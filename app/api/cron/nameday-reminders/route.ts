import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { notifyViber, buildNameDayReminder } from "@/lib/viber";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const stats = { calendarSent: 0, personalSent: 0 };

  /* ── 1. Общий болгарский календарь (nameday_optins) ─────── */
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const month = tomorrow.getMonth() + 1;
  const day = tomorrow.getDate();
  const today = tomorrow.toISOString().slice(0, 10);

  const { data: namedays } = await supabase
    .from("name_days")
    .select("name")
    .eq("month", month)
    .eq("day", day);

  if (namedays?.length) {
    const names = namedays.map((r) => r.name);
    const message = buildNameDayReminder(names);

    const { data: optins } = await supabase
      .from("nameday_optins")
      .select("phone, viber_id")
      .not(
        "phone",
        "in",
        `(SELECT phone FROM nameday_reminders_sent WHERE sent_date = '${today}')`
      );

    for (const contact of optins ?? []) {
      if (contact.viber_id) {
        await notifyViber(contact.viber_id, message);
        stats.calendarSent++;
      }
      await supabase.from("nameday_reminders_sent").upsert(
        { phone: contact.phone, sent_date: today, names: names.join(", ") },
        { onConflict: "phone,sent_date" }
      );
    }
  }

  /* ── 2. Персональные поводы (saved_occasions) ────────────── */
  /* Ищем поводы, для которых наступает день reminder_days_before */
  /* Упрощённо: ищем тех, у кого month/day = tomorrow (2-day reminder) */
  const { data: personal } = await supabase
    .from("saved_occasions")
    .select("customer_phone, recipient_name")
    .eq("month", month)
    .eq("day", day);

  for (const occ of personal ?? []) {
    /* Ищем Viber ID клиента через nameday_optins */
    const { data: optin } = await supabase
      .from("nameday_optins")
      .select("viber_id")
      .eq("phone", occ.customer_phone)
      .single();

    if (optin?.viber_id) {
      await notifyViber(
        optin.viber_id,
        buildPersonalOccasionReminder(occ.recipient_name)
      );
      stats.personalSent++;
    }
  }

  return NextResponse.json({ ...stats, date: today });
}

function buildPersonalOccasionReminder(recipientName: string): string {
  return [
    `Утре е именен ден на ${recipientName}!`,
    ``,
    `Не забравяйте да ги изненадате — доставяме букет в Бургас за под 2 часа.`,
    `Поръчайте на amur.bg`,
  ].join("\n");
}
