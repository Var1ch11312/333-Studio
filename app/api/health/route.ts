import { NextResponse } from "next/server";

/**
 * Lightweight health check for uptime monitoring.
 * Verifies env configuration and Supabase REST reachability.
 */
export async function GET() {
  const checks: Record<string, boolean> = {
    supabase_env: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    stripe_env: Boolean(process.env.STRIPE_SECRET_KEY),
    whatsapp_env: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
  };

  let dbReachable = false;
  if (checks.supabase_env) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?select=id&limit=1`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
          signal: AbortSignal.timeout(3000),
          cache: "no-store",
        }
      );
      dbReachable = res.ok;
    } catch {
      dbReachable = false;
    }
  }

  const healthy = checks.supabase_env && dbReachable;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: { ...checks, db_reachable: dbReachable },
      time: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
