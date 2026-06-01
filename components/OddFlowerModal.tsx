"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

type Props = {
  flowerCount: number;
  onClose: () => void;
};

/**
 * Блокирующий модал при попытке оформить заказ с чётным числом стеблей.
 * Чётный букет = знак скорби в болгарской культуре.
 * Не имеет кнопки «продолжить» — пользователь обязан вернуться и исправить.
 */
export function OddFlowerModal({ flowerCount, onClose }: Props) {
  /* Закрыть по Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* Заблокировать скролл пока открыт */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div className="relative w-full max-w-sm bg-card border border-border rounded-lg shadow-2xl flex flex-col gap-0 overflow-hidden">

        {/* Red accent top bar */}
        <div className="h-1 w-full bg-destructive" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive-foreground" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h2 className="font-serif font-semibold text-base leading-tight">
                Внимание! Четен брой стъбла
              </h2>
              <p className="text-xs text-muted-foreground">
                {flowerCount} стъбла → трябва да е нечетно
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 flex flex-col gap-4">
          <div className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary pl-3">
            <p>
              В България <strong className="text-foreground">четен брой цветя</strong> е
              традиционен знак за <strong className="text-foreground">траур и съболезнования</strong>.
            </p>
            <p className="mt-2">
              За да не огорчите получателя, букетите трябва да съдържат
              нечетен брой стъбла — 1, 3, 5, 7, 9, 11...
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={onClose} className="w-full">
              Разбрах — ще сменя количеството
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              Поръчката няма да бъде изпратена, докато броят не е нечетен.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
