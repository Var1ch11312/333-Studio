import { HubDashboard } from "./HubDashboard";
import Link from "next/link";

export const metadata = {
  title: "AMUR.BG — Флорист хъб",
};

export default function HubPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border py-4 px-4 sticky top-0 z-40 bg-background">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="font-serif text-xl font-bold tracking-widest text-primary">
                AMUR
              </span>
            </Link>
            <span className="text-muted-foreground text-sm">/ Флорист хъб</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Активен · Бургас Център
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <HubDashboard />
        </div>
      </main>
    </div>
  );
}
