---
name: code-review-and-quality
description: 5-axis code review with severity labels. ~100-line commits. Catch bugs before merge.
---

# Code Review and Quality

Good code review is not about style. It's about catching bugs, security issues, and architectural drift before they hit production.

## 5-Axis Review

Review every change across these 5 dimensions:

### 1. Correctness
- Does the code do what it's supposed to do?
- Are edge cases handled? (empty arrays, null values, 0, negative numbers)
- Are race conditions possible? (Supabase concurrent writes, WhatsApp duplicate webhooks)
- Are async errors caught and handled?

### 2. Security
- Is user input validated before use?
- Are API routes protected (auth check present)?
- Are SQL queries parameterized (no string interpolation)?
- Are secrets in env vars, not in code?
- See `/security-and-hardening` for full checklist

### 3. Performance
- Are N+1 queries present? (fetching inside a loop)
- Are heavy operations blocking the request? (move to background)
- Are indexes present for queried columns?
- Will this scale to 10x current load?

### 4. Maintainability
- Can a new developer understand this in 5 minutes?
- Are function names accurate to what they do?
- Is there duplication that should be extracted? (3+ identical blocks)
- Is complexity justified? (if it's complex, it needs a comment explaining WHY)

### 5. Test Coverage
- Does new code have tests?
- Do tests cover the happy path AND error cases?
- Are tests meaningful? (would they catch a real regression?)

---

## Severity Labels

Use these labels when noting review issues:

| Label | Meaning | Must fix before merge? |
|---|---|---|
| `[BLOCKER]` | Bug, security issue, or data loss risk | Yes, always |
| `[CRITICAL]` | Breaks user flow or corrupts state | Yes |
| `[MAJOR]` | Significant bug, bad performance, missing auth | Yes |
| `[MINOR]` | Code smell, minor inefficiency | Recommended |
| `[NIT]` | Style, naming, formatting preference | Optional |
| `[QUESTION]` | Needs clarification before judgment | Author must answer |

## Review Format

```
## Code Review: [feature/PR name]

### Blockers (must fix before merge)
- [BLOCKER] `app/api/orders/route.ts:47` — No auth check. Any unauthenticated user can create orders.
  Fix: Add `checkAuth(req)` call at top of POST handler.

### Major Issues
- [MAJOR] `lib/order-routing.ts:89` — N+1 query: fetching courier by ID inside a loop.
  Fix: Fetch all couriers in one query, then filter in memory.

### Minor Issues  
- [MINOR] `lib/geo.ts:12` — Magic number `6371` should be constant `EARTH_RADIUS_KM`.

### Nits
- [NIT] `components/ProductCard.tsx:5` — `props` could be destructured inline.

### Looks Good
- Auth pattern consistent with rest of codebase ✓
- Error messages are user-friendly ✓
- Tests cover the main edge cases ✓
```

## Commit Size

Aim for **~100 lines changed per commit**, max ~200. Larger commits are harder to review, harder to revert, and harder to bisect.

If a PR has 1000+ lines changed:
- It's doing too many things at once
- Ask for it to be split by concern
- Exception: generated files (migrations, lock files)

## Self-Review Checklist

Before requesting review, check:

- [ ] `tsc --noEmit` passes
- [ ] `vitest run` passes
- [ ] No `console.log` left in production code
- [ ] No `TODO` comments (open an issue instead)
- [ ] No hardcoded secrets, tokens, or phone numbers
- [ ] No disabled lint rules without a comment explaining why
- [ ] PR description explains WHAT changed and WHY

## Project-Specific Review Points

For this codebase specifically:

- [ ] WhatsApp button IDs unchanged (`hub_accept_`, `hub_reject_`, `courier_accept_`)
- [ ] `EUR_BGN_RATE` not changed (legally fixed at 1.95583)
- [ ] `isOddFlowerCount` called for any order quantity
- [ ] Cron routes check `Authorization: Bearer {CRON_SECRET}`
- [ ] Stripe webhook checks HMAC signature before processing
- [ ] No `tailwind.config.ts` created (Tailwind v4 uses CSS config)
- [ ] No `budget_tokens` in Claude API calls (use `thinking: { type: "adaptive" }`)
