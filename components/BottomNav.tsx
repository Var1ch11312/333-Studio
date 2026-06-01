"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Heart, User } from "lucide-react";

const ITEMS = [
  { href: "/",          icon: Home,        label: "Каталог"  },
  { href: "/checkout",  icon: ShoppingBag, label: "Поръчай"  },
  { href: "#",          icon: Heart,       label: "Любими"   },
  { href: "#",          icon: User,        label: "Профил"   },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: "rgba(14,12,9,0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(197,160,89,0.15)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-stretch">
        {ITEMS.map(({ href, icon: Icon, label }) => {
          const active = path === href;
          return (
            <Link
              key={label}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-opacity active:opacity-60"
            >
              <Icon
                className="w-5 h-5 transition-colors"
                style={{ color: active ? "#C5A059" : "#5A5753" }}
                strokeWidth={active ? 1.8 : 1.4}
              />
              <span
                className="text-[10px] tracking-wide transition-colors"
                style={{ color: active ? "#C5A059" : "#5A5753" }}
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
