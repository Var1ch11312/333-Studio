"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Heart, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export function BottomNav() {
  const path = usePathname();
  const { totalItems } = useCart();

  const ITEMS = [
    { href: "/",     icon: Home,        label: "Колекция", badge: 0 },
    { href: "/cart", icon: ShoppingBag, label: "Кошница",  badge: totalItems },
    { href: "#",     icon: Heart,       label: "Любими",   badge: 0 },
    { href: "#",     icon: User,        label: "Профил",   badge: 0 },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid #ECDFD9",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-stretch">
        {ITEMS.map(({ href, icon: Icon, label, badge }) => {
          const active = path === href;
          return (
            <Link
              key={label}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-opacity active:opacity-60 relative"
            >
              <div className="relative">
                <Icon
                  className="w-5 h-5 transition-colors"
                  style={{ color: active ? "#A8324A" : "#B7A8A1" }}
                  strokeWidth={active ? 1.9 : 1.5}
                />
                {badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1.5 rounded-full text-[8px] font-bold flex items-center justify-center"
                    style={{
                      background: "#A8324A",
                      color: "#FFFFFF",
                      minWidth: 14,
                      height: 14,
                      padding: "0 2px",
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] tracking-wide transition-colors"
                style={{ color: active ? "#A8324A" : "#B7A8A1" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
