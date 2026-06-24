---
name: ci-cd-and-automation
description: Shift-Left CI, GitHub Actions pipeline, no gate skipping, cron job patterns.
---

# CI/CD and Automation

Automate the boring, high-stakes checks. Ship confidently because the pipeline caught what you missed.

## Shift-Left Principle

Run checks as early as possible in the development cycle:

```
Local dev → Pre-commit → PR CI → Staging → Production

Cheapest to fix here ←────────────────────→ Most expensive to fix here
```

Don't wait for CI to catch type errors. Run `tsc --noEmit` locally before pushing.

## GitHub Actions Pipeline

The CI pipeline runs on every PR and every push to `main`:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Unit + integration tests
        run: npx vitest run --reporter=verbose
        env:
          # Use test env vars (not production secrets)
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
      
      - name: Build
        run: npx next build
        env:
          # Build-time env vars (public ones only)
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
```

## What Each Step Catches

| Step | What it catches |
|---|---|
| `tsc --noEmit` | Type errors, missing properties, wrong function signatures |
| `vitest run` | Logic bugs, regression in business rules, API contract violations |
| `next build` | Import errors, missing env vars needed at build time, bundle issues |

## No Gate Skipping

**Never skip CI gates, even under deadline pressure.**

Justifications that seem valid but aren't:
- "It's just a small change" — small changes break things too
- "I'll write tests after" — you won't, and the bug will ship
- "The build was passing before my change" — concurrent changes happen

If CI is slow: fix CI. Don't bypass it.

If CI is flaky: fix the flaky tests. Don't `--passWithNoTests`.

## Cron Job Patterns

Vercel cron jobs run on a schedule defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/nameday-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/dispatch-timeout",
      "schedule": "*/2 * * * *"
    },
    {
      "path": "/api/cron/agent-accountant",
      "schedule": "0 8 1,15 * *"
    },
    {
      "path": "/api/cron/agent-lawyer",
      "schedule": "0 9 1,15 * *"
    },
    {
      "path": "/api/cron/agent-marketing",
      "schedule": "0 7 * * 1"
    }
  ]
}
```

Every cron route must:
1. Check `Authorization: Bearer {CRON_SECRET}`
2. Return 200 quickly (within 10 seconds for short jobs)
3. Handle errors without crashing (log and return 200 — Vercel retries on 5xx)
4. Be idempotent (safe to run twice if Vercel retries)

```ts
// app/api/cron/dispatch-timeout/route.ts
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const result = await checkAndEscalateTimedOutOrders()
    return NextResponse.json({ ok: true, escalated: result.count })
  } catch (error) {
    console.error('[cron/dispatch-timeout] error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 200 }) // 200 to prevent retry
  }
}
```

## Environment Management

| Environment | Purpose | Supabase project | Stripe mode |
|---|---|---|---|
| Local (`.env.local`) | Development | Dev project | Test keys |
| Vercel Preview | PR previews | Dev project | Test keys |
| Vercel Production | Live traffic | Prod project | Live keys |

Never use production Supabase or Stripe live keys in local development.

## Secrets Management

```
GitHub → Settings → Secrets and variables → Actions:
  TEST_SUPABASE_URL           — dev Supabase project URL
  TEST_SUPABASE_ANON_KEY      — dev anon key
  TEST_SUPABASE_SERVICE_ROLE_KEY — dev service role key

Vercel → Project → Settings → Environment Variables:
  All production secrets (see shipping-and-launch skill for full list)
```

## Deployment Pipeline

```
Developer pushes to feature branch
  → CI: tsc + vitest + next build
  → PR review (human)
  → Merge to main
  → Vercel: auto-deploys to production
  → Post-deploy: smoke test (manual or automated)
```

Vercel deployment is automatic on every push to `main`. There's no manual "deploy" step — the discipline is in the PR review and CI gates.

## Monitoring Alerts

Configure these in Vercel or your monitoring service:

```
Alert: Error rate > 1% over 5 minutes → Slack/WhatsApp to admin
Alert: Build failure on main → Slack/WhatsApp to dev
Alert: Cron job missed (no successful run in expected window) → Slack/WhatsApp to admin
Alert: p95 response time > 2s → Slack/WhatsApp to dev
```
