/** Fixed EUR → BGN conversion rate (BNB official rate) */
export const EUR_BGN_RATE = 1.95583;

/**
 * Until this date, every price MUST be displayed in both EUR and BGN
 * with equal prominence. After this date, lev is no longer legal tender.
 * Fines: 150 – 100 000 BGN.
 */
export const DUAL_PRICE_DEADLINE = new Date("2026-08-08");

/** Delivery SLA in hours */
export const DELIVERY_SLA_HOURS = 2;

/** Hub coverage zones (radius in km, delivery fee in EUR) */
export const DELIVERY_ZONES = {
  center: { radiusKm: 3.5, feeEur: 5 },
  north: { radiusKm: 3.5, feeEur: 5 },
  medenRudnik: { radiusKm: 3.5, feeEur: 8 },
} as const;

/** Minimum flower count per bouquet (must be odd) */
export const MIN_FLOWERS = 1;

/**
 * Bulgarian cultural rule: even number of flowers = funeral/condolences.
 * All bouquet quantities must result in an ODD total.
 */
export function isOddFlowerCount(count: number): boolean {
  return count % 2 !== 0;
}

/** Format price with dual EUR/BGN display */
export function formatDualPrice(priceEur: number): { eur: string; bgn: string } {
  const priceBgn = priceEur * EUR_BGN_RATE;
  return {
    eur: new Intl.NumberFormat("bg-BG", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(priceEur),
    bgn: new Intl.NumberFormat("bg-BG", {
      style: "currency",
      currency: "BGN",
      minimumFractionDigits: 2,
    }).format(priceBgn),
  };
}

/** True while the dual-price law is in effect */
export function isDualPriceRequired(): boolean {
  return new Date() < DUAL_PRICE_DEADLINE;
}

/** Major Bulgarian flower-peak holidays */
export const BULGARIAN_PEAK_DAYS = [
  { date: "01-07", name: "Ивановден", notes: "Иван, Ивана, Йоана" },
  { date: "02-14", name: "Свети Валентин", notes: "Ден на влюбените" },
  { date: "03-01", name: "Баба Марта", notes: "Мартеници — начало на пролетта" },
  { date: "03-08", name: "8 март", notes: "Международен ден на жената" },
  { date: "05-06", name: "Гергьовден", notes: "Георги, Гергана, Геновева" },
  { date: "05-24", name: "24 май", notes: "Кирил и Методий" },
  { date: "10-26", name: "Димитровден", notes: "Димитър, Митко, Дима" },
  { date: "12-06", name: "Никулден", notes: "Никола, Николай, Николина" },
] as const;
