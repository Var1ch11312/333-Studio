import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { customer_phone, recipient_name, month, day, reminder_days_before, order_id } =
    await req.json();

  if (!customer_phone || !recipient_name || !month || !day) {
    return NextResponse.json(
      { error: "customer_phone, recipient_name, month and day are required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("saved_occasions")
    .upsert(
      {
        customer_phone,
        recipient_name: recipient_name.trim(),
        month: Number(month),
        day: Number(day),
        reminder_days_before: reminder_days_before ?? 2,
        order_id: order_id ?? null,
      },
      { onConflict: "customer_phone,recipient_name,month,day" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ occasion: data }, { status: 201 });
}
