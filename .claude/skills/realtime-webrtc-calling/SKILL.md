---
name: realtime-webrtc-calling
description: In-app audio calls with WebRTC. Signaling state machine, perfect negotiation, TURN, iOS Safari autoplay and permission traps, teardown, two-browser testing.
---

# WebRTC Audio Calling

WebRTC is three separate systems pretending to be one: **signaling** (yours), **connectivity** (ICE/STUN/TURN), and **media** (the browser). Most bugs come from treating them as one.

## Signaling is a state machine you own

WebRTC does not specify signaling. You transport SDP and ICE candidates however you like — WebSocket, Supabase Realtime broadcast, even HTTP polling. What matters is that both sides agree on the state.

```
        ┌──────┐  invite   ┌─────────┐  accept   ┌───────────┐
        │ idle ├──────────►│ ringing ├──────────►│ connecting│
        └──────┘           └────┬────┘           └─────┬─────┘
                                │ decline/timeout      │ ice connected
                                ▼                      ▼
                          ┌──────────┐           ┌──────────┐
                          │  ended   │◄──────────┤ in_call  │
                          └──────────┘  hangup   └──────────┘
```

Message types — keep this list closed, and version it:

```ts
type SignalMessage =
  | { t: 'invite';    callId: string; from: string }
  | { t: 'accept';    callId: string }
  | { t: 'decline';   callId: string; reason: 'busy' | 'declined' }
  | { t: 'offer';     callId: string; sdp: string }
  | { t: 'answer';    callId: string; sdp: string }
  | { t: 'ice';       callId: string; candidate: RTCIceCandidateInit }
  | { t: 'hangup';    callId: string; reason: string }
```

**Mirror the state into the database.** The signaling channel is ephemeral; the DB row is the record of what happened. Write `call_started_at` when ICE connects, not when the invite is sent.

## Perfect negotiation — stop writing glare bugs

Both peers can offer at once. Rather than hand-rolling collision handling, use the standard polite/impolite pattern:

```ts
const polite = myUserId < peerUserId   // deterministic, both sides agree

pc.onnegotiationneeded = async () => {
  makingOffer = true
  await pc.setLocalDescription()       // no args — the browser picks offer/answer
  send({ t: 'offer', sdp: pc.localDescription!.sdp })
  makingOffer = false
}

async function onSignal(msg) {
  if (msg.t === 'offer' || msg.t === 'answer') {
    const collision = msg.t === 'offer' &&
                      (makingOffer || pc.signalingState !== 'stable')
    if (collision && !polite) return           // impolite peer ignores
    ignoreOffer = false
    await pc.setRemoteDescription({ type: msg.t, sdp: msg.sdp })
    if (msg.t === 'offer') {
      await pc.setLocalDescription()
      send({ t: 'answer', sdp: pc.localDescription!.sdp })
    }
  } else if (msg.t === 'ice') {
    try { await pc.addIceCandidate(msg.candidate) }
    catch (e) { if (!ignoreOffer) throw e }
  }
}
```

## TURN is not optional

STUN alone fails for roughly 10–20% of connections — symmetric NAT on mobile carriers, corporate firewalls, some CGNAT. Those users experience "the app just doesn't work" and never tell you why.

```ts
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:turn.example.com:3478',
      username: ephemeralUser,      // short-lived credential, minted server-side
      credential: ephemeralPass },
  ],
})
```

- Never ship static TURN credentials to the client. Mint time-limited ones from an API route (HMAC of `timestamp:userId` is the standard coturn scheme).
- Budget for relay bandwidth. Audio-only is ~40 kbps each way — cheap, but not free.
- Managed options: Twilio NTS, Cloudflare Calls, Metered. Self-host coturn only if you want to operate it.

## The mobile traps

These are where the time goes. Each one is silent — no error, just no audio.

**Permission must follow a user gesture.**
```ts
// ✅ Inside the click handler for "Answer"
button.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
}
// ❌ On mount — Safari rejects, and on iOS the prompt may never appear again
useEffect(() => { navigator.mediaDevices.getUserMedia(...) }, [])
```

**Remote audio needs a real element and a gesture.**
```tsx
<audio ref={remoteAudioRef} autoPlay playsInline />
```
`playsInline` prevents iOS from taking over with a fullscreen player. `autoPlay` alone is not enough — call `.play()` inside the same user gesture that answered the call, and catch the rejection.

**getUserMedia requires a secure context.** `https://` or `localhost`. Testing on a phone over your LAN IP will fail — use a tunnel.

**Audio constraints worth setting for a wake-up call:**
```ts
{ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }
```

**The screen locks.** A backgrounded iOS Safari tab suspends. A wake-up call cannot depend on the sleeper's browser being foregrounded — the push notification is what brings them to the app, and even that is limited. Design the fallback (see `failover-and-chain-reliability`).

## Teardown on every exit path

Leaked `getUserMedia` tracks keep the microphone indicator lit and drain battery. Users notice, and they uninstall.

```ts
function teardown(pc: RTCPeerConnection, local: MediaStream | null) {
  local?.getTracks().forEach(t => t.stop())    // ← the one everyone forgets
  pc.getSenders().forEach(s => s.track?.stop())
  pc.close()
}

// Wire it to ALL of these:
window.addEventListener('pagehide', teardown)      // not 'unload' — unreliable on mobile
pc.onconnectionstatechange = () => {
  if (['failed','closed','disconnected'].includes(pc.connectionState)) teardown()
}
// …and the component unmount, and the hangup button, and the error boundary.
```

## Reconnection

`connectionState === 'disconnected'` is often transient (a network switch). `'failed'` is terminal until you act.

```ts
if (pc.connectionState === 'failed') {
  await pc.restartIce()          // re-gathers candidates on the existing connection
}
```
Give it one restart attempt and a 10-second budget. Past that, end the call and fall back — a wake-up call that spends 45 seconds reconnecting has already failed at its job.

## Testing

```ts
// Playwright: two contexts, fake media, no hardware required
const browser = await chromium.launch({
  args: [
    '--use-fake-ui-for-media-stream',       // auto-grant permission
    '--use-fake-device-for-media-stream',   // synthetic audio
  ],
})
const [caller, callee] = [await browser.newContext(), await browser.newContext()]
```

Assert on `pc.connectionState === 'connected'` and on the DB row transitioning to `called`, not on hearing audio. What you are testing is the state machine; the media path is the browser's job.

Also test with TURN forced (`iceTransportPolicy: 'relay'`) — it is the only way to know your relay actually works before a real user on a mobile carrier finds out.

## Checklist

- [ ] Signaling message types are a closed, versioned union
- [ ] Call state mirrored into the database at each transition
- [ ] Perfect-negotiation polite/impolite roles derived deterministically
- [ ] TURN configured with ephemeral, server-minted credentials
- [ ] `getUserMedia` called inside a user gesture
- [ ] Remote `<audio>` has `playsInline`; `.play()` rejection handled
- [ ] Teardown wired to hangup, unmount, `pagehide`, and connection failure
- [ ] One ICE restart attempt, then give up and fall back
- [ ] Two-context Playwright test, plus a relay-only run
