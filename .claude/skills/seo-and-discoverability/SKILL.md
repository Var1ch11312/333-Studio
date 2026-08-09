---
name: seo-and-discoverability
description: Technical SEO for Next.js App Router. Index boundary for auth-gated apps, Metadata API, canonical and hreflang, JSON-LD, sitemap discipline, service-worker traps.
---

# SEO and Discoverability

Most SEO advice assumes a content site. Product apps are mostly logged-in surface, where the correct action is usually **to keep pages out of the index**, not to rank them. Decide which you are building before optimizing anything.

## Step 1: Draw the index boundary

Split every route into exactly one bucket. Do this before writing a single meta tag.

```
PUBLIC / INDEXABLE      landing, pricing, how-it-works, FAQ, blog, legal
                        → full metadata, canonical, JSON-LD, in sitemap

PUBLIC / NOT INDEXABLE  login, magic-link verify, auth callback, /404 variants
                        → crawlable but noindex; NOT in sitemap

PRIVATE / NEVER         /home, /profile, /call/[id], /awake/[id], /onboarding
                        → noindex, and no link path from any public page
```

The third bucket is the one that causes incidents. A call page or a wake-event URL appearing in a search result is a privacy failure that happens to also be an SEO problem.

## Step 2: `Disallow` is not `noindex` — the trap

```
# robots.txt
Disallow: /profile
```

This tells Google **not to crawl** the page. It does not tell Google not to *index* it. If anything links to it, the URL can still appear in results — as a bare URL with no snippet, because the crawler was forbidden from reading the `noindex` you put on it. You blocked the crawler from seeing your own instruction.

Pick one, correctly:

| Goal | Correct mechanism |
|---|---|
| Keep the URL out of results | **Allow crawling**, serve `<meta name="robots" content="noindex">` |
| Save crawl budget on junk | `Disallow` in robots.txt (accept that URLs may still surface) |
| Genuinely private data | Auth wall. Robots directives are advisory; hostile crawlers ignore them. |

For a logged-in app: allow the crawl, return `noindex`, and rely on auth for actual protection.

```ts
// app/(app)/layout.tsx — one place, covers every private route beneath it
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true,
            googleBot: { index: false, follow: false } },
}
```

Route groups make this a single declaration. `(marketing)` gets indexed, `(app)` never does.

## Step 3: Metadata API (App Router)

Verified shapes — these are the ones this repo already uses in production:

```ts
// Static
export const metadata: Metadata = {
  metadataBase: new URL('https://wakechain.app'),   // makes relative OG URLs absolute
  title: { default: 'WakeChain', template: '%s — WakeChain' },
  description: '…',
  alternates: { canonical: '/', languages: { 'ru': '/ru', 'bg': '/bg', 'x-default': '/' } },
  openGraph: { type: 'website', locale: 'ru_RU', siteName: 'WakeChain' },
  twitter: { card: 'summary_large_image' },
}

// Dynamic — per-route, async, can hit the DB
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params          // params is a Promise in this version
  return { title: …, alternates: { canonical: `/blog/${slug}` } }
}
```

- `metadataBase` — set it once in the root layout or every OG image URL ships relative and breaks in crawlers.
- `title.template` — child routes set only their own segment.
- **Never set `keywords`.** No major engine has used it since ~2009. It is noise that signals an unmaintained site.

File-based routes, all typed as `MetadataRoute`:

```
app/robots.ts              → MetadataRoute.Robots
app/sitemap.ts             → MetadataRoute.Sitemap
app/manifest.ts            → MetadataRoute.Manifest
app/opengraph-image.tsx    → generated OG image (ImageResponse)
app/icon.tsx               → favicon
```

## Step 4: Titles and descriptions that earn the click

```
Title        50–60 chars. Primary intent FIRST, brand last.
             ✅ "Будильник по звонку от живого человека — WakeChain"
             ❌ "WakeChain | Главная | Приложение | Будильник"

Description  140–160 chars. Not a keyword dump — it is ad copy.
             Google rewrites ~70% of them anyway; write for the 30%.
```

**Write in the script your users type.** Bulgarian users search in Cyrillic — `цветя Бургас`, not `tsvetya Burgas`. Transliterated Latin titles match nothing and lose every query. Same for Russian. This single mistake can zero out organic traffic while everything looks fine in the browser.

Every indexable page needs a *unique* title and description. Duplicates across pages make Google pick one and drop the rest.

## Step 5: Canonical and hreflang

```ts
alternates: {
  canonical: 'https://wakechain.app/ru/how-it-works',
  languages: {
    'ru': 'https://wakechain.app/ru/how-it-works',
    'bg': 'https://wakechain.app/bg/how-it-works',
    'en': 'https://wakechain.app/en/how-it-works',
    'x-default': 'https://wakechain.app/en/how-it-works',
  },
}
```

Rules that are non-obvious and always broken:

