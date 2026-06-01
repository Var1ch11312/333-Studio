/**
 * Core order-routing logic for AMUR.BG.
 *
 * Called from:
 *  - /api/webhooks/stripe  (payment confirmed → route to nearest hub)
 *  - /api/webhooks/whatsapp (hub accepted → dispatch couriers)
 *  - /api/cron/dispatch-timeout (5-min SLA exceeded → escalate)
 */

import { createServerClient } from "@/lib/supabase-server";
import { haversineKm } from "@/lib/geo";
import { deliveryFeeForZone } from "@/lib/constants";
import {
  sendWhatsAppText,
  sendWhatsAppButtons,
  buildAdminOrderNotice,
  buildHubOrderBody,
  buildCourierDispatchBody,
  buildCustomerAccepted,
  buildAdminEscalation,
  hubAcceptId,
  hubRejectId,
  courierAcceptId,
} from "@/lib/whatsapp";

const FLORIST_SLA_MINUTES = 5;
const COURIER_RADIUS_KM = 1.5;

/* ── Fetch full order with items ───────────────────────────── */

async function getOrderWithItems(orderId: string) {
  const supabase = createServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      `*, order_items(quantity, unit_price_eur,
         products:product_id(title, flower_count))`
    )
    .eq("id", orderId)
    .single();
  return order;
}

/* ── Build order summary for message builders ──────────────── */

function summariseOrder(order: NonNullable<Awaited<ReturnType<typeof getOrderWithItems>>>) {
  const items: Array<{ title: string; flower_count: number; quantity: number }> =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (order.order_items as any[]).map((i) => ({
      title: i.products?.title ?? "Buket",
      flower_count: i.products?.flower_count ?? 0,
      quantity: i.quantity,
    }));

  const mainItem = items[0] ?? { title: "Buket", flower_count: 0, quantity: 1 };
  const totalFlowers = items.reduce(
    (s, i) => s + i.flower_count * i.quantity,
    0
  );

  const schedule =
    order.delivery_schedule === "scheduled" && order.delivery_date
      ? `${order.delivery_date} ${order.delivery_time_window ?? ""}`.trim()
      : "Kolkoto mozhe po-skoro (do 2h)";

  return {
    id: order.id,
    bouquet: mainItem.title,
    flowerCount: totalFlowers,
    deliveryAddress: order.delivery_address,
    recipientName: order.recipient_name ?? null,
    greeting: order.greeting_message ?? null,
    schedule,
    totalEur: Number(order.total_amount_eur),
  };
}

/* ── Find ordered list of hubs by distance to delivery ─────── */

