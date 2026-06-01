import { ParallaxHero } from "@/components/ParallaxHero";
import { BottomNav } from "@/components/BottomNav";
import { SiteHeader } from "@/components/SiteHeader";
import { CatalogClient, type CatalogProduct } from "@/components/CatalogClient";
import { isDualPriceRequired } from "@/lib/constants";
import { Clock, MapPin, Shield, Camera } from "lucide-react";

/* ─── Types ──────────────────────────────────────────── */
type Product = CatalogProduct;

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

/* ─── Page ───────────────────────────────────────────── */
export default async function StorefrontPage() {
  const products = await fetchProducts();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0A0907" }}>

      <SiteHeader />

      <main className="flex-1">

        {/* ── Hero with parallax ── */}
        <ParallaxHero />

        {/* ── Catalog with working category filter ── */}
        <CatalogClient products={products} />

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
