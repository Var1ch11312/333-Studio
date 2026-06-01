import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

/**
 * Admin-only: list AI agent reports (accountant / lawyer / marketing).
 * agent_reports is service-role only (RLS), so this must run server-side.
 * Gated on the amur_session cookie matching ADMIN_TOKEN.
 */
export async function GET(req: NextRequest) {
  const session = req.cookies.get("amur_session")?.value ?? "";
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  if (!adminToken || session !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type"); // optional filter

  const supabase = createServerClient();
  let query = supabase
    .from("agent_reports")
    .select("id, agent_type, period_start, period_end, summary, full_report, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (type && ["accountant", "lawyer", "marketing"].includes(type)) {
    query = query.eq("agent_type", type);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data ?? [] });
}
