import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { notifyViber, buildCourierAssignmentCard } from "@/lib/viber";
import type { ViberWebhookEvent } from "@/types";

/* Viber sends a GET to verify the webhook on registration */
export async function GET() {
  return NextResponse.json({ status: 0, status_message: "ok" });
}

export async function POST(req: NextRequest) {
  let event: ViberWebhookEvent;
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ status: 0 });
  }

  /* Only handle text messages */
  if (event.event !== "message" || event.message?.type !== "text") {
    return NextResponse.json({ status: 0 });
  }

  const senderId = event.sender?.id;
  const text = (event.message?.text ?? "").trim().toUpperCase();

  if (!senderId) return NextResponse.json({ status: 0 });

  const supabase = createServerClient();

  /* ── "ВЗИМАМ XXXXXXXX" — courier accepts order ── */
  if (text.startsWith("ВЗИМАМ ")) {
    const shortId = text.replace("ВЗИМАМ ", "").trim();

    /* Find the order by short ID prefix */
    const { data: orders } = await supabase
      .from("orders")
      .select("*, hubs(name)")
      .ilike("id", `${shortId.toLowerCase()}%`)
      .in("status", ["pending", "paid"])
      .limit(1);

    const order = orders?.[0];

    if (!order) {
      await notifyViber(
        senderId,
        `Поръчка #${shortId} не е намерена или вече е приета.`
      );
      return NextResponse.json({ status: 0 });
    }

    /* Find / register courier by Viber ID */
    let { data: courier } = await supabase
      .from("couriers")
      .select("*")
      .eq("viber_id", senderId)
      .single();

    /* Auto-register unknown couriers (they introduce themselves via Viber) */
    if (!courier) {
      const { data: newCourier } = await supabase
        .from("couriers")
        .insert({
          name: event.sender?.name ?? "Нов куриер",
          phone: "pending",
          viber_id: senderId,
        })
        .select()
        .single();
      courier = newCourier;
    }

    /* Assign courier + advance status to crafting */
    const { error: updateErr } = await supabase
      .from("orders")
      .update({ courier_id: courier?.id, status: "crafting" })
      .eq("id", order.id);

    if (updateErr) {
      await notifyViber(senderId, "Грешка при записване. Опитайте отново.");
      return NextResponse.json({ status: 0 });
    }

    /* Confirm to courier with full delivery details */
    await notifyViber(
      senderId,
      buildCourierAssignmentCard({
        id: order.id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        delivery_address: order.delivery_address,
        total_amount_eur: Number(order.total_amount_eur),
        payment_method: order.payment_method,
        notes: order.notes,
        hub_name: order.hubs?.name ?? "AMUR Хъб",
      })
    );

    return NextResponse.json({ status: 0 });
  }

  /* ── "ДОСТАВЕНО XXXXXXXX" — courier confirms delivery ── */
  if (text.startsWith("ДОСТАВЕНО ")) {
    const shortId = text.replace("ДОСТАВЕНО ", "").trim();

    const { data: orders } = await supabase
      .from("orders")
      .select("id, status")
      .ilike("id", `${shortId.toLowerCase()}%`)
      .eq("status", "delivering")
      .limit(1);

    const order = orders?.[0];

    if (!order) {
      await notifyViber(senderId, `Поръчка #${shortId} не е намерена в статус „При куриера".`);
      return NextResponse.json({ status: 0 });
    }

    await supabase
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", order.id);

    await notifyViber(
      senderId,
      `Отлично! Поръчка #${shortId} е маркирана като доставена.\nИзпратете снимка за протокола „Бели ръкавици".`
    );

    return NextResponse.json({ status: 0 });
  }

  /* ── Unrecognised message ── */
  await notifyViber(
    senderId,
    "Командите са:\n• ВЗИМАМ [ID] — приемане на поръчка\n• ДОСТАВЕНО [ID] — потвърждение за доставка"
  );

  return NextResponse.json({ status: 0 });
}
