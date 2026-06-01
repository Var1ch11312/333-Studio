import { NextRequest, NextResponse } from "next/server";
import { checkAndEscalateTimedOutOrders } from "@/lib/order-routing";

/**
 * Cron job: runs every 2 minutes.
 * Finds orders where florist didn't respond within 5 minutes
 * and escalates them to the next nearest hub.
 *
 * Secured by CRON_SECRET header (set same value in Vercel cron config).
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== (process.env.CRON_SECRET ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const escalated = await checkAndEscalateTimedOutOrders();
  return NextResponse.json({ escalated, timestamp: new Date().toISOString() });
}
