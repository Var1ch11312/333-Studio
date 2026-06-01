import { Suspense } from "react";
import { LoginContent } from "./LoginContent";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "AMUR.BG — Вход",
  robots: "noindex,nofollow",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
