import { NextRequest, NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase-server";
import { routeOrderToHub } from "@/lib/order-routing";

/* App Router: read raw body for Stripe signature verification */
export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing stripe-signature header or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(
      payload,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      console.error("[Stripe Webhook] No order_id in session metadata");
      return NextResponse.json({ received: true });
    }

    const supabase = createServerClient();

    const { data: order, error } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId)
      .select()
      .single();

    if (error || !order) {
      console.error("[Stripe Webhook] Failed to update order:", error);
      return NextResponse.json({ error: "Order update failed" }, { status: 500 });
    }

    // Route to nearest hub via WhatsApp (non-blocking)
    routeOrderToHub(order.id).catch((err) =>
      console.error("[Stripe Webhook] Routing failed:", err)
    );
  }

  return NextResponse.json({ received: true });
}
