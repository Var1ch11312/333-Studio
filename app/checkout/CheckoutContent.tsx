"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDualPrice, isDualPriceRequired, isOddFlowerCount } from "@/lib/constants";
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { PaymentMethod } from "@/types";

const DELIVERY_FEE_EUR = 5;

const CATALOG: Record<
  string,
  { title: string; price_eur: number; flower_count: number }
> = {
  "1": { title: "Розова Елегантност", price_eur: 45, flower_count: 25 },
  "2": { title: "Алена Страст", price_eur: 55, flower_count: 21 },
  "3": { title: "Бяла Приказка", price_eur: 65, flower_count: 17 },
  "4": { title: "Пролетна Радост", price_eur: 39, flower_count: 15 },
  "5": { title: "Корпоративен Шик", price_eur: 110, flower_count: 51 },
  "6": { title: "Изненада за Именник", price_eur: 35, flower_count: 11 },
};

export function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const productId = searchParams.get("product") ?? "1";
  const product = CATALOG[productId] ?? CATALOG["1"];

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
  const [error, setError] = useState<string | null>(null);

  const totalEur = product.price_eur + DELIVERY_FEE_EUR;
  const { eur: totalEurFmt, bgn: totalBgnFmt } = formatDualPrice(totalEur);
  const showDual = isDualPriceRequired();
  const flowerCountValid = isOddFlowerCount(product.flower_count);

  useEffect(() => {
    if (error) setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdprConsent || !flowerCountValid) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          delivery_address: form.delivery_address,
          notes: form.notes,
          payment_method: paymentMethod,
          nameday_optin: nameDayConsent,
          items: [
            {
              product_id: productId,
              title: product.title,
              quantity: 1,
              unit_price_eur: product.price_eur,
              flower_count: product.flower_count,
            },
          ],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Грешка при създаване на поръчката");
        return;
      }

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
    <div className="min-h-screen flex flex-col">
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
          <span className="text-muted-foreground text-sm">
            / Оформяне на поръчка
          </span>
        </div>
      </header>

      <main className="flex-1 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* ── Form ── */}
          <div className="md:col-span-3 flex flex-col gap-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
                        setForm((f) => ({
                          ...f,
                          customer_phone: e.target.value,
                        }))
                      }
                      placeholder="+359 88 888 8888"
                    />
                  </div>
                </CardContent>
              </Card>

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
                    Съгласен/на съм с обработката на личните ми данни за
                    целите на поръчката. *
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
                    Желая да получавам напомняния за именни дни (opt-in).
                  </span>
                </label>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded border border-destructive text-destructive-foreground bg-destructive text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={!gdprConsent || !flowerCountValid || loading}
                className="w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Обработка...
                  </span>
                ) : paymentMethod === "card" ? (
                  "Продължи към плащане"
                ) : (
                  "Потвърди поръчката"
                )}
              </Button>
            </form>
          </div>

          {/* ── Summary ── */}
          <div className="md:col-span-2">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Резюме</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {!flowerCountValid && (
                  <div className="flex items-start gap-2 p-3 rounded border border-destructive text-destructive-foreground bg-destructive text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Нечетен брой стъбла е задължителен — четни букети са
                      знак за съболезнования.
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {product.title}
                    </span>
                    <span>{formatDualPrice(product.price_eur).eur}</span>
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

                <div className="border-t border-border pt-3 text-xs text-muted-foreground flex items-center gap-2">
                  <span>⏱</span>
                  <span>Доставка до 2 часа + протокол „Бели ръкавици"</span>
                </div>

                {showDual && (
                  <p className="text-[10px] text-muted-foreground border-t border-border pt-3 leading-relaxed">
                    1 EUR = 1,95583 BGN · Задължително до 08.08.2026
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
