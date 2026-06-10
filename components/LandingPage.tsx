"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CatalogClient, type CatalogProduct } from "@/components/CatalogClient";
import { BottomNav } from "@/components/BottomNav";
import { useCart } from "@/contexts/CartContext";

// ── Design tokens: Preset B "Midnight Luxe" ──────────────────────────────────
const C = {
  bg:            "#0D0D12",
  bgDeep:        "#080810",
  accent:        "#C9A84C",
  accentGrad:    "linear-gradient(135deg, #C9A84C 0%, #8B6228 100%)",
  text:          "#FAF8F5",
  slate:         "#16161F",
  accentFade:    "rgba(201,168,76,0.12)",
  accentBorder:  "rgba(201,168,76,0.2)",
  textFade:      "rgba(250,248,245,0.55)",
  textMuted:     "rgba(250,248,245,0.35)",
  mono:          "var(--font-jetbrains, 'JetBrains Mono', monospace)",
  serif:         "var(--font-playfair, 'Playfair Display', Georgia, serif)",
  sans:          "var(--font-inter, 'Inter', system-ui, sans-serif)",
};

// ── Noise overlay ─────────────────────────────────────────────────────────────
function NoiseOverlay() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 999, pointerEvents: "none", opacity: 0.045 }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="lp-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#lp-noise)" />
      </svg>
    </div>
  );
}

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
      zIndex: 300, display: "flex", alignItems: "center", gap: 28,
      padding: "10px 16px 10px 24px", borderRadius: 9999,
      transition: "background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease",
      background: scrolled ? "rgba(8,8,16,0.82)" : "rgba(8,8,16,0.0)",
      backdropFilter: scrolled ? "blur(28px) saturate(1.4)" : "none",
      border: `1px solid ${scrolled ? C.accentBorder : "rgba(201,168,76,0)"}`,
      boxShadow: scrolled ? "0 8px 48px rgba(0,0,0,0.5)" : "none",
      whiteSpace: "nowrap", fontFamily: C.sans,
    }}>
      <span style={{ fontWeight: 800, letterSpacing: "0.22em", color: C.accent, fontSize: 13, textTransform: "uppercase" }}>
        AMUR.BG
      </span>

      <div style={{ display: "flex", gap: 24, alignItems: "center" }} className="hidden sm:flex">
        {[["Каталог", "#catalog"], ["B2B", "#b2b"], ["Как работи", "#protocol"]].map(([label, href]) => (
          <a key={label} href={href} style={{ color: C.textFade, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", transition: "color 0.2s, transform 0.2s" }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = C.text; (e.target as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = C.textFade; (e.target as HTMLElement).style.transform = ""; }}>
            {label}
          </a>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/cart" style={{ position: "relative", color: C.accent, display: "flex", transition: "transform 0.2s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}>
          <ShoppingBag size={17} strokeWidth={1.8} />
          {totalItems > 0 && (
            <span style={{ position: "absolute", top: -5, right: -5, background: C.accent, color: "#050403", borderRadius: 9999, fontSize: 9, fontWeight: 800, width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {totalItems}
            </span>
          )}
        </Link>
        <a href="#catalog" style={{ background: C.accentGrad, color: "#050403", padding: "8px 18px", borderRadius: 9999, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", transition: "transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.2s" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.04)"; el.style.boxShadow = "0 4px 24px rgba(201,168,76,0.4)"; }}
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
    let ctx: any;
    let cancelled = false;
    (async () => {
      const { default: gsap } = await import("gsap");
      if (cancelled) return;
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(".lp-eyebrow",  { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.3)
          .fromTo(".lp-h1-line1", { y: 56, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, 0.5)
          .fromTo(".lp-h1-line2", { y: 64, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, 0.65)
          .fromTo(".lp-hero-cta",  { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 }, 0.95)
          .fromTo(".lp-hero-meta", { opacity: 0 },        { opacity: 1, duration: 0.7 },         1.2);
      }, ref);
    })();
    return () => { cancelled = true; ctx?.revert(); };
  }, []);

  return (
    <section ref={ref} style={{ height: "100dvh", position: "relative", overflow: "hidden", background: C.bgDeep, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://images.unsplash.com/photo-1490750967868-88df5691cc4a?w=1920&q=80" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.25) saturate(0.7)" }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${C.bgDeep} 0%, rgba(8,8,16,0.55) 55%, rgba(8,8,16,0.05) 100%)` }} />

      <div style={{ position: "relative", zIndex: 2, padding: "0 clamp(24px,5vw,72px) clamp(64px,8vh,96px)", maxWidth: 920, fontFamily: C.sans }}>
        <p className="lp-eyebrow" style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: "0.3em", color: C.accent, textTransform: "uppercase", marginBottom: 28, opacity: 0 }}>
          Бургас · Доставка за 1 час · Премиум
        </p>
        <h1 style={{ margin: 0, lineHeight: 1.04, letterSpacing: "-0.025em" }}>
          <span className="lp-h1-line1" style={{ display: "block", fontWeight: 800, fontSize: "clamp(40px,7.5vw,100px)", color: C.text, fontFamily: C.sans, opacity: 0 }}>
            Елегантността среща
          </span>
          <span className="lp-h1-line2" style={{ display: "block", fontFamily: C.serif, fontStyle: "italic", fontWeight: 700, fontSize: "clamp(52px,10.5vw,136px)", color: C.accent, lineHeight: 0.95, opacity: 0 }}>
            Прецизността.
          </span>
        </h1>

        <div style={{ marginTop: 44, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <a className="lp-hero-cta" href="#catalog" style={{ background: C.accentGrad, color: "#050403", padding: "15px 40px", borderRadius: 9999, fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", opacity: 0, boxShadow: "0 4px 32px rgba(201,168,76,0.28)", display: "inline-flex", alignItems: "center", gap: 8, transition: "transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.2s" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.04)"; el.style.boxShadow = "0 8px 44px rgba(201,168,76,0.44)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = "0 4px 32px rgba(201,168,76,0.28)"; }}>
            Разгледай каталога →
          </a>
          <div className="lp-hero-meta" style={{ display: "flex", gap: 20, opacity: 0, flexWrap: "wrap" }}>
            {["100+ доставки", "★ 4.9 рейтинг", "2ч SLA гаранция"].map(b => (
              <span key={b} style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.05em", fontFamily: C.mono }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 40, right: "clamp(24px,5vw,72px)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 2 }}>
        <div style={{ width: 1, height: 44, background: `linear-gradient(to bottom, ${C.accent}, transparent)` }} />
        <span style={{ fontFamily: C.mono, fontSize: 8, letterSpacing: "0.22em", color: "rgba(201,168,76,0.5)", writingMode: "vertical-rl", textTransform: "uppercase" }}>SCROLL</span>
      </div>
    </section>
  );
}

// ── Features — Card 1: Diagnostic Shuffler ────────────────────────────────────
function DiagnosticShuffler() {
  const LABELS = [
    { zone: "Центъра", eta: "45 мин", icon: "📍" },
    { zone: "Север Бургас", eta: "60 мин", icon: "🗺" },
    { zone: "Меден Рудник", eta: "90 мин", icon: "📦" },
  ];
  const [stack, setStack] = useState(LABELS);

  useEffect(() => {
    const id = setInterval(() => setStack(s => { const n = [...s]; n.unshift(n.pop()!); return n; }), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ padding: "28px 24px 32px", height: "100%", display: "flex", flexDirection: "column", fontFamily: C.sans }}>
      <p style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: "0.25em", color: C.accent, textTransform: "uppercase", marginBottom: 6 }}>ДОСТАВКА ЗА ЧАС</p>
      <h3 style={{ fontWeight: 700, fontSize: 18, color: C.text, letterSpacing: "-0.01em", marginBottom: 28 }}>Зонова маршрутизация</h3>
      <div style={{ flex: 1, position: "relative", minHeight: 130 }}>
        {stack.map((item, i) => (
          <div key={item.zone} style={{
            position: i === 0 ? "relative" : "absolute",
            top: i === 0 ? 0 : `${i * 10}px`, left: `${i * 4}px`, right: `${i * 4}px`,
            background: i === 0 ? C.accentFade : "rgba(32,32,42,0.9)",
            border: `1px solid ${i === 0 ? C.accentBorder : "rgba(250,248,245,0.05)"}`,
            borderRadius: 14, padding: "14px 18px",
            transition: "all 0.55s cubic-bezier(0.34,1.56,0.64,1)",
            zIndex: 3 - i, opacity: 1 - i * 0.28,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <p style={{ fontSize: 10, color: C.textFade, marginBottom: 3 }}>{item.icon} {item.zone}</p>
              <p style={{ fontFamily: C.mono, fontSize: 24, fontWeight: 700, color: i === 0 ? C.accent : C.text, letterSpacing: "-0.02em" }}>{item.eta}</p>
            </div>
            {i === 0 && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#5CB85C", boxShadow: "0 0 10px #5CB85C" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Features — Card 2: Telemetry Typewriter ───────────────────────────────────
function TelemetryTypewriter() {
  const MSGS = [
    "Корпоративен букет → Зора ООД · 51 рози · потвърдено",
    "B2B абонамент → Хотел Аква · месечен план · активен",
    "VIP доставка → заседание на УС · Бургас Сити · 11:30",
    "Корпоративна поръчка → рожден ден на CEO · 65 EUR",
    "Офис абонамент → седмична доставка · автоматичен",
  ];
  const [text, setText] = useState("");
  const [mi, setMi] = useState(0);
  const [ci, setCi] = useState(0);

  useEffect(() => {
    const cur = MSGS[mi];
    if (ci < cur.length) {
      const t = setTimeout(() => { setText(cur.slice(0, ci + 1)); setCi(c => c + 1); }, 32);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setMi(m => (m + 1) % MSGS.length); setCi(0); setText(""); }, 2400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ci, mi]);

  return (
    <div style={{ padding: "28px 24px 32px", height: "100%", display: "flex", flexDirection: "column", fontFamily: C.sans }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5CB85C", boxShadow: "0 0 8px #5CB85C", animation: "lpPulse 2s ease-in-out infinite" }} />
        <p style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: "0.25em", color: C.accent, textTransform: "uppercase" }}>LIVE FEED · B2B</p>
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 18, color: C.text, letterSpacing: "-0.01em", marginBottom: 24 }}>Корпоративни поръчки</h3>
      <div style={{ flex: 1, background: "rgba(8,8,16,0.7)", borderRadius: 12, padding: "16px 18px", border: "1px solid rgba(201,168,76,0.08)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p style={{ fontFamily: C.mono, fontSize: 12, lineHeight: 1.75, color: "rgba(250,248,245,0.72)", wordBreak: "break-word", minHeight: 80 }}>
          <span style={{ color: C.accent, marginRight: 6 }}>›</span>{text}
          <span style={{ color: C.accent, animation: "lpBlink 1s step-end infinite", marginLeft: 1 }}>|</span>
        </p>
      </div>
    </div>
  );
}

// ── Features — Card 3: Cursor Protocol Scheduler ─────────────────────────────
function CursorScheduler() {
  const DAYS = ["П", "В", "С", "Ч", "П", "С", "Н"];
  const [active, setActive] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [pressing, setPressing] = useState(false);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      while (alive) {
        await delay(1200);
        if (!alive) break;
        const day = 1 + Math.floor(Math.random() * 5);
        setActive(day);
        await delay(500);
        if (!alive) break;
        setPressing(true);
        await delay(300);
        setPressing(false);
        setSaved(day);
        await delay(2400);
        if (!alive) break;
        setActive(null);
        setSaved(null);
        await delay(600);
      }
    };
    run();
    return () => { alive = false; };
  }, []);

  return (
    <div style={{ padding: "28px 24px 32px", height: "100%", display: "flex", flexDirection: "column", fontFamily: C.sans }}>
      <p style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: "0.25em", color: C.accent, textTransform: "uppercase", marginBottom: 6 }}>ПЛАНИРАЙ · B2C</p>
      <h3 style={{ fontWeight: 700, fontSize: 18, color: C.text, letterSpacing: "-0.01em", marginBottom: 24 }}>Седмичен календар</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, marginBottom: 16 }}>
        {DAYS.map((d, i) => (
          <div key={i} style={{
            aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontSize: 11, fontWeight: 600,
            background: active === i ? C.accentFade : "rgba(32,32,42,0.6)",
            border: `1px solid ${active === i ? C.accentBorder : "rgba(250,248,245,0.05)"}`,
            color: active === i ? C.accent : C.textMuted,
            transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            transform: active === i && pressing ? "scale(0.9)" : "scale(1)",
          }}>{d}</div>
        ))}
      </div>
      <div style={{
        padding: "11px 16px", borderRadius: 10, textAlign: "center", fontSize: 12, fontWeight: 600,
        background: saved !== null ? C.accentGrad : "rgba(32,32,42,0.6)",
        color: saved !== null ? "#050403" : C.textMuted,
        border: `1px solid ${saved !== null ? C.accent : "rgba(250,248,245,0.05)"}`,
        transition: "all 0.45s ease",
      }}>
        {saved !== null ? "✓ Запазено" : "Запази час"}
      </div>
    </div>
  );
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Features Section ──────────────────────────────────────────────────────────
function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let ctx: any;
    let cancelled = false;
    (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled) return;
      ctx = gsap.context(() => {
        gsap.fromTo(".lp-feat-card", { y: 56, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.15, scrollTrigger: { trigger: ref.current, start: "top 78%" } });
      }, ref);
    })();
    return () => { cancelled = true; ctx?.revert(); };
  }, []);

  return (
    <section ref={ref} style={{ padding: "120px clamp(20px,4vw,48px)", maxWidth: 1200, margin: "0 auto", fontFamily: C.sans }}>
      <div style={{ textAlign: "center", marginBottom: 72 }}>
        <p style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: "0.3em", color: C.accent, textTransform: "uppercase", marginBottom: 16 }}>ФУНКЦИИ</p>
        <h2 style={{ fontWeight: 800, fontSize: "clamp(30px,5vw,56px)", letterSpacing: "-0.025em", color: C.text }}>Три причини да изберете AMUR</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20 }}>
        {[DiagnosticShuffler, TelemetryTypewriter, CursorScheduler].map((Card, i) => (
          <div key={i} className="lp-feat-card" style={{ background: "#111118", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "2rem", minHeight: 300, boxShadow: "0 20px 60px rgba(0,0,0,0.45)", opacity: 0 }}>
            <Card />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Philosophy ────────────────────────────────────────────────────────────────
function PhilosophySection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let ctx: any;
    let cancelled = false;
    (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled) return;
      ctx = gsap.context(() => {
        gsap.fromTo(ref.current!.querySelectorAll(".lp-pw"),
          { y: 36, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, ease: "power3.out", stagger: 0.055, scrollTrigger: { trigger: ref.current, start: "top 72%" } }
        );
      }, ref);
    })();
    return () => { cancelled = true; ctx?.revert(); };
  }, []);

  const s1 = "Повечето цветарници доставят: след 2–3 дни.";
  const s2 = "Ние доставяме: в рамките на";
  const accent = "ЧАС.";

  return (
    <section ref={ref} style={{ background: C.slate, position: "relative", overflow: "hidden", padding: "140px clamp(24px,5vw,80px)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://images.unsplash.com/photo-1557683304-673a23048d34?w=1920&q=80" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.04, filter: "grayscale(1)" }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", fontFamily: C.sans }}>
        <p style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: "0.3em", color: C.accent, textTransform: "uppercase", marginBottom: 48 }}>ФИЛОСОФИЯ</p>
        <p style={{ fontSize: "clamp(15px,2.2vw,19px)", color: "rgba(250,248,245,0.38)", marginBottom: 44, lineHeight: 1.65 }}>
          {s1.split(" ").map((w, i) => <span key={i} className="lp-pw" style={{ display: "inline-block", marginRight: "0.38em", opacity: 0 }}>{w}</span>)}
        </p>
        <p style={{ fontSize: "clamp(28px,5.5vw,68px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.025em" }}>
          {s2.split(" ").map((w, i) => <span key={i} className="lp-pw" style={{ display: "inline-block", marginRight: "0.32em", color: C.text, opacity: 0 }}>{w}</span>)}
          {" "}
          <span className="lp-pw" style={{ display: "inline-block", fontFamily: C.serif, fontStyle: "italic", color: C.accent, opacity: 0 }}>{accent}</span>
        </p>
      </div>
    </section>
  );
}

