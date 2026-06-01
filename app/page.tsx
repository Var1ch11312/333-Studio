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

          {/* Ambient bottom glow — light barely through thick glass */}
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
            /* Candle-glow placeholder */
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
              {/* Outer halo */}
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
              {/* Inner glow orb with ✿ */}
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
              {/* Floor light pool */}
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: 80,
                  background: "radial-gradient(ellipse 65% 100% at 50% 100%, rgba(150,80,15,0.2) 0%, transparent 100%)",
                }}
              />
            </div>
          )}

          {/* Top glass sheen — specular surface highlight */}
          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: 72,
              background: "linear-gradient(to bottom, rgba(255,255,255,0.03) 0%, transparent 100%)",
              zIndex: 2,
            }}
          />

          {/* Bottom blend into card body */}
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: 64,
              background: "linear-gradient(to top, #100C08 0%, transparent 100%)",
              zIndex: 2,
            }}
          />

          {/* Hover inner bloom */}
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-600"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 50% 45%, rgba(197,130,50,0.07) 0%, transparent 70%)",
              zIndex: 3,
            }}
          />

          {/* Tag badge */}
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

          {/* Stem count */}
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
