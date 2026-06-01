"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title="Изход"
    >
      <LogOut className="w-3.5 h-3.5" />
      Изход
    </button>
  );
}
