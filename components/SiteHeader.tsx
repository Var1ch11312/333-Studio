"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export function SiteHeader() {
  const { totalItems } = useCart();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(18,14,10,0.88)",
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

        <Link href="/cart" className="relative p-1.5">
          <ShoppingBag className="w-5 h-5" style={{ color: "#C5A059" }} strokeWidth={1.5} />
          {totalItems > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full text-[9px] font-bold flex items-center justify-center"
              style={{
                background: "#C5A059",
                color: "#0A0907",
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
