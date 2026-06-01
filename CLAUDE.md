@AGENTS.md

# AMUR.BG — Project Context for AI Assistants

## What this project is

Premium flower delivery platform in Burgas, Bulgaria.
Three actors: Customer (web) → Florist/Hub (WhatsApp + web) → Courier (WhatsApp only).
Admin has a separate dashboard. All dispatch is automated via WhatsApp Cloud API.

## Critical: Read Next.js docs before writing any route or component code

This is Next.js 16 — it has breaking changes vs. your training data.
Read the relevant guide in `node_modules/next/dist/docs/` before writing code.

```bash
ls node_modules/next/dist/docs/01-app/01-getting-started/
# 15-route-handlers.md for API routes
# 03-layouts-and-pages.md for pages
# 05-server-and-client-components.md for RSC vs client
```

## Tailwind CSS v4 — NO tailwind.config.ts

Config is CSS-based. Do NOT create `tailwind.config.ts`.
Theme customization goes directly in `app/globals.css` using `@theme inline { ... }`.

## Supabase patterns

**Server-side** (API routes, cron jobs, agents): always use `createServerClient()` from `lib/supabase-server.ts` — uses service role key, bypasses RLS.

**Client-side** (React components): use the client from `lib/supabase.ts` — uses anon key, RLS enforced.

Realtime subscriptions (Hub dashboard example):
```ts
supabase
  .channel('orders')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handler)
  .subscribe()
```

## Business rules — NEVER change these

Located in `lib/constants.ts`. All rules are enforced at the API level:

- `isOddFlowerCount(n)` — bouquet total must be odd (even = funeral in Bulgarian culture)
- `EUR_BGN_RATE = 1.95583` — fixed BNB rate, do NOT change
- `DUAL_PRICE_DEADLINE = 2026-08-08` — show both EUR and BGN until this date
- `DELIVERY_SLA_HOURS = 2` — 2-hour delivery guarantee
- `FLORIST_SLA_MINUTES = 5` — florist has 5 min to accept (in `lib/order-routing.ts`)

## Auth pattern

PIN-based, no OAuth. Session stored as httpOnly cookie `amur_session`.

```
POST /api/auth { role, pin } → sets cookie → redirect
middleware.ts checks cookie against ADMIN_TOKEN / HUB_TOKEN env vars
```

Do NOT add a third role without updating `middleware.ts`.

## Dispatch flow (read before touching order or webhook code)

```
Stripe webhook → routeOrderToHub(orderId)    [lib/order-routing.ts]
WhatsApp reply → dispatchToCouriers(orderId) [lib/order-routing.ts]
Cron every 2m → checkAndEscalateTimedOutOrders() [lib/order-routing.ts]
```

All three functions are in `lib/order-routing.ts`. Keep them there.

## WhatsApp message IDs — never rename these

Button IDs in `lib/whatsapp.ts` must match exactly what the webhook handler checks:
- `hubAcceptId(orderId)` → `hub_accept_{orderId}`
- `hubRejectId(orderId)` → `hub_reject_{orderId}`
- `courierAcceptId(orderId)` → `courier_accept_{orderId}`

Renaming breaks the entire dispatch system.

## Agent tool loop pattern

All three agents (accountant, lawyer, marketing) use the same manual tool-use loop:

```ts
while (true) {
  const response = await client.messages.create({ ... tools, messages })
  messages.push({ role: "assistant", content: response.content })
  if (response.stop_reason === "end_turn") break
  if (response.stop_reason !== "tool_use") break
  // execute tools, push tool_result blocks
  messages.push({ role: "user", content: toolResults })
}
```

Do NOT use Managed Agents SDK — use this manual loop.

## File naming conventions

- API routes: `app/api/[resource]/route.ts`
- Cron routes: `app/api/cron/[name]/route.ts` — must check `Authorization: Bearer {CRON_SECRET}`
- Webhook routes: `app/api/webhooks/[service]/route.ts`
- Business logic: `lib/[domain].ts`
- Agent files: `lib/agents/[name].ts`
- DB migrations: `supabase/migrations/NN_name.sql` (sequential, never skip numbers)

## What NOT to do

- Do NOT use `tailwind.config.ts` — Tailwind v4 uses CSS config
- Do NOT use `process.env.SUPABASE_SERVICE_ROLE_KEY` directly in components — use `createServerClient()`
- Do NOT commit `.env.local` — it's in `.gitignore`
- Do NOT rename WhatsApp button IDs — they are coupled to webhook handler
- Do NOT change `EUR_BGN_RATE` — it's a legally fixed rate
- Do NOT add `budget_tokens` to Claude calls — use `thinking: { type: "adaptive" }`
- Do NOT use `export default` for API route handlers — use named exports `export async function GET/POST/PATCH`
