"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DualPrice } from "@/components/DualPrice";

export type CatalogProduct = {
  id: string;
  title: string;
  description: string | null;
  price_eur: number;
  flower_count: number;
  tag: string | null;
  image_url: string | null;
};

const ALL = "Всички";

/* ─── Product card ───────────────────────────────────── */
function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <Link href={`/checkout?product=${product.id}`} className="block group">
      <div
        className="rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-500 group-hover:-translate-y-1"
        style={{
          background: "#100C08",
          border: "1px solid rgba(197,160,89,0.09)",
          boxShadow: "0 0 0 0 rgba(197,160,89,0)",
          transition: "transform 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
        }}
      >
        {/* ── Image area: thick-glass inner glow ── */}
        <div className="relative overflow-hidden" style={{ height: 224, background: "#080604" }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 90% 55% at 50% 100%, rgba(175,95,20,0.26) 0%, rgba(12,8,4,0.92) 52%, #060402 100%)",
              zIndex: 1,
            }}
          />

          {product.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.image_url}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ filter: "brightness(0.78) saturate(0.9) sepia(0.06)", zIndex: 0 }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
              <div
                className="absolute"
                style={{
                  width: 180, height: 180,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(197,130,40,0.09) 0%, transparent 65%)",
                  left: "50%", top: "50%",
                  transform: "translate(-50%, -52%)",
                }}
              />
              <div
                className="transition-transform duration-500 group-hover:scale-110"
                style={{
                  width: 72, height: 72,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(197,155,75,0.2) 0%, rgba(160,90,20,0.07) 55%, transparent 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: -8,
                }}
              >
                <span
                  className="font-serif select-none"
                  style={{
                    fontSize: 40,
                    color: "#C5A059",
                    opacity: 0.55,
                    textShadow: "0 0 18px rgba(197,160,89,0.45), 0 0 50px rgba(180,110,30,0.18)",
                  }}
                >
                  ✿
                </span>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: 80,
                  background: "radial-gradient(ellipse 65% 100% at 50% 100%, rgba(150,80,15,0.2) 0%, transparent 100%)",
                }}
              />
            </div>
          )}

          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: 72,
              background: "linear-gradient(to bottom, rgba(255,255,255,0.03) 0%, transparent 100%)",
              zIndex: 2,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: 64,
              background: "linear-gradient(to top, #100C08 0%, transparent 100%)",
              zIndex: 2,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-600"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 50% 45%, rgba(197,130,50,0.07) 0%, transparent 70%)",
              zIndex: 3,
            }}
          />

          {product.tag && (
            <span
              className="absolute top-3 left-3 text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-sm font-medium"
              style={{
                background: "rgba(8,5,2,0.78)",
                border: "1px solid rgba(197,160,89,0.28)",
                color: "#C5A059",
                backdropFilter: "blur(12px)",
                zIndex: 4,
              }}
            >
              {product.tag}
            </span>
          )}

          <span
            className="absolute bottom-2.5 right-3 text-[10px]"
            style={{ color: "rgba(249,246,240,0.35)", zIndex: 4 }}
          >
            {product.flower_count} стъбла
          </span>
        </div>

        {/* ── Info area ── */}
        <div
          className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-2.5"
          style={{ background: "linear-gradient(to bottom, #100C08 0%, #0D0A06 100%)" }}
        >
          <h3
            className="font-serif text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: "#EDE5D5" }}
          >
            {product.title}
          </h3>

          {product.description && (
            <p
              className="text-[11px] leading-relaxed line-clamp-2"
              style={{ color: "rgba(249,246,240,0.30)" }}
            >
              {product.description}
            </p>
          )}

          <div className="mt-auto pt-1">
            <DualPrice priceEur={product.price_eur} layout="stacked" />
          </div>

          <div
            className="mt-1.5 w-full text-center py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase"
            style={{
              background: "linear-gradient(135deg, #BF9A50 0%, #96772F 100%)",
              color: "#170F04",
              boxShadow: "0 2px 16px rgba(197,160,89,0.16)",
              transition: "box-shadow 0.3s ease, opacity 0.3s ease",
            }}
          >
            Поръчай
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Catalog with category filter ───────────────────── */
export function CatalogClient({ products }: { products: CatalogProduct[] }) {
  const [active, setActive] = useState<string>(ALL);

  // Categories are derived from the actual product tags so the chips
  // always reflect what is in the catalog (no dead filters).
  const categories = useMemo(() => {
    const tags = Array.from(
      new Set(products.map((p) => p.tag).filter((t): t is string => !!t))
    );
    return [ALL, ...tags];
  }, [products]);

  const visible = useMemo(
    () => (active === ALL ? products : products.filter((p) => p.tag === active)),
    [products, active]
  );

  return (
    <>
      {/* ── Category filter bar ── */}
      <section
        id="catalog"
        className="sticky z-30 py-4 overflow-hidden"
        style={{
          top: 65,
          background: "rgba(10,9,7,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(197,160,89,0.08)",
        }}
      >
        <div className="flex gap-2 px-4 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {categories.map((cat) => {
            const isActive = cat === active;
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className="shrink-0 text-[11px] tracking-wider px-4 py-1.5 rounded-full cursor-pointer transition-all whitespace-nowrap"
                style={
                  isActive
                    ? { background: "rgba(197,160,89,0.15)", border: "1px solid rgba(197,160,89,0.45)", color: "#C5A059" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(249,246,240,0.45)" }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Product grid ── */}
      <section className="px-3 py-6 pb-28 md:pb-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-5 px-1">
            <h2 className="font-serif text-lg font-semibold" style={{ color: "#F9F6F0" }}>
              Нашата селекция
            </h2>
            <span className="h-px flex-1" style={{ background: "rgba(197,160,89,0.12)" }} />
            <span className="text-[11px]" style={{ color: "rgba(197,160,89,0.5)" }}>
              {visible.length} букета
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {!visible.length && (
            <p className="text-center text-sm py-10" style={{ color: "rgba(249,246,240,0.4)" }}>
              Няма букети в тази категория.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
