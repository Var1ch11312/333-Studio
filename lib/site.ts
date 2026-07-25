// ============================================================
//  Kiss My Flowers — Brand & Content config
// ============================================================
//
//  👉 EDIT THIS FILE to change brand name, contact details and
//     the main marketing copy on the storefront. Product prices
//     and bouquet content live separately in `lib/catalog.ts`.
// ============================================================

export const SITE = {
  /** Brand name shown in the header, footer and PWA. */
  brand: "Kiss My Flowers",
  /** Short tagline under the logo. */
  tagline: "Любов и романтика",
  /** City you deliver in. */
  city: "Бургас",

  /** Contact details (used in footer + checkout links). */
  email: "hello@kissmyflowers.bg",
  phone: "+359 88 888 8888",
  instagram: "https://instagram.com/kissmyflowers",

  /** Your purchased domain (no protocol). Used for canonical URLs. */
  domain: "kissmyflowers.bg",

  /** Hero section copy on the home page. */
  hero: {
    eyebrow: "Любов и романтика · Бургас",
    line1: "Кажи го с",
    line2: "цветя.",
    sub: "Романтични букети от рози и божури, ръчно подбрани от нашите флористи. Доставка до вратата на любимия човек — за под 2 часа в целия Бургас.",
  },

  /** Collection heading. */
  collection: {
    eyebrow: "Колекция",
    title: "Любов & Романтика",
    sub: "Букети, създадени за най-нежните моменти — годеж, годишнина или просто „обичам те“.",
  },
} as const;
