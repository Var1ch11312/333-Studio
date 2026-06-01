"use client";

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "#0A0907" }}
    >
      <div className="flex flex-col items-center gap-8 max-w-xs">

        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(197,160,89,0.07)",
            border: "1px solid rgba(197,160,89,0.25)",
            boxShadow: "0 0 32px rgba(197,160,89,0.08)",
          }}
        >
          <span style={{ fontSize: 40, opacity: 0.6 }}>✿</span>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-3">
          <p
            className="text-[10px] tracking-[0.4em] uppercase"
            style={{ color: "rgba(197,160,89,0.55)" }}
          >
            Офлайн
          </p>
          <h1
            className="font-serif text-2xl font-bold"
            style={{ color: "#EDE5D5" }}
          >
            Няма връзка
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "rgba(249,246,240,0.4)" }}
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
            background: "linear-gradient(135deg, #C5A059 0%, #9A7A35 100%)",
            color: "#180F04",
          }}
        >
          Опитай отново
        </button>

        <p
          className="text-[10px]"
          style={{ color: "rgba(249,246,240,0.18)" }}
        >
          AMUR.BG · Бургас
        </p>
      </div>
    </div>
  );
}
