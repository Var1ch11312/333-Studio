import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { notifyViber, buildNameDayReminder } from "@/lib/viber";

/* Protected by CRON_SECRET — set in env and in Vercel cron header */
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  /* Tomorrow's name-days (send reminder the day before) */
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const month = tomorrow.getMonth() + 1;
  const day = tomorrow.getDate();

  const { data: namedays } = await supabase
    .from("name_days")
    .select("name")
    .eq("month", month)
    .eq("day", day);

  if (!namedays?.length) {
    return NextResponse.json({ sent: 0, message: "No name-days tomorrow" });
  }

  const names = namedays.map((r) => r.name);
  const message = buildNameDayReminder(names);
  const today = tomorrow.toISOString().slice(0, 10);

  /* Fetch opt-in contacts that haven't received a reminder today */
  const { data: optins } = await supabase
    .from("nameday_optins")
    .select("phone, viber_id")
    .not(
      "phone",
      "in",
      `(SELECT phone FROM nameday_reminders_sent WHERE sent_date = '${today}')`
    );

  if (!optins?.length) {
    return NextResponse.json({ sent: 0, message: "All contacts already notified" });
  }

  let sent = 0;
  for (const contact of optins) {
    if (contact.viber_id) {
      await notifyViber(contact.viber_id, message);
      sent++;
    }

    /* Record send to prevent duplicates */
    await supabase.from("nameday_reminders_sent").upsert(
      { phone: contact.phone, sent_date: today, names: names.join(", ") },
      { onConflict: "phone,sent_date" }
    );
  }

  return NextResponse.json({ sent, names, date: today });
}
