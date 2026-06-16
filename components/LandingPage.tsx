"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Truck, Camera, Heart, Flower2 } from "lucide-react";
import { CatalogClient, type CatalogProduct } from "@/components/CatalogClient";
import { BottomNav } from "@/components/BottomNav";
import { useCart } from "@/contexts/CartContext";

// ── Design tokens: "Love & Romance" light theme ──────────────────────────────
const C = {
  bg:          "#FBF6F3",
  blush:       "#F5E4E5",
  blushDeep:   "#EFCBD0",
  rose:        "#A8324A",
  roseDeep:    "#7A2738",
  roseGrad:    "linear-gradient(135deg, #C24B5E 0%, #8E2438 100%)",
  ink:         "#2B2220",
  inkFade:     "#6E5F59",
  inkMuted:    "#9B8B84",
  border:      "#ECDFD9",
  white:       "#FFFFFF",
  serif:       "var(--font-playfair, 'Playfair Display', Georgia, serif)",
  sans:        "var(--font-inter, 'Inter', system-ui, sans-serif)",
};

// ── Floating Navbar ───────────────────────────────────────────────────────────
function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 72);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
      zIndex: 300, display: "flex", alignItems: "center", gap: 24,
      padding: "10px 14px 10px 22px", borderRadius: 9999, width: "min(94vw, 760px)",
      justifyContent: "space-between",
      transition: "background 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease",
      background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)",
      backdropFilter: "blur(22px) saturate(1.3)",
      border: `1px solid ${scrolled ? C.border : "rgba(236,223,217,0.6)"}`,
      boxShadow: scrolled ? "0 8px 36px rgba(122,39,56,0.10)" : "none",
      fontFamily: C.sans,
    }}>
      <span style={{ fontFamily: C.serif, fontWeight: 600, fontSize: 18, color: C.rose, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        Kiss My Flowers
      </span>

      <div style={{ display: "flex", gap: 22, alignItems: "center" }} className="hidden sm:flex">
        {[["Колекция", "#catalog"], ["За нас", "#about"], ["Как работи", "#protocol"]].map(([label, href]) => (
          <a key={label} href={href} style={{ color: C.inkFade, fontSize: 12, letterSpacing: "0.04em", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = C.rose; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = C.inkFade; }}>
            {label}
          </a>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/cart" style={{ position: "relative", color: C.rose, display: "flex" }}>
          <ShoppingBag size={18} strokeWidth={1.7} />
          {totalItems > 0 && (
            <span style={{ position: "absolute", top: -6, right: -6, background: C.rose, color: C.white, borderRadius: 9999, fontSize: 9, fontWeight: 800, width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {totalItems}
            </span>
          )}
        </Link>
        <a href="#catalog" style={{ background: C.roseGrad, color: C.white, padding: "8px 18px", borderRadius: 9999, fontSize: 12, fontWeight: 600, letterSpacing: "0.02em", textDecoration: "none", whiteSpace: "nowrap", transition: "transform 0.2s, box-shadow 0.2s" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.04)"; el.style.boxShadow = "0 6px 20px rgba(168,50,74,0.32)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = ""; }}>
          Поръчай
        </a>
      </div>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    (async () => {
      const { default: gsap } = await import("gsap");
      if (cancelled) return;
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(".lp-eyebrow",  { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.2)
          .fromTo(".lp-h1-line1", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0 }, 0.35)
          .fromTo(".lp-h1-line2", { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, 0.5)
          .fromTo(".lp-sub",      { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.75)
          .fromTo(".lp-hero-cta", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.9)
          .fromTo(".lp-hero-img", { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4 }, 0.1);
      }, ref);
    })();
    return () => { cancelled = true; ctx?.revert(); };
  }, []);

  return (
    <section ref={ref} style={{ position: "relative", overflow: "hidden", background: C.bg, paddingTop: 96 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(24px,5vw,48px)", display: "grid", gridTemplateColumns: "1fr", gap: 40, alignItems: "center" }} className="lp-hero-grid">
        {/* Text */}
        <div style={{ fontFamily: C.sans, maxWidth: 560 }}>
          <p className="lp-eyebrow" style={{ fontSize: 11, letterSpacing: "0.28em", color: C.rose, textTransform: "uppercase", marginBottom: 22, opacity: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Heart size={13} fill={C.rose} strokeWidth={0} /> Любов и романтика · Бургас
          </p>
          <h1 style={{ margin: 0, lineHeight: 1.02, letterSpacing: "-0.02em" }}>
            <span className="lp-h1-line1" style={{ display: "block", fontFamily: C.serif, fontWeight: 600, fontSize: "clamp(40px,6.5vw,76px)", color: C.ink, opacity: 0 }}>
              Кажи го с
            </span>
            <span className="lp-h1-line2" style={{ display: "block", fontFamily: C.serif, fontStyle: "italic", fontWeight: 600, fontSize: "clamp(44px,7vw,82px)", color: C.rose, lineHeight: 1.0, opacity: 0 }}>
              цветя.
            </span>
          </h1>

          <p className="lp-sub" style={{ marginTop: 24, fontSize: "clamp(15px,1.8vw,18px)", lineHeight: 1.6, color: C.inkFade, maxWidth: 440, opacity: 0 }}>
            Романтични букети от рози и божури, ръчно подбрани от нашите флористи.
            Доставка до вратата на любимия човек — за под 2 часа в целия Бургас.
          </p>

          <div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <a className="lp-hero-cta" href="#catalog" style={{ background: C.roseGrad, color: C.white, padding: "15px 36px", borderRadius: 9999, fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", textDecoration: "none", opacity: 0, boxShadow: "0 8px 28px rgba(168,50,74,0.26)", display: "inline-flex", alignItems: "center", gap: 8, transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.04)"; el.style.boxShadow = "0 12px 36px rgba(168,50,74,0.38)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = "0 8px 28px rgba(168,50,74,0.26)"; }}>
              Разгледай колекцията →
            </a>
            <a className="lp-hero-cta" href="#about" style={{ padding: "15px 30px", borderRadius: 9999, border: `1px solid ${C.rose}`, color: C.rose, fontSize: 13, fontWeight: 600, letterSpacing: "0.03em", textDecoration: "none", opacity: 0, transition: "background 0.2s", display: "inline-block" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.blush; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              Нашата история
            </a>
          </div>
        </div>

        {/* Image */}
        <div className="lp-hero-img" style={{ position: "relative", opacity: 0 }}>
          <div style={{ position: "relative", borderRadius: 28, overflow: "hidden", aspectRatio: "4/5", boxShadow: "0 30px 80px rgba(122,39,56,0.18)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=1200&q=80" alt="Романтичен букет рози" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(122,39,56,0.18) 0%, transparent 45%)" }} />
          </div>
          {/* Floating badge */}
          <div style={{ position: "absolute", bottom: 22, left: -14, background: C.white, borderRadius: 16, padding: "12px 18px", boxShadow: "0 12px 36px rgba(122,39,56,0.16)", display: "flex", alignItems: "center", gap: 10, fontFamily: C.sans }} className="animate-petal">
            <Truck size={18} color={C.rose} strokeWidth={1.8} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0 }}>Доставка за 2 часа</p>
              <p style={{ fontSize: 11, color: C.inkMuted, margin: 0 }}>в целия Бургас</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Value strip ───────────────────────────────────────────────────────────────
function ValueStrip() {
  const ITEMS = [
    { icon: Truck,   title: "Доставка за 2 часа", body: "SLA гаранция в целия Бургас" },
    { icon: Camera,  title: "Фото потвърждение",  body: "Снимка от момента на връчване" },
    { icon: Flower2, title: "Свежи всеки ден",     body: "Холандски ферми, премиум стъбла" },
    { icon: Heart,   title: "С любов опаковано",   body: "Безплатна картичка с послание" },
  ];
  return (
    <section style={{ background: C.white, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px clamp(20px,4vw,48px)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 20, fontFamily: C.sans }}>
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <div key={title} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: C.blush, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={19} color={C.rose} strokeWidth={1.7} />
            </div>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, margin: 0 }}>{title}</p>
              <p style={{ fontSize: 12, color: C.inkMuted, margin: 0 }}>{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Collection bridge ─────────────────────────────────────────────────────────
function CollectionSection({ products }: { products: CatalogProduct[] }) {
  return (
    <section id="catalog" style={{ background: C.bg }}>
      <div style={{ textAlign: "center", padding: "72px clamp(20px,4vw,48px) 8px", fontFamily: C.sans }}>
        <p style={{ fontSize: 11, letterSpacing: "0.28em", color: C.rose, textTransform: "uppercase", marginBottom: 14 }}>Колекция</p>
        <h2 style={{ fontFamily: C.serif, fontWeight: 600, fontSize: "clamp(30px,5vw,52px)", letterSpacing: "-0.02em", color: C.ink, margin: 0 }}>
          Любов &amp; Романтика
        </h2>
        <p style={{ fontSize: 15, color: C.inkFade, maxWidth: 480, margin: "16px auto 0", lineHeight: 1.6 }}>
          Букети, създадени за най-нежните моменти — годеж, годишнина или просто „обичам те“.
        </p>
      </div>
      <CatalogClient products={products} />
    </section>
  );
}

// ── Romance / about editorial ─────────────────────────────────────────────────
function RomanceSection() {
  return (
    <section id="about" style={{ background: C.white, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(64px,9vw,110px) clamp(20px,4vw,48px)", display: "grid", gridTemplateColumns: "1fr", gap: 48, alignItems: "center" }} className="lp-romance-grid">
        <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", aspectRatio: "5/4", boxShadow: "0 24px 60px rgba(122,39,56,0.14)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=1100&q=80" alt="Флорист подрежда букет" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ fontFamily: C.sans }}>
          <p style={{ fontSize: 11, letterSpacing: "0.28em", color: C.rose, textTransform: "uppercase", marginBottom: 18 }}>Нашата история</p>
          <h2 style={{ fontFamily: C.serif, fontWeight: 600, fontSize: "clamp(28px,4.2vw,44px)", letterSpacing: "-0.02em", color: C.ink, lineHeight: 1.15, margin: "0 0 20px" }}>
            Цветя, които говорят от сърце
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: C.inkFade, marginBottom: 18 }}>
            В <strong style={{ color: C.rose }}>Kiss My Flowers</strong> вярваме, че всеки букет разказва история.
            Подбираме всяко стъбло на ръка, спазваме българската традиция за нечетен брой цветя
            и опаковаме с внимание към детайла.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: C.inkFade, marginBottom: 28 }}>
            Поръчваш онлайн, а нашият флорист в Бургас получава поръчката веднага и тръгва към теб.
            Получаваш снимка от момента на връчване — защото любовта заслужава потвърждение.
          </p>
          <a href="#catalog" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: C.rose, fontSize: 14, fontWeight: 600, textDecoration: "none", borderBottom: `1.5px solid ${C.rose}`, paddingBottom: 3 }}>
            Разгледай букетите →
          </a>
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────
function ProtocolSection() {
  const STEPS = [
    { num: "01", title: "Избери букет", desc: "Разгледай колекцията „Любов и романтика“ — над 30 ръчно изработени букета от сертифицирани флористи." },
    { num: "02", title: "Поръчай за минута", desc: "Сигурно плащане и безплатна картичка с твоето послание. Флористът получава поръчката веднага." },
    { num: "03", title: "Доставяме с любов", desc: "Куриерът пристига до 2 часа и ти изпраща снимка от момента на връчване — гаранция за всяка крачка." },
  ];
  return (
    <section id="protocol" style={{ background: C.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(64px,9vw,110px) clamp(20px,4vw,48px)", fontFamily: C.sans }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.28em", color: C.rose, textTransform: "uppercase", marginBottom: 14 }}>Как работи</p>
          <h2 style={{ fontFamily: C.serif, fontWeight: 600, fontSize: "clamp(28px,4.5vw,48px)", letterSpacing: "-0.02em", color: C.ink, margin: 0 }}>
            Три стъпки до усмивка
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 22 }}>
          {STEPS.map((s) => (
            <div key={s.num} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 22, padding: "34px 28px", boxShadow: "0 10px 30px rgba(122,39,56,0.05)" }}>
              <span style={{ fontFamily: C.serif, fontSize: 44, fontWeight: 600, color: C.blushDeep, lineHeight: 1, display: "block", marginBottom: 16 }}>{s.num}</span>
              <h3 style={{ fontFamily: C.serif, fontWeight: 600, fontSize: 22, color: C.ink, margin: "0 0 10px" }}>{s.title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.inkFade, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section style={{ background: C.roseDeep, position: "relative", overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://images.unsplash.com/photo-1487070183336-b863922373d4?w=1600&q=80" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.18 }} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "clamp(72px,10vw,120px) clamp(20px,5vw,64px)", fontFamily: C.sans }}>
        <p style={{ fontSize: 11, letterSpacing: "0.3em", color: C.blushDeep, textTransform: "uppercase", marginBottom: 22 }}>Подари емоция</p>
        <h2 style={{ fontFamily: C.serif, fontWeight: 600, fontSize: "clamp(30px,5.5vw,58px)", letterSpacing: "-0.02em", color: C.white, maxWidth: 640, margin: "0 auto 20px", lineHeight: 1.1 }}>
          Изненадай я днес — доставяме за 2 часа.
        </h2>
        <p style={{ fontSize: "clamp(14px,1.8vw,17px)", color: "rgba(255,255,255,0.78)", marginBottom: 40, maxWidth: 460, margin: "0 auto 40px", lineHeight: 1.6 }}>
          Романтични букети за всеки повод. Безплатна картичка с послание към всяка поръчка.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          <a href="#catalog" style={{ background: C.white, color: C.roseDeep, padding: "15px 40px", borderRadius: 9999, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", textDecoration: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.18)", transition: "transform 0.2s", display: "inline-block" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}>
            Поръчай букет →
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function FooterSection() {
  const COLS = [
    { title: "Магазин",  links: [["Колекция", "#catalog"], ["За нас", "#about"], ["Как работи", "#protocol"]] },
    { title: "Компания", links: [["Флористи", "#about"], ["Контакти", "mailto:hello@kissmyflowers.bg"], ["Бургас", "#about"]] },
    { title: "Правно",   links: [["Поверителност", "/privacy"], ["Условия", "/terms"], ["Връщане", "/refund"]] },
  ] as const;

  return (
    <footer style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: "56px clamp(20px,5vw,60px) 40px", fontFamily: C.sans }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(3, 1fr)", gap: 40, marginBottom: 48 }} className="footer-grid">
          <div>
            <p style={{ fontFamily: C.serif, fontWeight: 600, fontSize: 22, color: C.rose, marginBottom: 12 }}>Kiss My Flowers</p>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: C.inkMuted, maxWidth: 250 }}>
              Романтични букети с доставка за час в Бургас. Всеки букет — създаден с любов.
            </p>
          </div>
          {COLS.map(col => (
            <div key={col.title}>
              <p style={{ fontSize: 11, letterSpacing: "0.16em", color: C.rose, textTransform: "uppercase", marginBottom: 18, fontWeight: 600 }}>{col.title}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(([label, href]) => (
                  <a key={label} href={href} style={{ fontSize: 13.5, color: C.inkFade, textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.color = C.rose; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.color = C.inkFade; }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <p style={{ fontSize: 12, color: C.inkMuted, letterSpacing: "0.02em" }}>
            © {new Date().getFullYear()} Kiss My Flowers · Бургас, България
          </p>
          <p style={{ fontSize: 12, color: C.inkMuted, display: "flex", alignItems: "center", gap: 6 }}>
            Създадено с <Heart size={12} fill={C.rose} strokeWidth={0} /> в Бургас
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Responsive helpers ────────────────────────────────────────────────────────
const STYLES = `
  @media (min-width: 880px) {
    .lp-hero-grid    { grid-template-columns: 1.05fr 0.95fr !important; gap: 56px !important; }
    .lp-romance-grid { grid-template-columns: 1fr 1fr !important; }
  }
  .footer-grid { grid-template-columns: 2fr repeat(3,1fr); }
  @media (max-width: 640px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
`;

// ── Main export ───────────────────────────────────────────────────────────────
export function LandingPage({ products }: { products: CatalogProduct[] }) {
  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: C.sans, overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <NavBar />
      <HeroSection />
      <ValueStrip />
      <CollectionSection products={products} />
      <RomanceSection />
      <ProtocolSection />
      <CTASection />
      <FooterSection />
      <BottomNav />
    </div>
  );
}
