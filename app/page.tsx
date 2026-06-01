import { ParallaxHero } from "@/components/ParallaxHero";
import { BottomNav } from "@/components/BottomNav";
import { DualPrice } from "@/components/DualPrice";
import { isDualPriceRequired } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Shield, Camera } from "lucide-react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────── */
type Product = {
  id: string;
  title: string;
  description: string | null;
  price_eur: number;
  flower_count: number;
  tag: string | null;
  image_url: string | null;
};

/* ─── Fallback catalog ───────────────────────────────── */
const FALLBACK_PRODUCTS: Product[] = [
  { id: "1", title: "Розова Елегантност",  description: "25 бели и розови рози, ароматни лилии, gypsophila",        price_eur: 45,  flower_count: 25, tag: "Бестселър",  image_url: null },
  { id: "2", title: "Алена Страст",        description: "21 червени рози Ecuador, бабий лен, декоративна зеленина", price_eur: 55,  flower_count: 21, tag: null,         image_url: null },
  { id: "3", title: "Бяла Приказка",       description: "17 бели рози, орхидея Dendrobium, еустома",                price_eur: 65,  flower_count: 17, tag: "Премиум",    image_url: null },
  { id: "4", title: "Пролетна Радост",     description: "Сезонни цветя — лалета, нарциси, хиацинти",               price_eur: 39,  flower_count: 15, tag: null,         image_url: null },
  { id: "5", title: "Корпоративен Шик",    description: "51 смесени рози, монобукет с луксозна опаковка",           price_eur: 110, flower_count: 51, tag: "B2B",        image_url: null },
  { id: "6", title: "Изненада за Именник", description: "Персонализиран букет — свободен избор на флориста",        price_eur: 35,  flower_count: 11, tag: "Именен ден", image_url: null },
];

