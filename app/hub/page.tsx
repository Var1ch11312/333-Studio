import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Package, CheckCircle, Truck } from "lucide-react";
import Link from "next/link";

/* Stub — full dashboard with Supabase real-time in Sprint 3 */

const STATUS_STEPS = [
  { icon: Package, label: "Получена", value: "pending" },
  { icon: Clock, label: "В изработка", value: "crafting" },
  { icon: Truck, label: "При куриера", value: "delivering" },
  { icon: CheckCircle, label: "Доставена", value: "delivered" },
] as const;

const MOCK_ORDERS = [
  {
    id: "ORD-001",
    product: "Розова Елегантност",
    address: "ул. Александровска 1",
    status: "crafting",
    time: "13:42",
    sla: "15:42",
  },
  {
    id: "ORD-002",
    product: "Алена Страст",
    address: "ж.к. Лазур, бл. 57",
    status: "pending",
    time: "14:05",
    sla: "16:05",
  },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "Нова", color: "#C5A059" },
    crafting: { label: "В изработка", color: "#6B9E6E" },
    delivering: { label: "При куриера", color: "#5B8DB8" },
    delivered: { label: "Доставена", color: "#666" },
  };
  const { label, color } = map[status] ?? { label: status, color: "#666" };
  return (
    <span
      className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm font-medium"
      style={{ color, border: `1px solid ${color}40`, background: `${color}10` }}
    >
      {label}
    </span>
  );
}

export default function HubDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="font-serif text-xl font-bold tracking-widest text-primary">
                AMUR
              </span>
            </Link>
            <span className="text-muted-foreground text-sm">/ Флорист</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Хъб: Център
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Днес", value: "2" },
              { label: "В изработка", value: "1" },
              { label: "При куриер", value: "0" },
              { label: "Доставени", value: "7" },
            ].map(({ label, value }) => (
              <Card key={label}>
                <CardContent className="pt-6 pb-4 flex flex-col gap-1">
                  <span className="text-2xl font-serif font-bold text-primary">
                    {value}
                  </span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Active orders */}
          <div className="flex flex-col gap-4">
            <h2 className="font-serif text-xl font-semibold">Активни поръчки</h2>

            {MOCK_ORDERS.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center gap-4 p-6">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {order.id}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="font-serif font-semibold text-base">
                      {order.product}
                    </p>
                    <p className="text-xs text-muted-foreground">{order.address}</p>
                  </div>

                  <div className="flex flex-col gap-1 text-right md:text-right">
                    <span className="text-xs text-muted-foreground">
                      Получена: {order.time}
                    </span>
                    <span className="text-xs text-primary font-medium">
                      SLA: {order.sla}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <Button size="sm">ВЗИМАМ →</Button>
                    )}
                    {order.status === "crafting" && (
                      <Button size="sm" variant="outline">
                        Готово ✓
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="border-t border-border px-6 py-3">
                  <div className="flex items-center gap-2">
                    {STATUS_STEPS.map(({ icon: Icon, label, value }, i) => {
                      const statuses = ["pending", "crafting", "delivering", "delivered"];
                      const currentIdx = statuses.indexOf(order.status);
                      const stepIdx = statuses.indexOf(value);
                      const done = stepIdx <= currentIdx;
                      return (
                        <div key={value} className="flex items-center gap-2 flex-1">
                          <div
                            className="flex items-center gap-1.5"
                            style={{ opacity: done ? 1 : 0.3 }}
                          >
                            <Icon className="w-3 h-3 text-primary shrink-0" />
                            <span className="text-[10px] text-muted-foreground hidden sm:block">
                              {label}
                            </span>
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div
                              className="flex-1 h-px"
                              style={{
                                background: stepIdx < currentIdx ? "#C5A059" : "#333",
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Protocol reminder */}
          <Card className="border-primary" style={{ borderColor: "rgba(197,160,89,0.3)" }}>
            <CardHeader>
              <CardTitle className="text-sm text-primary">
                Протокол „Бели ръкавици" — чеклист
              </CardTitle>
              <CardDescription className="text-xs">
                Задължителен при всяка доставка
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                {[
                  "Постави сургучен печат върху опаковката",
                  "Провери: букетът е с нечетен брой стъбла",
                  "Поздрави получателя по скрипта (раздаден при обучението)",
                  "Снимай момента на връчване и прати на клиента в Viber",
                  "Отбележи поръчката като „Доставена“ в системата",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
