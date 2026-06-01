# AMUR.BG — Premium Flower Delivery, Burgas

Premium hyper-local flower delivery platform for Burgas, Bulgaria. Connects customers, florists (Hubs), and couriers through automated WhatsApp-based dispatch.

## Roles

| Role | Interface | Auth |
|---|---|---|
| Customer | Web storefront (`/`) | None |
| Florist (Hub) | Web dashboard (`/hub`) + WhatsApp | PIN |
| Courier | WhatsApp only | None |
| Admin | Web dashboard (`/admin`) | PIN |

## Order Flow

```
Customer pays (Stripe)
  → routeOrderToHub()     nearest Hub gets WhatsApp with [Accept] / [Reject]
    → Hub accepts       → dispatchToCouriers() broadcasts to nearby couriers
      → First courier   → takes the job (atomic first-wins via dispatch_offers)
        → Delivers      → sends photo proof via WhatsApp
          → Done        → customer notified, order marked delivered
```

Florist SLA: **5 minutes** to respond → auto-escalate to next Hub
Delivery SLA: **2 hours** from payment to delivery

---

## Quick Start

```bash
git clone https://github.com/Var1ch11312/333-Studio
cd 333-Studio
npm install
cp .env.example .env.local
# fill in .env.local (see Environment Variables below)
npm run dev
# → http://localhost:3000
```

Minimum env vars for local dev:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ADMIN_PIN + ADMIN_TOKEN
HUB_PIN + HUB_TOKEN
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router, React 19) |
| Database | Supabase (PostgreSQL + RLS + Realtime + pgvector) |
| Payments | Stripe Checkout |
| Messaging | WhatsApp Cloud API, Viber Bot |
| AI Agents | Anthropic Claude claude-opus-4-8 (adaptive thinking, tool use) |
| Embeddings | OpenAI text-embedding-3-small (pgvector RAG) |
| Maps | OpenRouteService (geocoding + Haversine distance) |
| Hosting | Vercel (Edge + Serverless + 5 Cron jobs) |
| Styling | Tailwind CSS v4 (CSS-based config, `@theme inline`) |

---

## Project Structure

```
333-Studio/
├── app/
│   ├── page.tsx                       # Storefront (hero, catalog, trust pillars)
│   ├── checkout/                      # 5-step order form
│   ├── login/                         # PIN auth (admin / hub roles)
│   ├── order-success/                 # Post-payment confirmation
│   ├── admin/                         # Owner dashboard (orders, couriers, namedays)
│   ├── hub/                           # Florist dashboard (real-time order queue)
│   ├── offline/                       # PWA offline fallback
│   └── api/
│       ├── auth/                      # POST: PIN → httpOnly session cookie
│       ├── orders/                    # POST: create order; PATCH [id]/status; POST [id]/photo
│       ├── occasions/                 # POST: save customer birthday
│       ├── namedays/today/            # GET: today's nameday list
│       ├── couriers/                  # GET/POST: courier management
│       ├── webhooks/stripe/           # POST: payment confirmed → route to Hub
│       ├── webhooks/whatsapp/         # POST: Hub/courier WhatsApp button replies
│       ├── webhooks/viber/            # POST: Viber messages
│       ├── cron/nameday-reminders/    # GET: daily 6:00 AM — send reminders
│       ├── cron/dispatch-timeout/     # GET: every 2 min — escalate timed-out orders
│       ├── cron/agent-accountant/     # GET: 1st & 15th 8:00 — tax analysis (Claude)
│       ├── cron/agent-lawyer/         # GET: 1st & 15th 9:00 — legal review (Claude)
│       ├── cron/agent-marketing/      # GET: every Monday 7:00 — marketing insights (Claude)
│       └── v1/premium-data/           # GET: crypto-paywalled analytics API
├── lib/
│   ├── constants.ts                   # Business rules (odd flowers, pricing, SLA, zones)
│   ├── order-routing.ts               # Hub assignment + courier dispatch logic
│   ├── geo.ts                         # Address → lat/lng, Haversine distance
│   ├── whatsapp.ts                    # WhatsApp Cloud API client + 7 message builders
│   ├── viber.ts                       # Viber Bot API client
│   ├── stripe.ts                      # Stripe checkout session creation
│   ├── supabase.ts                    # Browser Supabase client (anon key)
│   ├── supabase-server.ts             # Server Supabase client (service role)
│   ├── crypto-paywall.ts              # USDC verifier (Polygon, Base)
│   ├── utils.ts                       # Misc helpers
│   └── agents/
│       ├── accountant.ts              # Claude: revenue + Bulgarian tax analysis
│       ├── lawyer.ts                  # Claude: legal optimization
│       ├── marketing.ts               # Claude: conversion + ad analysis
│       ├── tools.ts                   # Shared tools (DB queries, RAG search, WA notify)
│       └── embeddings.ts              # OpenAI text-embedding-3-small via fetch
├── components/
│   ├── ui/                            # Base components (Button, Input, Card)
│   ├── ParallaxHero.tsx
│   ├── ProductCard.tsx
│   ├── DualPrice.tsx                  # EUR/BGN legal dual-price display
│   └── OddFlowerModal.tsx             # Cultural validation warning
├── supabase/migrations/
│   ├── 01_init.sql                    # hubs, products, orders, order_items, name_days
│   ├── 02_couriers.sql                # couriers, nameday_optins
│   ├── 03_saved_occasions.sql         # customer birthdays
│   ├── 04_products_seed.sql           # 6 sample bouquets
│   ├── 05_order_extras.sql            # recipient, schedule, greeting, promo
│   ├── 06_api_payments.sql            # payment tracking (crypto paywall)
│   ├── 07_whatsapp_dispatch.sql       # dispatch_offers, hub/courier WA columns
│   └── 08_rag_agents.sql              # pgvector, knowledge_documents, agent_reports
├── docs/
│   ├── architecture.md                # System architecture & data flow diagrams
│   ├── deployment.md                  # Step-by-step deployment guide
│   ├── business-rules.md              # Bulgarian business rules reference
│   └── onboarding/
│       ├── florist-guide.md           # Hub partner guide
│       ├── courier-guide.md           # Courier guide
│       └── admin-guide.md             # Admin guide
├── middleware.ts                      # Route protection (/admin/*, /hub/*)
├── vercel.json                        # 5 cron job schedules
└── .env.example                       # All required environment variables
```

