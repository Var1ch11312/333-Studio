/**
 * WhatsApp Cloud API client for AMUR.BG
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 * All outbound messages use interactive reply-buttons (max 3).
 * Template messages are required for first-contact; replies within
 * the 24-hour window can use free-form text or interactive buttons.
 */

const WA_API_BASE = "https://graph.facebook.com/v19.0";

function phoneId() {
  return process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
}
function token() {
  return process.env.WHATSAPP_ACCESS_TOKEN ?? "";
}

/* ── Low-level sender ──────────────────────────────────────── */

async function waPost(payload: object): Promise<void> {
  if (!phoneId() || !token()) {
    console.warn("[WhatsApp] Credentials not set — message skipped");
    return;
  }
  const res = await fetch(`${WA_API_BASE}/${phoneId()}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("[WhatsApp] Send failed:", err);
  }
}

/* ── Plain text ────────────────────────────────────────────── */

export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  await waPost({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body, preview_url: false },
  });
}

/* ── Interactive reply-buttons (max 3) ─────────────────────── */

export type WaButton = { id: string; title: string };

export async function sendWhatsAppButtons(
  to: string,
  body: string,
  buttons: [WaButton, ...WaButton[]],
  header?: string
): Promise<void> {
  await waPost({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      ...(header ? { header: { type: "text", text: header } } : {}),
      body: { text: body },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
}

/* ── Download media by ID → URL ────────────────────────────── */

export async function getMediaUrl(mediaId: string): Promise<string | null> {
  if (!token()) return null;
  const res = await fetch(`${WA_API_BASE}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

/* ═══════════════════════════════════════════════════════════ */
/*  Message builders                                           */
/* ═══════════════════════════════════════════════════════════ */

type OrderInfo = {
  id: string;
  bouquet: string;
  flowerCount: number;
  deliveryAddress: string;
  recipientName: string | null;
  greeting: string | null;
  schedule: string;
  totalEur: number;
};

/** [1] Admin — new transaction summary */
export function buildAdminOrderNotice(o: OrderInfo): string {
  const short = o.id.slice(0, 8).toUpperCase();
  return [
    `*NOVA PORUCHKA #${short}*`,
    `Buket: ${o.bouquet} (${o.flowerCount} stebl)`,
    `Dostavka: ${o.deliveryAddress}`,
    o.recipientName ? `Poluchatel: ${o.recipientName}` : null,
    o.greeting ? `Pozdravlenie: ${o.greeting}` : null,
    `Vreme: ${o.schedule}`,
    `Suma: ${o.totalEur} EUR | PLATENO`,
    `SLA: do 2 chasa`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** [2] Hub/florist — new order to accept with buttons */
export function buildHubOrderBody(o: OrderInfo): string {
  const short = o.id.slice(0, 8).toUpperCase();
  return [
    `*NOVA PORUCHKA #${short}*`,
    ``,
    `Buket: ${o.bouquet}`,
    `Stebla: ${o.flowerCount}`,
    `Adres za dostavka: ${o.deliveryAddress}`,
    o.recipientName ? `Poluchatel: ${o.recipientName}` : null,
    o.greeting ? `Pozdravlenie: "${o.greeting}"` : null,
    ``,
    `Vreme: ${o.schedule}`,
    `Suma: ${o.totalEur} EUR`,
    ``,
    `Imate *5 minuti* da priemate zapovedta.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function hubAcceptId(orderId: string) {
  return `hub_accept_${orderId}`;
}
export function hubRejectId(orderId: string) {
  return `hub_reject_${orderId}`;
}

/** [3] Courier dispatch broadcast */
export function buildCourierDispatchBody(
  orderId: string,
  hubAddress: string,
  deliveryAddress: string,
  distanceKm: number,
  feeEur: number
): string {
  const short = orderId.slice(0, 8).toUpperCase();
  return [
    `*NUJEN KURIER — #${short}*`,
    ``,
    `Vzemi ot: ${hubAddress}`,
    `Dovezi v: ${deliveryAddress}`,
    `Razstoianie: ~${distanceKm.toFixed(1)} km`,
    `Oplashchane: ${feeEur} EUR`,
    ``,
    `Purviat natisnal — vze zakazata.`,
  ].join("\n");
}

export function courierAcceptId(orderId: string) {
  return `courier_accept_${orderId}`;
}

/** [4] Customer notification — order accepted */
export function buildCustomerAccepted(etaMinutes: number): string {
  return [
    `Vashata poruchka ot AMUR.BG e prieta!`,
    `Ochakvaite dostavka sled priblizitelno *${etaMinutes} minuti*.`,
    `Shte vi pratim snimka ot momenta na vruchvaneto.`,
  ].join("\n");
}

/** [5] Courier assigned confirmation */
export function buildCourierAssigned(
  orderId: string,
  hubAddress: string,
  deliveryAddress: string
): string {
  const short = orderId.slice(0, 8).toUpperCase();
  return [
    `Zakazata *#${short}* e VASHA!`,
    ``,
    `Vzemi ot: ${hubAddress}`,
    `Dovezi v: ${deliveryAddress}`,
    ``,
    `SLA: 2 chasa ot priemaneto.`,
    `Sled dostavka izpratete SNIMKA TUK.`,
  ].join("\n");
}

/** [6] Other couriers when job is taken */
export const MSG_COURIER_EXPIRED =
  "Zakazata veche e prieta ot drug kurier. Blagodarim!";

/** [7] Admin escalation — no hub responded */
export function buildAdminEscalation(orderId: string, reason: string): string {
  const short = orderId.slice(0, 8).toUpperCase();
  return `*ESKALATSIYA #${short}*\n${reason}\nProverete admin dashboard.`;
}
