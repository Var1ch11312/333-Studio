# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

# AMUR.BG — RAG Agents Documentation

Three AI agents built on Claude claude-opus-4-8 with adaptive thinking and tool use. Each agent runs on a Vercel cron schedule, queries Supabase for business data, searches the pgvector knowledge base, generates a report, saves it to `agent_reports`, and notifies the admin via WhatsApp.

## Architecture

```
Vercel Cron
  └─ GET /api/cron/agent-{name}
       └─ run{Name}Agent(periodStart, periodEnd)   [lib/agents/{name}.ts]
            └─ Claude claude-opus-4-8 tool-use loop
                 ├─ getFinancialSummary / getCourierEarnings / getHubPerformance / getOrderMetrics
                 │    └─ Supabase PostgreSQL queries   [lib/agents/tools.ts]
                 ├─ searchKnowledgeBase(query, category)
                 │    └─ embed(query)                  [lib/agents/embeddings.ts → OpenAI]
                 │    └─ search_knowledge() RPC         [Supabase pgvector]
                 ├─ saveReport(type, period, summary, fullReport)
                 │    └─ INSERT INTO agent_reports     [Supabase]
                 └─ notifyAdmin(message)
                      └─ sendWhatsAppText()            [lib/whatsapp.ts]
```

## Agent: Accountant

**File:** `lib/agents/accountant.ts`
**Cron:** `0 8 1,15 * *` — 1st and 15th of every month at 08:00 UTC
**Period:** Previous 15 days

**Task:** Calculate revenue, courier fees, hub commissions, and Bulgarian taxes owed.

**Bulgarian tax rules applied:**
- Corporate income tax: 10% flat rate on annual profit
- VAT: 20% (register when turnover exceeds 100,000 BGN/year)
- Employer social contributions: ~33% on gross salary (НОИ + НЗОК + ДЗПО)
- Courier self-employed contributions: ~27.8% on declared income
- Dividend tax: 5% for Bulgarian residents
- Minimum wage (2025): 933 BGN/month

**Tools available:**
- `get_financial_summary(period_start, period_end)` — total orders, revenue, status breakdown
- `get_courier_earnings(period_start, period_end)` — per-courier delivery counts and fees
- `get_hub_performance(period_start, period_end)` — per-hub revenue and order counts
- `search_knowledge_base(query)` — searches `knowledge_documents` WHERE category = 'accounting'
- `save_report(summary, full_report)` — persists to `agent_reports` table

**Output:** Bulgarian-language summary + JSON report with revenue breakdown, tax calculations, recommendations.

---

## Agent: Lawyer

**File:** `lib/agents/lawyer.ts`
**Cron:** `0 9 1,15 * *` — 1st and 15th of every month at 09:00 UTC
**Period:** Previous 15 days

**Task:** Find legal ways to optimize taxes, social contributions, and labor costs.

**Focus areas:**
- ЕООД vs ЕТ vs freelance contract structure
- Courier classification: employment vs civil contract vs self-employment (ГД, ДУ)
- Tax reliefs: §60 ЗДДФЛ (patent tax), ZKPO deductions, VAT threshold management
- Hub florist contracts: rental income vs service contract optimization
- Dividend vs salary optimization for owner-managers
- Bulgarian investment incentives (ЗИНЗП category B municipalities)

**Tools available:**
- `get_financial_summary`, `get_courier_earnings`, `get_hub_performance` — same as accountant
- `search_knowledge_base(query)` — searches `knowledge_documents` WHERE category = 'legal'
- `save_report(summary, full_report)` — persists to `agent_reports`

**Output:** Bulgarian-language summary with top 3 actions + detailed JSON report with legal citations.

---

## Agent: Marketing

**File:** `lib/agents/marketing.ts`
**Cron:** `0 7 * * 1` — every Monday at 07:00 UTC
**Period:** Previous 7 days

**Task:** Analyze order metrics, conversion rates, product performance, and ad effectiveness.

