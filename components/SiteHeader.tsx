"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  const { totalItems } = useCart();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(251,246,243,0.86)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid #ECDFD9",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-serif text-2xl font-semibold tracking-tight" style={{ color: "#A8324A" }}>
            {SITE.brand}
          </span>
          <span
            className="text-[9px] tracking-[0.32em] uppercase mt-0.5"
            style={{ color: "rgba(168,50,74,0.55)" }}
          >
            {SITE.city} · {SITE.tagline}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-xs tracking-wider uppercase" style={{ color: "#9B8B84" }}>
          <Link href="/#catalog" className="transition-colors hover:text-[#A8324A]">
            Колекция
          </Link>
          <Link href="/#about" className="transition-colors hover:text-[#A8324A]">
            За нас
          </Link>
        </nav>

        <Link href="/cart" className="relative p-1.5">
          <ShoppingBag className="w-5 h-5" style={{ color: "#A8324A" }} strokeWidth={1.6} />
          {totalItems > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 rounded-full text-[9px] font-bold flex items-center justify-center"
              style={{
                background: "#A8324A",
                color: "#FFFFFF",
                minWidth: 16,
                height: 16,
                padding: "0 3px",
              }}
            >
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
