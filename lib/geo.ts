/* OpenRouteService geocoding — 2 000 req/day free tier */
const ORS_GEOCODE = "https://api.openrouteservice.org/geocode/search";

const BURGAS = { lat: 42.4943, lng: 27.4726 };
const MAX_KM = 15;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type GeoResult =
  | { valid: true; lat: number; lng: number; distanceKm: number }
  | { valid: false; error: string };

export async function validateDeliveryAddress(
  address: string
): Promise<GeoResult> {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) {
    /* Fail open during development — log and skip */
    console.warn("[Geo] ORS_API_KEY not set, skipping geo-validation");
    return { valid: true, lat: BURGAS.lat, lng: BURGAS.lng, distanceKm: 0 };
  }

  try {
    const url = new URL(ORS_GEOCODE);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("text", `${address}, Бургас, България`);
    url.searchParams.set("boundary.country", "BG");
    url.searchParams.set("size", "1");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`ORS status ${res.status}`);

    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature) return { valid: false, error: "Адресът не е намерен" };

    const [lng, lat] = feature.geometry.coordinates as [number, number];
    const distanceKm = haversineKm(BURGAS.lat, BURGAS.lng, lat, lng);

    if (distanceKm > MAX_KM) {
      return {
        valid: false,
        error: `Адресът е извън зоната за доставка в Бургас (${distanceKm.toFixed(1)} km)`,
      };
    }
    return { valid: true, lat, lng, distanceKm };
  } catch (err) {
    /* Fail open — never block a real order due to geo service outage */
    console.error("[Geo] Validation error, failing open:", err);
    return { valid: true, lat: BURGAS.lat, lng: BURGAS.lng, distanceKm: 0 };
  }
}
