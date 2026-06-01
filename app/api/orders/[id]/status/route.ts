import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

type OrderStatus = "pending" | "paid" | "crafting" | "delivering" | "delivered";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:    ["crafting"],
  paid:       ["crafting"],
  crafting:   ["delivering"],
  delivering: ["delivered"],
  delivered:  [],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { status?: string; photo_proof_url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status, photo_proof_url } = body;
  if (!status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: current } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const allowed: string[] =
    VALID_TRANSITIONS[current.status as OrderStatus] ?? [];

  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Invalid transition: ${current.status} → ${status}` },
      { status: 422 }
    );
  }

  const update: Record<string, string> = { status };
  if (photo_proof_url) update.photo_proof_url = photo_proof_url;

  const { data: order, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ order });
}
