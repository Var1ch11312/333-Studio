import { AdminDashboard } from "./AdminDashboard";
import Link from "next/link";

export const metadata = {
  title: "AMUR.BG — Администрация",
  robots: "noindex,nofollow",
};

export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border py-4 px-4 sticky top-0 z-40 bg-background">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="font-serif text-xl font-bold tracking-widest text-primary">
                AMUR
              </span>
            </Link>
            <span className="text-muted-foreground text-sm">/ Администрация</span>
          </div>
          <div className="flex gap-3 text-xs">
            <Link href="/hub" className="text-muted-foreground hover:text-foreground transition-colors">
              Флорист хъб →
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <AdminDashboard />
        </div>
      </main>
    </div>
  );
}