---

## Database Migrations

Apply in order in Supabase SQL Editor:

```
01_init.sql             Core schema + RLS
02_couriers.sql         Couriers + nameday optins
03_saved_occasions.sql  Customer birthdays
04_products_seed.sql    Sample catalog (6 bouquets)
05_order_extras.sql     Extended order fields
06_api_payments.sql     Crypto payment tracking
07_whatsapp_dispatch.sql  Dispatch system
08_rag_agents.sql       AI agents + pgvector
```

Enable pgvector before migration 08:
```sql
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
```

---

## Environment Variables

See `.env.example` for the full list with descriptions.

| Group | Key Variables |
|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| WhatsApp | `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_ADMIN_PHONE` |
| AI Agents | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |
| Auth | `ADMIN_PIN`, `ADMIN_TOKEN`, `HUB_PIN`, `HUB_TOKEN`, `CRON_SECRET` |
| Maps | `OPENROUTESERVICE_API_KEY` |
| App | `NEXT_PUBLIC_APP_URL` |

---

## Cron Jobs

| Route | Schedule | Purpose |
|---|---|---|
| `/api/cron/nameday-reminders` | `0 6 * * *` | Daily 6 AM — WhatsApp nameday reminders |
| `/api/cron/dispatch-timeout` | `*/2 * * * *` | Every 2 min — escalate overdue hub assignments |
| `/api/cron/agent-accountant` | `0 8 1,15 * *` | 1st & 15th 8 AM — tax & revenue report |
| `/api/cron/agent-lawyer` | `0 9 1,15 * *` | 1st & 15th 9 AM — legal optimization |
| `/api/cron/agent-marketing` | `0 7 * * 1` | Every Monday 7 AM — marketing insights |

All cron routes require `Authorization: Bearer {CRON_SECRET}` (Vercel sets this automatically).

---

## Business Rules

- **Odd flower rule**: all bouquets must have odd flower count — even count = funeral in Bulgarian culture
- **Dual pricing**: prices shown in EUR and BGN until 08.08.2026 (Bulgarian law, fines 150–100,000 BGN)
- **EUR/BGN rate**: fixed at 1 EUR = 1.95583 BGN (Bulgarian National Bank official rate)
- **Delivery SLA**: 2 hours from payment to delivery
- **Florist SLA**: 5 minutes to accept/reject, then auto-escalate to next Hub
- **Delivery zones**: Center (3.5km, 5 EUR), North (3.5km, 5 EUR), Meden Rudnik (3.5km, 8 EUR)

Full reference: `docs/business-rules.md`

---

## Scripts

```bash
npm run dev          # Dev server on :3000
npm run build        # Production build
npx tsc --noEmit     # TypeScript check (must be clean before deploy)
npm run lint         # ESLint
```

For WhatsApp webhook testing locally: use `ngrok http 3000` and configure the tunnel URL in Meta Developer console.
