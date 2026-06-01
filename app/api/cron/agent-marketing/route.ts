import { NextRequest, NextResponse } from "next/server";
import { runMarketingAgent } from "@/lib/agents/marketing";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== (process.env.CRON_SECRET ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const periodEnd = now.toISOString().slice(0, 10);
  const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  try {
    const summary = await runMarketingAgent(periodStart, periodEnd);
    return NextResponse.json({ ok: true, periodStart, periodEnd, summary });
  } catch (err) {
    console.error("[cron/agent-marketing]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
