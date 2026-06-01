"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Users, ShoppingBag, Calendar } from "lucide-react";
import type { Order, Courier, OrderStatus } from "@/types";

type Tab = "orders" | "couriers" | "namedays";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:    "#C5A059",
  paid:       "#6B9E6E",
  crafting:   "#6B9E6E",
  delivering: "#5B8DB8",
  delivered:  "#555",
};

/* ─── Orders tab ─────────────────────────────────────── */
function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") query = query.eq("status", filter);

    const { data } = await query;
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const statuses: (OrderStatus | "all")[] = [
    "all", "pending", "paid", "crafting", "delivering", "delivered",
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground"
            }`}
          >
            {s === "all" ? "Всички" : s}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["ID", "Клиент", "Телефон", "Адрес", "EUR", "Плащане", "Статус", "Дата"].map(
                  (h) => (
                    <th key={h} className="pb-3 pr-4 text-xs text-muted-foreground font-medium">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                    {order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="py-3 pr-4">{order.customer_name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {order.customer_phone}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground max-w-xs truncate">
                    {order.delivery_address}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-primary">
                    {Number(order.total_amount_eur).toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 text-xs uppercase text-muted-foreground">
                    {order.payment_method}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-sm"
                      style={{
                        color: STATUS_COLORS[order.status],
                        background: `${STATUS_COLORS[order.status]}15`,
                        border: `1px solid ${STATUS_COLORS[order.status]}40`,
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("bg-BG", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders.length && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Няма поръчки
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Couriers tab ───────────────────────────────────── */
function CouriersTab() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", viber_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/couriers");
    const data = await res.json();
    setCouriers(data.couriers ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/couriers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); }
    else { setForm({ name: "", phone: "", viber_id: "" }); load(); }
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Add courier form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Добавяне на куриер</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              required
              placeholder="Име"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              required
              placeholder="Телефон"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              placeholder="Viber ID (незадължително)"
              value={form.viber_id}
              onChange={(e) => setForm((f) => ({ ...f, viber_id: e.target.value }))}
            />
            <div className="sm:col-span-3 flex items-center gap-3">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Добави"}
              </Button>
              {error && <span className="text-xs text-destructive-foreground">{error}</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Courier list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {couriers.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-5 pb-4 flex flex-col gap-1">
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.phone}</p>
                {c.viber_id && (
                  <p className="text-[10px] text-primary mt-1">
                    Viber: активен
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Name-days tab ──────────────────────────────────── */
function NameDaysTab() {
  const [data, setData] = useState<{ month: number; day: number; names: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/namedays/today")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const sendReminders = async () => {
    setSending(true);
    setResult(null);
    const res = await fetch("/api/cron/nameday-reminders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${prompt("CRON_SECRET:") ?? ""}`,
      },
    });
    const d = await res.json();
    setResult(res.ok ? `Изпратени: ${d.sent}` : d.error);
    setSending(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Именни дни днес</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : data?.names.length ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {data.names.map((n) => (
                  <span
                    key={n}
                    className="text-xs px-2 py-1 rounded border border-primary text-primary"
                    style={{ borderColor: "rgba(197,160,89,0.5)" }}
                  >
                    {n}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.day}.{String(data.month).padStart(2, "0")} — {data.names.length} имена
              </p>
              <Button size="sm" onClick={sendReminders} disabled={sending} className="w-fit">
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Изпрати напомняния за утре
              </Button>
              {result && (
                <p className="text-xs text-muted-foreground">{result}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Днес няма именни дни в календара.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Как работи системата</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground flex flex-col gap-2">
          <p>1. Клиентите дават opt-in при поръчка (GDPR съгласие).</p>
          <p>2. Всеки ден в 9:00 Vercel Cron вика <code className="text-primary">/api/cron/nameday-reminders</code>.</p>
          <p>3. Системата проверява утрешните именни дни и праща Viber напомняне.</p>
          <p>4. Всеки контакт получава максимум 1 напомняне на ден.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Main dashboard ─────────────────────────────────── */
export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("orders");

  const TABS: { key: Tab; label: string; icon: typeof ShoppingBag }[] = [
    { key: "orders", label: "Поръчки", icon: ShoppingBag },
    { key: "couriers", label: "Куриери", icon: Users },
    { key: "namedays", label: "Именни дни", icon: Calendar },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border flex gap-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <TabButton key={key} active={tab === key} onClick={() => setTab(key)}>
            <span className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </span>
          </TabButton>
        ))}
      </div>

      {tab === "orders"   && <OrdersTab />}
      {tab === "couriers" && <CouriersTab />}
      {tab === "namedays" && <NameDaysTab />}
    </div>
  );
}
