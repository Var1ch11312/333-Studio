const VIBER_API = "https://chatapi.viber.com/pa/send_message";

export async function notifyViber(
  receiverId: string,
  text: string
): Promise<void> {
  const token = process.env.VIBER_BOT_TOKEN;
  if (!token || !receiverId) {
    console.warn("[Viber] Token or receiver not set — skipping notification");
    return;
  }
  const res = await fetch(VIBER_API, {
    method: "POST",
    headers: {
      "X-Viber-Auth-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      receiver: receiverId,
      min_api_version: 1,
      sender: { name: "AMUR.BG Диспечер" },
      type: "text",
      text,
    }),
  });
  if (!res.ok) {
    console.error("[Viber] Send failed:", await res.text());
  }
}

export async function notifyDispatcher(text: string): Promise<void> {
  const dispatcherId = process.env.VIBER_DISPATCHER_ID ?? "";
  await notifyViber(dispatcherId, text);
}

type OrderSummary = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount_eur: number;
  payment_method: string;
  notes?: string | null;
};

export function buildOrderCard(order: OrderSummary): string {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const paymentLabel =
    order.payment_method === "cod"
      ? "Наложен платеж (€)"
      : "Карта — ПЛАТЕНО";
  const lines = [
    `НОВА ПОРЪЧКА #${shortId}`,
    `Клиент: ${order.customer_name}  ${order.customer_phone}`,
    `Адрес: ${order.delivery_address}`,
    `Сума: ${order.total_amount_eur.toFixed(2)} EUR  |  ${paymentLabel}`,
    order.notes ? `Бележка: ${order.notes}` : null,
    `SLA: доставка в рамките на 2 часа`,
    ``,
    `Отговорете "ВЗИМАМ ${shortId}" за да приемете поръчката.`,
  ];
  return lines.filter(Boolean).join("\n");
}
