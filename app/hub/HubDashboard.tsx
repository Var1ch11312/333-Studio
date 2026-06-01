"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Package, CheckCircle, Truck, Loader2 } from "lucide-react";
import type { Order, OrderStatus } from "@/types";

const STATUS_STEPS: { icon: typeof Clock; label: string; value: OrderStatus }[] =
  [
    { icon: Package, label: "Получена", value: "pending" },
    { icon: Clock, label: "В изработка", value: "crafting" },
    { icon: Truck, label: "При куриера", value: "delivering" },
    { icon: CheckCircle, label: "Доставена", value: "delivered" },
  ];

const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  pending:    { label: "Нова", color: "#C5A059" },
  paid:       { label: "Платена", color: "#6B9E6E" },
  crafting:   { label: "В изработка", color: "#6B9E6E" },
  delivering: { label: "При куриера", color: "#5B8DB8" },
  delivered:  { label: "Доставена", color: "#555" },
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:    "crafting",
  paid:       "crafting",
  crafting:   "delivering",
  delivering: "delivered",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending:    "ВЗИМАМ",
  paid:       "ВЗИМАМ",
  crafting:   "Готово — предай на куриер",
  delivering: "Доставено",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, color } = STATUS_META[status] ?? { label: status, color: "#555" };
  return (
    <span
      className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm font-medium"
      style={{
        color,
        border: `1px solid ${color}40`,
        background: `${color}12`,
      }}
    >
      {label}
    </span>
  );
}

function ProgressBar({ currentStatus }: { currentStatus: OrderStatus }) {
  const statuses: OrderStatus[] = ["pending", "crafting", "delivering", "delivered"];
  const currentIdx = statuses.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 w-full">
      {STATUS_STEPS.map(({ icon: Icon, label, value }, i) => {
        const stepIdx = statuses.indexOf(value);
        const done = stepIdx <= currentIdx;
        return (
          <div key={value} className="flex items-center gap-1 flex-1 min-w-0">
            <div
              className="flex items-center gap-1 shrink-0"
              style={{ opacity: done ? 1 : 0.3 }}
            >
              <Icon className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground hidden sm:block truncate">
                {label}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className="flex-1 h-px mx-1"
                style={{ background: stepIdx < currentIdx ? "#C5A059" : "#333" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function HubDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .not("status", "eq", "delivered")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("[Hub] Failed to load orders:", error);
    } else {
      setOrders((data as Order[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();

    /* Real-time subscription — updates arrive without polling */
    const channel = supabase
      .channel("orders-hub")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => { loadOrders(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadOrders]);

  const advanceStatus = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;

    setUpdating(order.id);
    try {
      await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      await loadOrders();
    } finally {
      setUpdating(null);
    }
  };

  /* KPI counts */
  const kpi = {
    total: orders.length,
    crafting: orders.filter((o) => o.status === "crafting").length,
    delivering: orders.filter((o) => o.status === "delivering").length,
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Активни", value: kpi.total },
          { label: "В изработка", value: kpi.crafting },
          { label: "При куриер", value: kpi.delivering },
          { label: "Хъб", value: "Център" },
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

      {/* Orders */}
      <div className="flex flex-col gap-4">
        <h2 className="font-serif text-xl font-semibold">Активни поръчки</h2>

        {orders.length === 0 && (
          <p className="text-muted-foreground text-sm py-8 text-center">
            Няма активни поръчки в момента.
          </p>
        )}

        {orders.map((order) => {
          const nextLabel = NEXT_LABEL[order.status];
          const isUpdating = updating === order.id;
          const createdAt = new Date(order.created_at);
          const slaAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
          const fmt = (d: Date) =>
            d.toLocaleTimeString("bg-BG", {
              hour: "2-digit",
              minute: "2-digit",
            });

          return (
            <Card key={order.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center gap-4 p-6">
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <StatusBadge status={order.status} />
                    {order.payment_method === "cod" && (
                      <span className="text-[10px] text-primary border border-primary rounded-sm px-1.5 py-0.5" style={{ borderColor: "rgba(197,160,89,0.4)" }}>
                        Наложен платеж
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.delivery_address}
                  </p>
                  {order.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      {order.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-sm md:text-right">
                  <span className="font-semibold text-primary">
                    {Number(order.total_amount_eur).toFixed(2)} €
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {fmt(createdAt)}
                  </span>
                  <span className="text-xs text-primary font-medium">
                    SLA: {fmt(slaAt)}
                  </span>
                </div>

                {nextLabel && (
                  <Button
                    size="sm"
                    onClick={() => advanceStatus(order)}
                    disabled={isUpdating}
                    className="shrink-0"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      nextLabel
                    )}
                  </Button>
                )}
              </div>

              {/* Progress bar */}
              <div className="border-t border-border px-6 py-3">
                <ProgressBar currentStatus={order.status} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* White Gloves protocol checklist */}
      <Card style={{ borderColor: "rgba(197,160,89,0.3)" }}>
        <CardHeader>
          <CardTitle className="text-sm text-primary">
            Протокол „Бели ръкавици" — чеклист
          </CardTitle>
          <CardDescription className="text-xs">
            Задължителен при всяка доставка
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-2 text-xs text-muted-foreground">
            {[
              "Провери: букетът е с НЕЧЕТЕН брой стъбла",
              "Постави самоклеящ сургучен печат върху опаковката",
              "Поздрави получателя по скрипта (раздаден при обучението)",
              "Снимай момента на връчване и прати снимката на клиента в Viber",
              'Отбележи поръчката като „Доставена" в системата',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
