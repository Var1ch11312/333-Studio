import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { isOddFlowerCount } from "@/lib/constants";

function isAdmin(req: NextRequest) {
  const session = req.cookies.get("amur_session")?.value ?? "";
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  return adminToken && session === adminToken;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  if ("title" in body) patch.title = String(body.title).trim();
  if ("description" in body) patch.description = body.description?.trim() || null;
  if ("price_eur" in body) {
    if (Number(body.price_eur) <= 0)
      return NextResponse.json({ error: "Цената трябва да е по-голяма от 0" }, { status: 400 });
    patch.price_eur = Number(body.price_eur);
  }
  if ("flower_count" in body) {
    if (!isOddFlowerCount(Number(body.flower_count)))
      return NextResponse.json({ error: "Броят цветя трябва да е нечетен" }, { status: 422 });
    patch.flower_count = Number(body.flower_count);
  }
  if ("tag" in body) patch.tag = body.tag?.trim() || null;
  if ("hub_id" in body) patch.hub_id = body.hub_id || null;
  if ("active" in body) patch.active = Boolean(body.active);

  if (!Object.keys(patch).length)
    return NextResponse.json({ error: "Няма полета за обновяване" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Продуктът не е намерен" }, { status: 404 });
  return NextResponse.json({ product: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("products")
    .update({ active: false })
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data)
    return NextResponse.json({ error: "Продуктът не е намерен" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
