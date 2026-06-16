"use client";

import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { DualPrice } from "@/components/DualPrice";
import { SiteHeader } from "@/components/SiteHeader";
import { BottomNav } from "@/components/BottomNav";

const DELIVERY_FEE = 5;

export function CartPageClient() {
  const { items, totalEur, updateQty, removeItem } = useCart();

  const grandTotal = totalEur + (items.length ? DELIVERY_FEE : 0);

  /* Build checkout URL with first item id for backward-compat */
  const checkoutHref = items.length
    ? `/checkout?product=${items[0].id}&from_cart=1`
    : "/checkout";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FBF6F3" }}>
      <SiteHeader />
      <div className="h-16" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-40">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs tracking-wider uppercase rounded-full px-4 py-2 mb-6 transition-colors"
          style={{ border: "1px solid #ECDFD9", color: "#6E5F59", background: "#FFFFFF" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Продължи пазаруването
        </Link>

        <h1 className="font-serif text-2xl font-semibold mb-6" style={{ color: "#2B2220" }}>
          Кошница
        </h1>

        {!items.length ? (
          <div className="flex flex-col items-center gap-6 py-16">
            <ShoppingBag className="w-12 h-12" style={{ color: "#EFCBD0" }} />
            <p className="text-sm" style={{ color: "#9B8B84" }}>
              Кошницата е празна
            </p>
            <Link
              href="/"
              className="text-xs tracking-wider uppercase rounded-full px-6 py-2.5"
              style={{ background: "linear-gradient(135deg, #C24B5E 0%, #8E2438 100%)", color: "#FFFFFF" }}
            >
              Разгледай колекцията
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-2xl p-4"
                style={{ background: "#FFFFFF", border: "1px solid #ECDFD9" }}
              >
                {/* Thumbnail */}
                <div
                  className="shrink-0 rounded-xl overflow-hidden"
                  style={{ width: 72, height: 72, background: "#F5E4E5" }}
                >
                  {item.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-serif text-3xl" style={{ color: "#A8324A", opacity: 0.35 }}>✿</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <p className="font-serif text-sm font-semibold truncate" style={{ color: "#2B2220" }}>
                    {item.title}
                  </p>
                  <p className="text-[11px]" style={{ color: "#A8324A" }}>
                    {item.flower_count} стъбла
                  </p>
                  <DualPrice priceEur={item.price_eur * item.quantity} layout="inline" />
                </div>

                {/* Qty + delete */}
                <div className="flex flex-col items-end justify-between shrink-0">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 transition-opacity hover:opacity-60"
                    style={{ color: "#C9B8B0" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div
                    className="flex items-center rounded-full overflow-hidden"
                    style={{ border: "1px solid #ECDFD9" }}
                  >
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center"
                      style={{ color: "#A8324A" }}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold" style={{ color: "#2B2220" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center"
                      style={{ color: "#A8324A" }}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Order summary */}
            <div
              className="rounded-2xl p-4 mt-2"
              style={{ background: "#FFFFFF", border: "1px solid #ECDFD9" }}
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm" style={{ color: "#6E5F59" }}>
                  <span>Букети</span>
                  <span>{totalEur.toFixed(2)} EUR</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: "#6E5F59" }}>
                  <span>Доставка</span>
                  <span>{DELIVERY_FEE} EUR</span>
                </div>
                <div
                  className="flex justify-between font-serif text-base font-semibold pt-2 mt-1"
                  style={{ borderTop: "1px solid #ECDFD9", color: "#2B2220" }}
                >
                  <span>Общо</span>
                  <DualPrice priceEur={grandTotal} layout="inline" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky checkout button */}
      {items.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 px-4"
          style={{
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid #ECDFD9",
            paddingTop: 12,
            paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
          }}
        >
          <div className="max-w-2xl mx-auto">
            <Link
              href={checkoutHref}
              className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold tracking-wider"
              style={{
                background: "linear-gradient(135deg, #C24B5E 0%, #8E2438 100%)",
                color: "#FFFFFF",
                boxShadow: "0 6px 20px rgba(168,50,74,0.28)",
              }}
            >
              Продължи към поръчката →
            </Link>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
