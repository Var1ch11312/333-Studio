# AMUR.BG — Architecture & Design Document

## System Overview

AMUR.BG follows a standard **Client–Server** architecture with three backend layers (Service, Business, Data) and multiple 3rd-party integrations.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE (Browser)                           │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │                        FRONTEND                              │      │
│   │  Next.js 16 App Router (React 19 Server + Client Components) │      │
│   │                                                              │      │
│   │  /           → Storefront (catalog, hero, trust pillars)     │      │
│   │  /checkout   → 5-step order form                            │      │
│   │  /login      → PIN authentication                           │      │
│   │  /admin      → Owner dashboard (protected)                  │      │
│   │  /hub        → Florist dashboard (protected)                │      │
│   └─────────────────────────────────────────────────────────────┘      │
└────────────────┬────────────────────────────────────────────────────────┘
                 │  1. GET static Web App assets (HTML/CSS/JS)
                 │  2.-n. API Request (JSON over HTTPS)
                 │  3.-n. API Response (JSON)
                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVER SIDE (Vercel)                           │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        WEB SERVER                                 │  │
│  │               Next.js Edge Runtime + Serverless Functions         │  │
│  │               middleware.ts → protects /admin/* and /hub/*        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      BACKEND SERVICES                             │  │
│  │                                                                   │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │  │
│  │  │  SERVICE LAYER   │  │  BUSINESS LAYER   │  │  DATA LAYER    │  │  │
│  │  │                  │  │                   │  │                │  │  │
│  │  │  app/api/ routes │→│  lib/             │→│  lib/supabase- │  │  │
│  │  │                  │  │  order-routing.ts │  │  server.ts     │  │  │
│  │  │  - auth          │  │  geo.ts           │  │                │  │  │
│  │  │  - orders        │  │  constants.ts     │  │  Supabase      │  │  │
│  │  │  - couriers      │  │  stripe.ts        │  │  PostgreSQL    │  │  │
│  │  │  - occasions     │  │  whatsapp.ts      │  │  client        │  │  │
│  │  │  - namedays      │  │  viber.ts         │  │  (service role)│  │  │
│  │  │  - webhooks      │  │  agents/          │  │                │  │  │
│  │  │  - cron          │  │  crypto-paywall   │  │                │  │  │
│  │  │  - v1/premium    │  │                   │  │                │  │  │
│  │  └─────────────────┘  └──────────────────┘  └────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────┬──────────────────┘
                   │                                  │
                   ▼                                  ▼
    ┌──────────────────────┐           ┌──────────────────────────────┐
    │       DATABASE        │           │       3RD PARTY SERVICES      │
    │                       │           │                               │
    │   Supabase            │           │  Stripe        (payments)     │
    │   PostgreSQL          │           │  WhatsApp API  (messaging)    │
    │   + RLS               │           │  Viber Bot     (messaging)    │
    │   + Realtime          │           │  Anthropic     (AI agents)    │
    │   + pgvector          │           │  OpenAI        (embeddings)   │
    │   + Storage           │           │  OpenRouteService (geocoding) │
    │                       │           │  Polygon/Base  (crypto)       │
    └──────────────────────┘           └──────────────────────────────┘
```

---

## Layer Responsibilities

### Service Layer (`app/api/`)

HTTP entry points. Validate auth, parse input, call Business Layer, return JSON.

| Route | Method | Caller | Purpose |
|---|---|---|---|
| `/api/auth` | POST/DELETE | Login page | PIN → session cookie |
| `/api/orders` | POST | Checkout | Create order + Stripe session |
| `/api/orders/[id]/status` | PATCH | Hub dashboard | Update order status |
| `/api/orders/[id]/photo` | POST | Hub (delivery proof) | Upload photo to Storage |
| `/api/occasions` | POST | Checkout | Save customer birthday |
| `/api/namedays/today` | GET | Admin/Cron | Today's nameday list |
| `/api/couriers` | GET/POST | Admin | Courier management |
| `/api/webhooks/stripe` | POST | Stripe | Payment confirmed → route order |
| `/api/webhooks/whatsapp` | POST | Meta | Hub/courier reply buttons |
| `/api/webhooks/viber` | POST | Viber | Viber messages |
| `/api/cron/nameday-reminders` | GET | Vercel Cron | Send daily reminders |
| `/api/cron/dispatch-timeout` | GET | Vercel Cron | Escalate timed-out hubs |
| `/api/cron/agent-accountant` | GET | Vercel Cron | Run accountant RAG agent |
| `/api/cron/agent-lawyer` | GET | Vercel Cron | Run lawyer RAG agent |
| `/api/cron/agent-marketing` | GET | Vercel Cron | Run marketing RAG agent |
| `/api/v1/premium-data` | GET | External | Crypto-paywalled analytics |

### Business Layer (`lib/`)

Pure business logic. No HTTP concerns.

| File | Responsibility |
|---|---|
| `order-routing.ts` | Hub assignment (Haversine nearest), courier dispatch (first-wins), SLA escalation |
| `geo.ts` | Address geocoding via OpenRouteService, Haversine distance calculation |
| `constants.ts` | Business rules: odd-flower rule, EUR/BGN rate, delivery SLA, zones, peak holidays |
| `whatsapp.ts` | WhatsApp Cloud API client, message template builders |
| `viber.ts` | Viber Bot API client |
| `stripe.ts` | Stripe checkout session creation |
| `crypto-paywall.ts` | USDC transaction verifier (Polygon, Base) |
| `agents/accountant.ts` | Claude tool-use loop: revenue + tax analysis |
| `agents/lawyer.ts` | Claude tool-use loop: legal optimization |
| `agents/marketing.ts` | Claude tool-use loop: conversion + ad analysis |
| `agents/tools.ts` | Shared agent tools: DB queries, RAG search, WhatsApp notify |
| `agents/embeddings.ts` | OpenAI text-embedding-3-small via raw HTTP |

### Data Layer (`lib/supabase-server.ts` + `lib/supabase.ts`)

All database access. `supabase-server.ts` uses the service role key (bypasses RLS for server-side operations). `supabase.ts` uses the anon key (enforces RLS for client-side).

---

## Database Schema

```
hubs                orders              couriers
────────────        ────────────        ────────────
id (PK)             id (PK)             id (PK)
name                customer_name       name
address             customer_phone      phone
lat, lng            delivery_address    whatsapp_phone
whatsapp_phone      delivery_lat/lng    hub_id (FK→hubs)
status              total_amount_eur    is_available
                    stripe_payment_id   current_lat/lng
                    payment_method      active
                    assigned_hub_id     
                    status              
                    flower_count_valid  
                    photo_proof_url     

products            order_items         dispatch_offers
────────────        ────────────        ────────────
id (PK)             id (PK)             id (PK)
title               order_id (FK)       order_id (FK)
description         product_id (FK)     target_type (hub/courier)
price_eur           quantity            target_id
flower_count        unit_price_eur      status (pending/accepted/rejected/expired)
image_url                               responded_at
hub_id (FK)

nameday_optins      saved_occasions     knowledge_documents
────────────        ────────────        ────────────
id (PK)             id (PK)             id (PK)
phone               customer_phone      category (accounting/legal/marketing)
name                recipient_name      title
viber_id            month, day          content
                                        embedding (vector 1536)

agent_reports
────────────
id (PK)
agent_type (accountant/lawyer/marketing)
period_start, period_end
summary
full_report (jsonb)
```

---

## Order State Machine

```
created → paid → crafting → delivering → delivered
                    ↓                       ↑
                 cancelled              (photo proof)

Transitions:
  created   → paid        POST /api/webhooks/stripe (Stripe payment confirmed)
  paid      → crafting    PATCH /api/orders/[id]/status (Hub accepts)
  crafting  → delivering  PATCH /api/orders/[id]/status (Courier picks up)
  delivering→ delivered   PATCH /api/orders/[id]/status + photo upload
  any       → cancelled   Admin action or all hubs rejected
```

---

## Dispatch Algorithm

```
Payment confirmed
  └─ routeOrderToHub(orderId)
       └─ getRankedHubs() → sort by Haversine distance to delivery address
          └─ skip already-tried hubs (dispatch_offers table)
             └─ send WhatsApp to nearest available hub
                └─ hub has 5 minutes to respond
                   ├─ ACCEPT → dispatchToCouriers(orderId, hubId)
                   │    └─ find couriers within 1.5km of hub (GPS) or same hub
                   │       └─ broadcast to all eligible couriers
                   │          └─ first to press button wins (atomic DB check)
                   └─ REJECT / TIMEOUT → escalateOrder(orderId)
                        └─ mark hub offline (timeout) or rejected
                           └─ routeOrderToHub() with next nearest hub
```

---

## RAG Agent Architecture

```
Vercel Cron trigger (schedule)
  └─ Claude claude-opus-4-8 (adaptive thinking, tool use loop)
       ├─ Tool: getFinancialSummary(period)     → Supabase orders
       ├─ Tool: getCourierEarnings(period)       → Supabase dispatch_offers
       ├─ Tool: getHubPerformance(period)        → Supabase orders + hubs
       ├─ Tool: getOrderMetrics(period)          → Supabase orders (marketing)
       ├─ Tool: searchKnowledgeBase(query, cat)  → pgvector similarity search
       │         └─ embed(query)                 → OpenAI text-embedding-3-small
       │         └─ search_knowledge() RPC       → Supabase pgvector
       ├─ Tool: saveReport(type, period, ...)    → Supabase agent_reports
       └─ Tool: notifyAdmin(message)             → WhatsApp to admin phone
```

---

## Authentication Flow

```
Browser                    Next.js                    Cookie
───────                    ───────                    ──────
GET /admin           →    middleware.ts
                           check amur_session cookie
                           cookie != ADMIN_TOKEN  →   redirect /login?role=admin
POST /api/auth             validate PIN
  { role: "admin",         ADMIN_PIN match?
    pin: "1234" }     →    set httpOnly cookie      →  amur_session = ADMIN_TOKEN
                           redirect to /admin
GET /admin           →    middleware.ts
                           cookie == ADMIN_TOKEN   →  NextResponse.next()
```

---

## Cron Job Schedule

```
UTC Time    │ Schedule      │ Route                          │ Action
────────────┼───────────────┼────────────────────────────────┼──────────────────────────
06:00 daily │ 0 6 * * *     │ /api/cron/nameday-reminders    │ Send WhatsApp to optins
every 2 min │ */2 * * * *   │ /api/cron/dispatch-timeout     │ Escalate timed-out orders
08:00 1+15  │ 0 8 1,15 * *  │ /api/cron/agent-accountant     │ Tax & revenue report (Claude)
09:00 1+15  │ 0 9 1,15 * *  │ /api/cron/agent-lawyer         │ Legal optimization (Claude)
07:00 Mon   │ 0 7 * * 1     │ /api/cron/agent-marketing      │ Marketing insights (Claude)
```

All cron routes require `Authorization: Bearer {CRON_SECRET}` header (set automatically by Vercel).
