import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductPageClient } from "./ProductPageClient";
import { PRODUCTS } from "@/lib/catalog";
import type { CatalogProduct } from "@/lib/catalog";

const FALLBACK: CatalogProduct[] = PRODUCTS;

async function fetchProducts(): Promise<CatalogProduct[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return FALLBACK;
    const res = await fetch(
      `${url}/rest/v1/products?select=id,title,description,price_eur,flower_count,tag,image_url&active=eq.true&order=price_eur.asc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 60 } }
    );
    if (!res.ok) return FALLBACK;
    const data: CatalogProduct[] = await res.json();
    return data.length ? data : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const all = await fetchProducts();
  const product = all.find((p) => p.id === id);
  if (!product) notFound();

  const related = all.filter((p) => p.id !== id).slice(0, 4);

  return (
    <>
      <SiteHeader />
      <ProductPageClient product={product} related={related} />
    </>
  );
}
