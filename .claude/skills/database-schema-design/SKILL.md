---
name: database-schema-design
description: PostgreSQL schema and migration discipline. Constraints as documentation, timestamptz everywhere, indexes from query patterns, expand-contract migrations, RLS default-deny.
---

# Database Schema Design

The schema outlives every line of application code written against it. Get it wrong and you pay for it in every query, every migration, and every 3 a.m. incident.

## Model events, not just state

A `users.is_awake` boolean answers one question badly. A `wake_events` table with timestamps answers every question you will be asked later:

```sql
-- ❌ State only — no history, no statistics, no debugging
users (id, is_awake, last_woken_by)

-- ✅ Events — state is derivable, history is free
wake_events (id, sleeper_id, waker_id, scheduled_at,
             call_started_at, confirmed_awake_at, status)
```

Rule: **if a product metric needs it, it must be an event row, not a mutated field.** Reliability percentages, streaks, and "how often does the backup path fire" all come out of the event table for free.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Table | plural, snake_case | `wake_events` |
| Column | singular, snake_case | `scheduled_at` |
| Timestamp | `_at` suffix, always `timestamptz` | `confirmed_awake_at` |
| Boolean | positive, no `is_not_` | `active`, not `is_disabled` |
| Foreign key | `{singular_table}_id` | `sleeper_id` → `users.id` |
| Index | `idx_{table}_{cols}` | `idx_wake_events_scheduled_at` |
| Constraint | `chk_{table}_{rule}` | `chk_wake_events_status` |

Never name a column `time`, `user`, `order`, or `end` — all reserved or ambiguous.

## Types

```sql
timestamptz    -- ALWAYS. Never `timestamp`. Never store an offset in a separate column.
text           -- Not varchar(n). Add a CHECK if you need a length limit.
numeric(10,2)  -- Money. Never float.
uuid           -- Primary keys. gen_random_uuid() default.
text + CHECK   -- Enums. Easier to extend than a native ENUM type (which needs ALTER TYPE).
smallint[]     -- days_of_week as {1,2,3,4,5}, ISO-8601 (1=Mon .. 7=Sun). Document the base!
time           -- A local wall-clock time with no date, e.g. 06:30. Pair it with an IANA tz column.
```

The `time` + IANA-timezone pairing is the correct way to store a recurring alarm. Storing `06:30 UTC` is wrong — the user means 06:30 *where they live*, which is a different UTC instant twice a year.

## Constraints are documentation that cannot go stale

Every rule you can express in the schema is a rule that cannot be violated by a buggy code path, a manual SQL fix, or a second service written later.

```sql
CREATE TABLE wake_events (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sleeper_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  waker_id           uuid     NULL REFERENCES users(id) ON DELETE SET NULL,
  scheduled_at       timestamptz NOT NULL,
  status             text NOT NULL DEFAULT 'pending',

  CONSTRAINT chk_wake_events_status
    CHECK (status IN ('pending','assigned','called','confirmed','missed','refused')),

  -- A person cannot be their own waker
  CONSTRAINT chk_wake_events_not_self
    CHECK (waker_id IS NULL OR waker_id <> sleeper_id),

  -- Confirmation cannot precede the call
  CONSTRAINT chk_wake_events_order
    CHECK (confirmed_awake_at IS NULL OR call_started_at IS NULL
           OR confirmed_awake_at >= call_started_at)
);

-- One event per sleeper per scheduled instant — the scheduler's idempotency guarantee
CREATE UNIQUE INDEX uq_wake_events_sleeper_slot
  ON wake_events (sleeper_id, scheduled_at);
```

That last unique index is worth more than any amount of application-level "check if it already exists" logic. It makes a double-firing cron harmless.

## Partial unique indexes for "only one active X"

```sql
-- A user may have many schedules but only one active one per weekday-set
CREATE UNIQUE INDEX uq_wake_schedules_one_active
  ON wake_schedules (user_id)
  WHERE active;
```

## Index from query patterns, not from intuition

Write the queries first, then index for them. Every index costs write throughput.

```sql
-- Query: "which events fire in the next 5 minutes?"  (runs every minute, forever)
SELECT * FROM wake_events
 WHERE status = 'pending' AND scheduled_at BETWEEN now() AND now() + interval '5 min';

CREATE INDEX idx_wake_events_due
  ON wake_events (scheduled_at)
  WHERE status IN ('pending','assigned');   -- partial: the hot rows are a tiny slice
```

Verify with `EXPLAIN (ANALYZE, BUFFERS)` on realistic row counts, not on 12 seed rows.

## Migrations: sequential, forward-only, expand-contract

File convention: `supabase/migrations/NN_name.sql` — sequential, **never skip or reuse a number**, never edit a migration that has been applied anywhere.

For any change that is not purely additive, use three deploys:

```
EXPAND    add the new column/table, nullable, with a default. Old code still works.
BACKFILL  populate it in batches. Both old and new code work.
CONTRACT  make it NOT NULL / drop the old column. Only after all code uses the new one.
```

A single-deploy rename is a guaranteed outage the moment two versions of the app run at once — which they always do during a rolling deploy.

```sql
-- ✅ Every migration starts with a comment stating what and why
-- 03_wake_events.sql — core event log for the wake chain.
-- Adds the unique (sleeper_id, scheduled_at) guarantee so a double-fired
-- scheduler tick cannot create duplicate events.
```

## RLS: default deny

On Supabase, enable RLS on every table at creation time, then grant narrowly. A table without RLS is readable by anyone holding the anon key.

```sql
ALTER TABLE wake_events ENABLE ROW LEVEL SECURITY;

-- A user sees only events they are a party to
CREATE POLICY wake_events_own ON wake_events
  FOR SELECT USING (auth.uid() = sleeper_id OR auth.uid() = waker_id);

-- Writes go through the service role only (scheduler, API routes)
-- — no client-side INSERT policy at all.
```

Server-side code uses the service-role client and bypasses RLS. That is fine *because* the API route does its own authorization check first. RLS is the second layer, not the only one.

## Pre-merge schema checklist

- [ ] Migration number is the next sequential integer, nothing skipped
- [ ] Every timestamp is `timestamptz`
- [ ] Every FK has an explicit `ON DELETE` action chosen deliberately
- [ ] Every status/enum column has a `CHECK` listing its values
- [ ] Every "must be unique" business rule has a unique index, not just app code
- [ ] Every hot query has a matching index, verified with `EXPLAIN ANALYZE`
- [ ] RLS enabled; policies written; write paths deliberately excluded
- [ ] The migration is reversible, or the irreversibility is stated in the header comment
