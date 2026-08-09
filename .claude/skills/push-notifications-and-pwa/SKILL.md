---
name: push-notifications-and-pwa
description: Web Push and service workers done right. VAPID, subscription lifecycle and pruning, iOS install requirement, permission priming, urgency headers, click routing.
---

# Web Push and PWA

Web Push is best-effort message delivery to a device that may be asleep, offline, or running an OS that throttles you. Build for that, not for the happy path.

## Architecture

```
Browser                    Your server                 Push service (FCM/APNs/Mozilla)
  │  register SW                                              │
  │  subscribe(VAPID pub key) ──────► store endpoint+keys     │
  │                                                            │
  │                            send(endpoint, payload) ───────►│
  │◄─────────── 'push' event in service worker ────────────────┤
  │  showNotification()                                        │
```

You never talk to the device. You POST to the endpoint the browser gave you, and the push service decides when it arrives.

## VAPID

```bash
npx web-push generate-vapid-keys   # once, ever. Losing the private key invalidates every subscription.
```

```
VAPID_PUBLIC_KEY    → client (safe to expose)
VAPID_PRIVATE_KEY   → server env only
VAPID_SUBJECT       → mailto:ops@example.com  (push services use it to contact you)
```

Rotating VAPID keys forces every user to resubscribe. Treat the private key as permanent infrastructure.

## Subscription lifecycle — the part that rots

Subscriptions expire silently. Browsers rotate them, users clear site data, apps get uninstalled. A table full of dead endpoints means your delivery metrics lie to you.

```ts
const res = await webpush.sendNotification(sub, payload, { TTL: 300, urgency: 'high' })
  .catch(err => err)

if (err?.statusCode === 404 || err?.statusCode === 410) {
  await db.deleteSubscription(sub.endpoint)   // Gone. Delete it, do not retry.
}
if (err?.statusCode === 429) {
  // Rate limited by the push service. Back off, retry with jitter.
}
```

Also re-sync on every app open:

```ts
const sub = await registration.pushManager.getSubscription()
if (sub) await fetch('/api/push/sync', { method: 'POST', body: JSON.stringify(sub) })
```

Store one row per (user, endpoint) — a user has a phone and a laptop, and both should ring.

## iOS: read this before promising anything

| Constraint | Detail |
|---|---|
| Minimum version | iOS 16.4+ for Web Push at all |
| **Must be installed** | Push only works if the user did **Share → Add to Home Screen**. A Safari tab gets nothing. |
| Permission | Must be requested from a user gesture, inside the installed PWA |
| No install prompt | iOS has no `beforeinstallprompt`. You must show illustrated instructions. |
| Badging/sound | Limited; do not rely on a custom sound to wake anyone |

For a product whose core loop is "wake a sleeping person", this is a first-class product constraint, not a footnote. The onboarding must walk iOS users through installation, and the app must detect and warn:

```ts
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                  || (navigator as any).standalone === true
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
if (isIOS && !isStandalone) showInstallInstructions()   // push will NOT work otherwise
```

## Permission priming — never ask on page load

A denied permission is close to permanent; the user must dig into browser settings to undo it. Spend a screen earning the yes.

```
1. Onboarding explains WHY:  "We need to notify you when it's time to wake someone.
                              Without this, you will miss your turn."
2. A button: "Enable notifications"
3. ONLY inside that click:   await Notification.requestPermission()
4. If denied → explain what breaks and how to re-enable. Do not re-prompt; you cannot.
```

Track `Notification.permission` (`'default' | 'granted' | 'denied'`) as user state and surface it in the profile. A user with `denied` cannot participate reliably and should be told so.

## Payload and headers

```ts
await webpush.sendNotification(sub, JSON.stringify({
  title: 'Time to wake Maria',
  body:  'Tap to call — she is counting on you',
  data:  { callId, url: `/call/${callId}` },
  tag:   `wake-${callId}`,     // replaces an earlier notification with the same tag
}), {
  TTL: 300,           // seconds. After this, the push service DROPS it. For a
                      // time-critical wake-up, a late notification is worse than none.
  urgency: 'high',    // 'very-low'|'low'|'normal'|'high' — affects battery-saver delivery
})
```

Keep payloads under ~4 KB. They are encrypted end-to-end; the push service cannot read them, so no PII concerns from the service — but a notification renders on a lock screen, so keep it to a first name.

## Service worker

```js
// public/sw.js
self.addEventListener('push', (event) => {
  const d = event.data?.json() ?? {}
  event.waitUntil(                       // ← without this the SW may die mid-await
    self.registration.showNotification(d.title, {
      body: d.body, tag: d.tag, data: d.data,
      requireInteraction: true,          // do not auto-dismiss a wake-up
      actions: [{ action: 'call', title: 'Call now' }],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = clients.find(c => c.url.includes(new URL(url, self.location.origin).pathname))
    if (existing) return existing.focus()          // reuse the open tab
    return self.clients.openWindow(url)
  })())
})
```

Every handler must call `event.waitUntil()`. A service worker is killed as soon as its handler returns, and an un-awaited promise is silently dropped.

## Update discipline

An old service worker will serve stale code for days. Ship a version constant and skip waiting:

```js
self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
```

Do not aggressively cache API responses in the SW for a real-time product. Cache the shell; let data be network-first.

## Push is never the only path

Design assumption: **any given push may not arrive.** Battery saver, Doze mode, a closed laptop, a revoked permission. The wake-up must still work:

- In-app polling / Realtime subscription while the app is foregrounded
- A visible in-app "you owe a call in 4 min" banner
- The escalation ladder in `failover-and-chain-reliability`, ending in the sleeper's own device alarm

## Checklist

- [ ] VAPID keys generated once, private key server-only
- [ ] One subscription row per (user, endpoint); pruned on 404/410
- [ ] Subscription re-synced on every app open
- [ ] iOS standalone-mode detection + install instructions in onboarding
- [ ] Permission requested only from a user gesture, after an explanation screen
- [ ] `denied` state surfaced in the UI as a broken-participation warning
- [ ] `TTL` and `urgency: 'high'` set on time-critical sends
- [ ] `event.waitUntil()` in every SW handler
- [ ] Notification click focuses an existing tab instead of opening a duplicate
- [ ] The flow degrades correctly when push never arrives
