import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DualPrice } from "@/components/DualPrice";
import { isDualPriceRequired } from "@/lib/constants";
import { Clock, MapPin, Shield, Camera } from "lucide-react";
import Link from "next/link";

/* ─── Placeholder catalog (replaced by Supabase data post-sprint) ─── */
const PLACEHOLDER_PRODUCTS = [
  {
    id: "1",
    title: "Розова Елегантност",
    description: "25 бели и розови рози, ароматни лилии, gypsophila",
    price_eur: 45,
    flower_count: 25,
    tag: "Бестселър",
  },
  {
    id: "2",
    title: "Алена Страст",
    description: "21 червени рози Ecuador, бабий лен, декоративна зеленина",
    price_eur: 55,
    flower_count: 21,
    tag: null,
  },
  {
    id: "3",
    title: "Бяла Приказка",
    description: "17 бели рози, орхидея Dendrobium, еустома",
    price_eur: 65,
    flower_count: 17,
    tag: "Премиум",
  },
  {
    id: "4",
    title: "Пролетна Радост",
    description: "Сезонни цветя — лалета, нарциси, хиацинти",
    price_eur: 39,
    flower_count: 15,
    tag: null,
  },
  {
    id: "5",
    title: "Корпоративен Шик",
    description: "51 смесени рози, монобукет с луксозна опаковка",
    price_eur: 110,
    flower_count: 51,
    tag: "B2B",
  },
  {
    id: "6",
    title: "Изненада за Именник",
    description: "Персонализиран букет — свободен избор на флориста",
    price_eur: 35,
    flower_count: 11,
    tag: "Именен ден",
  },
];

const TRUST_PILLARS = [
  {
    icon: Clock,
    title: "Доставка до 2 часа",
    body: "SLA гаранция в целия Бургас. При закъснение — отстъпка 20%.",
  },
  {
    icon: Shield,
    title: "Протокол „Бели ръкавици“",
    body: "Сургучен печат, скрипт на връчване, фотодокументация.",
  },
  {
    icon: Camera,
    title: "Фото потвърждение",
    body: "Снимка от момента на връчване директно в Viber / SMS.",
  },
  {
    icon: MapPin,
    title: "Само Бургас",
    body: "Хипер-локален фокус = перфектно изпълнение, всеки път.",
  },
];


export default function StorefrontPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-none">
            <span className="font-serif text-2xl font-bold tracking-widest text-primary">
              AMUR
            </span>
            <span className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
              Бургас · Цветя с характер
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Каталог
            </Link>
            <Link href="#about" className="hover:text-foreground transition-colors">
              За нас
            </Link>
            <Link href="/hub" className="hover:text-foreground transition-colors">
              Флористи
            </Link>
          </nav>

          <Link href="/checkout">
            <Button size="sm">Поръчай сега</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative py-24 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary opacity-[0.03] blur-3xl" />
          </div>

          <div className="relative max-w-3xl mx-auto">
            <p className="text-xs tracking-[0.4em] text-primary uppercase mb-4">
              Бургас · Премиум Доставка
            </p>
            <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight mb-6">
              Подарете{" "}
              <em className="not-italic text-primary">емоция</em>,
              <br />
              не просто цветя.
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Доставяме букети в целия Бургас за под 2 часа. Всяко връчване е
              събитие — с протокол „Бели ръкавици" и фото потвърждение.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/checkout">
                <Button size="lg" className="w-full sm:w-auto">
                  Поръчай сега
                </Button>
              </Link>
              <a href="#catalog">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Виж каталога
                </Button>
              </a>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Доставка в Бургас · Плащане с карта или наложен платеж (€)
            </p>
          </div>
        </section>

        {/* ── Trust pillars ── */}
        <section className="border-y border-border py-12 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {TRUST_PILLARS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="w-9 h-9 rounded border border-primary flex items-center justify-center" style={{ borderColor: "rgba(197,160,89,0.3)" }}>
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-serif font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Catalog ── */}
        <section id="catalog" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs tracking-[0.4em] text-primary uppercase mb-2">
                Нашата селекция
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold">
                Каталог
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PLACEHOLDER_PRODUCTS.map((product) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden transition-colors"
                >
                  {/* Product image placeholder */}
                  <div className="relative h-56 bg-secondary flex items-center justify-center overflow-hidden">
                    <span className="font-serif text-6xl text-primary select-none" style={{ opacity: 0.2 }}>
                      ✿
                    </span>
                    {product.tag && (
                      <span className="absolute top-3 left-3 text-[10px] tracking-widest uppercase bg-primary text-primary-foreground px-2 py-1 rounded-sm">
                        {product.tag}
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground">
                      {product.flower_count} стъбла
                    </span>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{product.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {product.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pb-0">
                    <DualPrice priceEur={product.price_eur} />
                  </CardContent>

                  <CardFooter className="pt-4">
                    <Link href={`/checkout?product=${product.id}`} className="w-full">
                      <Button className="w-full" size="sm">
                        Поръчай
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Dual-price legal notice ── */}
        {isDualPriceRequired() && (
          <section className="py-6 px-4 border-t border-border">
            <p className="max-w-6xl mx-auto text-center text-[11px] text-muted-foreground">
              Цените се показват едновременно в евро (EUR) и лева (BGN) по
              фиксиран курс 1 EUR = 1,95583 BGN съгласно Закона за въвеждане на
              еврото в България — в сила до 08.08.2026.
            </p>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-serif text-sm text-primary font-semibold tracking-widest">
            AMUR.BG
          </span>
          <span>© {new Date().getFullYear()} AMUR.BG · Бургас, България</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">
              Политика за поверителност
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Условия
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
