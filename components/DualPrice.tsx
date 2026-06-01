import { formatDualPrice, isDualPriceRequired } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  priceEur: number;
  className?: string;
  /* layout="stacked" → EUR сверху, BGN снизу (карточка товара)
     layout="inline"  → EUR / BGN на одной строке (чекаут) */
  layout?: "stacked" | "inline";
};

/**
 * Отображает цену в EUR и BGN одинаковым размером и весом шрифта.
 * Соответствует требованию равнозначного отображения до 08.08.2026
 * (Закон за въвеждане на еврото, чл. 12).
 */
export function DualPrice({ priceEur, className, layout = "stacked" }: Props) {
  const { eur, bgn } = formatDualPrice(priceEur);
  const showDual = isDualPriceRequired();

  if (!showDual) {
    return (
      <span className={cn("text-base font-semibold text-primary", className)}>
        {eur}
      </span>
    );
  }

  if (layout === "inline") {
    return (
      <span className={cn("flex items-baseline gap-1 text-sm font-semibold", className)}>
        <span className="text-primary">{eur}</span>
        <span className="text-muted-foreground font-normal">/</span>
        <span className="text-foreground">{bgn}</span>
      </span>
    );
  }

  /* stacked — обе строки одинакового размера (text-sm font-semibold) */
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-sm font-semibold text-primary">{eur}</span>
      <span className="text-sm font-semibold text-foreground">{bgn}</span>
    </div>
  );
}
