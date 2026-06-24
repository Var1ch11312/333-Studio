---
name: test-driven-development
description: RED → GREEN → REFACTOR cycle. Test pyramid 80/15/5. DAMP not DRY in tests.
---

# Test-Driven Development

Write the test first. Watch it fail. Make it pass. Refactor.

## The TDD Cycle

```
RED   → Write a failing test that describes the desired behavior
GREEN → Write the minimum code to make it pass (no more)
REFACTOR → Clean up code and tests without changing behavior
          (tests must still pass after refactor)
```

Repeat for every new behavior. Never skip RED. A test you didn't watch fail might not test what you think.

## Test Pyramid

```
        /\
       /E2E\      5%  — Full user journeys (Playwright)
      /------\
     /  Integ  \  15% — API routes, DB queries, webhooks (Vitest + Supabase)
    /------------\
   /    Unit      \ 80% — Pure functions, validators, formatters (Vitest)
  /________________\
```

Most tests should be unit tests. E2E tests are expensive — write them for critical paths only.

## DAMP, not DRY

Tests should be **D**escriptive **A**nd **M**eaningful **P**hrases, not DRY (Don't Repeat Yourself).

```ts
// ❌ DRY (bad for tests) — abstracts away what's being tested
const makeOrder = (overrides = {}) => ({ quantity: 1, ...overrides })
it('validates', () => {
  expect(validate(makeOrder({ quantity: 2 }))).toBe(false)
})

// ✅ DAMP (good) — explicit, readable even in isolation
it('rejects even flower counts because even numbers mean mourning in Bulgaria', () => {
  expect(isOddFlowerCount(2)).toBe(false)
  expect(isOddFlowerCount(10)).toBe(false)
  expect(isOddFlowerCount(100)).toBe(false)
})

it('accepts odd flower counts', () => {
  expect(isOddFlowerCount(1)).toBe(true)
  expect(isOddFlowerCount(11)).toBe(true)
  expect(isOddFlowerCount(51)).toBe(true)
})
```

Each test should be readable as a specification, even without knowing the implementation.

## Unit Tests — What to Test

Test pure functions in `lib/`:
- **Business rules**: `isOddFlowerCount`, EUR/BGN conversion, zone calculation
- **Validators**: form validation, payload validation
- **Formatters**: date formatting, price display, WhatsApp message templates
- **Algorithms**: Haversine distance, hub routing, dispatch ordering

```ts
// lib/geo.test.ts
describe('haversine', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversine(42.5, 27.5, 42.5, 27.5)).toBe(0)
  })

  it('calculates correct distance between Burgas center and Meden Rudnik', () => {
    const dist = haversine(42.4975, 27.4714, 42.4600, 27.4500)
    expect(dist).toBeCloseTo(4.2, 0)  // ~4.2 km
  })
})
```

## Integration Tests — What to Test

Test API routes end-to-end with a real (test) database:
- **Happy path**: valid request → correct response + DB state
- **Auth**: missing/wrong PIN → 401
- **Validation**: invalid payload → 400 with error message
- **Idempotency**: same webhook fired twice → only one order created

```ts
// POST /api/orders integration test
it('creates order and triggers hub routing', async () => {
  const res = await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(validOrderPayload),
  })
  expect(res.status).toBe(201)
  const { id } = await res.json()
  
  const { data } = await supabase.from('orders').select().eq('id', id).single()
  expect(data.status).toBe('pending_hub')
  expect(data.hub_id).not.toBeNull()
})
```

## E2E Tests — What to Test

Only the most critical user journeys:
1. Customer: catalog → checkout → Stripe payment → confirmation
2. Hub: WhatsApp accept → order appears in Hub dashboard
3. Courier: broadcast received → accept → photo upload → delivered
4. Admin: escalation fires after 5-minute timeout

## Test File Conventions

```
lib/geo.ts              → lib/geo.test.ts
lib/order-routing.ts    → lib/order-routing.test.ts
app/api/orders/route.ts → app/api/orders/route.test.ts
```

Co-locate tests with the code they test. Don't put all tests in a `__tests__/` directory.

## Before You Ship

```bash
# Run the full test suite
npx vitest run

# Type check
npx tsc --noEmit

# E2E on staging
npx playwright test
```

All three must pass before a PR can merge.
