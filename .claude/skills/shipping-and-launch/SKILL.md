---
name: shipping-and-launch
description: Pre-launch checklist, staged rollout, monitoring setup. Go/no-go criteria for production.
---

# Shipping and Launch

Shipping is a process, not an event. Every launch should be boring — predictable, reversible, and monitored.

## Pre-Launch Checklist

Work through these gates in order. Don't skip. Don't parallelize.

### Gate 1: Code Quality ✓
- [ ] `tsc --noEmit` — zero TypeScript errors
- [ ] `vitest run` — all unit and integration tests green
- [ ] `next build` — builds without errors
- [ ] `npm audit --audit-level=high` — no high/critical vulnerabilities
- [ ] No `console.log` in production code paths
- [ ] No hardcoded secrets, tokens, or phone numbers in code

### Gate 2: Security ✓
- [ ] All API routes have auth checks
- [ ] Stripe webhook HMAC signature verified
- [ ] WhatsApp webhook `hub.verify_token` verified
- [ ] Cron endpoints require `Authorization: Bearer {CRON_SECRET}`
- [ ] RLS enabled on all Supabase tables
- [ ] `.env.local` is in `.gitignore` and not committed
- [ ] Session cookie: `httpOnly: true`, `sameSite: 'lax'`, `secure: true`

### Gate 3: Environment ✓
- [ ] All env vars set in Vercel production environment:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY` (live key, not test)
  - `STRIPE_WEBHOOK_SECRET` (production webhook endpoint)
  - `STRIPE_PUBLISHABLE_KEY`
  - `WHATSAPP_TOKEN`
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_VERIFY_TOKEN`
  - `WHATSAPP_ADMIN_PHONE`
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `ADMIN_PIN`
  - `HUB_PIN`
  - `CRON_SECRET`
- [ ] Supabase production project created (separate from dev)
- [ ] All 10 migrations applied to production Supabase
- [ ] Supabase Storage bucket `product-images` created (public read)

### Gate 4: Third-Party Services ✓
- [ ] Stripe: switched from test keys to live keys
- [ ] Stripe: production webhook endpoint registered (`https://kissmyflowers.bg/api/webhooks/stripe`)
- [ ] Meta Business: WhatsApp Business account verified
- [ ] Meta Business: all 8 message templates approved (allow 24-48h)
- [ ] Google Business Profile: claimed and verified (Burgas)

### Gate 5: DNS and Domain ✓
- [ ] `kissmyflowers.bg` DNS pointed to Vercel
- [ ] SSL certificate auto-provisioned by Vercel
- [ ] `www.kissmyflowers.bg` redirects to `kissmyflowers.bg`

### Gate 6: Smoke Test on Staging ✓
- [ ] Customer: browse catalog → add to cart → checkout → pay with Stripe test card → see confirmation
- [ ] Hub: receive WhatsApp → accept order → see it in Hub dashboard
- [ ] Courier: receive WhatsApp broadcast → accept → upload photo → order marked delivered
- [ ] Admin: see order in dashboard → manually change status → see escalation after 5-minute timeout
- [ ] AI agent: trigger accountant cron manually → see report in `agent_reports` table

### Gate 7: Monitoring ✓
- [ ] Vercel Analytics enabled (Core Web Vitals)
- [ ] Error tracking configured (Sentry or Vercel Logs)
- [ ] Uptime monitoring configured (UptimeRobot, Better Uptime, or Vercel)
- [ ] Alert configured: notify admin on 5xx rate > 1%
- [ ] Alert configured: notify admin if Supabase connection pool exhausted

---

## Staged Rollout Plan

Don't flip the switch for all users at once.

```
Stage 1: Internal (Day 1)
  → Admin only, test with real orders
  → Use Stripe test mode, real WhatsApp
  → Goal: verify the full flow with zero customers at risk

Stage 2: Soft Launch (Week 1)
  → 3-5 known customers (friends, family of owner)
  → Stripe live mode ON
  → Monitor: error rates, order completion rate, WhatsApp delivery rate
  → Goal: find issues before public announcement

Stage 3: Public Launch (Week 2)
  → Share on Google Business, social media
  → Monitor: load, conversion rate, time-to-hub-assignment
  → Keep Admin on standby for first week

Stage 4: Scale (Month 1)
  → Add second hub (if demand justifies)
  → Add more couriers
  → Review AI agent reports for business insights
```

## Rollback Plan

If something breaks after launch:

1. **Immediate**: Vercel → Deployments → Roll back to previous deployment (2 clicks, ~60 seconds)
2. **DB issue**: Supabase point-in-time recovery (if available on plan) or restore from backup
3. **Third-party**: disable the affected integration (e.g., disable AI agents cron if OpenAI is down)

Have the rollback steps written down before you launch. Don't figure it out under pressure.

## Post-Launch Monitoring (First Week)

Check daily:
- [ ] Error rate in Vercel logs (< 0.1% of requests should error)
- [ ] Order completion rate (paid → delivered, target > 95%)
- [ ] Hub assignment time (target < 10 minutes)
- [ ] WhatsApp delivery rate (Stripe-to-hub notification, target > 99%)
- [ ] Lighthouse score on prod (LCP < 2.5s)

Check weekly:
- [ ] AI agent reports saved to `agent_reports`
- [ ] No uncaught errors in Supabase logs
- [ ] `npm audit` — new vulnerabilities?

## Go/No-Go Criteria

**GO** (all must be true):
- All 7 pre-launch gates passed ✓
- Smoke test on staging completed ✓
- Rollback plan documented ✓
- Admin available for first 4 hours post-launch ✓

**NO-GO** (any one blocks launch):
- Outstanding `[BLOCKER]` from code review
- Stripe webhook not verified in production
- WhatsApp templates not approved
- DNS not propagated (> 48 hours after configuration)
- Smoke test found a broken flow
