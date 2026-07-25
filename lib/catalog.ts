// ============================================================
//  Kiss My Flowers — Product Catalog (single source of truth)
// ============================================================
//
//  👉 ЕDIT THIS FILE to change prices, titles, descriptions,
//     photos, tags or the delivery fee. No other file needs to
//     be touched — the storefront, product pages and checkout
//     all read from here.
//
//  Rules to keep:
//    • `price_eur` is the price in EURO (BGN is auto-calculated).
//    • `flower_count` MUST be an ODD number — an even bouquet is
//      a funeral symbol in Bulgaria (enforced at checkout).
//    • `image_url` — paste any photo URL. Leave `null` to show a
//      decorative ✿ placeholder. Replace the sample Unsplash
//      photos below with your own bouquet photography.
//    • `tag` — short label shown as a chip ("Бестселър", "Премиум",
//      "Сезонен", "B2B", "Именен ден"...). Use `null` for none.
//
//  When you connect Supabase, the live `products` table takes
//  priority and this file becomes the offline fallback.
// ============================================================

export type CatalogProduct = {
  id: string;
  title: string;
  description: string | null;
  price_eur: number;
  flower_count: number;
  tag: string | null;
  image_url: string | null;
};

/** Flat delivery fee in EUR added to every order. */
export const DELIVERY_FEE_EUR = 5;

/** Sample catalog — 8 bouquets calibrated to the Burgas premium market. */
export const PRODUCTS: CatalogProduct[] = [
  {
    id: "1",
    title: "Розова Мечта",
    description:
      "11 розово-бели рози с деликатен аромат, гипсофила и декоративна зеленина. Класически букет за всеки повод.",
    price_eur: 32,
    flower_count: 11,
    tag: null,
    image_url:
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=900&q=80",
  },
  {
    id: "2",
    title: "Слънчева Радост",
    description:
      "9 слънчогледа — символ на топлина и вярност. Сезонни допълнения по избор на флориста.",
    price_eur: 37,
    flower_count: 9,
    tag: "Сезонен",
    image_url:
      "https://images.unsplash.com/photo-1470509037663-253afd7f0f51?w=900&q=80",
  },
  {
    id: "3",
    title: "Нежна Прегръдка",
    description:
      "21 розови рози и бели пиони — романтичен букет за годишнини и специални поводи.",
    price_eur: 59,
    flower_count: 21,
    tag: "Бестселър",
    image_url:
      "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=900&q=80",
  },
  {
    id: "4",
    title: "Алена Страст",
    description:
      "21 червени рози Ecuador с дълги стъбла и интензивен аромат. Декоративна зеленина и бабин лен.",
    price_eur: 69,
    flower_count: 21,
    tag: null,
    image_url:
      "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=900&q=80",
  },
  {
    id: "5",
    title: "Бяла Симфония",
    description:
      "17 бели рози с орхидея Dendrobium и еустома. Луксозна опаковка с панделка. Символ на чистота.",
    price_eur: 89,
    flower_count: 17,
    tag: "Премиум",
    image_url:
      "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=900&q=80",
  },
  {
    id: "6",
    title: "Пролетна Поема",
    description:
      "15 стъбла лалета, нарциси и зюмбюли. Свежест и аромат на пролетта. Наличен март–май.",
    price_eur: 45,
    flower_count: 15,
    tag: "Сезонен",
    image_url:
      "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=900&q=80",
  },
  {
    id: "7",
    title: "Корпоративен Шик",
    description:
      "51 смесени рози — монобукет с луксозна опаковка и персонална картичка. За корпоративни подаръци и партньори.",
    price_eur: 139,
    flower_count: 51,
    tag: "B2B",
    image_url:
      "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=900&q=80",
  },
  {
    id: "8",
    title: "Изненада за Именник",
    description:
      "11 стъбла — персонализиран букет по избор на флориста, съобразен с повода и сезона.",
    price_eur: 39,
    flower_count: 11,
    tag: "Именен ден",
    image_url:
      "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=900&q=80",
  },
];

/** Optional add-ons offered at checkout. Edit freely. */
export type Upsell = { id: string; title: string; price_eur: number; emoji: string };

export const UPSELLS: Upsell[] = [
  { id: "bear", title: "Плюшена мечка 30 см", price_eur: 15, emoji: "🧸" },
  { id: "choco", title: "Raffaello (♥ 18 бр.)", price_eur: 12, emoji: "🍫" },
  { id: "card", title: "Поздравителна картичка", price_eur: 3, emoji: "💌" },
];

/** Look up a bouquet by id. */
export function getProduct(id: string): CatalogProduct | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/**
 * Trusted unit price (EUR) for a known catalog product or upsell id.
 * Returns `null` for unknown ids. Used server-side so customers can
 * never tamper with prices sent from the browser.
 */
export function trustedUnitPriceEur(id: string): number | null {
  const product = PRODUCTS.find((p) => p.id === id);
  if (product) return product.price_eur;
  const upsell = UPSELLS.find((u) => u.id === id);
  if (upsell) return upsell.price_eur;
  return null;
}

/** Human title for a known catalog product or upsell id. */
export function titleForId(id: string): string | null {
  return (
    PRODUCTS.find((p) => p.id === id)?.title ??
    UPSELLS.find((u) => u.id === id)?.title ??
    null
  );
}