- hreflang must be **reciprocal**. If `ru` points at `bg`, `bg` must point back at `ru`, or the whole cluster is ignored.
- Each language version must **self-reference** in its own `languages` map.
- Include `x-default` for the "none of these match" visitor.
- Canonical must be **absolute** and point to the version you actually want indexed.
- One canonical per page. Two canonical tags = both ignored.

Strip tracking params (`?utm_*`, `?ref=`) from canonicals or you fragment one page into fifty duplicates.

## Step 6: Structured data (JSON-LD)

Ship it as a script tag from a server component. Only mark up what is **visibly on the page** — markup describing content a user cannot see is a manual-action risk.

```tsx
const ld = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'WakeChain',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
}

<script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
```

Worth having, in priority order: `Organization` (root), `SoftwareApplication` or `WebApplication` (landing), `FAQPage` (only if the Q&A is rendered on the page), `BreadcrumbList` (deep pages), `Article` (blog).

Do **not** mark up `AggregateRating` you invented. Fake review markup is the fastest route to a penalty.

Validate on Google's Rich Results Test before shipping, not after.

## Step 7: Sitemap discipline

A sitemap is a statement of *what you want indexed*. Every URL in it must return 200, be self-canonical, and be indexable. A sitemap full of redirects and `noindex` pages trains Google to ignore it.

```ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    { url: `${BASE}/`,             changeFrequency: 'weekly',  priority: 1,   lastModified: new Date() },
    { url: `${BASE}/how-it-works`, changeFrequency: 'monthly', priority: 0.8 },
    // NEVER: /home, /profile, /call/*, /onboarding, /auth/*
  ]
}
```

`lastModified` must be a real modification date. Setting it to `new Date()` on every build tells Google the whole site changed daily, and it stops believing you. Pull it from the content's actual `updated_at`.

Split at 50 000 URLs / 50 MB with a sitemap index.

## Step 8: The service-worker trap

A PWA and a crawler want opposite things. The classic failure: a service worker configured with an SPA fallback serves the cached app shell for *every* navigation. Googlebot requests `/how-it-works`, receives an empty shell, and indexes a blank page.

```js
// ❌ Poisons indexing — every URL returns the shell
self.addEventListener('fetch', e => e.respondWith(caches.match('/app-shell.html')))

// ✅ Network-first for HTML documents; cache only static assets
if (e.request.mode === 'navigate') return   // let the network handle documents
```

Also: never cache HTML with a long `max-age`. Cache the hashed JS/CSS forever, revalidate the documents.

Verify with the URL Inspection tool's **rendered HTML** — not "view source", not your browser. If the rendered HTML is empty, nothing else in this document matters.

## Step 9: Core Web Vitals are a ranking input

Do not re-derive the targets here — see `performance-optimization`. The SEO-specific points:

- CWV are measured on **real users** (CrUX), not Lighthouse. A green lab score with red field data does not help.
- They are a tiebreaker, not a primary factor. Fix relevance and content first; a fast page about nothing still ranks nowhere.
- Field data needs ~28 days to reflect a fix. Do not judge a deploy after two days.

## Step 10: Programmatic pages — the thin-content trap

Tempting for a location product: `/wake-up-call/sofia`, `/wake-up-call/plovdiv`, ×200 cities.

The rule: **a generated page must answer a query a real person types, with content that differs by more than a token swap.** A hundred pages identical except the city name is textbook thin content — they get crawled, judged near-duplicate, and can drag down the whole domain.

If you cannot give each page genuinely distinct value (local wake times, real member counts, timezone specifics), build ten good pages instead of two hundred empty ones.

## Anti-patterns

- `keywords` meta tag — dead since 2009
- Blocking `/_next/static/` in robots.txt — Googlebot needs your JS and CSS to render
- Same title on every page ("WakeChain")
- Canonical pointing to the homepage from every page (de-indexes the whole site)
- Infinite scroll with no crawlable pagination
- `noindex` accidentally shipped to production from a staging config — check this on every deploy
- Interstitials that cover mobile content on load

## Checklist

- [ ] Every route assigned to public-indexable / public-noindex / private-never
- [ ] `(app)` route group carries `robots: { index: false }` at its layout
- [ ] Private routes are crawlable-but-noindex, not `Disallow`-only
- [ ] `metadataBase` set once at the root
- [ ] Unique title + description on every indexable page; no `keywords`
- [ ] Copy written in the script users actually search in
- [ ] Canonical absolute, self-referencing, tracking params stripped
- [ ] hreflang reciprocal, self-referencing, with `x-default`
- [ ] JSON-LD matches visible content; validated in Rich Results Test
- [ ] Sitemap contains only 200 / self-canonical / indexable URLs; real `lastModified`
- [ ] Service worker does not serve the shell for navigations
- [ ] Rendered HTML verified in URL Inspection, not view-source
- [ ] Search Console + Bing Webmaster verified; sitemap submitted
