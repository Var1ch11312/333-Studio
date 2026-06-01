import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  sendWhatsAppText,
  buildCourierAssigned,
  MSG_COURIER_EXPIRED,
  getMediaUrl,
} from "@/lib/whatsapp";
import {
  escalateOrder,
  dispatchToCouriers,
} from "@/lib/order-routing";

/* ── GET: Meta webhook verification ───────────────────────── */

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === (process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "")
  ) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/* ── POST: incoming messages / button replies ──────────────── */

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Always return 200 quickly — process async
  processWebhook(body).catch((err) =>
    console.error("[WhatsApp Webhook] Processing error:", err)
  );

  return NextResponse.json({ status: "ok" });
}

/* ── Async processor ───────────────────────────────────────── */

async function processWebhook(body: unknown): Promise<void> {
  const entry = (body as Record<string, unknown>)?.entry;
  if (!Array.isArray(entry)) return;

  for (const e of entry) {
    const changes = (e as Record<string, unknown>)?.changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      const value = (change as Record<string, unknown>)?.value as Record<string, unknown>;
      const messages = value?.messages;
      if (!Array.isArray(messages)) continue;

      for (const msg of messages) {
        await handleMessage(msg as Record<string, unknown>);
      }
    }
  }
}

async function handleMessage(msg: Record<string, unknown>): Promise<void> {
  const from = msg.from as string;
  const type = msg.type as string;

  /* ── Interactive button reply ─────────────────────────── */
  if (type === "interactive") {
    const interactive = msg.interactive as Record<string, unknown>;
    const buttonReply = interactive?.button_reply as
      | { id: string; title: string }
      | undefined;
    if (!buttonReply) return;

    const { id: buttonId } = buttonReply;

    if (buttonId.startsWith("hub_accept_")) {
      await handleHubAccept(buttonId.replace("hub_accept_", ""), from);
      return;
    }
    if (buttonId.startsWith("hub_reject_")) {
      await handleHubReject(buttonId.replace("hub_reject_", ""), from);
      return;
    }
    if (buttonId.startsWith("courier_accept_")) {
      await handleCourierAccept(
        buttonId.replace("courier_accept_", ""),
        from
      );
      return;
    }
  }

  /* ── Image — courier photo proof ─────────────────────── */
  if (type === "image") {
    const image = msg.image as Record<string, unknown>;
    await handleCourierPhoto(from, image?.id as string | undefined);
    return;
  }
}

/* ═══════════════════════════════════════════════════════════ */
/*  Hub accepts                                                */
/* ═══════════════════════════════════════════════════════════ */

async function handleHubAccept(orderId: string, hubPhone: string): Promise<void> {
  const supabase = createServerClient();

  // Find hub by phone
  const { data: hub } = await supabase
    .from("hubs")
    .select("id, name")
    .eq("whatsapp_phone", hubPhone)
    .single();
  if (!hub) return;

  // Mark offer accepted
  const { error } = await supabase
    .from("dispatch_offers")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("target_type", "hub")
    .eq("target_id", hub.id)
    .eq("status", "pending");

  if (error) return;

  // Advance order to crafting
  await supabase
    .from("orders")
    .update({ status: "crafting", assigned_hub_id: hub.id })
    .eq("id", orderId);

  await sendWhatsAppText(hubPhone, `Zakazata e prieta! Gotov buket — izpratete snimka tuk.`);

  // Dispatch couriers
  await dispatchToCouriers(orderId, hub.id);
}

/* ═══════════════════════════════════════════════════════════ */
/*  Hub rejects                                                */
/* ═══════════════════════════════════════════════════════════ */

async function handleHubReject(orderId: string, _hubPhone: string): Promise<void> {
  await escalateOrder(orderId, "rejected");
}

/* ═══════════════════════════════════════════════════════════ */
/*  Courier accepts — first one wins                           */
/* ═══════════════════════════════════════════════════════════ */