async function fetchProducts(): Promise<Product[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return FALLBACK_PRODUCTS;
    const res = await fetch(
      `${url}/rest/v1/products?select=id,title,description,price_eur,flower_count,tag,image_url&active=eq.true&order=price_eur.asc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 60 } }
    );
    if (!res.ok) return FALLBACK_PRODUCTS;
    const data: Product[] = await res.json();
    return data.length ? data : FALLBACK_PRODUCTS;
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

/* ─── Trust pillars ──────────────────────────────────── */
const TRUST = [
  { icon: Clock,   title: "Доставка до 2 часа",           body: "SLA гаранция в целия Бургас. При закъснение — отстъпка 20%." },
  { icon: Shield,  title: 'Протокол „Бели ръкавици"',     body: "Сургучен печат, скрипт на връчване, фотодокументация." },
  { icon: Camera,  title: "Фото потвърждение",            body: "Снимка от момента на връчване директно в Viber / SMS." },
  { icon: MapPin,  title: "Само Бургас",                  body: "Хипер-локален фокус = перфектно изпълнение, всеки път." },
];

/* ─── Category chips ─────────────────────────────────── */
const CATEGORIES = ["Всички", "Рози", "Бели рози", "Смесени", "Именен ден", "Премиум", "B2B"];

/* ─── Product card ───────────────────────────────────── */
function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/checkout?product=${product.id}`} className="block group">
      <div className="velvet-card rounded-xl overflow-hidden flex flex-col h-full">

        {/* Image area */}
        <div
          className="relative overflow-hidden"
          style={{
            height: 200,
            background: "linear-gradient(150deg, #1E1A14 0%, #252018 50%, #1A1710 100%)",
          }}
        >
          {product.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <>
              {/* Elegant placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-serif select-none transition-transform duration-500 group-hover:scale-110"
                  style={{ fontSize: 90, color: "#C5A059", opacity: 0.13 }}
                >
                  ✿
                </span>
              </div>
              {/* Gold shimmer sweep on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 20%, rgba(197,160,89,0.05) 50%, transparent 80%)",
                }}
              />
            </>
          )}

          {/* Tag badge */}
          {product.tag && (
            <span
              className="absolute top-3 left-3 text-[10px] tracking-widest uppercase px-2 py-1 rounded-sm font-medium"
              style={{
                background: "rgba(197,160,89,0.15)",
                border: "1px solid rgba(197,160,89,0.4)",
                color: "#C5A059",
                backdropFilter: "blur(8px)",
              }}
            >
              {product.tag}
            </span>
          )}

          {/* Stem count */}
          <span
            className="absolute bottom-3 right-3 text-[10px]"
            style={{ color: "rgba(249,246,240,0.35)" }}
          >
            {product.flower_count} стъбла
          </span>
        </div>

        {/* Info area */}
        <div className="flex flex-col flex-1 p-4 gap-3">
          <h3
            className="font-serif text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: "#F9F6F0" }}
          >
            {product.title}
          </h3>

          {product.description && (
            <p
              className="text-[11px] leading-relaxed line-clamp-2"
              style={{ color: "rgba(249,246,240,0.38)" }}
            >
              {product.description}
            </p>
          )}

          <div className="mt-auto pt-1">
            <DualPrice priceEur={product.price_eur} layout="stacked" />
          </div>

          {/* Order button */}
          <div
            className="mt-1 w-full text-center py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #C5A059 0%, #A8853E 100%)",
              color: "#1A1A1A",
              boxShadow: "0 2px 12px rgba(197,160,89,0.2)",
            }}
          >
            Поръчай
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default async function StorefrontPage() {
  const products = await fetchProducts();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0A0907" }}>

      {/* ── Header ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(10,9,7,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(197,160,89,0.1)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-none">
            <span className="font-serif text-2xl font-bold tracking-widest text-primary">
              AMUR
            </span>
            <span
              className="text-[9px] tracking-[0.35em] uppercase"
              style={{ color: "rgba(197,160,89,0.5)" }}
            >
              Бургас · Цветя с характер
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs tracking-wider text-muted-foreground uppercase">
            <a href="#catalog" className="hover:text-foreground transition-colors">
              Каталог
            </a>
            <a href="#about" className="hover:text-foreground transition-colors">
              За нас
            </a>
          </nav>

          <Link href="/checkout">
            <Button size="sm" className="text-xs tracking-wider">
              Поръчай
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero with parallax ── */}
        <ParallaxHero />

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
            {CATEGORIES.map((cat, i) => (
              <span
                key={cat}
                className="shrink-0 text-[11px] tracking-wider px-4 py-1.5 rounded-full cursor-pointer transition-all whitespace-nowrap"
                style={
                  i === 0
                    ? { background: "rgba(197,160,89,0.15)", border: "1px solid rgba(197,160,89,0.45)", color: "#C5A059" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(249,246,240,0.45)" }
                }
              >
                {cat}
              </span>
            ))}
          </div>
        </section>

        {/* ── Product grid ── */}
        <section className="px-3 py-6 pb-28 md:pb-10">
          <div className="max-w-6xl mx-auto">

            {/* Section title */}
            <div className="flex items-center gap-4 mb-5 px-1">
              <h2 className="font-serif text-lg font-semibold" style={{ color: "#F9F6F0" }}>
                Нашата селекция
              </h2>
              <span className="h-px flex-1" style={{ background: "rgba(197,160,89,0.12)" }} />
              <span className="text-[11px]" style={{ color: "rgba(197,160,89,0.5)" }}>
                {products.length} букета
              </span>
            </div>

            {/* 2-col on mobile, 3-col on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust section ── */}
        <section
          id="about"
          className="py-16 px-4"
          style={{ borderTop: "1px solid rgba(197,160,89,0.08)" }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p
                className="text-[11px] tracking-[0.45em] uppercase mb-2"
                style={{ color: "rgba(197,160,89,0.6)" }}
              >
                Нашата гаранция
              </p>
              <h2 className="font-serif text-2xl font-bold">Защо AMUR?</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TRUST.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="velvet-card rounded-xl p-5 flex flex-col gap-3"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: "rgba(197,160,89,0.1)",
                      border: "1px solid rgba(197,160,89,0.2)",
                    }}
                  >
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-serif text-sm font-semibold leading-snug">
                    {title}
                  </h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(249,246,240,0.45)" }}>
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Dual-price legal notice ── */}
        {isDualPriceRequired() && (
          <section
            className="py-5 px-4"
            style={{ borderTop: "1px solid rgba(197,160,89,0.06)" }}
          >
            <p
              className="max-w-6xl mx-auto text-center text-[10px] leading-relaxed"
              style={{ color: "rgba(249,246,240,0.25)" }}
            >
              Цените се показват едновременно в евро (EUR) и лева (BGN) по фиксиран курс
              1&nbsp;EUR&nbsp;=&nbsp;1,95583&nbsp;BGN съгласно Закона за въвеждане на еврото в
              България — в сила до 08.08.2026.
            </p>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer
        className="py-10 px-4 hidden md:block"
        style={{ borderTop: "1px solid rgba(197,160,89,0.08)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-serif text-sm text-primary font-semibold tracking-widest">
            AMUR.BG
          </span>
          <span style={{ color: "rgba(249,246,240,0.3)" }}>
            © {new Date().getFullYear()} AMUR.BG · Бургас, България
          </span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground transition-colors">
              Поверителност
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Условия
            </a>
          </div>
        </div>
      </footer>

      {/* ── Mobile bottom nav ── */}
      <BottomNav />
    </div>
  );
}
