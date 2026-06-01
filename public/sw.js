/**
 * AMUR.BG Service Worker
 *
 * Cache strategies:
 *  - Static assets (JS/CSS/fonts/images) → Cache First (30 days)
 *  - Pages (/, /checkout, /order-success) → Stale While Revalidate
 *  - API routes (/api/*) → Network Only (never cache mutations)
 *  - Offline fallback → /offline
 */

const CACHE_STATIC = "amur-static-v1";
const CACHE_PAGES  = "amur-pages-v1";
const ALL_CACHES   = [CACHE_STATIC, CACHE_PAGES];

const PRECACHE_PAGES = ["/", "/checkout", "/offline"];

const STATIC_EXTENSIONS = /\.(js|css|woff2?|ttf|otf|svg|png|jpg|webp|ico)$/i;

/* ── Install: pre-cache essential pages ───────────────────── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_PAGES)
      .then((cache) => cache.addAll(PRECACHE_PAGES))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: remove stale caches ───────────────────────── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !ALL_CACHES.includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: route-based strategies ───────────────────────── */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin, non-GET, and API requests
  if (
    url.origin !== self.location.origin ||
    request.method !== "GET" ||
    url.pathname.startsWith("/api/")
  ) {
    return; // pass through to network
  }

  // Static assets → Cache First
  if (STATIC_EXTENSIONS.test(url.pathname) || url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // Pages → Stale While Revalidate with offline fallback
  event.respondWith(staleWhileRevalidate(request, CACHE_PAGES));
});

/* ── Strategy: Cache First ────────────────────────────────── */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Network error", { status: 503 });
  }
}

/* ── Strategy: Stale While Revalidate ────────────────────── */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  // Return cached immediately, revalidate in background
  if (cached) {
    networkPromise; // fire and forget
    return cached;
  }

  // No cache: wait for network
  const networkResponse = await networkPromise;
  if (networkResponse) return networkResponse;

  // Both failed → offline fallback
  const offlineFallback = await cache.match("/offline");
  return (
    offlineFallback ??
    new Response("Няма интернет връзка. Отворете приложението онлайн.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}