async function handleCourierAccept(orderId: string, courierPhone: string): Promise<void> {
  const supabase = createServerClient();

  // Find courier
  const { data: courier } = await supabase
    .from("couriers")
    .select("id, name")
    .eq("whatsapp_phone", courierPhone)
    .single();
  if (!courier) return;

  // Check this offer is still pending (race: someone else accepted first)
  const { data: offer } = await supabase
    .from("dispatch_offers")
    .select("id")
    .eq("order_id", orderId)
    .eq("target_type", "courier")
    .eq("target_id", courier.id)
    .eq("status", "pending")
    .maybeSingle();

  if (!offer) {
    await sendWhatsAppText(courierPhone, MSG_COURIER_EXPIRED);
    return;
  }

  // Accept this courier — expire all others atomically via unique constraint
  const { error } = await supabase
    .from("dispatch_offers")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("target_type", "courier")
    .eq("target_id", courier.id)
    .eq("status", "pending");

  if (error) return;

  // Expire other pending offers for this order
  await supabase
    .from("dispatch_offers")
    .update({ status: "expired", responded_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("target_type", "courier")
    .neq("target_id", courier.id)
    .eq("status", "pending");

  // Notify other couriers
  const { data: expiredOffers } = await supabase
    .from("dispatch_offers")
    .select("target_id")
    .eq("order_id", orderId)
    .eq("target_type", "courier")
    .eq("status", "expired");

  if (expiredOffers?.length) {
    const ids = expiredOffers.map((o) => o.target_id as string);
    const { data: otherCouriers } = await supabase
      .from("couriers")
      .select("whatsapp_phone")
      .in("id", ids);
    await Promise.all(
      (otherCouriers ?? [])
        .filter((c) => c.whatsapp_phone)
        .map((c) => sendWhatsAppText(c.whatsapp_phone!, MSG_COURIER_EXPIRED))
    );
  }

  // Assign order + mark courier busy
  await supabase
    .from("orders")
    .update({ status: "delivering", courier_id: courier.id })
    .eq("id", orderId);

  await supabase
    .from("couriers")
    .update({ is_available: false })
    .eq("id", courier.id);

  // Get hub + delivery address for confirmation message
  const { data: order } = await supabase
    .from("orders")
    .select("delivery_address, assigned_hub_id, hubs(address)")
    .eq("id", orderId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hubAddress = (order?.hubs as any)?.address ?? "Hub";
  await sendWhatsAppText(
    courierPhone,
    buildCourierAssigned(orderId, hubAddress, order?.delivery_address ?? "")
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Courier sends delivery photo                               */
/* ═══════════════════════════════════════════════════════════ */

async function handleCourierPhoto(
  courierPhone: string,
  mediaId?: string
): Promise<void> {
  if (!mediaId) return;
  const supabase = createServerClient();

  // Find courier's active order
  const { data: courier } = await supabase
    .from("couriers")
    .select("id")
    .eq("whatsapp_phone", courierPhone)
    .single();
  if (!courier) return;

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_phone")
    .eq("courier_id", courier.id)
    .eq("status", "delivering")
    .maybeSingle();
  if (!order) return;

  const photoUrl = await getMediaUrl(mediaId);
  if (!photoUrl) return;

  await supabase
    .from("orders")
    .update({ status: "delivered", photo_proof_url: photoUrl })
    .eq("id", order.id);

  await supabase
    .from("couriers")
    .update({ is_available: true })
    .eq("id", courier.id);

  await sendWhatsAppText(
    courierPhone,
    `Dostavkata e potvrzdena! Blagodarim, ${order.id.slice(0, 8).toUpperCase()}.`
  );

  if (order.customer_phone) {
    await sendWhatsAppText(
      order.customer_phone,
      `Vashiyat buket ot AMUR.BG e dostaveni! Snimka: ${photoUrl}`
    );
  }

  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;
  if (adminPhone) {
    await sendWhatsAppText(
      adminPhone,
      `Poruchka #${order.id.slice(0, 8).toUpperCase()} — DOSTAVENA. Foto: ${photoUrl}`
    );
  }
}
