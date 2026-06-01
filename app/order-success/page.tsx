import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string; type?: string }>;
}) {
  const { order_id, type } = await searchParams;
  const shortId = order_id?.slice(0, 8).toUpperCase() ?? "—";
  const isCOD = type === "cod";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md">
        <div className="w-16 h-16 rounded-full border border-primary flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs tracking-[0.4em] text-primary uppercase">
            Поръчка приета
          </p>
          <h1 className="font-serif text-3xl font-bold">Благодарим ви!</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Поръчка{" "}
            <span className="font-mono text-foreground">#{shortId}</span> е
            получена.
          </p>
        </div>

        <div className="w-full border border-border rounded p-5 flex flex-col gap-3 text-sm text-left">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Какво следва
            </span>
          </div>
          <ol className="flex flex-col gap-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-semibold shrink-0">1.</span>
              {isCOD
                ? "Диспечерът е уведомен. Флористът приема поръчката."
                : "Плащането е потвърдено. Флористът е уведомен в Viber."}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-semibold shrink-0">2.</span>
              Букетът се изработва с внимание към детайла.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-semibold shrink-0">3.</span>
              Доставка с протокол „Бели ръкавици" в рамките на{" "}
              <strong className="text-foreground">2 часа</strong>.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-semibold shrink-0">4.</span>
              Получавате снимка от момента на връчване в Viber/SMS.
            </li>
          </ol>
        </div>

        {isCOD && (
          <p className="text-xs text-muted-foreground border border-border rounded px-4 py-3">
            Плащането е в евро (€) при получаване. Моля, пригответе точна сума.
          </p>
        )}

        <Link href="/" className="w-full">
          <Button variant="outline" className="w-full">
            Обратно към каталога
          </Button>
        </Link>
      </div>
    </div>
  );
}
