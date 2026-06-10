import Link from "next/link";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: "#0D0D12", color: "rgba(250,248,245,0.75)" }}>
      <div className="max-w-2xl mx-auto px-5 py-14">
        <Link
          href="/"
          className="inline-block text-xs tracking-wider uppercase mb-10"
          style={{ color: "#C9A84C" }}
        >
          ← AMUR.BG
        </Link>
        <h1
          className="font-serif text-3xl font-semibold mb-2"
          style={{ color: "#FAF8F5" }}
        >
          {title}
        </h1>
        <p className="text-xs mb-10" style={{ color: "rgba(250,248,245,0.35)" }}>
          Последна актуализация: {updated}
        </p>
        <div className="legal-body flex flex-col gap-6 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold text-base mb-2" style={{ color: "#C9A84C" }}>
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
