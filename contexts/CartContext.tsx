"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type CartItem = {
  id: string;
  title: string;
  price_eur: number;
  flower_count: number;
  image_url: string | null;
  tag: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalEur: number;
  addItem: (product: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "amur_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const addItem = useCallback((product: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      const next = existing
        ? prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i)
        : [...prev, { ...product, quantity: qty }];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    persist(items.filter((i) => i.id !== id));
  }, [items, persist]);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) { persist(items.filter((i) => i.id !== id)); return; }
    persist(items.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  }, [items, persist]);

  const clear = useCallback(() => persist([]), [persist]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalEur = items.reduce((s, i) => s + i.price_eur * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, totalItems, totalEur, addItem, removeItem, updateQty, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
