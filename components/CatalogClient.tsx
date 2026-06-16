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
    <Link href={`/product/${product.id}`} className="block group">
      <div className="bloom-card rounded-2xl overflow-hidden flex flex-col h-full">
        {/* ── Image area ── */}
        <div className="relative overflow-hidden" style={{ aspectRatio: "4/5", background: "#F5E4E5" }}>
          {product.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.image_url}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="absolute"
                style={{
                  width: 200, height: 200, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(168,50,74,0.10) 0%, transparent 65%)",
                  left: "50%", top: "50%", transform: "translate(-50%, -50%)",
                }}
              />
              <span
                className="font-serif select-none transition-transform duration-500 group-hover:scale-110"
                style={{ fontSize: 56, color: "#A8324A", opacity: 0.45 }}
              >
                ✿
              </span>
            </div>
          )}

          {product.tag && (
            <span
              className="absolute top-3 left-3 text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-full font-medium"
              style={{
                background: "rgba(255,255,255,0.92)",
                color: "#A8324A",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 10px rgba(122,39,56,0.10)",
              }}
            >
              {product.tag}
            </span>
          )}

          {/* hover quick-shop hint */}
          <div
            className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 text-center py-2 rounded-full text-[11px] font-semibold tracking-wider uppercase"
            style={{ background: "#A8324A", color: "#FFFFFF", boxShadow: "0 4px 16px rgba(168,50,74,0.30)" }}
          >
            Виж букета
          </div>
        </div>

        {/* ── Info area ── */}
        <div className="flex flex-col flex-1 px-4 pt-3.5 pb-4 gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-serif text-[15px] font-semibold leading-snug line-clamp-1" style={{ color: "#2B2220" }}>
              {product.title}
            </h3>
            <span className="text-[10px] shrink-0" style={{ color: "#B7A8A1" }}>
              {product.flower_count} бр.
            </span>
          </div>

          {product.description && (
            <p className="text-[11.5px] leading-relaxed line-clamp-2" style={{ color: "#9B8B84" }}>
              {product.description}
            </p>
          )}

          <div className="mt-auto pt-2">
            <DualPrice priceEur={product.price_eur} layout="inline" />
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
        className="sticky z-30 py-4"
        style={{
          top: 61,
          background: "rgba(251,246,243,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #ECDFD9",
        }}
      >
        <div className="flex gap-2 px-4 max-w-6xl mx-auto overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const isActive = cat === active;
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className="shrink-0 text-[11px] tracking-wider px-4 py-1.5 rounded-full cursor-pointer transition-all whitespace-nowrap"
                style={
                  isActive
                    ? { background: "#A8324A", border: "1px solid #A8324A", color: "#FFFFFF" }
                    : { background: "#FFFFFF", border: "1px solid #ECDFD9", color: "#9B8B84" }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Product grid ── */}
      <section className="px-4 py-8 pb-28 md:pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6 px-1">
            <h2 className="font-serif text-xl font-semibold" style={{ color: "#2B2220" }}>
              Нашата селекция
            </h2>
            <span className="h-px flex-1" style={{ background: "#ECDFD9" }} />
            <span className="text-[11px]" style={{ color: "#A8324A" }}>
              {visible.length} букета
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {!visible.length && (
            <p className="text-center text-sm py-10" style={{ color: "#9B8B84" }}>
              Няма букети в тази категория.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
