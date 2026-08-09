---
name: trust-and-safety-for-social-products
description: Safety design for products that pair strangers. Identity minimization, block and report flows, pairing exclusions, abuse rate limits, minors, incident runbook.
---

# Trust and Safety for Stranger-Pairing Products

The moment your product connects two people who did not choose each other, you have taken on a duty of care. This is not a v2 feature — an unsafe pairing product gets one incident and then it is over.

## Principle: minimum viable identity

Share the least that makes the interaction work. For a wake-up call, that is a first name.

| Field | Shared with the other party? | Reason |
|---|---|---|
| First name | ✅ Yes | The obligation needs a person, not an ID |
| City | ⚠️ Coarse only | "Burgas" builds affinity; a district narrows to a neighborhood |
| Timezone | ✅ Yes | Needed to explain the schedule |
| Reliability % | ✅ Yes | Legitimate signal for the interaction |
| Surname | ❌ Never | Makes the person findable on every other platform |
| Email / phone | ❌ Never | Irreversible once leaked; enables off-platform contact |
| Exact location | ❌ Never | — |
| Photo | ❌ Not in v1 | Turns a duty into an appearance market; invites harassment |
| Age / gender | ❌ Not shared | Enables targeted selection, which is the failure mode |

**Never route a real phone call.** PSTN telephony exposes caller ID in both directions and cannot be un-leaked. In-app WebRTC keeps identity under your control — this is a safety decision, not only a cost one.

## Pairing exclusions

The matcher is your primary safety control. It is far more effective to never create a bad pairing than to handle its aftermath.

```sql
-- Hard exclusions, enforced in the matching query itself, not in app code afterward
NOT EXISTS (SELECT 1 FROM user_blocks
             WHERE (blocker_id = :sleeper AND blocked_id = candidate.id)
                OR (blocker_id = candidate.id AND blocked_id = :sleeper))
AND NOT EXISTS (SELECT 1 FROM user_reports
                 WHERE reporter_id = :sleeper AND reported_id = candidate.id)
AND candidate.suspended_at IS NULL
AND candidate.id <> :sleeper
```

Blocks are **bidirectional and invisible**. The blocked user is never told; they simply never get paired again. Telling them is an escalation trigger.

Additional matcher rules worth having:

- **Cool-down on repeat pairings.** Do not pair the same two people more than once per week without both opting in. Repeated forced contact is how a duty becomes a relationship someone did not want.
- **New-account throttle.** An account under 48 hours old gets paired only with users who opted into onboarding new members.

## Report and block: two taps, always reachable

```
DURING the call    → a persistent "Report" control on the call screen.
                     Reporting ends the call immediately. No confirmation dialog.
AFTER the call     → on the post-call screen and in call history for 30 days.
NEVER              → require the reporter to type a reason before the block takes effect.
                     Block first, ask for detail optionally.
```

Categories, short and unambiguous — long taxonomies suppress reporting:

```
• Abusive or threatening language
• Sexual content or advances
• Tried to move the conversation off the app
• Attempted to sell something / scam
• Someone else's safety is at risk        ← routes to a separate, faster queue
• Other
```

Store: reporter, reported, event id, category, free text, timestamp, and the call's technical metadata (duration, connection state). Do **not** record audio by default — see below.

## Recording

Default: **do not record calls.** Recording a private voice call changes your legal position, your storage obligations, and users' willingness to participate.

If you later add abuse-review recording, it must be:
- disclosed before the first call, in plain language, not buried in terms;
- consented to by both parties, per jurisdiction (Bulgaria and the EU are two-party consent for private communications);
- short-retention (e.g. 7 days) and access-logged;
- deletable on request under GDPR Art. 17.

The honest v1 answer is: no recording, and reports are handled on reported behavior plus pattern analysis across multiple reporters.

## Abuse rate limits

```
Account creation      3 per IP per day
Report submission     10 per user per day       (beyond that, review the reporter)
Pairing requests      bounded by the schedule; no manual "call someone now"
Name changes          1 per 30 days             (prevents identity churn after a report)
```

The absence of a "call anyone now" button is itself a safety control. Every call in this product is scheduled and system-initiated; there is no way for a user to reach a specific person on demand. Preserve that property — it eliminates an entire class of stalking.

## Minors

A stranger-voice-call product with under-18 users is a different regulatory and moral category.

- Age gate at signup (self-declared date of birth, 18+ required).
- State it in the terms, and enforce on the account: a declared minor cannot complete onboarding.
- If a report indicates a minor, suspend immediately and review — do not wait for a queue.
- Do not collect more than the date of birth. Age verification via documents creates a worse privacy problem than it solves at this scale.

## Incident runbook

Write this before launch. During an incident nobody is going to design a process.

| Severity | Example | Response time | Action |
|---|---|---|---|
| **P0** | Threat of violence, self-harm disclosure, suspected minor | < 1 hour | Immediate suspension of reported account; preserve records; escalate to a named human; provide crisis resources to the reporter |
| **P1** | Sexual harassment, repeated abuse, doxxing attempt | < 24 hours | Suspend pending review; permanent ban on confirmation |
| **P2** | Rudeness, off-platform solicitation, spam | < 72 hours | Warning; auto-ban at 3 |
| **P3** | Reliability complaints, no-shows | Batch weekly | Handled by the reliability score, not by moderation |

Every report gets an acknowledgement to the reporter within the SLA, even if the outcome is not shared. Silence after a report is the thing that makes people leave.

**Named owner.** One human is accountable for the P0 queue with a real contact path. "The team monitors it" is not a runbook.

## Ban evasion

Bans on email-only accounts are weak. Accept that, and layer:

- Ban the email *and* keep a hash of any device/push endpoint seen on the account.
- New accounts start at zero reliability with restricted pairing for the first week.
- Alert on a new account whose behavior pattern matches a recently banned one (same timezone + wake time + IP range).

Do not fight this too hard at small scale. Detect the repeat offender, do not build a fingerprinting apparatus.

## Safety metrics on the dashboard

```
reports per 1000 calls          → rising = the matcher or the norms are failing
median time to P0 resolution    → the number that matters most
% of users who have blocked ≥1  → above ~5% means a systemic problem, not bad apples
repeat-offender rate            → measures whether bans actually work
```

## Checklist before any public launch

- [ ] Only first name, coarse city, timezone, and reliability are shared between users
- [ ] No mechanism exists for a user to initiate contact with a chosen person
- [ ] Block is bidirectional, silent, permanent, and enforced inside the matching query
- [ ] Report is reachable in two taps during and after a call, with no mandatory free text
- [ ] Calls are not recorded; if they ever are, consent and retention are designed first
- [ ] Age gate present; minors cannot complete onboarding
- [ ] P0 runbook written, with a named human and a real contact path
- [ ] Reporter receives acknowledgement within the stated SLA
- [ ] Safety metrics instrumented and on the same dashboard as product metrics
- [ ] Privacy policy states exactly what is shared with the other party
