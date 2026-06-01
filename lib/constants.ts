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

/** Hub coverage zones (centre point + radius in km, delivery fee in EUR) */
export const DELIVERY_ZONES = {
  center:      { label: "Център",       lat: 42.4943, lng: 27.4726, radiusKm: 3.5, feeEur: 5 },
  north:       { label: "Север",        lat: 42.5215, lng: 27.4690, radiusKm: 3.5, feeEur: 5 },
  medenRudnik: { label: "Меден Рудник", lat: 42.4570, lng: 27.4280, radiusKm: 4.5, feeEur: 8 },
} as const;

export type DeliveryZoneKey = keyof typeof DELIVERY_ZONES;

/** Default fee when an address falls outside every defined zone radius */
export const DEFAULT_DELIVERY_FEE_EUR = 5;

/**
 * Pick the delivery zone whose centre is nearest to the address.
 * Pure geometry — no DB call. `distanceKm` accepts the haversine helper
 * so this stays dependency-free and unit-testable.
 */
export function resolveDeliveryZone(
  lat: number,
  lng: number,
  distanceKm: (aLat: number, aLng: number, bLat: number, bLng: number) => number
): { key: DeliveryZoneKey; feeEur: number; label: string } {
  let best: { key: DeliveryZoneKey; dist: number } | null = null;

  for (const key of Object.keys(DELIVERY_ZONES) as DeliveryZoneKey[]) {
    const z = DELIVERY_ZONES[key];
    const dist = distanceKm(lat, lng, z.lat, z.lng);
    if (!best || dist < best.dist) best = { key, dist };
  }

  if (!best) {
    return { key: "center", feeEur: DEFAULT_DELIVERY_FEE_EUR, label: DELIVERY_ZONES.center.label };
  }
  const zone = DELIVERY_ZONES[best.key];
  return { key: best.key, feeEur: zone.feeEur, label: zone.label };
}

/** Delivery fee in EUR for a delivery coordinate, by nearest zone. */
export function deliveryFeeForZone(
  lat: number,
  lng: number,
  distanceKm: (aLat: number, aLng: number, bLat: number, bLng: number) => number
): number {
  return resolveDeliveryZone(lat, lng, distanceKm).feeEur;
}

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
