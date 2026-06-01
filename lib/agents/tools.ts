import { createServerClient } from "@/lib/supabase-server";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { embed } from "@/lib/agents/embeddings";

const ADMIN_PHONE = process.env.ADMIN_WHATSAPP_PHONE ?? "";

/* ── Financial summary ─────────────────────────────────────────── */

export interface FinancialSummary {
  totalOrders: number;
  totalRevenueEur: number;
  avgOrderValueEur: number;
  byStatus: Record<string, number>;
}

export async function getFinancialSummary(
  periodStart: string,
  periodEnd: string
): Promise<FinancialSummary> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("status, total_eur")
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  if (error) throw new Error(`getFinancialSummary: ${error.message}`);

  const rows = data ?? [];
  const byStatus: Record<string, number> = {};
  let totalRevenue = 0;

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    if (row.status === "delivered") totalRevenue += Number(row.total_eur ?? 0);
  }

  return {
    totalOrders: rows.length,
    totalRevenueEur: Math.round(totalRevenue * 100) / 100,
    avgOrderValueEur:
      rows.length > 0 ? Math.round((totalRevenue / rows.length) * 100) / 100 : 0,
    byStatus,
  };
}

/* ── Courier earnings ──────────────────────────────────────────── */

export interface CourierEarning {
  courierId: string;
  name: string;
  deliveries: number;
  totalFeeEur: number;
}

export async function getCourierEarnings(
  periodStart: string,
  periodEnd: string
): Promise<CourierEarning[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("dispatch_offers")
    .select("courier_id, fee_eur, couriers(name)")
    .eq("status", "accepted")
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  if (error) throw new Error(`getCourierEarnings: ${error.message}`);

  const map = new Map<string, CourierEarning>();
  for (const row of data ?? []) {
    const existing = map.get(row.courier_id) ?? {
      courierId: row.courier_id,
      name: (row.couriers as { name?: string } | null)?.name ?? "Unknown",
      deliveries: 0,
      totalFeeEur: 0,
    };
    existing.deliveries += 1;
    existing.totalFeeEur += Number(row.fee_eur ?? 0);
    map.set(row.courier_id, existing);
  }

  return Array.from(map.values()).map((e) => ({
    ...e,
    totalFeeEur: Math.round(e.totalFeeEur * 100) / 100,
  }));
}

/* ── Hub performance ───────────────────────────────────────────── */

export interface HubPerformance {
  hubId: string;
  name: string;
  acceptedOrders: number;
  rejectedOrders: number;
  revenueEur: number;
}

export async function getHubPerformance(
  periodStart: string,
  periodEnd: string
): Promise<HubPerformance[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select("assigned_hub_id, status, total_eur, hubs(name)")
    .not("assigned_hub_id", "is", null)
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  if (error) throw new Error(`getHubPerformance: ${error.message}`);

  const map = new Map<string, HubPerformance>();
  for (const row of data ?? []) {
    const hubId = row.assigned_hub_id as string;
    const existing = map.get(hubId) ?? {
      hubId,
      name: (row.hubs as { name?: string } | null)?.name ?? "Unknown",
      acceptedOrders: 0,
      rejectedOrders: 0,
      revenueEur: 0,
    };
    if (row.status === "delivered") {
      existing.acceptedOrders += 1;
      existing.revenueEur += Number(row.total_eur ?? 0);
    } else if (row.status === "cancelled") {
      existing.rejectedOrders += 1;
    }
    map.set(hubId, existing);
  }

  return Array.from(map.values()).map((h) => ({
    ...h,
    revenueEur: Math.round(h.revenueEur * 100) / 100,
  }));
}

/* ── Order metrics (for marketing) ────────────────────────────── */

export interface OrderMetrics {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  conversionRate: number;
  avgOrderValueEur: number;
  topProducts: { name: string; count: number }[];
  ordersByDay: { date: string; count: number }[];
}

export async function getOrderMetrics(
  periodStart: string,
  periodEnd: string
): Promise<OrderMetrics> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select("status, total_eur, bouquet_name, created_at")
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  if (error) throw new Error(`getOrderMetrics: ${error.message}`);

  const rows = data ?? [];
  const delivered = rows.filter((r) => r.status === "delivered");
  const cancelled = rows.filter((r) => r.status === "cancelled");

  const productCount = new Map<string, number>();
  const dayCount = new Map<string, number>();
  let totalValue = 0;

  for (const row of delivered) {
    totalValue += Number(row.total_eur ?? 0);
    const name = (row.bouquet_name as string) ?? "Unknown";
    productCount.set(name, (productCount.get(name) ?? 0) + 1);
    const day = (row.created_at as string).slice(0, 10);
    dayCount.set(day, (dayCount.get(day) ?? 0) + 1);
  }

  const topProducts = Array.from(productCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const ordersByDay = Array.from(dayCount.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  return {
    totalOrders: rows.length,
    deliveredOrders: delivered.length,
    cancelledOrders: cancelled.length,
    conversionRate:
      rows.length > 0
        ? Math.round((delivered.length / rows.length) * 10000) / 100
        : 0,
    avgOrderValueEur:
      delivered.length > 0
        ? Math.round((totalValue / delivered.length) * 100) / 100
        : 0,
    topProducts,
    ordersByDay,
  };
}

/* ── RAG: knowledge base search ───────────────────────────────── */

export interface KnowledgeResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
}

export async function searchKnowledgeBase(
  query: string,
  category: "accounting" | "legal" | "marketing",
  matchCount = 5
): Promise<KnowledgeResult[]> {
  const supabase = createServerClient();
  const queryEmbedding = await embed(query);

  const { data, error } = await supabase.rpc("search_knowledge", {
    query_embedding: queryEmbedding,
    search_category: category,
    match_count: matchCount,
  });

  if (error) throw new Error(`searchKnowledgeBase: ${error.message}`);
  return (data as KnowledgeResult[]) ?? [];
}

/* ── Save report ───────────────────────────────────────────────── */

export async function saveReport(
  agentType: "accountant" | "lawyer" | "marketing",
  periodStart: string,
  periodEnd: string,
  summary: string,
  fullReport: Record<string, unknown>
): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase.from("agent_reports").insert({
    agent_type: agentType,
    period_start: periodStart,
    period_end: periodEnd,
    summary,
    full_report: fullReport,
  });
  if (error) throw new Error(`saveReport: ${error.message}`);
}

/* ── Notify admin via WhatsApp ─────────────────────────────────── */

export async function notifyAdmin(message: string): Promise<void> {
  if (!ADMIN_PHONE) {
    console.warn("[agents] ADMIN_WHATSAPP_PHONE not set — notification skipped");
    return;
  }
  await sendWhatsAppText(ADMIN_PHONE, message);
}
