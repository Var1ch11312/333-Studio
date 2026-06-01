import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { notifyViber } from "@/lib/viber";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { photo_url, courier_viber_id } = await req.json();

  if (!photo_url) {
    return NextResponse.json({ error: "photo_url is required" }, { status: 400 });
  }

  const supabase = createServerClient();

  /* Update order with proof photo and mark as delivered */
  const { data: order, error } = await supabase
    .from("orders")
    .update({ photo_proof_url: photo_url, status: "delivered" })
    .eq("id", id)
    .select()
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found or update failed" }, { status: 404 });
  }

  /* Notify customer via Viber if they have a viber_id (future field) */
  if (order.customer_phone && courier_viber_id) {
    await notifyViber(
      courier_viber_id,
      `Доставката на поръчка #${id.slice(0, 8).toUpperCase()} е потвърдена. Благодарим!`
    );
  }

  return NextResponse.json({ order });
}
