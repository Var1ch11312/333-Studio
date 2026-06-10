"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { isOddFlowerCount } from "@/lib/constants";
import { DualPrice } from "@/components/DualPrice";
import { OddFlowerModal } from "@/components/OddFlowerModal";
import {
  ArrowLeft, CreditCard, AlertTriangle,
  Loader2, ChevronDown, ChevronUp, Plus, Check,
  Calendar, Clock, Tag, EyeOff, Lock,
} from "lucide-react";
import Link from "next/link";

/* ─── Constants ────────────────────────────────────────── */
const DELIVERY_FEE_EUR = 5;

const CATALOG: Record<string, { title: string; price_eur: number; flower_count: number }> = {
  "1": { title: "Розова Елегантност",  price_eur: 45,  flower_count: 25 },
  "2": { title: "Алена Страст",        price_eur: 55,  flower_count: 21 },
  "3": { title: "Бяла Приказка",       price_eur: 65,  flower_count: 17 },
  "4": { title: "Пролетна Радост",     price_eur: 39,  flower_count: 15 },
  "5": { title: "Корпоративен Шик",    price_eur: 110, flower_count: 51 },
  "6": { title: "Изненада за Именник", price_eur: 35,  flower_count: 11 },
};

const UPSELLS = [
  { id: "bear",  title: "Плюшена мечка 30 см",   price_eur: 15, emoji: "🧸" },
  { id: "choco", title: "Raffaello (♥ 18 бр.)",  price_eur: 12, emoji: "🍫" },
  { id: "card",  title: "Поздравителна картичка", price_eur: 3,  emoji: "💌" },
];

const TIME_WINDOWS = ["09:00–11:00", "11:00–13:00", "13:00–15:00", "15:00–17:00", "17:00–19:00"];

const GREETING_TEMPLATES = [
  "С обич — тези цветя са само за теб! ❤",
  "Честит имен ден! Пожелавам ти здраве и щастие!",
  "Благодаря ти за всичко. С уважение.",
  "С любов, по повод твоя специален ден!",
];

/* ─── Helpers ──────────────────────────────────────────── */
const S: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(197,160,89,0.18)",
  borderRadius: 10,
  color: "#F9F6F0",
  fontSize: 14,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] tracking-wider uppercase" style={{ color: "rgba(197,160,89,0.6)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#1C1915", border: "1px solid rgba(197,160,89,0.14)" }}>
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(197,160,89,0.1)" }}>
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "rgba(197,160,89,0.15)", border: "1px solid rgba(197,160,89,0.4)", color: "#C5A059" }}>
          {number}
        </span>
        <span className="font-serif text-sm font-semibold" style={{ color: "#F9F6F0" }}>{title}</span>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

