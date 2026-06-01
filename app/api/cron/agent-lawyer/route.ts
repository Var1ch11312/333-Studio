import { NextRequest, NextResponse } from "next/server";
import { runLawyerAgent } from "@/lib/agents/lawyer";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== (process.env.CRON_SECRET ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const periodEnd = now.toISOString().slice(0, 10);
  const periodStart = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  try {
    const summary = await runLawyerAgent(periodStart, periodEnd);
    return NextResponse.json({ ok: true, periodStart, periodEnd, summary });
  } catch (err) {
    console.error("[cron/agent-lawyer]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