**Analysis areas:**
- Conversion rate: visits → orders (from order volume trends)
- Product performance: top bouquets by revenue and repeat orders
- Order timing: peak hours, days, seasonal patterns
- Pricing sensitivity: impact on volume
- Competitive positioning: premium vs mid-market in Burgas
- Seasonal peaks: 8 March, 14 February, Easter, graduation season (May–June)

**Tools available:**
- `get_order_metrics(period_start, period_end)` — conversion rate, top products, orders by day
- `get_financial_summary(period_start, period_end)` — revenue correlation
- `search_knowledge_base(query)` — searches `knowledge_documents` WHERE category = 'marketing'
- `save_report(summary, full_report)` — persists to `agent_reports`

**Output:** Bulgarian-language summary with #1 action for next week + JSON report with metrics, A/B test ideas, ad copy suggestions.

---

## Knowledge Base

The agents search `knowledge_documents` table in Supabase using pgvector similarity search.

### Seeding the knowledge base

Before agents can return useful results, populate `knowledge_documents` with relevant content:

```sql
-- Example: add Bulgarian tax law article
INSERT INTO knowledge_documents (category, title, content)
VALUES (
  'accounting',
  'ЗКПО чл. 20 — Корпоративен данък 10%',
  'Корпоративният данък в България е 10% плосък данък върху облагаемата печалба...'
);
```

Then run embeddings for unseeded documents via the embeddings function:

```ts
import { embed } from '@/lib/agents/embeddings'
import { createServerClient } from '@/lib/supabase-server'

const supabase = createServerClient()
const { data: docs } = await supabase
  .from('knowledge_documents')
  .select('id, content')
  .is('embedding', null)

for (const doc of docs ?? []) {
  const embedding = await embed(doc.content)
  await supabase
    .from('knowledge_documents')
    .update({ embedding })
    .eq('id', doc.id)
}
```

### Recommended documents to seed

**Category: `accounting`**
- ЗКПО (Закон за корпоративното подоходно облагане) — key articles
- ЗДДС (Закон за данък върху добавената стойност) — VAT rules
- НАП social contribution rates (current year)
- Courier self-employment contribution calculator

**Category: `legal`**
- КТ (Кодекс на труда) — employment vs contractor classification
- ЗДДФЛ §60 — patent tax for small business
- ЗИНЗП — investment incentives for category B municipalities
- GDPR Article 5 — data retention requirements

**Category: `marketing`**
- Bulgarian flower market research (Burgas segment)
- WhatsApp marketing best practices
- Seasonal campaign calendar for Bulgarian holidays
- Premium positioning strategies for local delivery

---

## Database Tables

```sql
-- Reports saved after each agent run
agent_reports (
  id           UUID PRIMARY KEY,
  agent_type   TEXT  -- 'accountant' | 'lawyer' | 'marketing'
  period_start DATE,
  period_end   DATE,
  summary      TEXT,  -- short Bulgarian text for admin
  full_report  JSONB, -- structured data
  created_at   TIMESTAMPTZ
)

-- Knowledge base for RAG search
knowledge_documents (
  id         UUID PRIMARY KEY,
  category   TEXT  -- 'accounting' | 'legal' | 'marketing'
  title      TEXT,
  content    TEXT,
  embedding  vector(1536),  -- OpenAI text-embedding-3-small
  created_at TIMESTAMPTZ
)
```

---

## Environment Variables

```
ANTHROPIC_API_KEY   — Claude claude-opus-4-8 (agents)
OPENAI_API_KEY      — text-embedding-3-small (RAG embeddings)
WHATSAPP_ADMIN_PHONE — admin phone for report notifications (format: 359888123456)
CRON_SECRET         — protects cron route endpoints
```

---

## Testing an Agent Manually

```bash
# Trigger accountant agent (replace TOKEN with your CRON_SECRET value)
curl -X GET https://amur.bg/api/cron/agent-accountant \
  -H "Authorization: Bearer TOKEN"

# Check if report was saved
# Supabase Dashboard → Table Editor → agent_reports → latest row
```
