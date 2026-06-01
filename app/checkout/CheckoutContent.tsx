"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { isOddFlowerCount } from "@/lib/constants";
import { DualPrice } from "@/components/DualPrice";
import { OddFlowerModal } from "@/components/OddFlowerModal";
import {
  ArrowLeft, CreditCard, Banknote, AlertTriangle,
  Loader2, ChevronDown, ChevronUp, Plus, Check,
} from "lucide-react";
import Link from "next/link";
import type { PaymentMethod } from "@/types";

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
  { id: "bear",  title: "Плюшена мечка 30 см",    price_eur: 15, emoji: "🧸" },
  { id: "choco", title: "Raffaello (♥ 18 бр.)",   price_eur: 12, emoji: "🍫" },
  { id: "card",  title: "Поздравителна картичка",  price_eur: 3,  emoji: "💌" },
];

/* ─── Step wrapper ─────────────────────────────────────── */
function Step({
  number, title, children,
}: {
  number: number; title: string; children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#1C1915", border: "1px solid rgba(197,160,89,0.14)" }}
    >
      {/* Step header */}
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(197,160,89,0.1)" }}>
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "rgba(197,160,89,0.15)", border: "1px solid rgba(197,160,89,0.4)", color: "#C5A059" }}
        >
          {number}
        </span>
        <span className="font-serif text-sm font-semibold" style={{ color: "#F9F6F0" }}>
          {title}
        </span>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

/* ─── Field wrapper ────────────────────────────────────── */
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

