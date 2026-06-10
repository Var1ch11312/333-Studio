import type { MetadataRoute } from "next";

const BASE = "https://amur.bg";

async function fetchProductIds(): Promise<string[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];
    const res = await fetch(
      `${url}/rest/v1/products?select=id&active=eq.true`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data: { id: string }[] = await res.json();
    return data.map((p) => p.id);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productIds = await fetchProductIds();

  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/refund`, changeFrequency: "yearly", priority: 0.3 },
    ...productIds.map((id) => ({
      url: `${BASE}/product/${id}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
