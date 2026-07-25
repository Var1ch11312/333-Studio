import { CheckoutContent } from "./CheckoutContent";
import { PRODUCTS, getProduct, type CatalogProduct } from "@/lib/catalog";
import { SITE } from "@/lib/site";

export const metadata = {
  title: `${SITE.brand} — Оформяне на поръчка`,
};

/**
 * Resolve the bouquet to check out:
 *   1. local catalog (lib/catalog.ts) — works with zero backend
 *   2. live Supabase `products` row (when configured) — supports UUID ids
 *   3. first catalog item as a safe fallback
 */
async function resolveProduct(id: string): Promise<CatalogProduct> {
  const local = getProduct(id);
  if (local) return local;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const res = await fetch(
        `${url}/rest/v1/products?select=id,title,description,price_eur,flower_count,tag,image_url&id=eq.${encodeURIComponent(id)}&limit=1`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 60 } }
      );
      if (res.ok) {
        const rows: CatalogProduct[] = await res.json();
        if (rows.length) return rows[0];
      }
    } catch {
      /* fall through to default */
    }
  }
  return PRODUCTS[0];
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productId } = await searchParams;
  const product = await resolveProduct(productId ?? PRODUCTS[0].id);
  return <CheckoutContent product={product} />;
}
