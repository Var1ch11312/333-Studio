# Kiss My Flowers — Launch Checklist

Everything needed to take the storefront from code to a live shop on your
domain. Items are ordered by priority. **Tier 1 = minimum to sell.**

---

## 0. What already works with zero setup

- Browsing the storefront, collection and product pages
- Adding to cart
- All prices/content come from **two editable files** (no database needed):
  - **`lib/catalog.ts`** — bouquets: title, description, **price (EUR)**, flower
    count, tag, photo. *Edit this to change the catalog.*
  - **`lib/site.ts`** — brand name, tagline, contact email/phone, hero text.

> The sample photos are placeholders from Unsplash. Replace the `image_url`
> values with your own bouquet photos when ready.

---

## 1. Editing prices & content (you can do this yourself)

| Want to change… | File | Field |
|---|---|---|
| A price | `lib/catalog.ts` | `price_eur` |
| A bouquet name / description | `lib/catalog.ts` | `title` / `description` |
| A product photo | `lib/catalog.ts` | `image_url` (any image URL) |
| The "Бестселър/Премиум…" chip | `lib/catalog.ts` | `tag` |
| Add / remove a bouquet | `lib/catalog.ts` | add/remove an object in `PRODUCTS` |
| Delivery fee | `lib/catalog.ts` | `DELIVERY_FEE_EUR` |
| Checkout add-ons (мечка, бонбони…) | `lib/catalog.ts` | `UPSELLS` |
| Brand name / tagline | `lib/site.ts` | `brand` / `tagline` |
| Contact email / phone / Instagram | `lib/site.ts` | `email` / `phone` / `instagram` |
| Hero / collection headline text | `lib/site.ts` | `hero` / `collection` |

Rule that stays enforced: **flower_count must be ODD** (even = funeral in BG).

---

## 2. What I need FROM YOU to finish the launch

### A. Brand assets & info
- [ ] **Logo** (SVG or PNG, transparent) — for header + favicon + PWA icon
- [ ] **Bouquet photos** (or confirm we keep the sample stock photos for now)
- [ ] **Real contact**: email, phone, Instagram/Facebook links
- [ ] **Legal entity details** for the Terms/Privacy pages: company name,
      ЕИК/Булстат, registered address, DPO/contact email

### B. Domain (you already bought it)
- [ ] Tell me the exact domain (e.g. `kissmyflowers.bg`)
- [ ] Access to its **DNS** (or add the records I give you) to point it at Vercel

### C. Accounts & API keys (create, then send me the values — see table below)
Send these privately (NOT in a public chat / commit). I'll put them into Vercel.

| # | Service | What to create | Keys to send |
|---|---|---|---|
| 1 | **Supabase** | New project | `Project URL`, `anon key`, `service_role key` |
| 2 | **Stripe** | Account (BG) + activate payments | `Secret key` (`sk_...`), then `Webhook signing secret` (`whsec_...`) |
| 3 | **Vercel** | Account + connect this GitHub repo | invite me / or you deploy with my guide |
| 4 | OpenRouteService *(optional)* | Free API key | `OPENROUTESERVICE_API_KEY` |
| 5 | WhatsApp Cloud API *(optional, for auto-dispatch)* | Meta app + phone number | `phone_number_id`, `access_token`, a verify token you invent, admin phone |
| 6 | Anthropic + OpenAI *(optional, AI reports)* | API keys | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |

You also choose 4 secrets (any random strings / PINs):
- [ ] `ADMIN_PIN` (login PIN for you) + `ADMIN_TOKEN` (random string)
- [ ] `HUB_PIN` (login PIN for florists) + `HUB_TOKEN` (random string)
- [ ] `CRON_SECRET` (random string)

> Full variable reference with comments: **`.env.example`**.

---

## 3. Deploy steps (I run these once I have the above)

1. **Supabase**: run the SQL migrations in order (`supabase/migrations/01…10`).
   Enable `vector` extension before `08`. Migration `10` seeds the 8 bouquets.
2. **Stripe**: add `STRIPE_SECRET_KEY`; create a webhook to
   `https://<domain>/api/webhooks/stripe` (event `checkout.session.completed`)
   → copy its `whsec_…` into `STRIPE_WEBHOOK_SECRET`.
3. **Vercel**: import the repo, paste all env vars, set
   `NEXT_PUBLIC_APP_URL=https://<domain>`, deploy. Cron jobs auto-register
   from `vercel.json`.
4. **Domain**: add it in Vercel → set the DNS records at your registrar.
5. **Smoke test**: open the site → place a test order with a Stripe test card
   → confirm `/order-success` and the row in Supabase `orders`.

Detailed version: **`docs/deployment.md`**.

---

## 4. Known follow-ups (not blockers)
- Checkout currently buys **one bouquet at a time** (the cart can hold several;
  full multi-item checkout is a planned enhancement).
- Replace stock photos with real photography.
- Fill in real legal text on `/terms`, `/privacy`, `/refund`.
