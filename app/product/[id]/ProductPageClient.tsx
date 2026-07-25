"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { DualPrice } from "@/components/DualPrice";
import { useCart } from "@/contexts/CartContext";
import type { CatalogProduct } from "@/components/CatalogClient";

/* Accordion section (Care instructions, Delivery info etc.) */
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #ECDFD9" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left text-xs tracking-widest uppercase transition-colors"
        style={{ color: open ? "#A8324A" : "#9B8B84" }}
      >
        {title}
        <span className="text-lg leading-none" style={{ color: "#A8324A" }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="pb-4 text-sm leading-relaxed" style={{ color: "#6E5F59" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function ProductPageClient({ product, related }: { product: CatalogProduct; related: CatalogProduct[] }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        title: product.title,
        price_eur: product.price_eur,
        flower_count: product.flower_count,
        image_url: product.image_url,
        tag: product.tag,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FBF6F3" }}>

      {/* ── Header space ── */}
      <div className="h-16" />

      {/* ── Back button ── */}
      <div className="px-4 pt-4 pb-2 max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs tracking-wider uppercase rounded-full px-4 py-2 transition-colors"
          style={{ border: "1px solid #ECDFD9", color: "#6E5F59", background: "#FFFFFF" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Назад към магазина
        </Link>
      </div>

      <div className="max-w-5xl mx-auto w-full md:grid md:grid-cols-2 md:gap-8 md:px-4 md:pt-2">
        {/* ── Product image ── */}
        <div className="relative w-full md:rounded-3xl md:overflow-hidden" style={{ aspectRatio: "4/5", maxHeight: 540, background: "#F5E4E5" }}>
          {product.tag && (
            <span
              className="absolute top-4 left-4 z-10 text-[10px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.92)", color: "#A8324A", backdropFilter: "blur(8px)" }}
            >
              {product.tag}
            </span>
          )}

          {product.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-serif select-none" style={{ fontSize: 96, color: "#A8324A", opacity: 0.35 }}>
                ✿
              </span>
            </div>
          )}
        </div>

        {/* ── Product info ── */}
        <div className="flex flex-col px-4 pt-5 pb-32 w-full">

          {/* Title + stems */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="font-serif text-2xl md:text-3xl font-semibold leading-snug" style={{ color: "#2B2220" }}>
              {product.title}
            </h1>
            <span
              className="shrink-0 text-[10px] mt-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "#F5E4E5", color: "#A8324A" }}
            >
              {product.flower_count} стъбла
            </span>
          </div>

          {/* Price */}
          <div className="mb-5">
            <DualPrice priceEur={product.price_eur} layout="inline" className="text-lg" />
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#6E5F59" }}>
              {product.description}
            </p>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {[
              { icon: "🚗", title: "Доставка до 2 часа", body: "SLA гаранция в целия Бургас" },
              { icon: "📸", title: "Фото потвърждение", body: "Снимка от момента на връчване" },
              { icon: "💌", title: "Картичка с послание", body: "Безплатна към всяка поръчка" },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "#FFFFFF", border: "1px solid #ECDFD9" }}
              >
                <span className="text-lg">{icon}</span>
                <div>
                  <p className="text-[12px] font-semibold tracking-wide" style={{ color: "#A8324A" }}>{title}</p>
                  <p className="text-[11px]" style={{ color: "#9B8B84" }}>{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Accordion */}
          <div className="mb-8">
            <Accordion title="Информация за доставката">
              Доставяме в рамките на 2 часа след потвърждение на плащането. Зона Център и Север — 5 EUR.
              Зона Меден Рудник — 8 EUR. Пикови дни (8 март, 14 февруари) — резервирайте предварително.
            </Accordion>
            <Accordion title="Грижа за букета">
              Подрежете стъблата под ъгъл 45° и поставете в прясна вода. Сменяйте водата ежедневно.
              Пазете от пряка слънчева светлина и горещина. Може да добавите цветна храна.
            </Accordion>
            <Accordion title="Правило за броя стъбла">
              По българска традиция букетите съдържат нечетен брой стъбла. Четен брой се използва само
              за погребения и опелета. Kiss My Flowers спазва тази традиция строго.
            </Accordion>
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div>
              <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: "#2B2220" }}>
                Може да харесате и
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {related.map((r) => (
                  <Link key={r.id} href={`/product/${r.id}`} className="group">
                    <div className="bloom-card rounded-xl overflow-hidden">
                      <div className="relative" style={{ aspectRatio: "4/5", background: "#F5E4E5" }}>
                        {r.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={r.image_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-serif text-4xl" style={{ color: "#A8324A", opacity: 0.35 }}>✿</span>
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="font-serif text-xs font-semibold line-clamp-1" style={{ color: "#2B2220" }}>{r.title}</p>
                        <p className="text-[11px] mt-0.5 font-semibold" style={{ color: "#A8324A" }}>{r.price_eur} EUR</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky bottom bar: qty + Add to cart ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-4"
        style={{
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid #ECDFD9",
          paddingTop: 12,
          paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {/* Qty stepper */}
          <div
            className="flex items-center gap-0 rounded-full overflow-hidden shrink-0"
            style={{ border: "1px solid #ECDFD9" }}
          >
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-11 h-11 flex items-center justify-center transition-colors active:opacity-60"
              style={{ color: "#A8324A" }}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold" style={{ color: "#2B2220" }}>
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-11 h-11 flex items-center justify-center transition-colors active:opacity-60"
              style={{ color: "#A8324A" }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-sm font-semibold tracking-wider transition-all active:scale-[0.98]"
            style={{
              background: added ? "#5C8A5E" : "linear-gradient(135deg, #C24B5E 0%, #8E2438 100%)",
              color: "#FFFFFF",
              boxShadow: "0 6px 20px rgba(168,50,74,0.28)",
            }}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                Добавено
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                Добави в кошницата
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
