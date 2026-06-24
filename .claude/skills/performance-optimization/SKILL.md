---
name: performance-optimization
description: Core Web Vitals targets (LCP≤2.5s, INP≤200ms, CLS≤0.1). 5-step optimization workflow.
---

# Performance Optimization

Performance is a feature. Slow pages lose customers. For an e-commerce flower shop, every 100ms matters.

## Core Web Vitals Targets

| Metric | Target | Fail |
|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | > 4.0s |
| **INP** (Interaction to Next Paint) | ≤ 200ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | > 0.25 |
| **FCP** (First Contentful Paint) | ≤ 1.8s | > 3.0s |
| **TTFB** (Time to First Byte) | ≤ 800ms | > 1800ms |

## 5-Step Optimization Workflow

```
1. MEASURE     — Get a baseline before optimizing anything
2. IDENTIFY    — Find the actual bottleneck (don't guess)
3. FIX         — Apply the minimal targeted fix
4. MEASURE     — Verify improvement (never trust intuition)
5. DOCUMENT    — Note what was slow and how it was fixed
```

**Never skip step 1 and 4.** Untested "optimizations" often make things worse.

## Measurement Tools

```bash
# Lighthouse CI (automated in GitHub Actions)
npx lighthouse https://amur.bg --output=json

# Bundle analysis
npx @next/bundle-analyzer

# Supabase query performance
# Dashboard → Database → Query Performance → Slow Queries
```

## Layer-by-Layer Optimizations

### Database Layer

**Problem: N+1 queries**
```ts
// ❌ N+1 — one query per order
const orders = await supabase.from('orders').select('*')
for (const order of orders) {
  const hub = await supabase.from('hubs').select('*').eq('id', order.hub_id)
}

// ✅ Join — one query total
const orders = await supabase.from('orders').select('*, hubs(name, address)')
```

**Problem: Missing indexes**
```sql
-- If you query orders by status frequently:
CREATE INDEX idx_orders_status ON orders(status);

-- Composite index for common filter combinations:
CREATE INDEX idx_orders_hub_status ON orders(hub_id, status) WHERE status != 'delivered';
```

**Problem: Fetching too many columns**
```ts
// ❌ Fetches entire row including large JSONB fields
const orders = await supabase.from('orders').select('*')

// ✅ Only what you need
const orders = await supabase.from('orders').select('id, status, created_at, customer_name')
```

### API Layer (Next.js)

**Use React Server Components for data fetching:**
```ts
// ✅ Server component — data fetched server-side, no client JS needed
export default async function CatalogPage() {
  const products = await getProducts() // runs on server
  return <ProductGrid products={products} />
}
```

**Cache expensive queries:**
```ts
// Cache for 60 seconds (revalidates on ISR)
export const revalidate = 60

// Or force-cache for static content
const res = await fetch(url, { cache: 'force-cache' })
```

**Use Supabase streaming for real-time:**
Instead of polling every N seconds, use Supabase Realtime subscriptions. Polling wastes bandwidth and adds latency.

### Frontend Layer

**Images:**
```tsx
// ✅ Use Next.js Image component (auto WebP, lazy load, size hints)
import Image from 'next/image'
<Image src={product.image_url} width={400} height={533} alt={product.name} priority={isAboveFold} />

// ❌ Plain img tag with full-size JPEG
<img src={product.image_url} />
```

**Avoid layout shift (CLS):**
```tsx
// ✅ Reserve space with aspect-ratio (no shift when image loads)
<div className="aspect-[3/4] relative">
  <Image src={...} fill alt={...} />
</div>

// ❌ No size reservation — content jumps when image loads
<img src={...} />
```

**Code splitting:**
```ts
// ✅ Lazy load heavy components
const AdminChart = dynamic(() => import('./AdminChart'), { ssr: false })

// Only load chart library when user navigates to analytics page
```

**Font optimization:**
```ts
// ✅ Next.js font optimization — zero layout shift, subset only latin
import { Cormorant_Garamond } from 'next/font/google'
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['300', '400'] })
```

### WhatsApp/API Response Times

- WhatsApp webhook should respond with 200 within **3 seconds** or Meta retries
- Run heavy processing asynchronously after sending 200
- Log slow webhook handlers (> 1s) as warnings

```ts
// ✅ Respond immediately, process async
export async function POST(req: NextRequest) {
  const body = await req.json()
  
  // Acknowledge receipt immediately
  const response = NextResponse.json({ ok: true })
  
  // Process asynchronously (Vercel Edge: use waitUntil)
  void processWebhook(body)  // don't await
  
  return response
}
```

## Performance Budget

| Asset type | Budget |
|---|---|
| Total JS (initial load) | < 200KB gzipped |
| Total CSS | < 50KB gzipped |
| Images per page | < 500KB total |
| API response time (p95) | < 500ms |
| Webhook response time | < 1000ms |
