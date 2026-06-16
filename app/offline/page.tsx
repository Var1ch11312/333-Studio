"use client";

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "#FBF6F3" }}
    >
      <div className="flex flex-col items-center gap-8 max-w-xs">

        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(168,50,74,0.07)",
            border: "1px solid rgba(168,50,74,0.25)",
            boxShadow: "0 0 32px rgba(168,50,74,0.08)",
          }}
        >
          <span style={{ fontSize: 40, opacity: 0.6 }}>✿</span>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-3">
          <p
            className="text-[10px] tracking-[0.4em] uppercase"
            style={{ color: "rgba(168,50,74,0.55)" }}
          >
            Офлайн
          </p>
          <h1
            className="font-serif text-2xl font-bold"
            style={{ color: "#2B2220" }}
          >
            Няма връзка
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "rgba(110,95,89,0.4)" }}
          >
            Проверете интернет връзката си и опитайте отново.
            Последно посетените страници са запазени.
          </p>
        </div>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 rounded-2xl font-semibold tracking-wider text-sm"
          style={{
            background: "linear-gradient(135deg, #C24B5E 0%, #8E2438 100%)",
            color: "#FFFFFF",
          }}
        >
          Опитай отново
        </button>

        <p
          className="text-[10px]"
          style={{ color: "rgba(110,95,89,0.18)" }}
        >
          Kiss My Flowers · Бургас
        </p>
      </div>
    </div>
  );
}
