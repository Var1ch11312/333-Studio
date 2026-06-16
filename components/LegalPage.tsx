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
    <div className="min-h-screen" style={{ background: "#FBF6F3", color: "#6E5F59" }}>
      <div className="max-w-2xl mx-auto px-5 py-14">
        <Link
          href="/"
          className="inline-block text-xs tracking-wider uppercase mb-10"
          style={{ color: "#A8324A" }}
        >
          ← Kiss My Flowers
        </Link>
        <h1
          className="font-serif text-3xl font-semibold mb-2"
          style={{ color: "#2B2220" }}
        >
          {title}
        </h1>
        <p className="text-xs mb-10" style={{ color: "#9B8B84" }}>
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
      <h2 className="font-semibold text-base mb-2" style={{ color: "#A8324A" }}>
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
