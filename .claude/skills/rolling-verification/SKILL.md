---
name: rolling-verification
description: Re-verify the previous 5 steps before taking the next one. Catches silent drift, stale assumptions, and broken invariants while they are still cheap to fix.
---

# Rolling Verification (5-Step Look-Back)

Long tasks fail quietly. A column gets renamed in step 3, step 7 still writes the old name, and nothing breaks until integration — at which point five more steps are built on the same sand.

This protocol makes drift visible early. **Before every new action, re-check the previous five.**

## What counts as a step

A step is anything that changed state or established a fact you will rely on later:

- a file written or edited
- a migration added
- a command run whose output you acted on
- a decision made ("signaling goes over Supabase Realtime")
- an assumption adopted ("the `users` table already has `timezone`")

Reading a file for orientation is not a step. Concluding something from it is.

## The four checks

For each of the last five steps, ask:

| Check | Question | Cheap evidence |
|---|---|---|
| **Exists** | Is the artifact still there and still what I think it is? | `ls`, read the 5 relevant lines |
| **Contract** | Do the names/types/signatures still match their callers? | grep the symbol across the repo |
| **Assumption** | Is the fact I assumed still true? | re-run the one query or command |
| **Invariant** | Does the project rule still hold? | targeted test, not the full suite |

If all four pass for all five steps, proceed. Say so in one line — do not narrate each check.

## Cost control

Re-verification must be cheaper than the work it protects, or it will be skipped under pressure.

```
Pick the cheapest evidence that would FAIL if the step were wrong.

✅ grep for the renamed symbol            (200ms)
✅ tsc --noEmit on the touched project    (5s)
✅ one vitest file                        (1s)
❌ full E2E suite after every edit        (4min — you will stop doing it)
```

Batch the check: one `tsc --noEmit` covers "contract" for every TypeScript step in the window at once.

## The ledger

Keep a running five-row window. Overwrite the oldest row each step.

```
STEP  ACTION                             VERIFIES AS
 12   migration 03: wake_events table    ✓ file exists, 03 not skipped
 13   lib/matching.ts pairIsValid()      ✓ tsc clean
 14   decided: TURN via Twilio           ✓ still the plan, no cheaper option found
 15   /api/schedule POST                 ✓ vitest schedule.test.ts green
 16   ScheduleForm.tsx                   ✓ imports resolve, builds
NEXT  matching cron tick  ← re-check 12–16 before starting
```

When a step ages out of the window it is *committed knowledge*. If a later step contradicts it, that is a finding, not a routine check.

## When a check fails

Stop. Do not "fix it later" — later is where the compounding happens.

1. **Fix forward** if the correction is contained (rename in 2 files).
2. **Revert the step** if the correction would ripple (wrong schema shape).
3. **Escalate to the user** if the failure invalidates a decision they approved.

Then re-run the window from the corrected step. A failed check resets the count — you now verify five steps forward from the fix.

## What this is not

- Not re-reading files you just wrote to confirm the write succeeded. Tools error on failure; trust them.
- Not repeating the same test five times because five steps have elapsed.
- Not narration. "Verified 12–16, clean" is the entire user-facing output.

The value is in catching the *contradiction between* steps, not in restating each step.

## Phase-boundary audit

At each phase gate (auth done → scheduler starts), run one deeper pass:

- [ ] Every migration number is sequential with no gaps
- [ ] Every table referenced in code exists in a migration
- [ ] Every env var read in code is documented in `.env.example`
- [ ] Every API route has an auth check or an explicit "public" comment
- [ ] Every timestamp column is `timestamptz`, never `timestamp`
- [ ] `tsc --noEmit`, lint, and the full test suite all pass

This is the one place the full suite is worth its cost.