/* ─── Dark input ───────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(197,160,89,0.18)",
  borderRadius: 10,
  color: "#F9F6F0",
  fontSize: 14,
};

/* ─── SaveOccasionBlock ────────────────────────────────── */
function SaveOccasionBlock({ customerPhone }: { customerPhone: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [occasion, setOccasion] = useState({ recipient_name: "", month: "", day: "" });

  const handleSave = async () => {
    if (!customerPhone || !occasion.recipient_name || !occasion.month || !occasion.day) return;
    setSaving(true);
    await fetch("/api/occasions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_phone: customerPhone,
        recipient_name: occasion.recipient_name,
        month: Number(occasion.month),
        day: Number(occasion.day),
      }),
    });
    setSaving(false);
    setSaved(true);
  };

  if (saved) {
    return (
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs"
        style={{ background: "rgba(197,160,89,0.08)", border: "1px solid rgba(197,160,89,0.25)", color: "#C5A059" }}
      >
        <Check className="w-3.5 h-3.5 shrink-0" />
        Запазихме именния ден на {occasion.recipient_name} — ще ви напомним 2 дни преди!
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(197,160,89,0.12)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs transition-colors text-left"
        style={{ background: "rgba(197,160,89,0.05)", color: "rgba(249,246,240,0.55)" }}
      >
        <span>🎂 Запомни именния ден на близък човек</span>
        <span style={{ color: "rgba(197,160,89,0.6)" }}>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(197,160,89,0.1)" }}>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(249,246,240,0.4)" }}>
            Ще изпратим напомняне в Viber 2 дни преди датата.
          </p>
          <Field label="Ime на получателя">
            <Input placeholder="Мария, Георги..." value={occasion.recipient_name}
              onChange={(e) => setOccasion((o) => ({ ...o, recipient_name: e.target.value }))}
              style={inputStyle} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Месец"><Input type="number" min={1} max={12} placeholder="5"
              value={occasion.month} onChange={(e) => setOccasion((o) => ({ ...o, month: e.target.value }))}
              style={inputStyle} /></Field>
            <Field label="Ден"><Input type="number" min={1} max={31} placeholder="6"
              value={occasion.day} onChange={(e) => setOccasion((o) => ({ ...o, day: e.target.value }))}
              style={inputStyle} /></Field>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !occasion.recipient_name || !occasion.month || !occasion.day}
            className="w-fit text-xs px-4 py-2 rounded-lg transition-opacity disabled:opacity-40"
            style={{ background: "rgba(197,160,89,0.15)", border: "1px solid rgba(197,160,89,0.3)", color: "#C5A059" }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Запази повода"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main component ───────────────────────────────────── */
export function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const productId = searchParams.get("product") ?? "1";
  const product = CATALOG[productId] ?? CATALOG["1"];

  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", delivery_address: "", notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [nameDayConsent, setNameDayConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOddModal, setShowOddModal] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [upsells, setUpsells] = useState<Record<string, boolean>>({});

  const upsellTotal = UPSELLS.reduce((s, u) => (upsells[u.id] ? s + u.price_eur : s), 0);
  const totalEur = product.price_eur + DELIVERY_FEE_EUR + upsellTotal;
  const flowerCountValid = isOddFlowerCount(product.flower_count);

  useEffect(() => { if (error) setError(null); }, [form]); // eslint-disable-line

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdprConsent) return;
    if (!flowerCountValid) { setShowOddModal(true); return; }

    setLoading(true);
    setError(null);
    try {
      const selectedUpsells = UPSELLS.filter((u) => upsells[u.id]).map((u) => ({
        product_id: u.id,
        title: u.title,
        quantity: 1,
        unit_price_eur: u.price_eur,
        flower_count: 0,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_phone: form.customer_phone.startsWith("+") ? form.customer_phone : `+359${form.customer_phone}`,
          delivery_address: form.delivery_address,
          notes: form.notes,
          payment_method: paymentMethod,
          nameday_optin: nameDayConsent,
          items: [
            { product_id: productId, title: product.title, quantity: 1, unit_price_eur: product.price_eur, flower_count: product.flower_count },
            ...selectedUpsells,
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Грешка при създаване на поръчката"); return; }
      if (data.type === "stripe" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.type === "cod") {
        router.push(`/order-success?order_id=${data.orderId}&type=cod`);
      }
    } catch {
      setError("Мрежова грешка. Моля, опитайте отново.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-32" style={{ background: "#0A0907" }}>
      {showOddModal && (
        <OddFlowerModal flowerCount={product.flower_count} onClose={() => setShowOddModal(false)} />
      )}

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4"
        style={{
          background: "rgba(10,9,7,0.9)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(197,160,89,0.1)",
        }}
      >
        <Link href="/" className="p-1.5 rounded-lg transition-colors hover:bg-white/5">
          <ArrowLeft className="w-4 h-4" style={{ color: "#C5A059" }} />
        </Link>
        <span className="font-serif text-lg font-bold tracking-widest text-primary">AMUR</span>
        <span className="text-xs" style={{ color: "rgba(249,246,240,0.35)" }}>/ Поръчка</span>
      </header>

      {/* ── Order summary bar ── */}
      <div
        className="mx-3 mt-3 rounded-2xl overflow-hidden"
        style={{ background: "#1C1915", border: "1px solid rgba(197,160,89,0.2)" }}
      >
        <button
          type="button"
          onClick={() => setSummaryOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        >
          {/* Product icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(197,160,89,0.08)", border: "1px solid rgba(197,160,89,0.15)" }}
          >
            <span style={{ fontSize: 22, opacity: 0.6 }}>✿</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "#F9F6F0" }}>
              {product.title}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(249,246,240,0.4)" }}>
              {product.flower_count} стъбла · + доставка
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <DualPrice priceEur={totalEur} layout="inline" />
            {summaryOpen
              ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "rgba(197,160,89,0.5)" }} />
              : <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(197,160,89,0.5)" }} />
            }
          </div>
        </button>

        {summaryOpen && (
          <div
            className="px-4 pb-4 flex flex-col gap-2 text-xs"
            style={{ borderTop: "1px solid rgba(197,160,89,0.1)" }}
          >
            <div className="flex justify-between pt-3" style={{ color: "rgba(249,246,240,0.5)" }}>
              <span>{product.title}</span>
              <DualPrice priceEur={product.price_eur} layout="inline" />
            </div>
            {UPSELLS.filter((u) => upsells[u.id]).map((u) => (
              <div key={u.id} className="flex justify-between" style={{ color: "rgba(249,246,240,0.5)" }}>
                <span>{u.emoji} {u.title}</span>
                <DualPrice priceEur={u.price_eur} layout="inline" />
              </div>
            ))}
            <div className="flex justify-between" style={{ color: "rgba(249,246,240,0.5)" }}>
              <span>Доставка</span>
              <DualPrice priceEur={DELIVERY_FEE_EUR} layout="inline" />
            </div>
            <div
              className="flex justify-between font-semibold pt-2"
              style={{ borderTop: "1px solid rgba(197,160,89,0.1)", color: "#C5A059" }}
            >
              <span>Общо</span>
              <DualPrice priceEur={totalEur} layout="inline" />
            </div>
          </div>
        )}
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-3 mt-3">

        {/* Step 1 — Your data */}
        <Step number={1} title="Вашите данни">
          <div className="flex flex-col gap-4">
            <Field label="Телефон (Viber / SMS) *">
              <div
                className="flex items-stretch rounded-[10px] overflow-hidden"
                style={{ border: "1px solid rgba(197,160,89,0.18)", background: "rgba(255,255,255,0.04)" }}
              >
                <div
                  className="flex items-center gap-1.5 px-3"
                  style={{ borderRight: "1px solid rgba(197,160,89,0.15)", background: "rgba(197,160,89,0.06)" }}
                >
                  <span>🇧🇬</span>
                  <span className="text-xs font-medium" style={{ color: "rgba(197,160,89,0.8)" }}>+359</span>
                </div>
                <input
                  required
                  type="tel"
                  className="flex-1 bg-transparent px-3 py-3 text-sm outline-none"
                  style={{ color: "#F9F6F0" }}
                  placeholder="88 888 8888"
                  value={form.customer_phone}
                  onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                />
              </div>
            </Field>

            <Field label="Вашето име *">
              <Input
                required
                placeholder="Иван Иванов"
                value={form.customer_name}
                onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                style={inputStyle}
              />
            </Field>
          </div>
        </Step>

        {/* Step 2 — Delivery address */}
        <Step number={2} title="Адрес за доставка">
          <div className="flex flex-col gap-4">
            <Field label="Пълен адрес в Бургас *">
              <Input
                required
                placeholder="ул. Александровска 1, Бургас"
                value={form.delivery_address}
                onChange={(e) => setForm((f) => ({ ...f, delivery_address: e.target.value }))}
                style={inputStyle}
              />
            </Field>
            <Field label="Бележка (поздравителен текст, специфики)">
              <Input
                placeholder="С любов от Иван..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                style={inputStyle}
              />
            </Field>
          </div>
        </Step>

        {/* Upsell section */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#1C1915", border: "1px solid rgba(197,160,89,0.14)" }}
        >
          <div className="px-4 py-3.5" style={{ borderBottom: "1px solid rgba(197,160,89,0.1)" }}>
            <p className="text-sm font-serif font-semibold" style={{ color: "#F9F6F0" }}>
              Добавете към букета
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(249,246,240,0.38)" }}>
              Завършете подаръка с нещо специално
            </p>
          </div>
          <div className="flex flex-col divide-y" style={{ borderColor: "rgba(197,160,89,0.08)" }}>
            {UPSELLS.map((u) => {
              const selected = !!upsells[u.id];
              return (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span style={{ fontSize: 28 }}>{u.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "#F9F6F0" }}>{u.title}</p>
                    <DualPrice priceEur={u.price_eur} layout="inline" className="mt-0.5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setUpsells((s) => ({ ...s, [u.id]: !s[u.id] }))}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0"
                    style={
                      selected
                        ? { background: "#C5A059", color: "#1A1A1A" }
                        : { background: "rgba(197,160,89,0.1)", border: "1px solid rgba(197,160,89,0.3)", color: "#C5A059" }
                    }
                  >
                    {selected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3 — Payment */}
        <Step number={3} title="Метод на плащане">
          <div className="flex flex-col gap-3">
            {[
              {
                value: "card" as PaymentMethod,
                icon: CreditCard,
                label: "Карта / Apple Pay / Google Pay",
                sub: "Сигурно плащане чрез Stripe",
              },
              {
                value: "cod" as PaymentMethod,
                icon: Banknote,
                label: "Наложен платеж (при доставка)",
                sub: "Плащане в евро (€) при получаване",
              },
            ].map(({ value, icon: Icon, label, sub }) => {
              const active = paymentMethod === value;
              return (
                <label
                  key={value}
                  className="flex items-start gap-3 cursor-pointer rounded-xl p-3.5 transition-all"
                  style={{
                    background: active ? "rgba(197,160,89,0.08)" : "transparent",
                    border: `1px solid ${active ? "rgba(197,160,89,0.35)" : "rgba(197,160,89,0.1)"}`,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full mt-0.5 shrink-0 flex items-center justify-center"
                    style={{ border: `2px solid ${active ? "#C5A059" : "rgba(197,160,89,0.3)"}` }}
                  >
                    {active && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    value={value}
                    checked={active}
                    onChange={() => setPaymentMethod(value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "#F9F6F0" }}>
                      <Icon className="w-4 h-4 text-primary" />
                      {label}
                    </span>
                    <p className="text-[11px] mt-1" style={{ color: "rgba(249,246,240,0.4)" }}>{sub}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </Step>

        {/* Step 4 — Consent */}
        <Step number={4} title="Съгласие & именни дни">
          <div className="flex flex-col gap-4">
            {[
              {
                id: "gdpr",
                checked: gdprConsent,
                onChange: (v: boolean) => setGdprConsent(v),
                label: "Съгласен/на съм с обработката на личните ми данни за целите на поръчката. *",
              },
              {
                id: "nameday",
                checked: nameDayConsent,
                onChange: (v: boolean) => setNameDayConsent(v),
                label: "Желая да получавам напомняния за именни дни в Viber (opt-in).",
              },
            ].map(({ id, checked, onChange, label }) => (
              <label key={id} className="flex items-start gap-3 cursor-pointer">
                <div
                  className="w-5 h-5 rounded-md mt-0.5 shrink-0 flex items-center justify-center transition-all"
                  style={{
                    background: checked ? "#C5A059" : "transparent",
                    border: `1.5px solid ${checked ? "#C5A059" : "rgba(197,160,89,0.3)"}`,
                  }}
                  onClick={() => onChange(!checked)}
                >
                  {checked && <Check className="w-3 h-3" style={{ color: "#1A1A1A" }} />}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked)}
                  required={id === "gdpr"}
                />
                <span className="text-xs leading-relaxed" style={{ color: "rgba(249,246,240,0.5)" }}>
                  {label}
                </span>
              </label>
            ))}

            <SaveOccasionBlock customerPhone={form.customer_phone} />
          </div>
        </Step>

        {/* Error */}
        {error && (
          <div
            className="flex items-start gap-2 p-4 rounded-xl text-xs"
            style={{ background: "rgba(122,29,29,0.4)", border: "1px solid rgba(122,29,29,0.6)", color: "#F9F6F0" }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Legal note */}
        <p className="text-center text-[10px] px-2" style={{ color: "rgba(249,246,240,0.2)" }}>
          1 EUR = 1,95583 BGN · Двойно показване до 08.08.2026
        </p>
      </form>

      {/* ── Fixed bottom CTA ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 py-4"
        style={{
          background: "rgba(10,9,7,0.97)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(197,160,89,0.12)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs" style={{ color: "rgba(249,246,240,0.45)" }}>Общо:</span>
          <DualPrice priceEur={totalEur} layout="inline" />
        </div>

        <button
          type="submit"
          form=""
          onClick={handleSubmit as unknown as React.MouseEventHandler}
          disabled={!gdprConsent || loading}
          className="w-full py-4 rounded-2xl font-semibold tracking-wider text-sm transition-all disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #C5A059 0%, #A8853E 100%)",
            color: "#1A1A1A",
            boxShadow: "0 4px 20px rgba(197,160,89,0.3)",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Обработка...
            </span>
          ) : paymentMethod === "card" ? (
            "Продължи към плащане →"
          ) : (
            "Потвърди поръчката →"
          )}
        </button>
      </div>
    </div>
  );
}
