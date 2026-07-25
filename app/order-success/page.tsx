import { CheckCircle, Clock, Flower2, Camera, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;
  const shortId = order_id?.slice(0, 8).toUpperCase() ?? "—";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "#FBF6F3" }}
    >
      {/* Back link */}
      <Link
        href="/"
        className="fixed top-4 left-4 flex items-center gap-2 text-xs transition-opacity hover:opacity-70"
        style={{ color: "rgba(168,50,74,0.55)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Каталог
      </Link>

      <div className="flex flex-col items-center gap-8 max-w-sm w-full text-center">

        {/* ── Success icon with glow ── */}
        <div className="relative">
          {/* Outer ambient glow */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(168,50,74,0.18) 0%, transparent 70%)",
              transform: "scale(2.4)",
            }}
          />
          {/* Ring */}
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(168,50,74,0.07)",
              border: "1px solid rgba(168,50,74,0.35)",
              boxShadow: "0 0 32px rgba(168,50,74,0.12), inset 0 0 20px rgba(168,50,74,0.05)",
            }}
          >
            <CheckCircle className="w-9 h-9" style={{ color: "#A8324A" }} />
          </div>
        </div>

        {/* ── Heading ── */}
        <div className="flex flex-col gap-2">
          <p
            className="text-[10px] tracking-[0.45em] uppercase"
            style={{ color: "rgba(168,50,74,0.6)" }}
          >
            Поръчка приета
          </p>
          <h1 className="font-serif text-3xl font-bold" style={{ color: "#2B2220" }}>
            Благодарим ви!
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(110,95,89,0.45)" }}>
            Поръчка{" "}
            <span
              className="font-mono px-1.5 py-0.5 rounded"
              style={{ color: "#A8324A", background: "rgba(168,50,74,0.1)", fontSize: 12 }}
            >
              #{shortId}
            </span>{" "}
            е получена и се обработва.
          </p>
        </div>

        {/* ── What happens next ── */}
        <div
          className="w-full rounded-2xl overflow-hidden text-left"
          style={{ background: "#FFFFFF", border: "1px solid rgba(168,50,74,0.14)" }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid rgba(168,50,74,0.1)" }}
          >
            <p
              className="text-[10px] tracking-[0.35em] uppercase"
              style={{ color: "rgba(168,50,74,0.55)" }}
            >
              Какво следва
            </p>
          </div>

          <div className="flex flex-col divide-y" style={{ borderColor: "rgba(168,50,74,0.07)" }}>
            {[
              {
                icon: CheckCircle,
                step: "1",
                title: "Плащането е потвърдено",
                body: "Флористът е уведомен в реално време чрез Viber.",
              },
              {
                icon: Flower2,
                step: "2",
                title: "Изработване на букета",
                body: "Изработваме с внимание към всеки детайл и цвят.",
              },
              {
                icon: Clock,
                step: "3",
                title: "Доставка до 2 часа",
                body: 'Протокол „Бели ръкавици" — прецизно и деликатно.',
              },
              {
                icon: Camera,
                step: "4",
                title: "Фото потвърждение",
                body: "Снимка от момента на връчване директно в Viber / SMS.",
              },
            ].map(({ icon: Icon, step, title, body }) => (
              <div key={step} className="flex items-start gap-4 px-5 py-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: "rgba(168,50,74,0.08)",
                    border: "1px solid rgba(168,50,74,0.18)",
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#A8324A" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-snug" style={{ color: "#2B2220" }}>
                    {title}
                  </p>
                  <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "rgba(110,95,89,0.4)" }}>
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SLA note ── */}
        <p
          className="text-[11px] leading-relaxed px-2"
          style={{ color: "rgba(110,95,89,0.28)" }}
        >
          SLA гаранция: при закъснение над 2 часа получавате{" "}
          <span style={{ color: "rgba(168,50,74,0.6)" }}>20% отстъпка</span> от следваща поръчка.
        </p>

        {/* ── CTA ── */}
        <Link href="/" className="w-full">
          <div
            className="w-full text-center py-4 rounded-2xl font-semibold tracking-wider text-sm"
            style={{
              background: "linear-gradient(135deg, #C24B5E 0%, #8E2438 100%)",
              color: "#FFFFFF",
              boxShadow: "0 6px 20px rgba(168,50,74,0.25)",
            }}
          >
            Обратно към колекцията
          </div>
        </Link>

        <p
          className="text-[10px]"
          style={{ color: "rgba(110,95,89,0.18)" }}
        >
          1 EUR = 1,95583 BGN · Kiss My Flowers · Бургас
        </p>
      </div>
    </div>
  );
}