async function getRankedHubs(deliveryLat: number, deliveryLng: number) {
  const supabase = createServerClient();
  const { data: hubs } = await supabase
    .from("hubs")
    .select("id, name, address, lat, lng, whatsapp_phone, status")
    .eq("status", "online");

  if (!hubs) return [];

  return hubs
    .map((h) => ({
      ...h,
      distanceKm: haversineKm(
        deliveryLat,
        deliveryLng,
        Number(h.lat),
        Number(h.lng)
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/* ── Already-tried hub IDs for this order ──────────────────── */

async function getTriedHubIds(orderId: string): Promise<string[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("dispatch_offers")
    .select("target_id")
    .eq("order_id", orderId)
    .eq("target_type", "hub");
  return (data ?? []).map((r) => r.target_id as string);
}

/* ═══════════════════════════════════════════════════════════ */
/*  1. Route order to nearest available hub                    */
/* ═══════════════════════════════════════════════════════════ */

export async function routeOrderToHub(orderId: string): Promise<void> {
  const supabase = createServerClient();
  const order = await getOrderWithItems(orderId);
  if (!order) {
    console.error("[Routing] Order not found:", orderId);
    return;
  }

  const deliveryLat = Number(order.delivery_lat ?? 42.4943);
  const deliveryLng = Number(order.delivery_lng ?? 27.4726);

  const triedHubIds = await getTriedHubIds(orderId);
  const hubs = await getRankedHubs(deliveryLat, deliveryLng);
  const hub = hubs.find((h) => !triedHubIds.includes(h.id));

  // Notify admin about new payment (always)
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;
  if (adminPhone) {
    const summary = summariseOrder(order);
    await sendWhatsAppText(adminPhone, buildAdminOrderNotice(summary));
  }

  if (!hub) {
    const msg = `Nyama nalichni hubove za poruchka #${orderId.slice(0, 8).toUpperCase()}. Vsichki sa offline ili otkazali.`;
    console.error("[Routing]", msg);
    if (adminPhone) {
      await sendWhatsAppText(adminPhone, buildAdminEscalation(orderId, msg));
    }
    return;
  }

  if (!hub.whatsapp_phone) {
    console.warn("[Routing] Hub has no WhatsApp phone:", hub.id);
    return;
  }

  const summary = summariseOrder(order);
  const body = buildHubOrderBody(summary);

  await sendWhatsAppButtons(
    hub.whatsapp_phone,
    body,
    [
      { id: hubAcceptId(orderId), title: "Prieми ✅" },
      { id: hubRejectId(orderId), title: "Otkayi ❌" },
    ],
    "AMUR.BG — Nova Poruchka"
  );

  // Record offer + update order
  await supabase.from("dispatch_offers").insert({
    order_id: orderId,
    target_type: "hub",
    target_id: hub.id,
  });

  await supabase
    .from("orders")
    .update({
      assigned_hub_id: hub.id,
      florist_notified_at: new Date().toISOString(),
    })
    .eq("id", orderId);
}

/* ═══════════════════════════════════════════════════════════ */
/*  2. Escalate — mark current hub offline, try next           */
/* ═══════════════════════════════════════════════════════════ */

export async function escalateOrder(
  orderId: string,
  reason: "timeout" | "rejected" = "timeout"
): Promise<void> {
  const supabase = createServerClient();

  // Mark current pending hub offer as expired/rejected
  await supabase
    .from("dispatch_offers")
    .update({ status: reason === "timeout" ? "expired" : "rejected", responded_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("target_type", "hub")
    .eq("status", "pending");

  // If timeout: mark that hub as offline
  if (reason === "timeout") {
    const { data: order } = await supabase
      .from("orders")
      .select("assigned_hub_id")
      .eq("id", orderId)
      .single();
    if (order?.assigned_hub_id) {
      await supabase
        .from("hubs")
        .update({ status: "offline" })
        .eq("id", order.assigned_hub_id);
      console.warn("[Routing] Hub marked offline:", order.assigned_hub_id);
    }
  }

  // Notify admin
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;
  if (adminPhone) {
    await sendWhatsAppText(
      adminPhone,
      buildAdminEscalation(
        orderId,
        reason === "timeout"
          ? `Xab ne otvori za ${FLORIST_SLA_MINUTES} min — eskalatsiya.`
          : "Xabut otkazа zakazata."
      )
    );
  }

  // Try next nearest hub
  await routeOrderToHub(orderId);
}

/* ═══════════════════════════════════════════════════════════ */
/*  3. Hub accepted → dispatch couriers                        */
/* ═══════════════════════════════════════════════════════════ */

export async function dispatchToCouriers(
  orderId: string,
  hubId: string
): Promise<void> {
  const supabase = createServerClient();

  // Get hub data
  const { data: hub } = await supabase
    .from("hubs")
    .select("id, name, address, lat, lng")
    .eq("id", hubId)
    .single();
  if (!hub) return;

  const hubLat = Number(hub.lat);
  const hubLng = Number(hub.lng);

  // Get order delivery address
  const { data: order } = await supabase
    .from("orders")
    .select("delivery_address, delivery_lat, delivery_lng, customer_phone")
    .eq("id", orderId)
    .single();
  if (!order) return;

  const deliveryLat = Number(order.delivery_lat ?? hubLat);
  const deliveryLng = Number(order.delivery_lng ?? hubLng);

  const distanceKm = haversineKm(hubLat, hubLng, deliveryLat, deliveryLng);
  const etaMinutes = Math.round(15 + distanceKm * 4); // 15 min prep + 4 min/km

  // Courier fee depends on the delivery zone (Center/North 5 EUR, Meden Rudnik 8 EUR)
  const courierFeeEur = deliveryFeeForZone(deliveryLat, deliveryLng, haversineKm);

  // Find available couriers — prefer couriers at this hub with GPS,
  // fallback to all active couriers at hub
  const { data: couriers } = await supabase
    .from("couriers")
    .select("id, name, whatsapp_phone, current_lat, current_lng, hub_id")
    .eq("is_available", true)
    .eq("active", true);

  const eligible = (couriers ?? []).filter((c) => {
    if (!c.whatsapp_phone) return false;
    // Has GPS: filter by 1.5km from hub
    if (c.current_lat && c.current_lng) {
      return (
        haversineKm(hubLat, hubLng, Number(c.current_lat), Number(c.current_lng)) <=
        COURIER_RADIUS_KM
      );
    }
    // No GPS: include if assigned to same hub
    return c.hub_id === hubId;
  });

  if (!eligible.length) {
    console.warn("[Routing] No eligible couriers for order:", orderId);
    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;
    if (adminPhone) {
      await sendWhatsAppText(
        adminPhone,
        buildAdminEscalation(orderId, "Nyama svobodni kurieri — nazhnachete ruchno.")
      );
    }
    return;
  }

  // Send dispatch message to each courier
  const body = buildCourierDispatchBody(
    orderId,
    hub.address,
    order.delivery_address,
    distanceKm,
    courierFeeEur
  );

  await Promise.all(
    eligible.map((c) =>
      sendWhatsAppButtons(
        c.whatsapp_phone!,
        body,
        [{ id: courierAcceptId(orderId), title: "Vzemi zakazata" }],
        "AMUR.BG — Nujen Kurier"
      )
    )
  );

  // Record offers
  if (eligible.length) {
    await supabase.from("dispatch_offers").insert(
      eligible.map((c) => ({
        order_id: orderId,
        target_type: "courier",
        target_id: c.id,
      }))
    );
  }

  // Notify customer
  if (order.customer_phone) {
    await sendWhatsAppText(
      order.customer_phone,
      buildCustomerAccepted(etaMinutes)
    );
  }

  await supabase
    .from("orders")
    .update({
      courier_search_started_at: new Date().toISOString(),
      estimated_delivery_at: new Date(
        Date.now() + etaMinutes * 60_000
      ).toISOString(),
    })
    .eq("id", orderId);
}

/* ═══════════════════════════════════════════════════════════ */
/*  4. SLA check — called by cron every 2 minutes             */
/* ═══════════════════════════════════════════════════════════ */

export async function checkAndEscalateTimedOutOrders(): Promise<number> {
  const supabase = createServerClient();
  const cutoff = new Date(
    Date.now() - FLORIST_SLA_MINUTES * 60_000
  ).toISOString();

  // Orders that are paid, florist was notified, but still not accepted
  const { data: timedOut } = await supabase
    .from("orders")
    .select("id")
    .eq("status", "paid")
    .lt("florist_notified_at", cutoff)
    .not("florist_notified_at", "is", null);

  if (!timedOut?.length) return 0;

  // For each, check there's no accepted hub offer
  let escalated = 0;
  for (const { id } of timedOut) {
    const { data: accepted } = await supabase
      .from("dispatch_offers")
      .select("id")
      .eq("order_id", id)
      .eq("target_type", "hub")
      .eq("status", "accepted")
      .maybeSingle();

    if (!accepted) {
      await escalateOrder(id, "timeout");
      escalated++;
    }
  }

  return escalated;
}
