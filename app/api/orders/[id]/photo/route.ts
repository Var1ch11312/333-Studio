import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { notifyViber } from "@/lib/viber";

const PROOF_BUCKET = "delivery-proofs";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Courier proof-of-delivery upload.
 *
 * Two modes:
 *  1. multipart/form-data with a `file` field → uploaded to the private
 *     `delivery-proofs` Storage bucket, a signed URL is stored on the order.
 *  2. application/json with `photo_url` → URL stored directly (e.g. when the
 *     image is already hosted, or for WhatsApp media URLs).
 *
 * Either mode marks the order as delivered.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();
  const contentType = req.headers.get("content-type") ?? "";

  let photoUrl: string | null = null;
  let courierViberId: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    /* ── Mode 1: real file upload to Storage ── */
    const form = await req.formData();
    const file = form.get("file");
    courierViberId = (form.get("courier_viber_id") as string) || null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Файлът е твърде голям (макс 8 MB)" }, { status: 413 });
    }
    if (file.type && !ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Разрешени са само JPEG/PNG/WebP" }, { status: 415 });
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${id}/${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: upErr } = await supabase.storage
      .from(PROOF_BUCKET)
      .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: true });

    if (upErr) {
      return NextResponse.json(
        { error: `Качването в Storage се провали: ${upErr.message}` },
        { status: 500 }
      );
    }

    /* Private bucket → signed URL valid 1 year for the proof record */
    const { data: signed } = await supabase.storage
      .from(PROOF_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    photoUrl = signed?.signedUrl ?? path;
  } else {
    /* ── Mode 2: JSON with an already-hosted URL ── */
    const body = await req.json().catch(() => ({}));
    photoUrl = body.photo_url ?? null;
    courierViberId = body.courier_viber_id ?? null;
    if (!photoUrl) {
      return NextResponse.json({ error: "photo_url is required" }, { status: 400 });
    }
  }

  /* Update order with proof photo and mark as delivered */
  const { data: order, error } = await supabase
    .from("orders")
    .update({ photo_proof_url: photoUrl, status: "delivered" })
    .eq("id", id)
    .select()
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found or update failed" }, { status: 404 });
  }

  /* Notify customer via Viber if a viber_id was supplied */
  if (order.customer_phone && courierViberId) {
    await notifyViber(
      courierViberId,
      `Доставката на поръчка #${id.slice(0, 8).toUpperCase()} е потвърдена. Благодарим!`
    );
  }

  return NextResponse.json({ order, photo_url: photoUrl });
}
