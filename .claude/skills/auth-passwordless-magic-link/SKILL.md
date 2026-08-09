---
name: auth-passwordless-magic-link
description: Passwordless email login done safely. Token hashing, single use, TTL, email-prefetch defense, enumeration resistance, session cookie rules.
---

# Passwordless Auth (Magic Link)

No password means no password database to leak — and a brand new set of ways to get it wrong. Every mistake below has shipped in production somewhere.

## Token rules

```ts
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'

// Generate: 32 bytes of CSPRNG, base64url. Not uuid(), not Math.random(), not nanoid(8).
const raw = randomBytes(32).toString('base64url')

// Store the HASH, never the token itself.
// A DB leak must not hand the attacker a set of working login links.
const tokenHash = createHash('sha256').update(raw).digest('hex')
```

| Rule | Value | Why |
|---|---|---|
| Entropy | ≥ 256 bits | Unguessable even at high request volume |
| Storage | SHA-256 hash | DB read ≠ account takeover |
| TTL | 10–15 minutes | Short enough that a forwarded email is useless |
| Uses | Exactly one | Consumed atomically on redeem |
| Binding | To the requested email | A token for A cannot log in B |
| Siblings | Invalidated on new request | Requesting a new link kills the old ones |

Consume atomically or you have a race:

```sql
UPDATE auth_tokens
   SET consumed_at = now()
 WHERE token_hash = $1
   AND consumed_at IS NULL
   AND expires_at > now()
RETURNING user_id;          -- zero rows = invalid, expired, or already used
```

One statement. Never `SELECT` then `UPDATE` — two clicks 40 ms apart both succeed.

## The email-prefetch problem (the one everybody hits)

Outlook SafeLinks, Gmail's image proxy, corporate scanners, and iMessage previews **fetch every URL in an email before the human clicks it.** If your link is a `GET` that consumes the token, the scanner burns it and the user sees "invalid link".

Fix — a two-stage redeem:

```
1. Email contains:  GET /auth/verify?token=…
2. That page does NOT consume the token. It renders a page with one button:
   "Sign in as user@example.com"  →  POST /api/auth/consume
3. Only the POST consumes it.
```

Scanners issue `GET`, not `POST`. Cost: one extra tap. Benefit: the flow actually works at companies.

Second-best option if you insist on a one-tap link: consume on `GET` but allow the *same token* to be redeemed twice within a 60-second window from the same user agent. Weaker, and harder to reason about. Prefer the button.

## Enumeration resistance

The request endpoint must be indistinguishable for existing and non-existing accounts.

```ts
// ✅ Same response, same status, same timing, whether or not the account exists
await maybeSendLink(email)          // no-ops silently for unknown addresses
return Response.json({ ok: true })  // always

// ❌ Leaks the whole user list, one request at a time
if (!user) return Response.json({ error: 'No account' }, { status: 404 })
```

Do the constant-time work regardless — if the account exists you hash and insert; if not, sleep for the same rough duration. And never let the *response time* be the oracle.

## Rate limiting (both dimensions)

```
Per email:   3 requests / 15 min   → prevents mailbox flooding of one victim
Per IP:     10 requests / 15 min   → prevents enumeration sweeps
Per token:   5 redeem attempts     → then invalidate the token entirely
```

Sending an unlimited number of emails to an address you do not control is an abuse vector against *that address*, not against you. Rate-limit it even though it costs you nothing.

## Redirect validation

```ts
// ❌ Open redirect — phishing with your own domain as the lure
redirect(searchParams.get('next')!)

// ✅ Allowlist of relative paths only
const NEXT_ALLOW = new Set(['/home', '/onboarding', '/profile'])
const next = searchParams.get('next') ?? '/home'
redirect(NEXT_ALLOW.has(next) ? next : '/home')
```

Reject anything starting with `//`, `http:`, `https:`, or containing a backslash.

## Session cookie

```ts
cookies().set('wc_session', sessionToken, {
  httpOnly: true,      // JS cannot read it → XSS cannot steal it
  secure: true,        // HTTPS only
  sameSite: 'lax',     // survives the email-link navigation; blocks CSRF POSTs
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
})
```

- `sameSite: 'strict'` **breaks magic links** — the cookie is not sent on the cross-site navigation from the mail client. Use `lax`.
- Store a random session id server-side; do not put a signed JWT with user claims in the cookie unless you also have a revocation list. Sessions must be killable.
- Rotate the session id on login. Never reuse a pre-login session id (session fixation).

## Cross-device reality

A user requests the link on their laptop and opens it on their phone. That is the *normal* case, not an attack. Do not bind the token to an IP or user-agent — you will lock out half your users.

If you need stronger assurance, show a short code in the requesting browser and display it on the verify page so the human can compare. Do not enforce it silently.

## Checklist

- [ ] 32-byte CSPRNG token, SHA-256 hashed at rest
- [ ] TTL ≤ 15 min, single use, consumed by an atomic conditional `UPDATE`
- [ ] New request invalidates the user's outstanding tokens
- [ ] `GET` does not consume — a `POST` behind a button does
- [ ] Identical response for known and unknown emails
- [ ] Rate limits on email, IP, and redeem attempts
- [ ] `next` param validated against an allowlist
- [ ] Cookie `httpOnly` + `secure` + `sameSite=lax`; session id rotated on login
- [ ] Token never appears in logs, analytics, or the `Referer` header
