---
name: security-and-hardening
description: OWASP Top 10, threat modeling, 3-tier controls. Auth, input validation, secrets management.
---

# Security and Hardening

Security is not a phase. Apply it at every layer: input, processing, output, auth, storage, transport.

## Threat Model First

Before implementing any security control, identify the threat:

1. **Who** might attack this? (external user, authenticated user, insider, bot)
2. **What** can they do? (read data, modify data, DoS, escalate privileges)
3. **How** would they do it? (injection, CSRF, broken auth, misconfigured permissions)
4. **What's the impact?** (data breach, financial loss, reputational damage)

Then pick controls proportional to the risk.

## 3-Tier Controls

```
Tier 1 — PREVENT (don't let bad input in)
  → Validate all input at API boundary
  → Use parameterized queries
  → Enforce auth before any data access

Tier 2 — DETECT (catch attacks in progress)
  → Rate limiting
  → Anomaly detection (too many failed PINs)
  → Audit logs for sensitive operations

Tier 3 — RESPOND (limit blast radius when prevention fails)
  → RLS policies so DB breach ≠ full data access
  → Short-lived tokens
  → Idempotency keys so replayed requests are harmless
```

## OWASP Top 10 Checklist

### A01: Broken Access Control
- [ ] Every API route checks auth before accessing data
- [ ] Users can only access their own data (RLS in Supabase)
- [ ] Admin routes check admin PIN, hub routes check hub PIN (separate tokens)
- [ ] No direct object reference without ownership check

### A02: Cryptographic Failures
- [ ] No plaintext secrets in code or logs
- [ ] `crypto.timingSafeEqual()` for PIN comparison (prevents timing attacks)
- [ ] HTTPS enforced (Vercel default)
- [ ] Supabase RLS as second layer of encryption at rest

### A03: Injection
- [ ] All Supabase queries use parameterized calls (`.eq()`, `.filter()`, not `.sql()` with interpolation)
- [ ] User input not interpolated into WhatsApp message templates
- [ ] No `eval()` or dynamic code execution

### A04: Insecure Design
- [ ] Stripe webhook verified with HMAC before processing
- [ ] WhatsApp webhook verified with `hub.verify_token`
- [ ] Idempotency: Stripe webhook idempotency key checked before creating order

### A05: Security Misconfiguration
- [ ] No default credentials (Supabase project uses unique passwords)
- [ ] CORS not wildcard (`*`) on sensitive routes
- [ ] RLS enabled on all Supabase tables (default deny)
- [ ] `CRON_SECRET` required on all cron endpoints

### A06: Vulnerable Components
- [ ] `npm audit` run before shipping
- [ ] `next`, `stripe`, `@supabase/ssr` on latest patch versions
- [ ] No packages with known high/critical CVEs

### A07: Identity and Authentication Failures
- [ ] Rate limit: 5 failed PIN attempts → 15 minute lockout
- [ ] `crypto.timingSafeEqual()` prevents brute-force timing attacks
- [ ] Session cookie: `httpOnly`, `sameSite: 'lax'`, `secure: true`
- [ ] No session token in URL (query params are logged)

### A08: Software and Data Integrity Failures
- [ ] Stripe webhook signature verified with `stripe.webhooks.constructEvent()`
- [ ] No unsigned webhooks accepted
- [ ] CSV imports validated before processing

### A09: Logging and Monitoring Failures
- [ ] Errors logged with context (order ID, user role, endpoint)
- [ ] Failed auth attempts logged with IP and timestamp
- [ ] No PII in logs (no phone numbers, names, payment data)

### A10: SSRF
- [ ] No user-controlled URLs fetched server-side
- [ ] WhatsApp media URLs validated before proxying

## LLM-Specific Security (AI Agents)

For Claude agent code in `lib/agents/`:

- [ ] **Prompt injection**: Never include user-provided text directly in system prompts without sanitization
- [ ] **Tool scope**: Each tool only has access to data it needs (no `get_all_users` tool if only counting orders)
- [ ] **Output validation**: Agent output parsed and validated before storing in DB or sending via WhatsApp
- [ ] **Cost controls**: Max tokens set to prevent runaway bills
- [ ] **No sensitive data in tool names**: Tool names may appear in logs — don't use `get_admin_pin_hash()`

## Auth Pattern for This Project

```ts
// ✅ Correct auth check in API route
export async function POST(req: NextRequest) {
  const session = req.cookies.get('amur_session')?.value
  if (!session || !crypto.timingSafeEqual(
    Buffer.from(session),
    Buffer.from(process.env.ADMIN_TOKEN!)
  )) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... handler logic
}

// ❌ Wrong — timing attack possible
if (session !== process.env.ADMIN_TOKEN) { ... }

// ❌ Wrong — no auth check at all
export async function POST(req: NextRequest) {
  const body = await req.json()
  // directly processes without auth
}
```

## Secrets Checklist

| Secret | Where it lives | Where it does NOT go |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local`, Vercel env | Client components, browser |
| `STRIPE_SECRET_KEY` | `.env.local`, Vercel env | Client-side code |
| `ANTHROPIC_API_KEY` | `.env.local`, Vercel env | Logs, error messages |
| `CRON_SECRET` | `.env.local`, Vercel env | URL params, response bodies |
| `ADMIN_PIN`, `HUB_PIN` | `.env.local`, Vercel env | DB, anywhere persistent |
| `WHATSAPP_TOKEN` | `.env.local`, Vercel env | Client code |
