import { NextRequest, NextResponse } from "next/server";
import { withCryptoPaywall } from "@/lib/crypto-paywall";
import { createServerClient } from "@/lib/supabase-server";

async function handler(_req: NextRequest) {
  const supabase = createServerClient();

  // Pull live catalog from Supabase — premium clients get full data
  const { data: products } = await supabase
    .from("products")
    .select("id, title, description, price_eur, price_bgn, flower_count, tag")
    .eq("active", true)
    .order("price_eur", { ascending: true });

  return NextResponse.json({
    access: "granted",
    tier: "B2B Premium — Cartier-style Floral Catalog",
    description:
      "Full catalog with wholesale pricing. AMUR.BG — Burgas, Bulgaria. 2-hour SLA delivery.",
    catalog: products ?? [],
    meta: {
      currency_primary: "EUR",
      currency_secondary: "BGN",
      exchange_rate: 1.95583,
      dual_price_until: "2026-08-08",
      delivery_sla_hours: 2,
      geo_zone: "Burgas, Bulgaria (≤15 km radius)",
    },
  });
}

// Protect with 0.10 USDC paywall on Polygon or Base
export const GET = withCryptoPaywall(handler, {
  amountUsdc: 0.1,
  networks: ["polygon", "base"],
});
