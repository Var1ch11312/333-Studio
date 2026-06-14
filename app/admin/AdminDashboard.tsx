"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Users, ShoppingBag, Calendar, FileText, Package } from "lucide-react";
import type { Order, Courier, OrderStatus, Product } from "@/types";

type Tab = "orders" | "couriers" | "namedays" | "reports" | "catalog";

type AgentReport = {
  id: string;
  agent_type: "accountant" | "lawyer" | "marketing";
  period_start: string;
  period_end: string;
  summary: string;
  full_report: Record<string, unknown>;
  created_at: string;
};

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

/* ─── AI Reports tab ─────────────────────────────────── */
const AGENT_LABELS: Record<AgentReport["agent_type"], { label: string; color: string }> = {
  accountant: { label: "Бухгалтер", color: "#6B9E6E" },
  lawyer:     { label: "Юрист",     color: "#5B8DB8" },
  marketing:  { label: "Маркетолог", color: "#C5A059" },
};

function ReportsTab() {
  const [reports, setReports] = useState<AgentReport[]>([]);
  const [filter, setFilter] = useState<AgentReport["agent_type"] | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const url = filter === "all" ? "/api/admin/reports" : `/api/admin/reports?type=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Грешка при зареждане");
    else setReports(data.reports ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filters: (AgentReport["agent_type"] | "all")[] = ["all", "accountant", "lawyer", "marketing"];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground"
            }`}
          >
            {f === "all" ? "Всички" : AGENT_LABELS[f].label}
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
      ) : error ? (
        <p className="text-center text-destructive-foreground py-8 text-sm">{error}</p>
      ) : !reports.length ? (
        <p className="text-center text-muted-foreground py-8 text-sm">
          Все още няма отчети. Агентите се стартират по график (1-ви/15-и и понеделник).
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => {
            const agent = AGENT_LABELS[r.agent_type];
            const open = expanded === r.id;
            return (
              <Card key={r.id}>
                <CardContent className="pt-4 pb-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-sm"
                      style={{ color: agent.color, background: `${agent.color}15`, border: `1px solid ${agent.color}40` }}
                    >
                      {agent.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.period_start} → {r.period_end}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("bg-BG", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{r.summary}</p>
                  <button
                    onClick={() => setExpanded(open ? null : r.id)}
                    className="text-xs text-primary hover:underline w-fit"
                  >
                    {open ? "Скрий пълния отчет" : "Покажи пълния отчет"}
                  </button>
                  {open && (
                    <pre className="text-[11px] bg-secondary/40 rounded-lg p-3 overflow-x-auto text-muted-foreground">
                      {JSON.stringify(r.full_report, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Catalog tab ────────────────────────────────────── */
type ProductForm = {
  title: string;
  description: string;
  price_eur: string;
  flower_count: string;
  tag: string;
};

const EMPTY_FORM: ProductForm = {
  title: "",
  description: "",
  price_eur: "",
  flower_count: "",
  tag: "",
};

function CatalogTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({
    open: false,
    editId: null,
  });
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal({ open: false, editId: null });
    // small delay so state settles before opening
    setTimeout(() => setModal({ open: true, editId: null }), 0);
  };

  const openEdit = (p: Product) => {
    setForm({
      title: p.title,
      description: p.description ?? "",
      price_eur: String(p.price_eur),
      flower_count: String(p.flower_count),
      tag: p.tag ?? "",
    });
    setFormError(null);
    setModal({ open: true, editId: p.id });
  };

  const closeModal = () => setModal({ open: false, editId: null });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      title: form.title,
      description: form.description,
      price_eur: parseFloat(form.price_eur),
      flower_count: parseInt(form.flower_count, 10),
      tag: form.tag,
    };

    const url = modal.editId
      ? `/api/admin/products/${modal.editId}`
      : "/api/admin/products";
    const method = modal.editId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error ?? "Грешка при запис");
    } else {
      closeModal();
      load();
    }
    setSaving(false);
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    load();
  };

  const handleImageUpload = async (id: string, file: File) => {
    setUploadingFor(id);
    const fd = new FormData();
    fd.append("file", file);
    await fetch(`/api/admin/products/${id}/image`, { method: "POST", body: fd });
    load();
    setUploadingFor(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products.length} продукта
        </p>
        <Button size="sm" onClick={openAdd}>
          + Добави продукт
        </Button>
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
                {["Снимка", "Заглавие", "EUR", "Цветя", "Таг", "Статус", ""].map((h) => (
                  <th
                    key={h}
                    className="pb-3 pr-4 text-xs text-muted-foreground font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-border/50 hover:bg-secondary/30 transition-colors${
                    !p.active ? " opacity-50" : ""
                  }`}
                >
                  {/* Photo cell — click to upload */}
                  <td className="py-3 pr-4">
                    <label className="cursor-pointer group relative block w-10 h-10">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageUpload(p.id, f);
                          e.target.value = "";
                        }}
                      />
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.title}
                          className="w-10 h-10 rounded object-cover group-hover:opacity-60 transition-opacity"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-secondary/60 transition-colors">
                          {uploadingFor === p.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <span className="text-[10px]">＋</span>
                          )}
                        </div>
                      )}
                    </label>
                  </td>

                  <td className="py-3 pr-4 font-medium max-w-[180px] truncate">
                    {p.title}
                  </td>
                  <td className="py-3 pr-4 text-primary font-semibold">
                    {Number(p.price_eur).toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.flower_count}</td>
                  <td className="py-3 pr-4">
                    {p.tag && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-sm border"
                        style={{ borderColor: "rgba(197,160,89,0.4)", color: "rgba(197,160,89,0.85)" }}
                      >
                        {p.tag}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => handleToggleActive(p.id, p.active)}
                      className={`text-[10px] px-2 py-0.5 rounded-sm border transition-colors ${
                        p.active
                          ? "border-green-600/40 text-green-400 hover:border-red-500/40 hover:text-red-400"
                          : "border-red-500/40 text-red-400 hover:border-green-600/40 hover:text-green-400"
                      }`}
                    >
                      {p.active ? "Активен" : "Неактивен"}
                    </button>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Редактирай
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!products.length && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Каталогът е празен
            </p>
          )}
        </div>
      )}

      {/* Add / Edit modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-background border border-border rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4">
            <h2 className="text-sm font-semibold">
              {modal.editId ? "Редактиране на продукт" : "Нов продукт"}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Заглавие *</label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Розова Елегантност"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Описание</label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="25 бели и розови рози, лилии..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Цена (EUR) *</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="1"
                    value={form.price_eur}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price_eur: e.target.value }))
                    }
                    placeholder="45.00"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Брой цветя *</label>
                  <Input
                    required
                    type="number"
                    min="1"
                    value={form.flower_count}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, flower_count: e.target.value }))
                    }
                    placeholder="25"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">
                  Таг (незадължителен)
                </label>
                <Input
                  value={form.tag}
                  onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
                  placeholder="Бестселър / Премиум / B2B..."
                />
              </div>

              {formError && (
                <p className="text-xs text-red-400">{formError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modal.editId ? "Запази" : "Добави"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={closeModal}
                >
                  Отказ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main dashboard ─────────────────────────────────── */
export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("orders");

  const TABS: { key: Tab; label: string; icon: typeof ShoppingBag }[] = [
    { key: "orders",   label: "Поръчки",     icon: ShoppingBag },
    { key: "couriers", label: "Куриери",     icon: Users },
    { key: "namedays", label: "Именни дни",  icon: Calendar },
    { key: "reports",  label: "AI Отчети",   icon: FileText },
    { key: "catalog",  label: "Каталог",     icon: Package },
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
      {tab === "reports"  && <ReportsTab />}
      {tab === "catalog"  && <CatalogTab />}
    </div>
  );
}
