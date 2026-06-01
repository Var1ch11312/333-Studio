"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ParallaxHero() {
  const textRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (textRef.current) {
        textRef.current.style.transform = `translateY(${y * 0.28}px)`;
        textRef.current.style.opacity = String(Math.max(0, 1 - y / 500));
      }
      if (orb1Ref.current) {
        orb1Ref.current.style.transform = `translateY(${y * 0.12}px)`;
      }
      if (orb2Ref.current) {
        orb2Ref.current.style.transform = `translateY(${y * 0.18}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: "100svh" }}
    >
      {/* ── Background ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, #261C0A 0%, #12100C 45%, #0A0907 100%)",
        }}
      />

      {/* Gold orbs */}
      <div
        ref={orb1Ref}
        className="absolute animate-gold-pulse pointer-events-none"
        style={{
          top: "15%",
          left: "20%",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(197,160,89,0.10) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        ref={orb2Ref}
        className="absolute animate-gold-pulse pointer-events-none"
        style={{
          bottom: "20%",
          right: "15%",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(197,160,89,0.07) 0%, transparent 70%)",
          filter: "blur(50px)",
          animationDelay: "2s",
        }}
      />

      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "128px",
        }}
      />

      {/* ── Content ── */}
      <div
        ref={textRef}
        className="relative z-10 text-center px-6 max-w-3xl mx-auto"
        style={{ willChange: "transform, opacity" }}
      >
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span
            className="h-px flex-1 max-w-16"
            style={{ background: "rgba(197,160,89,0.35)" }}
          />
          <p
            className="text-[11px] tracking-[0.45em] uppercase"
            style={{ color: "rgba(197,160,89,0.7)" }}
          >
            Бургас · Премиум Доставка
          </p>
          <span
            className="h-px flex-1 max-w-16"
            style={{ background: "rgba(197,160,89,0.35)" }}
          />
        </div>

        {/* Heading */}
        <h1
          className="font-serif font-bold leading-[1.08] mb-6"
          style={{ fontSize: "clamp(2.8rem, 8vw, 5.5rem)" }}
        >
          Подарете{" "}
          <em
            className="not-italic text-gold-shimmer"
            style={{ display: "inline-block" }}
          >
            емоция
          </em>
          ,<br />
          не просто цветя.
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg max-w-lg mx-auto mb-10 leading-relaxed"
          style={{ color: "rgba(249,246,240,0.5)" }}
        >
          Доставяме букети в целия Бургас за под&nbsp;2&nbsp;часа.
          <br />
          Всяко връчване е събитие с протокол „Бели ръкавици".
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#catalog">
            <Button
              size="lg"
              className="w-full sm:w-auto tracking-wider text-sm"
            >
              Разгледай каталога
            </Button>
          </a>
          <Link href="/checkout">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto tracking-wider text-sm"
            >
              Поръчай сега
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span
          className="text-[9px] tracking-[0.5em] uppercase"
          style={{ color: "rgba(197,160,89,0.4)" }}
        >
          Скролирай
        </span>
        <div
          className="w-px h-10 animate-scroll-line"
          style={{ background: "rgba(197,160,89,0.5)" }}
        />
      </div>
    </section>
  );
}