// ── Protocol — SVG Animations ─────────────────────────────────────────────────
function ConcentricRings() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {[58, 44, 30, 16].map((r, i) => (
        <circle key={r} cx="70" cy="70" r={r} fill="none" stroke={C.accent} strokeWidth={i === 0 ? 1.2 : 0.7} opacity={0.9 - i * 0.18}
          style={{ transformOrigin: "70px 70px", animation: `${i % 2 === 0 ? "lpSpinCW" : "lpSpinCCW"} ${9 + i * 5}s linear infinite` }} />
      ))}
      <circle cx="70" cy="70" r="4" fill={C.accent} opacity="0.9" />
      <line x1="70" y1="12" x2="70" y2="70" stroke={C.accent} strokeWidth="0.8" opacity="0.4"
        style={{ transformOrigin: "70px 70px", animation: "lpSpinCW 4s linear infinite" }} />
    </svg>
  );
}

function ScanGrid() {
  return (
    <svg width="180" height="110" viewBox="0 0 180 110" style={{ overflow: "visible" }}>
      {Array.from({ length: 5 }, (_, r) => Array.from({ length: 7 }, (_, c) => (
        <circle key={`${r}-${c}`} cx={14 + c * 26} cy={10 + r * 22} r={2.5} fill={C.accent} opacity={0.18} />
      )))}
      <line x1="0" y1="0" x2="0" y2="110" stroke={C.accent} strokeWidth="2" opacity="0.85" strokeLinecap="round"
        style={{ animation: "lpScanLine 2.8s cubic-bezier(0.4,0,0.2,1) infinite" }} />
      <rect x="-8" y="0" width="16" height="110" fill={`url(#lpScanGrad)`} opacity="0.15" style={{ animation: "lpScanLine 2.8s cubic-bezier(0.4,0,0.2,1) infinite" }} />
      <defs>
        <linearGradient id="lpScanGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0" />
          <stop offset="50%" stopColor={C.accent} stopOpacity="1" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function EKGWave() {
  const d = "M0,40 L22,40 L28,40 L34,8 L39,62 L44,32 L50,40 L75,40 L82,40 L88,6 L93,64 L98,30 L104,40 L136,40 L142,10 L147,60 L152,28 L158,40 L180,40";
  return (
    <svg width="200" height="72" viewBox="0 0 200 72" style={{ overflow: "visible" }}>
      <path d={d} fill="none" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 440, strokeDashoffset: 440, animation: "lpEKG 2.2s ease-in-out infinite" }} />
    </svg>
  );
}

