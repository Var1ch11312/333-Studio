"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock } from "lucide-react";
import Link from "next/link";

const ROLE_LABELS: Record<string, { title: string; hint: string }> = {
  admin: { title: "Администрация", hint: "Въведете администраторски PIN" },
  hub:   { title: "Флорист хъб",   hint: "Въведете PIN за хъба" },
};

export function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();

  const role = params.get("role") ?? "hub";
  const next = params.get("next") ?? (role === "admin" ? "/admin" : "/hub");
  const { title, hint } = ROLE_LABELS[role] ?? ROLE_LABELS.hub;

  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* clear error when pin changes */
  useEffect(() => { setError(null); }, [pin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, pin }),
    });

    if (res.ok) {
      router.replace(next);
    } else {
      const d = await res.json();
      setError(d.error ?? "Грешка");
      setPin("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      {/* Logo */}
      <Link href="/" className="mb-10">
        <span className="font-serif text-3xl font-bold tracking-widest text-primary">
          AMUR
        </span>
      </Link>

      <div className="w-full max-w-xs flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Lock className="w-4 h-4 text-primary" />
            </div>
          </div>
          <h1 className="font-serif text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="••••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            className="text-center tracking-widest text-lg"
          />

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <Button type="submit" disabled={loading || !pin.trim()} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Влез"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            ← Към магазина
          </Link>
        </p>
      </div>
    </div>
  );
}
