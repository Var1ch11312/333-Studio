---
name: failover-and-chain-reliability
description: Design escalation ladders for human-dependent flows. Deadline state machines, backup assignment, idempotent transitions, fair blame attribution, terminal fallbacks.
---

# Failover and Chain Reliability

When a step in your system is *a human being who might be asleep*, failure is not an exception path — it is a routine outcome with a known rate. Design for it as a first-class flow.

## The core question

> If the responsible party does nothing at all, what happens?

If the answer is "the user is failed silently", the design is incomplete. Every human-dependent step needs a deadline, a backup, and a terminal fallback that does not depend on anyone.

## The escalation ladder

Write it as a table before writing code. Each rung has a trigger, an action, and an owner.

```
T-5min   assign primary waker   push to waker   ── waker has 5 min of warning
T-0      call window opens      push to both    ── "call now" / "incoming"
T+3min   NO CALL PLACED         → assign BACKUP waker, push immediately
                                → primary marked 'missed' (see fairness rules)
T+6min   BACKUP DID NOT CALL    → broadcast to on-call volunteer pool
T+8min   STILL NOTHING          → automated fallback: loud in-app alarm on the
                                  sleeper's own device + SMS if opted in
T+10min  TERMINAL               → event closed as 'system_failed'.
                                  This is an incident, not a user error. Alert ops.
```

Two properties make this a *ladder* rather than a list:

1. **Every rung shortens the remaining budget.** The sleeper asked to be up at 06:30, not 07:15. If the ladder cannot complete inside ~10 minutes, it has failed regardless of which rung fires.
2. **The last rung depends on no human.** Always. A chain of obligations must terminate in something mechanical, or the product's worst case is "you overslept and missed your flight because a stranger rolled over".

## Deadlines live in the database, not in memory

```sql
ALTER TABLE wake_events
  ADD COLUMN escalation_deadline timestamptz,
  ADD COLUMN escalation_level    smallint NOT NULL DEFAULT 0;

CREATE INDEX idx_wake_events_escalation
  ON wake_events (escalation_deadline)
  WHERE status IN ('assigned','called') AND escalation_deadline IS NOT NULL;
```

The same cron tick that schedules events also drives escalation:

```sql
SELECT * FROM wake_events
 WHERE escalation_deadline < now()
   AND status IN ('assigned','called')
 FOR UPDATE SKIP LOCKED
 LIMIT 100;
```

A `setTimeout` in a serverless function is a deadline that evaporates on redeploy. A row is a deadline that survives.

## Transitions must be idempotent and guarded

Escalation runs concurrently with the human it is escalating past. The waker may call at exactly T+3min while the backup is being assigned.

```sql
-- ✅ Guarded: only escalates if still un-called. Returns 0 rows if the human beat us.
UPDATE wake_events
   SET escalation_level = 1,
       waker_id = $backup,
       escalation_deadline = now() + interval '3 min'
 WHERE id = $1
   AND escalation_level = 0        -- ← guard against double-escalation
   AND call_started_at IS NULL     -- ← guard against racing the real call
RETURNING *;
```

Every state transition follows this shape: `UPDATE … WHERE id = ? AND <expected current state>` and treat zero rows as "someone else got there first, do nothing". Never `SELECT`, branch in application code, then `UPDATE`.

Define which states are terminal and enforce it:

```
terminal: confirmed, refused, missed, system_failed, cancelled
→ no transition out of a terminal state, ever. Add a CHECK or a trigger.
```

## Fair blame attribution

Reliability scores drive behavior. An unfair score destroys trust in the whole mechanism, and it is very easy to be unfair.

**Only count a miss when the person had a genuine chance to act:**

```ts
function isCountableMiss(e: WakeEvent): boolean {
  if (e.push_delivered_at == null)      return false  // we never reached them
  if (e.system_degraded)                return false  // our scheduler was late
  if (e.assigned_at > e.scheduled_at)   return false  // assigned after it was due
  if (minutesBetween(e.assigned_at, e.scheduled_at) < 5) return false // no warning
  return true
}
```

**Distinguish the three failure kinds — they are not the same act:**

| Kind | Meaning | Weight |
|---|---|---|
| `refused` | Declined in advance, in the app | Light. Honest and useful — the system can re-pair in time. |
| `missed` | Silence. No call, no decline. | Heavy. This is the behavior that breaks chains. |
| `system_failed` | Nobody was reachable / we broke | Zero. Not the user's fault. |

Make refusing *cheap and fast*. A user who can decline at 06:25 costs the system 5 minutes of re-pairing; a user who ghosts costs a missed wake-up. Design the incentive accordingly, and say so in the UI.

**Show a rate with a floor, not a raw count.** Reliability under ~10 events is noise — display "New" rather than "50%" after one miss out of two.

## Backup selection

The backup pool cannot be "any random user" — it must be people who are *already awake*.

```
Prefer, in order:
  1. Users who confirmed awake in the last 30 min (proven awake, already up)
  2. Users whose local time is 07:00–22:00 and who opted into the rescue pool
  3. Users with reliability ≥ 90% and a wake time within the last 2 hours
Exclude always:
  - the primary waker who just failed
  - anyone the sleeper has blocked (and vice versa)
  - anyone already assigned to another event in this window
```

That last exclusion needs a unique index, or one enthusiastic volunteer gets three simultaneous calls.

## Instrument the ladder

The distribution across rungs is your single best health metric.

```
wake_ladder_level{level="0"}  → primary called on time      target > 85%
wake_ladder_level{level="1"}  → backup rescued it           target < 12%
wake_ladder_level{level="2"}  → volunteer pool              target <  2%
wake_ladder_level{level="3"}  → automated fallback fired    target <  1%
wake_ladder_level{level="4"}  → total failure               target =  0, page on any
```

If level 1 exceeds ~30%, the primary path is decorative and the design needs rework — not more backups. Adding rungs to compensate for a broken primary is how systems become unmaintainable.

## Checklist

- [ ] Every human-dependent step has a written deadline and a named backup
- [ ] The ladder terminates in something that requires no human
- [ ] The whole ladder fits inside the user's acceptable lateness budget
- [ ] Deadlines are database rows, not in-process timers
- [ ] Every transition is a guarded conditional `UPDATE`; zero rows = no-op
- [ ] Terminal states cannot be transitioned out of
- [ ] Misses only counted when the user was reachable and had warning
- [ ] `refused` weighted lighter than `missed`, and declining is one tap
- [ ] Reliability hidden below a minimum sample size
- [ ] Ladder-level distribution is a dashboard metric with alert thresholds