const PROTOCOL = [
  { num: "01", title: "Изберете букет", desc: "Разгледайте каталог с 30+ премиум букета. Всеки е изработен от сертифицирани флористи с цветя от холандски ферми.", Visual: ConcentricRings },
  { num: "02", title: "Потвърдете поръчката", desc: "Сигурно плащане чрез Stripe. Веднага след потвърждение флористът получава WhatsApp известие и стартира изработката.", Visual: ScanGrid },
  { num: "03", title: "Доставка до вратата", desc: "Курьерът пристига до 2 часа. Получавате снимка от момента на връчване — гаранция за качество на всяка крачка.", Visual: EKGWave },
];

// ── Protocol Section ──────────────────────────────────────────────────────────
function ProtocolSection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let ctx: any;
    let cancelled = false;
    (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled) return;
      ctx = gsap.context(() => {
        const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
        cards.forEach((card, i) => {
          if (i === 0) return;
          ScrollTrigger.create({
            trigger: card, start: "top 60%",
            onEnter: () => cards[i - 1] && gsap.to(cards[i - 1], { scale: 0.91, filter: "blur(10px)", opacity: 0.38, duration: 0.55, ease: "power2.inOut" }),
            onLeaveBack: () => cards[i - 1] && gsap.to(cards[i - 1], { scale: 1, filter: "blur(0px)", opacity: 1, duration: 0.55, ease: "power2.inOut" }),
          });
        });
      }, wrapRef);
    })();
    return () => { cancelled = true; ctx?.revert(); };
  }, []);

  return (
    <section id="protocol" style={{ background: C.bg, fontFamily: C.sans }}>
      <div style={{ textAlign: "center", padding: "120px clamp(20px,4vw,48px) 64px" }}>
        <p style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: "0.3em", color: C.accent, textTransform: "uppercase", marginBottom: 16 }}>КАК РАБОТИ</p>
        <h2 style={{ fontWeight: 800, fontSize: "clamp(30px,5vw,56px)", letterSpacing: "-0.025em", color: C.text }}>Протоколът AMUR</h2>
      </div>
      <div ref={wrapRef}>
        {PROTOCOL.map((step, i) => (
          <div key={step.num} ref={el => { cardRefs.current[i] = el; }} style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: i % 2 === 0 ? "#0A0A12" : "#0D0D12",
            position: "sticky", top: 0, zIndex: i + 1,
            borderTop: "1px solid rgba(201,168,76,0.07)",
          }}>
            <div style={{ maxWidth: 780, width: "100%", padding: "48px clamp(24px,5vw,64px)", display: "grid", gridTemplateColumns: "1fr auto", gap: "clamp(32px,6vw,80px)", alignItems: "center" }}>
              <div>
                <span style={{ fontFamily: C.mono, fontSize: "clamp(48px,8vw,80px)", fontWeight: 700, color: "rgba(201,168,76,0.12)", letterSpacing: "-0.02em", lineHeight: 1, display: "block" }}>{step.num}</span>
                <h3 style={{ fontWeight: 800, fontSize: "clamp(26px,4vw,46px)", letterSpacing: "-0.02em", color: C.text, marginTop: 8, marginBottom: 16 }}>{step.title}</h3>
                <p style={{ fontSize: "clamp(14px,1.6vw,17px)", lineHeight: 1.72, color: C.textFade, maxWidth: 440 }}>{step.desc}</p>
              </div>
              <div style={{ flexShrink: 0, width: "clamp(100px,16vw,180px)", height: "clamp(100px,16vw,180px)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.85 }} className="hidden sm:flex">
                <step.Visual />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── CTA Section ───────────────────────────────────────────────────────────────
function CTASection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let ctx: any;
    let cancelled = false;
    (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled) return;
      ctx = gsap.context(() => {
        gsap.fromTo(ref.current!, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 80%" } });
      }, ref);
    })();
    return () => { cancelled = true; ctx?.revert(); };
  }, []);

  return (
    <section id="b2b" ref={ref} style={{ padding: "120px clamp(20px,5vw,64px)", textAlign: "center", background: C.slate, fontFamily: C.sans }}>
      <p style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: "0.3em", color: C.accent, textTransform: "uppercase", marginBottom: 24 }}>СТАРТИРАЙТЕ СЕГА</p>
      <h2 style={{ fontWeight: 800, fontSize: "clamp(28px,5vw,60px)", letterSpacing: "-0.025em", color: C.text, maxWidth: 640, margin: "0 auto 20px" }}>
        Първата ви доставка — до 2 часа.
      </h2>
      <p style={{ fontSize: "clamp(14px,1.7vw,17px)", color: C.textFade, marginBottom: 52, maxWidth: 440, margin: "0 auto 52px" }}>
        30+ премиум букета или индивидуален по ваш вкус. B2B абонаменти за корпоративни клиенти.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
        <a href="#catalog" style={{ background: C.accentGrad, color: "#050403", padding: "15px 44px", borderRadius: 9999, fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", boxShadow: "0 4px 32px rgba(201,168,76,0.3)", transition: "transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.2s", display: "inline-block" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.04)"; el.style.boxShadow = "0 8px 48px rgba(201,168,76,0.48)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = "0 4px 32px rgba(201,168,76,0.3)"; }}>
          Разгледай каталога →
        </a>
        <a href="mailto:b2b@amur.bg" style={{ padding: "15px 44px", borderRadius: 9999, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textDecoration: "none", transition: "background 0.2s", display: "inline-block" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.accentFade; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}>
          B2B запитване
        </a>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function FooterSection() {
  const COLS = [
    { title: "Магазин",   links: [["Каталог", "#catalog"], ["B2B", "#b2b"], ["Именни дни", "#catalog"], ["Абонамент", "#b2b"]] },
    { title: "Компания",  links: [["За нас", "#protocol"], ["Флористи", "#protocol"], ["Курьери", "#protocol"], ["Контакти", "mailto:support@amur.bg"]] },
    { title: "Правно",    links: [["Поверителност", "/privacy"], ["Условия", "/terms"], ["Връщане", "/refund"], ["GDPR", "/privacy"]] },
  ] as const;

  return (
    <footer style={{ background: "#050508", borderRadius: "4rem 4rem 0 0", padding: "64px clamp(20px,5vw,60px) 40px", marginTop: -32, fontFamily: C.sans }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(3, 1fr)", gap: 40, marginBottom: 60 }} className="footer-grid">
          <div>
            <p style={{ fontWeight: 800, fontSize: 22, letterSpacing: "0.18em", color: C.accent, marginBottom: 14 }}>AMUR.BG</p>
            <p style={{ fontSize: 13, lineHeight: 1.72, color: C.textMuted, maxWidth: 230 }}>Премиум цветя с доставка за час в Бургас. Всеки букет — с бели ръкавици.</p>
          </div>
          {COLS.map(col => (
            <div key={col.title}>
              <p style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: "0.22em", color: C.accent, textTransform: "uppercase", marginBottom: 20 }}>{col.title}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(([label, href]) => (
                  <a key={label} href={href} style={{ fontSize: 13, color: C.textMuted, textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.color = "rgba(250,248,245,0.75)"; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.color = C.textMuted; }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(201,168,76,0.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <p style={{ fontFamily: C.mono, fontSize: 10, color: "rgba(250,248,245,0.22)", letterSpacing: "0.05em" }}>
            © {new Date().getFullYear()} AMUR.BG · Бургас, България
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 9999, padding: "6px 14px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5CB85C", boxShadow: "0 0 8px #5CB85C", animation: "lpPulse 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: C.mono, fontSize: 9, color: C.textMuted, letterSpacing: "0.18em", textTransform: "uppercase" }}>Системата работи</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Catalog Bridge ────────────────────────────────────────────────────────────
function CatalogSection({ products }: { products: CatalogProduct[] }) {
  return (
    <section id="catalog" style={{ background: "#0C0A08" }}>
      <div style={{ textAlign: "center", padding: "80px clamp(20px,4vw,48px) 48px", fontFamily: C.sans }}>
        <p style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: "0.3em", color: C.accent, textTransform: "uppercase", marginBottom: 16 }}>КАТАЛОГ</p>
        <h2 style={{ fontWeight: 800, fontSize: "clamp(26px,4vw,48px)", letterSpacing: "-0.02em", color: "#F0E8D8" }}>Нашите букети</h2>
      </div>
      <CatalogClient products={products} />
    </section>
  );
}

// ── Keyframe injector ─────────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes lpBlink    { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes lpPulse    { 0%,100%{opacity:1;box-shadow:0 0 6px #5CB85C} 50%{opacity:.5;box-shadow:0 0 14px #5CB85C} }
  @keyframes lpSpinCW   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes lpSpinCCW  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
  @keyframes lpScanLine { 0%{transform:translateX(0);opacity:1} 85%{transform:translateX(170px);opacity:.7} 100%{transform:translateX(0);opacity:0} }
  @keyframes lpEKG      { 0%{stroke-dashoffset:440} 65%{stroke-dashoffset:0;opacity:1} 85%{stroke-dashoffset:0;opacity:0} 100%{stroke-dashoffset:440;opacity:0} }
  .footer-grid { grid-template-columns: 2fr repeat(3,1fr); }
  @media(max-width:640px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
`;

// ── Main export ───────────────────────────────────────────────────────────────
export function LandingPage({ products }: { products: CatalogProduct[] }) {
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: C.sans, overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <NoiseOverlay />
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <PhilosophySection />
      <ProtocolSection />
      <CTASection />
      <FooterSection />
      <CatalogSection products={products} />
      <BottomNav />
    </div>
  );
}
