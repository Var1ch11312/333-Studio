const VIBER_API = "https://chatapi.viber.com/pa/send_message";
const VIBER_SET_WEBHOOK = "https://chatapi.viber.com/pa/set_webhook";

function viberHeaders() {
  return {
    "X-Viber-Auth-Token": process.env.VIBER_BOT_TOKEN ?? "",
    "Content-Type": "application/json",
  };
}

export async function notifyViber(receiverId: string, text: string) {
  if (!process.env.VIBER_BOT_TOKEN || !receiverId) {
    console.warn("[Viber] Token or receiverId missing — skipping");
    return;
  }
  const res = await fetch(VIBER_API, {
    method: "POST",
    headers: viberHeaders(),
    body: JSON.stringify({
      receiver: receiverId,
      min_api_version: 1,
      sender: { name: "AMUR.BG" },
      type: "text",
      text,
    }),
  });
  if (!res.ok) console.error("[Viber] Send failed:", await res.text());
}

export async function notifyDispatcher(text: string) {
  await notifyViber(process.env.VIBER_DISPATCHER_ID ?? "", text);
}

/* Register the Viber webhook URL (run once during setup) */
export async function registerViberWebhook(webhookUrl: string) {
  const res = await fetch(VIBER_SET_WEBHOOK, {
    method: "POST",
    headers: viberHeaders(),
    body: JSON.stringify({
      url: webhookUrl,
      event_types: ["message", "subscribed", "conversation_started"],
    }),
  });
  return res.json();
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
    order.payment_method === "cod" ? "Наложен платеж (€)" : "Карта — ПЛАТЕНО";
  return [
    `НОВА ПОРЪЧКА #${shortId}`,
    `Клиент: ${order.customer_name}  ${order.customer_phone}`,
    `Адрес: ${order.delivery_address}`,
    `Сума: ${order.total_amount_eur.toFixed(2)} EUR  |  ${paymentLabel}`,
    order.notes ? `Бележка: ${order.notes}` : null,
    `SLA: доставка в рамките на 2 часа`,
    ``,
    `Отговорете "ВЗИМАМ ${shortId}" за да приемете поръчката.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildCourierAssignmentCard(
  order: OrderSummary & { hub_name: string }
): string {
  const shortId = order.id.slice(0, 8).toUpperCase();
  return [
    `Поръчка #${shortId} е ВАША!`,
    ``,
    `Адрес: ${order.delivery_address}`,
    `Клиент: ${order.customer_name}`,
    order.notes ? `Бележка: ${order.notes}` : null,
    ``,
    `Вземете от: ${order.hub_name}`,
    `SLA: 2 часа от момента на приемане`,
    ``,
    `При доставка: снимайте и изпратете снимка тук.`,
    `Пишете "ДОСТАВЕНО ${shortId}" след успешна доставка.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildCustomerDeliveryNotice(
  customerPhone: string,
  courierName: string
): string {
  void customerPhone;
  return [
    `Вашата поръчка от AMUR.BG е на път!`,
    `Куриер: ${courierName} ще пристигне скоро.`,
    `Очаквайте снимка след връчването.`,
  ].join("\n");
}

export function buildNameDayReminder(names: string[]): string {
  const nameList = names.join(", ");
  return [
    `Утре е именен ден на: ${nameList}`,
    ``,
    `Подарете им нещо незабравимо — доставяме букет в Бургас за под 2 часа.`,
    `Поръчайте на amur.bg`,
  ].join("\n");
}
