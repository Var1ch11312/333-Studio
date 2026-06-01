import { Suspense } from "react";
import { CheckoutContent } from "./CheckoutContent";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "AMUR.BG — Оформяне на поръчка",
};

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutContent />
    </Suspense>
  );
}
