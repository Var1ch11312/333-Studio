import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const IMAGE_BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

function isAdmin(req: NextRequest) {
  const session = req.cookies.get("amur_session")?.value ?? "";
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  return adminToken && session === adminToken;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File))
    return NextResponse.json({ error: "file е задължително" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "Файлът е твърде голям (макс 5 MB)" }, { status: 413 });
  if (file.type && !ALLOWED.includes(file.type))
    return NextResponse.json({ error: "Разрешени са само JPEG/PNG/WebP" }, { status: 415 });

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${id}/${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const supabase = createServerClient();
  const { error: upErr } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: true });

  if (upErr)
    return NextResponse.json({ error: `Качването се провали: ${upErr.message}` }, { status: 500 });

  const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  const imageUrl = pub.publicUrl;

  const { data, error } = await supabase
    .from("products")
    .update({ image_url: imageUrl })
    .eq("id", id)
    .select("id, image_url")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data, image_url: imageUrl });
}
