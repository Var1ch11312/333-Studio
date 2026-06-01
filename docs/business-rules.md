# AMUR.BG — Business Rules Reference

All rules in this document are enforced in code at `lib/constants.ts` and `lib/order-routing.ts`. Do not change values without updating the corresponding legal/cultural source.

---

## 1. Odd Flower Rule

**Rule:** Every bouquet must contain an **odd** number of flowers.

**Source:** Bulgarian cultural tradition. Even number of flowers = condolences / funeral. Giving an even-numbered bouquet as a gift is considered offensive.

**Implementation:**
```ts
// lib/constants.ts
export function isOddFlowerCount(count: number): boolean {
  return count % 2 !== 0;
}
```

**Enforcement:**
- `app/api/orders/route.ts` — rejects orders with even total flower count
- `components/OddFlowerModal.tsx` — shows warning before checkout if count is even
- Validation applies to the **total** across all items in the cart

---

## 2. Dual Pricing Law (EUR + BGN)

**Rule:** All prices MUST be displayed in both EUR and BGN with equal visual prominence until 08.08.2026.

**Source:** Закон за въвеждане на еврото (Law on Euro Introduction). Bulgaria joins the Eurozone on 08.08.2026. Until that date, all price tags must show both currencies. Fines: **150 – 100,000 BGN**.

**Fixed exchange rate:** `1 EUR = 1.95583 BGN` (Bulgarian National Bank official rate — this rate is fixed by law and cannot be negotiated or rounded).

**Implementation:**
```ts
// lib/constants.ts
export const EUR_BGN_RATE = 1.95583;
export const DUAL_PRICE_DEADLINE = new Date("2026-08-08");

export function isDualPriceRequired(): boolean {
  return new Date() < DUAL_PRICE_DEADLINE;
}
```

**Enforcement:**
- `components/DualPrice.tsx` — used on every product card and order summary
- After 08.08.2026, `isDualPriceRequired()` returns `false` and only EUR is shown

---

## 3. Delivery SLA

**Rule:** Orders must be delivered within **2 hours** of payment confirmation.

**Source:** Internal business guarantee used in marketing materials and customer notifications.

**Constants:**
```ts
export const DELIVERY_SLA_HOURS = 2;
```

**Enforcement:**
- `lib/order-routing.ts` — ETA calculation: `15 min prep + 4 min/km`
- `lib/whatsapp.ts` — customer notification includes estimated delivery time
- `app/hub/HubDashboard.tsx` — displays countdown for active orders
- SLA breach threshold is informational only (no automatic penalty applied in v1)

---

## 4. Florist Response SLA

**Rule:** A Hub (florist) has **5 minutes** to accept or reject an order. After 5 minutes with no response, the order auto-escalates to the next nearest Hub.

**Source:** Internal operational rule to ensure order throughput.

**Constants (in `lib/order-routing.ts`):**
```ts
const FLORIST_SLA_MINUTES = 5;
```

**Enforcement:**
- `app/api/cron/dispatch-timeout/route.ts` — runs every 2 minutes, calls `checkAndEscalateTimedOutOrders()`
- `lib/order-routing.ts` → `escalateOrder()` — marks Hub as offline after timeout, tries next Hub
- Hub that misses SLA is set to `status = 'offline'` automatically

---

## 5. Delivery Zones

**Rule:** AMUR.BG delivers within defined geographic zones in Burgas. Each zone has a radius and delivery fee.

```ts
export const DELIVERY_ZONES = {
  center:      { radiusKm: 3.5, feeEur: 5 },
  north:       { radiusKm: 3.5, feeEur: 5 },
  medenRudnik: { radiusKm: 3.5, feeEur: 8 },
} as const;
```

**Zone map:**
- **Center** — central Burgas, covered by Hub 1 (Цветарница Централ)
- **North** — northern Burgas, covered by Hub 2 (Цветарница Север)
- **Meden Rudnik** — southern residential area, higher fee due to distance (future Hub 3)

**Enforcement:**
- `lib/geo.ts` — validates delivery address is within Burgas city limits
- `lib/order-routing.ts` — selects nearest Hub by Haversine distance
- Dynamic fee calculation per zone (pending implementation — currently flat 5 EUR)

---

## 6. Courier Dispatch Rules

**Rule:** Multiple couriers can receive a dispatch broadcast. The **first courier to accept** gets the order (atomic first-wins system).

**Constants:**
```ts
const COURIER_FEE_EUR = 5;       // Fixed fee per delivery
const COURIER_RADIUS_KM = 1.5;   // Max distance from Hub to include courier in broadcast
```

**Prioritization:**
1. Couriers with GPS coordinates within 1.5km of the Hub — preferred
2. Couriers assigned to the same Hub (no GPS) — fallback
3. If no eligible couriers → admin notified via WhatsApp for manual assignment

**Atomic acceptance:** The `dispatch_offers` table uses Supabase's row-level locking. When a courier accepts, the row is updated to `status = 'accepted'` and all other couriers receive "order already taken" notification.

---

## 7. Bulgarian Peak Demand Days

Dates when order volume is significantly higher than normal. Hubs and couriers should be pre-briefed before these dates.

```ts
export const BULGARIAN_PEAK_DAYS = [
  { date: "01-07", name: "Ивановден",     notes: "Иван, Ивана, Йоана" },
  { date: "02-14", name: "Свети Валентин", notes: "Ден на влюбените" },
  { date: "03-01", name: "Баба Марта",    notes: "Мартеници" },
  { date: "03-08", name: "8 март",        notes: "Международен ден на жената" },
  { date: "05-06", name: "Гергьовден",    notes: "Георги, Гергана, Геновева" },
  { date: "05-24", name: "24 май",        notes: "Кирил и Методий" },
  { date: "10-26", name: "Димитровден",   notes: "Димитър, Митко, Дима" },
  { date: "12-06", name: "Никулден",      notes: "Никола, Николай, Николина" },
]
```

The nameday reminder cron job (`0 6 * * *`) uses the `name_days` database table (not this constant) for daily notifications.

---

## 8. GDPR and Data Retention

**Rule:** Customer data collected for nameday reminders requires explicit opt-in. Personal data must not be retained beyond its purpose.

**Implementation:**
- `nameday_optin` boolean column on orders — customer must check a box
- `nameday_optins` table stores phone + name for reminder sending
- `saved_occasions` table stores customer-saved birthdays (opt-in only)

**Recommended retention policy (not yet automated):**
- `orders` table: 2 years (for accounting and legal purposes)
- `nameday_optins`: until customer unsubscribes or 1 year inactive
- `saved_occasions`: until customer deletes or 2 years inactive

---

## 9. Payment Methods

| Method | Provider | Notes |
|---|---|---|
| Card (Visa/MC) | Stripe | Primary method — Stripe Checkout handles 3DS |
| Cash on delivery | Internal | Order created without Stripe; status set to `paid` manually |
| USDC (crypto) | Polygon/Base | Via `/api/v1/premium-data` paywall — not for flower orders |

---

## 10. Flower Catalog Rules

**Minimum order:** 1 bouquet
**Minimum flowers per bouquet:** 1 (odd numbers only)

Standard catalog sizes:
- Single stem (1 flower)
- Small (5–9 stems)
- Medium (11–21 stems)
- Large (23–51 stems)

B2B tier (Corporate Chic): 51-stem arrangements for corporate clients.
