# AMUR.BG — Deployment Guide

## Prerequisites

- Node.js 20+
- Supabase account (supabase.com)
- Vercel account (vercel.com)
- Stripe account (stripe.com)
- Meta Developer account (developers.facebook.com) — for WhatsApp
- OpenRouteService account (openrouteservice.org) — for geocoding
- Anthropic API key (console.anthropic.com) — for AI agents
- OpenAI API key (platform.openai.com) — for embeddings

---

## Step 1: Supabase Setup

### 1.1 Create Project

1. Go to supabase.com → New Project
2. Region: **Europe West (Frankfurt)** — closest to Bulgaria
3. Name: `amur-bg-production`
4. Copy and save: **Project URL** and **anon key** and **service_role key**

### 1.2 Enable pgvector

In Supabase Dashboard → Database → Extensions → search "vector" → Enable

Or run in SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
```

### 1.3 Run Migrations

In Supabase Dashboard → SQL Editor, run each migration file in order:

```
supabase/migrations/01_init.sql
supabase/migrations/02_couriers.sql
supabase/migrations/03_saved_occasions.sql
supabase/migrations/04_products_seed.sql
supabase/migrations/05_order_extras.sql
supabase/migrations/06_api_payments.sql
supabase/migrations/07_whatsapp_dispatch.sql
supabase/migrations/08_rag_agents.sql
```

### 1.4 Create Storage Buckets

In Supabase Dashboard → Storage → New Bucket:

| Bucket Name | Public | Purpose |
|---|---|---|
| `delivery-proofs` | No | Courier photo proof of delivery |
| `product-images` | Yes | Bouquet photos for storefront |

---

## Step 2: Stripe Setup

### 2.1 Get API Keys

Dashboard → Developers → API keys:
- **Secret key** (`sk_live_...`) → `STRIPE_SECRET_KEY`
- **Publishable key** (`pk_live_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Use test keys (`sk_test_...`) during development.

### 2.2 Register Webhook

Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://amur.bg/api/webhooks/stripe`
- Events to listen: `checkout.session.completed`
- Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## Step 3: WhatsApp Cloud API Setup

### 3.1 Create Meta App

1. Go to developers.facebook.com → My Apps → Create App
2. Type: Business
3. App name: AMUR.BG
4. Add product: WhatsApp

### 3.2 Get Credentials

WhatsApp → Getting Started:
- **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID`
- **Temporary Access Token** (for testing) → `WHATSAPP_ACCESS_TOKEN`

For production, create a permanent token:
Meta Business Suite → System Users → Create → Generate Token → select WhatsApp permission

### 3.3 Register Webhook

WhatsApp → Configuration → Webhook:
- Callback URL: `https://amur.bg/api/webhooks/whatsapp`
- Verify token: any string you choose → `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Subscribe to: `messages`

### 3.4 Submit Message Templates

WhatsApp → Message Templates → Create:
Templates must be approved by Meta before sending (24–48 hours).
Required templates for AMUR.BG:
- Order confirmation to customer
- Hub dispatch (Accept/Reject buttons)
- Courier dispatch (Take Order button)
- Order delivered confirmation

---

## Step 4: Vercel Deployment

### 4.1 Import Repository

1. vercel.com → Add New Project → Import Git Repository
2. Select `Var1ch11312/333-Studio`
3. Framework: Next.js (auto-detected)

### 4.2 Set Environment Variables

In Vercel → Project → Settings → Environment Variables, add all variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_ACCESS_TOKEN=EAA...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
WHATSAPP_ADMIN_PHONE=359888123456

# AI Agents
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Auth
ADMIN_PIN=xxxx
ADMIN_TOKEN=<openssl rand -hex 32>
HUB_PIN=xxxx
HUB_TOKEN=<openssl rand -hex 32>
CRON_SECRET=<openssl rand -hex 32>

# Maps
OPENROUTESERVICE_API_KEY=5b3ce...

# App
NEXT_PUBLIC_APP_URL=https://amur.bg
```

Select **Production + Preview + Development** for each variable.

### 4.3 Configure Domain

Vercel → Project → Settings → Domains → Add Domain: `amur.bg`

DNS configuration (at your domain registrar):
```
Type  Name  Value
A     @     76.76.21.21    (Vercel IP)
CNAME www   cname.vercel-dns.com
```

### 4.4 Verify Cron Jobs

After deployment, in Vercel → Project → Cron Jobs, verify 5 jobs appear:
- `/api/cron/nameday-reminders` — `0 6 * * *`
- `/api/cron/dispatch-timeout` — `*/2 * * * *`
- `/api/cron/agent-accountant` — `0 8 1,15 * *`
- `/api/cron/agent-lawyer` — `0 9 1,15 * *`
- `/api/cron/agent-marketing` — `0 7 * * 1`

---

## Step 5: Seed Knowledge Base for AI Agents

After deploying, add initial documents to the RAG knowledge base:

```sql
-- Add to Supabase SQL Editor (category: accounting, legal, or marketing)
INSERT INTO knowledge_documents (category, title, content) VALUES
('accounting', 'Корпоративен данък — 10%', 'Съгласно чл. 20 от ЗКПО, данъчната ставка е 10% върху данъчната печалба...'),
('legal', 'Статус на куриера — граждански договор', 'Куриерите работят по граждански договори (ГД). Осигурителни вноски: 27.8%...'),
('marketing', 'Пикови дни за цветя в България', '8 март, 14 февруари, Гергьовден, Димитровден са основните пикове...');
```

Then generate embeddings (run once as a one-off script or via Supabase Edge Function).

---

## Step 6: Go-Live Checklist

Run through this checklist before switching to production:

```
Infrastructure
  [ ] amur.bg domain resolves to Vercel
  [ ] HTTPS certificate active (Vercel auto-provisions)
  [ ] All 8 Supabase migrations applied successfully
  [ ] All 5 Vercel cron jobs visible in dashboard

Payments
  [ ] Stripe live keys configured (not test keys)
  [ ] Stripe webhook registered and shows "Active"
  [ ] Test order with real card completes successfully

WhatsApp
  [ ] Webhook registered and verified in Meta console
  [ ] At least one message template approved by Meta
  [ ] Test message sends successfully from API

End-to-End Smoke Test
  [ ] Place test order from storefront
  [ ] Stripe payment completes
  [ ] Hub receives WhatsApp with Accept/Reject buttons
  [ ] Hub accepts → courier receives dispatch message
  [ ] Courier accepts → customer receives ETA notification
  [ ] Admin dashboard shows order in correct status

AI Agents
  [ ] Trigger accountant agent manually → report saved to agent_reports
  [ ] Admin receives WhatsApp notification from agent

Monitoring
  [ ] Sentry error tracking configured (recommended before launch)
  [ ] Uptime monitoring configured (UptimeRobot or BetterStack)
```

---

## Local Development with Stripe Webhooks

Stripe webhooks require a public URL. For local dev:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret shown → add to .env.local as STRIPE_WEBHOOK_SECRET
```

## Local Development with WhatsApp Webhooks

Use ngrok to expose local server:
```bash
ngrok http 3000
# Use the https://xxx.ngrok.io URL in Meta Developer console webhook config
```
