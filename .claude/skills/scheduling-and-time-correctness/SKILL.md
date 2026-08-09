---
name: scheduling-and-time-correctness
description: Recurring schedules across timezones and DST, tick-based job queues, idempotent firing, distributed locks, catch-up after downtime, injectable clocks for testing.
---

# Scheduling and Time Correctness

Two separate hard problems that get conflated: **what instant does "06:30 on Tuesdays" mean**, and **how do I reliably run something at that instant**. Solve them separately.

---

## Part 1: What time is it, really

### Store UTC. Display local. Compute in the user's zone.

```
users.timezone       text NOT NULL   -- IANA name: 'Europe/Sofia'. NEVER '+03:00', never 'EEST'.
wake_schedules.wake_time   time      -- local wall clock: 06:30
wake_schedules.days_of_week smallint[] -- ISO-8601: 1=Mon … 7=Sun
wake_events.scheduled_at   timestamptz -- the resolved UTC instant
```

Offsets are not timezones. `+03:00` is what Sofia is *today*; it is `+02:00` in January. Store the IANA name and let the tz database resolve the offset for each date.

### Materialize occurrences, don't compute them at read time

Each day, resolve the next occurrences into concrete `timestamptz` rows. This makes the scheduler a trivial range query and makes every event inspectable.

```ts
// Resolve "06:30 local on 2026-08-12" → a UTC instant
function resolveOccurrence(localDate: string, wakeTime: string, tz: string): Date {
  // Use a real tz library — Temporal, Luxon, or date-fns-tz.
  // Do NOT hand-roll offset math.
  return DateTime.fromISO(`${localDate}T${wakeTime}`, { zone: tz }).toUTC().toJSDate()
}
```

### The two DST cases you must decide explicitly

Spring forward (Sofia, last Sunday of March, 03:00 → 04:00): **02:30 does not exist.**
Fall back (last Sunday of October, 04:00 → 03:00): **03:30 happens twice.**

```
Nonexistent local time → fire at the first valid instant after the gap.
                          (02:30 becomes 04:00 wall clock. The user wakes early, not never.)
Ambiguous local time   → fire at the FIRST occurrence.
                          (Earlier is safe; later means a missed wake-up.)
```

Both defaults follow one rule: **when time is ambiguous, err toward waking the person.** Write that rule in a comment, because the next person to read the code will not derive it.

Luxon returns an invalid DateTime for gaps and picks the first offset for ambiguity — check `.isValid` and handle the gap explicitly rather than letting an `Invalid DateTime` reach the database.

### Test these dates specifically

```ts
// Europe/Sofia
'2026-03-29'  // spring forward, 03:00→04:00
'2026-10-25'  // fall back,     04:00→03:00
// Plus: a user in Europe/Sofia paired with a user in America/Sao_Paulo,
// whose DST runs the opposite direction — the gap between them changes twice a year.
```

---

## Part 2: Running the job reliably

### Tick, don't sleep

Do not `setTimeout` until the wake time. Processes restart, deploys happen, serverless functions die. Instead: a **tick** every minute that asks "what is due in the next window?"

```ts
// GET /api/cron/tick  — every minute
const due = await db.query(`
  SELECT id FROM wake_events
   WHERE status = 'pending'
     AND scheduled_at BETWEEN now() AND now() + interval '5 minutes'
   ORDER BY scheduled_at
   FOR UPDATE SKIP LOCKED          -- concurrent ticks never grab the same row
   LIMIT 200
`)
```

`FOR UPDATE SKIP LOCKED` is the whole concurrency story for a Postgres-backed queue. Two overlapping ticks process disjoint sets instead of duplicating work.

### Idempotency is a database constraint, not a code path

```sql
CREATE UNIQUE INDEX uq_wake_events_slot ON wake_events (sleeper_id, scheduled_at);
```

Now a cron that fires twice, a retry after a timeout, and a manual replay are all harmless — the second insert raises a unique violation you swallow. Application-level `if (!exists)` checks lose this race; the index cannot.

Every side effect needs the same treatment. A push notification gets a dedupe key of `${event_id}:${kind}`; sending it twice is a no-op.

### Catch-up after downtime — the rule everyone forgets

The scheduler was down for four hours. It comes back and finds 400 due events. **Do not fire them.**

```ts
const STALE_AFTER_MIN = 10

if (differenceInMinutes(now, event.scheduled_at) > STALE_AFTER_MIN) {
  await markStale(event.id)   // status='missed', reason='scheduler_downtime'
  continue                    // never place a wake-up call 4 hours late
}
```

A late alarm is worse than no alarm. Bound the catch-up window, mark the rest as system-missed, and — critically — **do not count a system-caused miss against a user's reliability score.**

### Clock skew

Serverless instances drift. Never compare a client-supplied timestamp to server `now()` for authorization decisions. Do all scheduling arithmetic in Postgres (`now()`) so there is exactly one clock.

### Injectable clock for tests

```ts
// ✅ Time is a dependency
export function dueEvents(now: Date, events: WakeEvent[]) { … }

// ❌ Untestable — you cannot make it be 02:30 on the DST boundary
export function dueEvents(events: WakeEvent[]) { const now = new Date(); … }
```

Every scheduling function takes `now` as a parameter. Tests then run the DST cases in milliseconds without mocking the global clock.

---

## Deployment notes

| Host | Granularity | Caveat |
|---|---|---|
| Vercel Cron | 1 min (Pro), 1/day (Hobby) | Best-effort timing, ±seconds; not guaranteed exactly-once |
| Supabase `pg_cron` | 1 min | Runs inside the DB, survives app deploys, no HTTP hop |
| Dedicated worker | arbitrary | You now operate a long-lived process |

Whichever you pick, the tick must be **safe to run twice and safe to miss once**. If either is untrue, the design is wrong, not the host.

## Checklist

- [ ] IANA timezone names stored, never offsets
- [ ] Wall-clock time + timezone stored separately from the resolved UTC instant
- [ ] Spring-forward gap and fall-back ambiguity both have explicit, commented policies
- [ ] Unique index enforces one event per (user, slot)
- [ ] Tick query uses `FOR UPDATE SKIP LOCKED` with a `LIMIT`
- [ ] Stale events past the catch-up window are marked, not fired
- [ ] System-caused misses are excluded from user reliability stats
- [ ] Every scheduling function takes `now` as an argument
- [ ] Tests cover both DST transitions and a cross-hemisphere pair
