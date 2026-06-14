import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { isOddFlowerCount } from "@/lib/constants";

function isAdmin(req: NextRequest) {
  const session = req.cookies.get("amur_session")?.value ?? "";
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  return adminToken && session === adminToken;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { title, description, price_eur, flower_count, tag } = body;

  if (!title?.trim())
    return NextResponse.json({ error: "Заглавието е задължително" }, { status: 400 });
  if (!price_eur || Number(price_eur) <= 0)
    return NextResponse.json({ error: "Цената трябва да е по-голяма от 0" }, { status: 400 });
  if (!flower_count || Number(flower_count) <= 0)
    return NextResponse.json({ error: "Броят цветя е задължителен" }, { status: 400 });
  if (!isOddFlowerCount(Number(flower_count)))
    return NextResponse.json({ error: "Броят цветя трябва да е нечетен (Bulgarian rule)" }, { status: 422 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      price_eur: Number(price_eur),
      flower_count: Number(flower_count),
      tag: tag?.trim() || null,
      active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data }, { status: 201 });
}