/* ─── SaveOccasionBlock ────────────────────────────────── */
function SaveOccasionBlock({ customerPhone }: { customerPhone: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [occ, setOcc] = useState({ recipient_name: "", month: "", day: "" });

  const handleSave = async () => {
    if (!customerPhone || !occ.recipient_name || !occ.month || !occ.day) return;
    setSaving(true);
    await fetch("/api/occasions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_phone: customerPhone, recipient_name: occ.recipient_name, month: Number(occ.month), day: Number(occ.day) }),
    });
    setSaving(false);
    setSaved(true);
  };

  if (saved) return (
    <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs"
      style={{ background: "rgba(197,160,89,0.08)", border: "1px solid rgba(197,160,89,0.25)", color: "#C5A059" }}>
      <Check className="w-3.5 h-3.5 shrink-0" />
      Запазихме именния ден на {occ.recipient_name} — ще ви напомним 2 дни преди!
    </div>
  );

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(197,160,89,0.12)" }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs text-left transition-colors"
        style={{ background: "rgba(197,160,89,0.05)", color: "rgba(249,246,240,0.55)" }}>
        <span>🎂 Запомни именния ден на близък човек</span>
        <span style={{ color: "rgba(197,160,89,0.6)" }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(197,160,89,0.1)" }}>
          <Field label="Иmе на получателя">
            <Input placeholder="Мария, Георги..." value={occ.recipient_name}
              onChange={e => setOcc(o => ({ ...o, recipient_name: e.target.value }))} style={S} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Месец"><Input type="number" min={1} max={12} placeholder="5" value={occ.month}
              onChange={e => setOcc(o => ({ ...o, month: e.target.value }))} style={S} /></Field>
            <Field label="Ден"><Input type="number" min={1} max={31} placeholder="6" value={occ.day}
              onChange={e => setOcc(o => ({ ...o, day: e.target.value }))} style={S} /></Field>
          </div>
          <button type="button" onClick={handleSave}
            disabled={saving || !occ.recipient_name || !occ.month || !occ.day}
            className="w-fit text-xs px-4 py-2 rounded-lg transition-opacity disabled:opacity-40"
            style={{ background: "rgba(197,160,89,0.15)", border: "1px solid rgba(197,160,89,0.3)", color: "#C5A059" }}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Запази повода"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────── */
export function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const productId = searchParams.get("product") ?? "1";
  const product = CATALOG[productId] ?? CATALOG["1"];

  /* Base form */
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", delivery_address: "", notes: "" });
  /* Recipient */
  const [deliveryFor, setDeliveryFor] = useState<"self" | "recipient">("recipient");
  const [recipient, setRecipient] = useState({ name: "", phone: "" });
  const [greetingMessage, setGreetingMessage] = useState("");
  /* Schedule */
  const [schedule, setSchedule] = useState<"asap" | "scheduled">("asap");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  /* Payment + extras */
  const [upsells, setUpsells] = useState<Record<string, boolean>>({});
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  /* Consent */
  const [gdprConsent, setGdprConsent] = useState(false);
  const [nameDayConsent, setNameDayConsent] = useState(false);
  /* UI state */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOddModal, setShowOddModal] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const upsellTotal = UPSELLS.reduce((s, u) => (upsells[u.id] ? s + u.price_eur : s), 0);
  const totalEur = product.price_eur + DELIVERY_FEE_EUR + upsellTotal;
  const flowerCountValid = isOddFlowerCount(product.flower_count);

  // Min date = today
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { if (error) setError(null); }, [form]); // eslint-disable-line

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!gdprConsent) return;
    if (!flowerCountValid) { setShowOddModal(true); return; }

    setLoading(true);
    setError(null);
    try {
      const phone = form.customer_phone.startsWith("+") ? form.customer_phone : `+359${form.customer_phone}`;
      const selectedUpsells = UPSELLS.filter(u => upsells[u.id]).map(u => ({
        product_id: u.id, title: u.title, quantity: 1, unit_price_eur: u.price_eur, flower_count: 0,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_phone: phone,
          delivery_address: form.delivery_address,
          notes: form.notes,
          payment_method: "card",
          nameday_optin: nameDayConsent,
          items: [
            { product_id: productId, title: product.title, quantity: 1, unit_price_eur: product.price_eur, flower_count: product.flower_count },
            ...selectedUpsells,
          ],
          delivery_for_self: deliveryFor === "self",
          recipient_name: deliveryFor === "recipient" ? recipient.name : null,
          recipient_phone: deliveryFor === "recipient" ? (recipient.phone.startsWith("+") ? recipient.phone : `+359${recipient.phone}`) : null,
          greeting_message: greetingMessage || null,
          delivery_schedule: schedule,
          delivery_date: schedule === "scheduled" ? deliveryDate : null,
          delivery_time_window: schedule === "scheduled" ? timeWindow : null,
          promo_code: promoCode || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Грешка при създаване на поръчката"); return; }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setError("Мрежова грешка. Моля, опитайте отново.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-36" style={{ background: "#0A0907" }}>
      {showOddModal && <OddFlowerModal flowerCount={product.flower_count} onClose={() => setShowOddModal(false)} />}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4"
        style={{ background: "rgba(10,9,7,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(197,160,89,0.1)" }}>
        <Link href="/" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-4 h-4" style={{ color: "#C5A059" }} />
        </Link>
        <span className="font-serif text-lg font-bold tracking-widest text-primary">AMUR</span>
        <span className="text-xs" style={{ color: "rgba(249,246,240,0.35)" }}>/ Поръчка</span>
      </header>

      {/* ── Summary bar ── */}
      <div className="mx-3 mt-3 rounded-2xl overflow-hidden"
        style={{ background: "#1C1915", border: "1px solid rgba(197,160,89,0.2)" }}>
        <button type="button" onClick={() => setSummaryOpen(o => !o)}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(197,160,89,0.08)", border: "1px solid rgba(197,160,89,0.15)" }}>
            <span style={{ fontSize: 22, opacity: 0.6 }}>✿</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "#F9F6F0" }}>{product.title}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(249,246,240,0.4)" }}>
              {product.flower_count} стъбла · + доставка{upsellTotal > 0 ? ` · + добавки` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DualPrice priceEur={totalEur} layout="inline" />
            {summaryOpen ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "rgba(197,160,89,0.5)" }} />
              : <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(197,160,89,0.5)" }} />}
          </div>
        </button>
        {summaryOpen && (
          <div className="px-4 pb-4 flex flex-col gap-2 text-xs" style={{ borderTop: "1px solid rgba(197,160,89,0.1)" }}>
            <div className="flex justify-between pt-3" style={{ color: "rgba(249,246,240,0.5)" }}>
              <span>{product.title}</span><DualPrice priceEur={product.price_eur} layout="inline" />
            </div>
            {UPSELLS.filter(u => upsells[u.id]).map(u => (
              <div key={u.id} className="flex justify-between" style={{ color: "rgba(249,246,240,0.5)" }}>
                <span>{u.emoji} {u.title}</span><DualPrice priceEur={u.price_eur} layout="inline" />
              </div>
            ))}
            <div className="flex justify-between" style={{ color: "rgba(249,246,240,0.5)" }}>
              <span>Доставка</span><DualPrice priceEur={DELIVERY_FEE_EUR} layout="inline" />
            </div>
            <div className="flex justify-between font-semibold pt-2"
              style={{ borderTop: "1px solid rgba(197,160,89,0.1)", color: "#C5A059" }}>
              <span>Общо</span><DualPrice priceEur={totalEur} layout="inline" />
            </div>
          </div>
        )}
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-3 mt-3">

        {/* ── STEP 1: Вашите данни ── */}
        <Step number={1} title="Вашите данни">
          <div className="flex flex-col gap-4">
            <Field label="Телефон (Viber / SMS) *">
              <div className="flex items-stretch rounded-[10px] overflow-hidden"
                style={{ border: "1px solid rgba(197,160,89,0.18)", background: "rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-1.5 px-3"
                  style={{ borderRight: "1px solid rgba(197,160,89,0.15)", background: "rgba(197,160,89,0.06)" }}>
                  <span>🇧🇬</span>
                  <span className="text-xs font-medium" style={{ color: "rgba(197,160,89,0.8)" }}>+359</span>
                </div>
                <input required type="tel" className="flex-1 bg-transparent px-3 py-3 text-sm outline-none"
                  style={{ color: "#F9F6F0" }} placeholder="88 888 8888"
                  value={form.customer_phone}
                  onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
              </div>
            </Field>
            <Field label="Вашето име *">
              <Input required placeholder="Иван Иванов" value={form.customer_name}
                onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} style={S} />
            </Field>
          </div>
        </Step>

        {/* ── STEP 2: Кому доставяме ── */}
        <Step number={2} title="Кому доставяме">
          <div className="flex flex-col gap-4">

            {/* Toggle */}
            <div className="grid grid-cols-2 gap-2">
              {(["recipient", "self"] as const).map(v => (
                <button key={v} type="button" onClick={() => setDeliveryFor(v)}
                  className="py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={deliveryFor === v
                    ? { background: "rgba(197,160,89,0.15)", border: "1px solid rgba(197,160,89,0.5)", color: "#C5A059" }
                    : { background: "transparent", border: "1px solid rgba(197,160,89,0.14)", color: "rgba(249,246,240,0.45)" }}>
                  {v === "recipient" ? "На получателя" : "На себе си"}
                </button>
              ))}
            </div>

            {/* Recipient fields */}
            {deliveryFor === "recipient" && (
              <>
                <Field label="Телефон на получателя">
                  <div className="flex items-stretch rounded-[10px] overflow-hidden"
                    style={{ border: "1px solid rgba(197,160,89,0.18)", background: "rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center gap-1.5 px-3"
                      style={{ borderRight: "1px solid rgba(197,160,89,0.15)", background: "rgba(197,160,89,0.06)" }}>
                      <span>🇧🇬</span>
                      <span className="text-xs font-medium" style={{ color: "rgba(197,160,89,0.8)" }}>+359</span>
                    </div>
                    <input type="tel" className="flex-1 bg-transparent px-3 py-3 text-sm outline-none"
                      style={{ color: "#F9F6F0" }} placeholder="88 888 8888"
                      value={recipient.phone}
                      onChange={e => setRecipient(r => ({ ...r, phone: e.target.value }))} />
                  </div>
                </Field>
                <Field label="Иmе на получателя">
                  <Input placeholder="Мария Иванова" value={recipient.name}
                    onChange={e => setRecipient(r => ({ ...r, name: e.target.value }))} style={S} />
                </Field>

                {/* Anonymous notice */}
                <div className="flex items-start gap-2.5 rounded-xl px-3 py-3"
                  style={{ background: "rgba(197,160,89,0.06)", border: "1px solid rgba(197,160,89,0.14)" }}>
                  <EyeOff className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "rgba(197,160,89,0.7)" }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(249,246,240,0.55)" }}>
                    Доставката е <strong style={{ color: "rgba(197,160,89,0.9)" }}>анонимна</strong> — получателят не разбира кой е изпратил, освен ако посочите себе си в съобщението.
                  </p>
                </div>
              </>
            )}

            {/* Greeting message */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] tracking-wider uppercase" style={{ color: "rgba(197,160,89,0.6)" }}>
                Поздравително съобщение (незадължително)
              </label>
              <textarea
                maxLength={300}
                rows={3}
                placeholder="Напишете пожелание към получателя..."
                value={greetingMessage}
                onChange={e => setGreetingMessage(e.target.value)}
                className="w-full resize-none rounded-[10px] px-3 py-3 text-sm outline-none"
                style={{ ...S, lineHeight: 1.5 }}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "rgba(249,246,240,0.3)" }}>
                  {greetingMessage.length}/300
                </span>
                <span className="text-[10px]" style={{ color: "rgba(197,160,89,0.5)" }}>
                  Готови шаблони →
                </span>
              </div>
              {/* Templates */}
              <div className="flex flex-col gap-1.5">
                {GREETING_TEMPLATES.map(t => (
                  <button key={t} type="button" onClick={() => setGreetingMessage(t)}
                    className="text-left text-[11px] px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: greetingMessage === t ? "rgba(197,160,89,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${greetingMessage === t ? "rgba(197,160,89,0.3)" : "rgba(255,255,255,0.06)"}`,
                      color: greetingMessage === t ? "#C5A059" : "rgba(249,246,240,0.4)",
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Step>

        {/* ── STEP 3: Дата & час доставка ── */}
        <Step number={3} title="Кога да доставим">
          <div className="flex flex-col gap-4">
            {/* ASAP / Scheduled toggle */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { v: "asap",      label: "Как можно скоро",  sub: "до 2 часа" },
                { v: "scheduled", label: "Избери дата",       sub: "конкретен ден" },
              ] as const).map(({ v, label, sub }) => (
                <button key={v} type="button" onClick={() => setSchedule(v)}
                  className="py-3 px-3 rounded-xl text-left transition-all"
                  style={schedule === v
                    ? { background: "rgba(197,160,89,0.12)", border: "1px solid rgba(197,160,89,0.45)" }
                    : { background: "transparent", border: "1px solid rgba(197,160,89,0.12)" }}>
                  <p className="text-xs font-semibold" style={{ color: schedule === v ? "#C5A059" : "#F9F6F0" }}>
                    {label}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(249,246,240,0.4)" }}>{sub}</p>
                </button>
              ))}
            </div>

            {schedule === "asap" && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-3"
                style={{ background: "rgba(197,160,89,0.06)", border: "1px solid rgba(197,160,89,0.14)" }}>
                <Clock className="w-4 h-4 shrink-0" style={{ color: "rgba(197,160,89,0.7)" }} />
                <p className="text-[11px]" style={{ color: "rgba(249,246,240,0.55)" }}>
                  Доставка до <strong style={{ color: "#C5A059" }}>2 часа</strong> след потвърждение.
                  SLA гаранция — при закъснение 20% отстъпка.
                </p>
              </div>
            )}

            {schedule === "scheduled" && (
              <div className="flex flex-col gap-3">
                <Field label="Дата на доставка">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "rgba(197,160,89,0.5)" }} />
                    <input type="date" min={today}
                      value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                      className="w-full rounded-[10px] pl-9 pr-3 py-3 text-sm outline-none"
                      style={{ ...S, colorScheme: "dark" }} />
                  </div>
                </Field>

                <Field label="Времеви прозорец">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {TIME_WINDOWS.map(w => (
                      <button key={w} type="button" onClick={() => setTimeWindow(w)}
                        className="py-2 rounded-lg text-xs text-center transition-all"
                        style={timeWindow === w
                          ? { background: "rgba(197,160,89,0.15)", border: "1px solid rgba(197,160,89,0.5)", color: "#C5A059" }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(197,160,89,0.12)", color: "rgba(249,246,240,0.5)" }}>
                        {w}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}
          </div>
        </Step>

        {/* ── STEP 4: Адрес ── */}
        <Step number={4} title="Адрес за доставка">
          <div className="flex flex-col gap-4">
            <Field label="Пълен адрес в Бургас *">
              <Input required placeholder="ул. Александровска 1, Бургас" value={form.delivery_address}
                onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))} style={S} />
            </Field>
            <Field label="Бележка (специфики, код на домофон...)">
              <Input placeholder="Например: ет. 3, ап. 12" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={S} />
            </Field>
          </div>
        </Step>

        {/* ── Upsells ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1C1915", border: "1px solid rgba(197,160,89,0.14)" }}>
          <div className="px-4 py-3.5" style={{ borderBottom: "1px solid rgba(197,160,89,0.1)" }}>
            <p className="text-sm font-serif font-semibold" style={{ color: "#F9F6F0" }}>Добавете към букета</p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(249,246,240,0.38)" }}>Завършете подаръка с нещо специално</p>
          </div>
          <div className="flex flex-col" style={{ gap: 0 }}>
            {UPSELLS.map((u, i) => {
              const selected = !!upsells[u.id];
              return (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderTop: i > 0 ? "1px solid rgba(197,160,89,0.07)" : undefined }}>
                  <span style={{ fontSize: 28 }}>{u.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "#F9F6F0" }}>{u.title}</p>
                    <DualPrice priceEur={u.price_eur} layout="inline" className="mt-0.5" />
                  </div>
                  <button type="button" onClick={() => setUpsells(s => ({ ...s, [u.id]: !s[u.id] }))}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0"
                    style={selected
                      ? { background: "#C5A059", color: "#1A1A1A" }
                      : { background: "rgba(197,160,89,0.1)", border: "1px solid rgba(197,160,89,0.3)", color: "#C5A059" }}>
                    {selected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STEP 5: Плащане ── */}
        <Step number={5} title="Плащане">
          <div className="flex flex-col gap-3">
            {/* Card payment info */}
            <div className="flex items-start gap-3 rounded-xl p-4"
              style={{ background: "rgba(197,160,89,0.07)", border: "1px solid rgba(197,160,89,0.28)" }}>
              <CreditCard className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#C5A059" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#F9F6F0" }}>
                  Карта · Apple Pay · Google Pay
                </p>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "rgba(249,246,240,0.45)" }}>
                  Сигурно плащане чрез Stripe. Ще бъдете пренасочени към защитена страница.
                </p>
              </div>
            </div>
            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "rgba(249,246,240,0.28)" }}>
                <Lock className="w-3 h-3" /> SSL 256-bit
              </span>
              <span className="text-[10px]" style={{ color: "rgba(197,160,89,0.2)" }}>·</span>
              <span className="text-[10px]" style={{ color: "rgba(249,246,240,0.28)" }}>Powered by Stripe</span>
              <span className="text-[10px]" style={{ color: "rgba(197,160,89,0.2)" }}>·</span>
              <span className="text-[10px]" style={{ color: "rgba(249,246,240,0.28)" }}>3D Secure</span>
            </div>
            {/* GDPR / legal consent */}
            <p className="text-[10px] text-center leading-relaxed" style={{ color: "rgba(249,246,240,0.3)" }}>
              Натискайки „Продължи към плащане", приемате{" "}
              <a href="/terms" target="_blank" style={{ color: "rgba(197,160,89,0.6)", textDecoration: "underline" }}>Условията за ползване</a>,{" "}
              <a href="/refund" target="_blank" style={{ color: "rgba(197,160,89,0.6)", textDecoration: "underline" }}>Политиката за връщане</a>{" "}
              и обработката на лични данни съгласно{" "}
              <a href="/privacy" target="_blank" style={{ color: "rgba(197,160,89,0.6)", textDecoration: "underline" }}>Политиката за поверителност</a> (GDPR).
            </p>
          </div>
        </Step>

        {/* ── Promo code ── */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(197,160,89,0.12)" }}>
          <button type="button" onClick={() => setPromoOpen(o => !o)}
            className="w-full flex items-center gap-2 px-4 py-3 text-xs text-left transition-colors"
            style={{ background: "rgba(197,160,89,0.04)", color: "rgba(249,246,240,0.5)" }}>
            <Tag className="w-3.5 h-3.5" style={{ color: "rgba(197,160,89,0.6)" }} />
            <span>Имам промокод</span>
            <span className="ml-auto" style={{ color: "rgba(197,160,89,0.5)" }}>{promoOpen ? "−" : "+"}</span>
          </button>
          {promoOpen && (
            <div className="px-4 pb-4 pt-3 flex gap-2" style={{ borderTop: "1px solid rgba(197,160,89,0.1)" }}>
              <Input placeholder="AMUR2026" value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                style={{ ...S, flex: 1 }} />
              <button type="button"
                className="px-4 rounded-lg text-xs font-semibold transition-opacity"
                style={{ background: "rgba(197,160,89,0.15)", border: "1px solid rgba(197,160,89,0.3)", color: "#C5A059" }}>
                Приложи
              </button>
            </div>
          )}
        </div>

        {/* ── STEP 6: Съгласие ── */}
        <Step number={6} title="Съгласие & напомняния">
          <div className="flex flex-col gap-4">
            {[
              { id: "gdpr", checked: gdprConsent, onChange: (v: boolean) => setGdprConsent(v), label: "Съгласен/на съм с обработката на личните ми данни за целите на поръчката. *" },
              { id: "nameday", checked: nameDayConsent, onChange: (v: boolean) => setNameDayConsent(v), label: "Желая да получавам напомняния за именни дни в Viber (opt-in)." },
            ].map(({ id, checked, onChange, label }) => (
              <label key={id} className="flex items-start gap-3 cursor-pointer">
                <div className="w-5 h-5 rounded-md mt-0.5 shrink-0 flex items-center justify-center transition-all"
                  style={{ background: checked ? "#C5A059" : "transparent", border: `1.5px solid ${checked ? "#C5A059" : "rgba(197,160,89,0.3)"}` }}
                  onClick={() => onChange(!checked)}>
                  {checked && <Check className="w-3 h-3" style={{ color: "#1A1A1A" }} />}
                </div>
                <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} required={id === "gdpr"} />
                <span className="text-xs leading-relaxed" style={{ color: "rgba(249,246,240,0.5)" }}>{label}</span>
              </label>
            ))}
            <SaveOccasionBlock customerPhone={form.customer_phone} />
          </div>
        </Step>

        {error && (
          <div className="flex items-start gap-2 p-4 rounded-xl text-xs"
            style={{ background: "rgba(122,29,29,0.4)", border: "1px solid rgba(122,29,29,0.6)", color: "#F9F6F0" }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-center text-[10px] px-2" style={{ color: "rgba(249,246,240,0.2)" }}>
          1 EUR = 1,95583 BGN · Двойно показване до 08.08.2026
        </p>
      </form>

      {/* ── Fixed bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-4"
        style={{ background: "rgba(10,9,7,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(197,160,89,0.12)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px]" style={{ color: "rgba(249,246,240,0.35)" }}>
              {schedule === "asap" ? "Доставка до 2 часа" : deliveryDate ? `${deliveryDate} · ${timeWindow || "час по избор"}` : "Избери дата"}
            </span>
          </div>
          <DualPrice priceEur={totalEur} layout="inline" />
        </div>
        <button type="submit" form="" onClick={handleSubmit as unknown as React.MouseEventHandler}
          disabled={!gdprConsent || loading}
          className="w-full py-4 rounded-2xl font-semibold tracking-wider text-sm transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #C5A059 0%, #A8853E 100%)", color: "#1A1A1A", boxShadow: "0 4px 20px rgba(197,160,89,0.3)" }}>
          {loading
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Обработка...</span>
            : "Продължи към плащане →"}
        </button>
      </div>
    </div>
  );
}
