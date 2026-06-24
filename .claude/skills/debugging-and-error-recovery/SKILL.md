---
name: debugging-and-error-recovery
description: 6-step triage methodology. Stop-the-Line rule. Root cause first, symptoms second.
---

# Debugging and Error Recovery

Debug systematically. Never guess. Find the root cause before touching code.

## The Stop-the-Line Rule

If production is down or customers are losing orders: **stop everything else and fix it now.**

Priority order when production is broken:
1. **Mitigate** — reduce blast radius (roll back, disable feature, reroute traffic)
2. **Communicate** — tell the team what's broken and what you're doing
3. **Diagnose** — find the root cause
4. **Fix** — apply the smallest possible fix
5. **Verify** — confirm the fix works in production
6. **Post-mortem** — understand why it happened and how to prevent it

## 6-Step Triage

### Step 1: Define the problem precisely

Don't debug "it's broken." Define:
- What behavior is observed vs. what is expected?
- When did it start? (specific commit, deploy, time)
- Who is affected? (all users, specific role, specific zone)
- How often? (every time, intermittent, under load)

```
❌ "The checkout is broken"
✅ "POST /api/orders returns 500 for orders with delivery to Meden Rudnik zone since the 14:30 deploy. Orders to Center zone work fine."
```

### Step 2: Reproduce the problem

Find the minimal reproduction case:
- What's the simplest input that triggers the bug?
- Can you reproduce it locally?
- Can you reproduce it consistently?

If you can't reproduce it, you can't verify the fix.

### Step 3: Isolate the cause

Work from the outside in:
1. Check logs first (Vercel logs, Supabase logs)
2. Check recent changes (`git log --oneline -10`)
3. Narrow down which layer is failing (DB? API? UI? Third-party?)
4. Add temporary logging to confirm your hypothesis

```ts
// Temporary debug logging (remove before commit)
console.log('[DEBUG routing]', { orderId, hubId, distance, selectedHub })
```

### Step 4: Identify root cause (not symptom)

The symptom is what fails. The root cause is **why** it fails.

```
Symptom: Courier doesn't receive WhatsApp broadcast
Root cause: Database query filters by zone='Center' but Meden Rudnik couriers have zone='Meden Rudnik'
Real root cause: Zone names were changed in the DB migration but not updated in the query string

Fix: Update query constant in lib/order-routing.ts line 87
```

Don't fix symptoms. Fix root causes.

### Step 5: Apply the minimal fix

The smallest change that fixes the root cause. Don't "clean up while you're in there."

```
✅ Fix the zone name constant → 1 line change, easy to review, easy to revert
❌ Refactor the entire routing algorithm because "the code could be cleaner"
```

### Step 6: Verify and document

- Test the fix against your reproduction case
- Test that you haven't broken adjacent functionality
- Add a test that would have caught this bug
- Document in the PR: what was broken, why, how fixed, how to detect next time

---

## Common Failure Patterns in This Project

### WhatsApp webhook not firing
1. Check Meta Developer → Webhook delivery log
2. Check `WHATSAPP_VERIFY_TOKEN` matches in env vars
3. Check webhook URL is HTTPS and accessible
4. Check Vercel function logs for errors in the handler

### Order stuck in `pending_hub`
1. Check `hub_timeout_at` — has 5 minutes passed?
2. Check `app/api/cron/dispatch-timeout` — is cron running? (Vercel dashboard)
3. Check `CRON_SECRET` env var matches in cron request headers
4. Check `lib/order-routing.ts:checkAndEscalateTimedOutOrders()` for errors

### Stripe webhook not creating orders
1. Check Stripe Dashboard → Webhooks → Recent deliveries
2. Check webhook signature: `STRIPE_WEBHOOK_SECRET` env var
3. Check idempotency: is the `stripe_checkout_id` already in DB? (duplicate delivery)
4. Check Vercel logs for the webhook handler response

### Supabase Realtime not updating dashboard
1. Check browser console for WebSocket errors
2. Check Supabase Dashboard → Realtime → Channels
3. Verify RLS policies allow SELECT for the session's role
4. Check if `supabase.channel()` subscription is being cleaned up on unmount

### PIN auth returning 401 unexpectedly
1. Check cookie name: must be `amur_session`
2. Check `httpOnly` — the cookie won't be readable by JS (check in DevTools → Application → Cookies)
3. Check timing: `crypto.timingSafeEqual` requires buffers of equal length
4. Check env var: `ADMIN_TOKEN` must match exactly (no trailing spaces)

---

## Debugging Tools

```bash
# Vercel production logs (real-time)
vercel logs --follow

# Local request debugging
curl -v -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"quantity": 1, ...}'

# Supabase query debugging
# Dashboard → SQL Editor → run query → check explain plan
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending_hub';

# TypeScript errors
npx tsc --noEmit 2>&1 | head -50
```

## Post-Mortem Template

```markdown
## Incident: [Title]
**Date:** YYYY-MM-DD
**Duration:** X hours
**Impact:** [Who was affected, how many orders lost/delayed]

## Timeline
- HH:MM — First report / detection
- HH:MM — Investigation started
- HH:MM — Root cause identified
- HH:MM — Fix deployed
- HH:MM — Verified resolved

## Root Cause
[Single paragraph explaining WHY this happened]

## Fix Applied
[What changed, link to commit]

## Prevention
- [ ] [Add test that would have caught this]
- [ ] [Add monitoring alert]
- [ ] [Process change]
```
