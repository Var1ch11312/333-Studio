"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDualPrice, isDualPriceRequired, isOddFlowerCount } from "@/lib/constants";
import { ArrowLeft, CreditCard, Banknote, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { PaymentMethod } from "@/types";

const DELIVERY_FEE_EUR = 5;

/* Placeholder — will be replaced with cart state / Supabase query */
const MOCK_ORDER = {
  title: "Розова Елегантност",
  price_eur: 45,
  flower_count: 25,
};

export default function CheckoutPage() {
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    delivery_address: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [nameDayConsent, setNameDayConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalEur = MOCK_ORDER.price_eur + DELIVERY_FEE_EUR;
  const { eur: totalEurFmt, bgn: totalBgnFmt } = formatDualPrice(totalEur);
  const showDual = isDualPriceRequired();

  /* Validate odd flower count — cultural guard */
  const flowerCountValid = isOddFlowerCount(MOCK_ORDER.flower_count);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdprConsent) return;
    setLoading(true);
    /* TODO Sprint 2: POST to /api/orders → Stripe Checkout / COD flow */
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    alert("Поръчката е приета! (Stripe/COD интеграция — Sprint 2)");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <span className="font-serif text-xl font-semibold tracking-wider text-primary">
            AMUR
          </span>
          <span className="text-muted-foreground text-sm">/ Оформяне на поръчка</span>
        </div>
      </header>

      <main className="flex-1 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* ── Order form (left) ── */}
          <div className="md:col-span-3 flex flex-col gap-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Данни за контакт</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">
                      Вашето име *
                    </label>
                    <Input
                      required
                      value={form.customer_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, customer_name: e.target.value }))
                      }
                      placeholder="Иван Иванов"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">
                      Телефон (Viber/SMS) *
                    </label>
                    <Input
                      required
                      type="tel"
                      value={form.customer_phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, customer_phone: e.target.value }))
                      }
                      placeholder="+359 88 888 8888"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Адрес за доставка</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">
                      Пълен адрес в Бургас *
                    </label>
                    <Input
                      required
                      value={form.delivery_address}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          delivery_address: e.target.value,
                        }))
                      }
                      placeholder="ул. Александровска 1, Бургас"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">
                      Бележка към поръчката
                    </label>
                    <Input
                      value={form.notes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      placeholder="Поздравителен текст, специфики..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Метод на плащане</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="mt-0.5 accent-[#C5A059]"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <CreditCard className="w-4 h-4 text-primary" />
                        Карта / Apple Pay / Google Pay
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Сигурно плащане чрез Stripe
                      </span>
                    </div>
                  </label>

                  <div className="border-t border-border" />

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="mt-0.5 accent-[#C5A059]"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Banknote className="w-4 h-4 text-primary" />
                        Наложен платеж (при доставка)
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Плащане в евро (€) при получаване
                      </span>
                    </div>
                  </label>
                </CardContent>
              </Card>

              {/* GDPR consent */}
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gdprConsent}
                    onChange={(e) => setGdprConsent(e.target.checked)}
                    className="mt-0.5 accent-[#C5A059]"
                    required
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Съгласен съм с обработката на личните ми данни за целите на
                    доставката. *
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nameDayConsent}
                    onChange={(e) => setNameDayConsent(e.target.checked)}
                    className="mt-0.5 accent-[#C5A059]"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Желая да получавам напомняния за именни дни и специални поводи
                    (по избор — GDPR opt-in).
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={!gdprConsent || loading}
                className="w-full"
              >
                {loading ? "Изпращане..." : "Потвърди поръчката"}
              </Button>
            </form>
          </div>

          {/* ── Order summary (right) ── */}
          <div className="md:col-span-2">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Резюме</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* Flower count validation */}
                {!flowerCountValid && (
                  <div className="flex items-start gap-2 p-3 rounded border border-destructive text-xs text-destructive-foreground bg-destructive">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Броят на стъблата трябва да бъде нечетен. Четни букети са
                      знак за съболезнования в България.
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{MOCK_ORDER.title}</span>
                    <span>{formatDualPrice(MOCK_ORDER.price_eur).eur}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Доставка</span>
                    <span>{formatDualPrice(DELIVERY_FEE_EUR).eur}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-semibold">
                    <span>Общо</span>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-primary">{totalEurFmt}</span>
                      {showDual && (
                        <span className="text-xs text-muted-foreground font-normal">
                          {totalBgnFmt}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>⏱</span>
                    <span>Доставка до 2 часа + протокол „Бели ръкавици"</span>
                  </div>
                </div>

                {showDual && (
                  <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-border pt-3">
                    1 EUR = 1,95583 BGN · Задължително двойно показване до 08.08.2026
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
