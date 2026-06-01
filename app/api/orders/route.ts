import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getStripeClient } from "@/lib/stripe";
import { notifyDispatcher, buildOrderCard } from "@/lib/viber";
import { validateDeliveryAddress } from "@/lib/geo";
import { isOddFlowerCount } from "@/lib/constants";

const DELIVERY_FEE_EUR = 5;

type OrderItem = {
  product_id: string;
  title: string;
  quantity: number;
  unit_price_eur: number;
  flower_count: number;
};

export async function POST(req: NextRequest) {
  let body: {
    customer_name?: string;
    customer_phone?: string;
    delivery_address?: string;
    notes?: string;
    payment_method?: "card" | "cod";
    nameday_optin?: boolean;
    items?: OrderItem[];
    delivery_for_self?: boolean;
    recipient_name?: string;
    recipient_phone?: string;
    greeting_message?: string;
    delivery_schedule?: "asap" | "scheduled";
    delivery_date?: string;
    delivery_time_window?: string;
    promo_code?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    customer_name,
    customer_phone,
    delivery_address,
    notes,
    payment_method = "card",
    nameday_optin = false,
    items = [],
    delivery_for_self = true,
    recipient_name,
    recipient_phone,
    greeting_message,
    delivery_schedule = "asap",
    delivery_date,
    delivery_time_window,
    promo_code,
  } = body;

  /* ── Validate required fields ── */
  if (!customer_name?.trim() || !customer_phone?.trim() || !delivery_address?.trim()) {
    return NextResponse.json(
      { error: "customer_name, customer_phone and delivery_address are required" },
      { status: 400 }
    );
  }
  if (!items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  /* ── Validate odd flower count (Bulgarian cultural rule) ── */
  const totalFlowers = items.reduce(
    (sum, item) => sum + item.flower_count * item.quantity,
    0
  );
  if (!isOddFlowerCount(totalFlowers)) {
    return NextResponse.json(
      {
        error:
          "Броят на стъблата трябва да бъде нечетен — четен брой цветя е знак за съболезнования.",
      },
      { status: 422 }
    );
  }

  /* ── Geo-validate delivery address ── */
  const geo = await validateDeliveryAddress(delivery_address);
  if (!geo.valid) {
    return NextResponse.json({ error: geo.error }, { status: 422 });
  }

  /* ── Calculate totals ── */
  const subtotalEur = items.reduce(
    (sum, item) => sum + item.unit_price_eur * item.quantity,
    0
  );
  const totalAmountEur = subtotalEur + DELIVERY_FEE_EUR;

  /* ── Create order in Supabase ── */
  const supabase = createServerClient();

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      delivery_address: delivery_address.trim(),
      delivery_lat: geo.lat ?? null,
      delivery_lng: geo.lng ?? null,
      total_amount_eur: totalAmountEur,
      payment_method,
      notes: notes?.trim() ?? null,
      nameday_optin,
      flower_count_validated: true,
      status: "pending",
      delivery_for_self,
      recipient_name: recipient_name?.trim() ?? null,
      recipient_phone: recipient_phone?.trim() ?? null,
      greeting_message: greeting_message?.trim() ?? null,
      delivery_schedule,
      delivery_date: delivery_date ?? null,
      delivery_time_window: delivery_time_window ?? null,
      promo_code: promo_code?.trim() ?? null,
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error("[Orders] insert error:", orderErr);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  /* ── Insert order items ── */
  await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price_eur: item.unit_price_eur,
    }))
  );

  /* ── COD path: notify dispatcher immediately, order is live ── */
  if (payment_method === "cod") {
    await notifyDispatcher(
      buildOrderCard({
        id: order.id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        delivery_address: order.delivery_address,
        total_amount_eur: totalAmountEur,
        payment_method: "cod",
        notes: order.notes,
      })
    );
    return NextResponse.json({ orderId: order.id, type: "cod" });
  }

  /* ── Card path: create Stripe Checkout Session ── */
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const stripeClient = getStripeClient();
  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      ...items.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: { name: item.title ?? "Букет" },
          unit_amount: Math.round(item.unit_price_eur * 100),
        },
        quantity: item.quantity,
      })),
      {
        price_data: {
          currency: "eur",
          product_data: { name: "Доставка до 2 часа" },
          unit_amount: DELIVERY_FEE_EUR * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: { order_id: order.id },
    success_url: `${appUrl}/order-success?order_id=${order.id}`,
    cancel_url: `${appUrl}/checkout`,
  });

  await supabase
    .from("orders")
    .update({ stripe_payment_intent_id: session.id })
    .eq("id", order.id);

  return NextResponse.json({
    orderId: order.id,
    type: "stripe",
    checkoutUrl: session.url,
  });
}
