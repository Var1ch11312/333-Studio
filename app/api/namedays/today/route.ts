import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("name_days")
    .select("name")
    .eq("month", month)
    .eq("day", day)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const names = (data ?? []).map((r) => r.name);
  return NextResponse.json({ month, day, names });
}
