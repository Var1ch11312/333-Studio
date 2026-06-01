"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaProvider() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  /* ── Register service worker ───────────────────────────── */
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) =>
          console.error("[PWA] Service worker registration failed:", err)
        );
    }
  }, []);

  /* ── Capture install prompt ────────────────────────────── */
  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if user already dismissed this session
    if (sessionStorage.getItem("pwa-banner-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Small delay so page loads first
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  if (!showBanner || dismissed) return null;

  return (
    <div
      className="fixed bottom-20 left-3 right-3 z-50 rounded-2xl p-4 flex items-center gap-3 md:left-auto md:right-4 md:w-80"
      style={{
        background: "rgba(28,25,21,0.97)",
        border: "1px solid rgba(197,160,89,0.28)",
        backdropFilter: "blur(24px)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(197,160,89,0.1)",
      }}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: "rgba(197,160,89,0.1)",
          border: "1px solid rgba(197,160,89,0.2)",
        }}
      >
        <span style={{ fontSize: 24 }}>✿</span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "#EDE5D5" }}>
          Инсталирай AMUR
        </p>
        <p
          className="text-[11px] mt-0.5 leading-snug"
          style={{ color: "rgba(249,246,240,0.45)" }}
        >
          Добави на началния екран — работи офлайн
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{
            background: "linear-gradient(135deg, #C5A059 0%, #9A7A35 100%)",
            color: "#180F04",
          }}
        >
          <Download className="w-3.5 h-3.5" />
          Добави
        </button>
        <button
          onClick={handleDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-lg"
          style={{ color: "rgba(249,246,240,0.35)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
