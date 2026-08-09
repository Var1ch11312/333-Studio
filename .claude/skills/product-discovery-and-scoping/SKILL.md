---
name: product-discovery-and-scoping
description: Project initiation. Name the load-bearing mechanism, map actors, write the anti-scope with reasons, set kill criteria before writing code.
---

# Product Discovery and Scoping

The initiation phase. Its output is not a plan — it is a *boundary*. Everything after this is easier if the boundary is drawn honestly.

## Step 1: Name the load-bearing mechanism

Every product that works has exactly one mechanism doing the real work. Everything else is packaging.

> WakeChain: **the obligation to a real, named human being.** Not the alarm. Not the UI. A person is waiting for your call, and letting them down costs more than pressing snooze.

Write it in one sentence. Then write the sentence that destroys it:

> If the call comes from an AI voice, the mechanism is gone — there is no one to disappoint. The product becomes a worse alarm clock.

**Why this matters:** most scope creep is a proposal to replace the mechanism with something cheaper. Naming it makes those proposals visible as what they are.

## Step 2: Map actors and their transitions

For each actor: what they do, what they owe, and how they change state.

```
Sleeper    → sets wake time → receives call → confirms awake → BECOMES Waker
Waker      → receives "time to wake X" → places call → completes obligation
System     → pairs, schedules, escalates, records outcomes
```

The interesting row is the transition — `Sleeper BECOMES Waker` is the whole product. Circle it. That is where the hard bugs live.

## Step 3: Write the anti-scope, with reasons

A list of excluded features is useless. A list of excluded features *with the reason each one would break the mechanism* is a design document.

| Excluded | Why it breaks the mechanism |
|---|---|
| AI voice calls | Removes the human obligation — the only thing that works |
| Likes / ratings / matching by attraction | Turns a duty into a social market; people optimize for charm, not reliability |
| Chat and DMs | Creates a harassment surface and a reason to talk instead of wake up |
| Subscriptions / ads | Adds an incentive to maximize sessions, not wake-ups |
| Real telephony (PSTN) | Leaks phone numbers between strangers; unrecoverable privacy failure |

Restate this list at the top of every implementation phase. It is the cheapest defense against a well-meaning "while we're here…".

## Step 4: Define success and kill criteria together

Success metrics without kill criteria are decoration.

```
SUCCESS (measure at day 30 of pilot)
  Chain completion rate       ≥ 85%   (calls placed / calls owed)
  Wake confirmation rate      ≥ 90%   (confirmed / calls answered)
  Median time-to-confirm      ≤ 90s   (call start → "I'm up")
  Week-2 retention            ≥ 40%

KILL / RETHINK (any one of these)
  Chain completion            < 50%   → obligation is not strong enough; the premise is wrong
  Users report feeling unsafe > 2%    → stranger-pairing is not viable without heavy T&S
  Backup-waker path fires     > 30%   → the primary path is decorative, redesign scheduling
```

Kill criteria must be written *before* you are emotionally invested. Write them now.

## Step 5: Find the riskiest assumption and test it first

Rank assumptions by `damage-if-wrong × probability-wrong`. Build the cheapest test of the top one before building the product.

For a chain-of-obligation product the top assumption is almost never technical:

> **Riskiest:** a stranger will actually get up and place a call at 06:30 for someone they have never met.
>
> **Cheapest test:** 20 people, a group chat, a spreadsheet, and manual pairing for one week. No code. If completion is under 50% with hand-held humans, no amount of WebRTC saves it.

If the user has not run this test, say so once, plainly, then build what they asked for. It is their call, not yours.

## Step 6: The scope contract

One page, and it is the thing you gate on:

```
IN            6 numbered capabilities, each with an acceptance criterion
OUT           the anti-scope table above
UNKNOWN       questions that block implementation, with the decision owner
ASSUMED       what you will proceed on if nobody answers, stated explicitly
```

The `ASSUMED` section is what keeps discovery from becoming a stall. Every unknown gets a default, so work continues while answers arrive.

## Anti-patterns

- **Discovery theater.** Six personas and a journey map for a product with one user type and one job.
- **Scope by enumeration.** Listing 40 features and calling the first 6 "MVP" — that's a backlog, not a boundary.
- **Deferred safety.** "Trust and safety in v2" is not a scope decision for a product that pairs strangers by voice; it is a launch blocker moved out of sight.
- **Metrics without instrumentation.** If nothing in the data model can compute the success metric, it is not a metric.
