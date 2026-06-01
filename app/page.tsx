import { LandingPage } from "@/components/LandingPage";
import type { CatalogProduct } from "@/components/CatalogClient";

const FALLBACK: CatalogProduct[] = [
  { id: "1", title: "Розова Елегантност",  description: "25 бели и розови рози, ароматни лилии, gypsophila",        price_eur: 45,  flower_count: 25, tag: "Бестселър",  image_url: null },
  { id: "2", title: "Алена Страст",        description: "21 червени рози Ecuador, бабий лен, декоративна зеленина", price_eur: 55,  flower_count: 21, tag: null,         image_url: null },
  { id: "3", title: "Бяла Приказка",       description: "17 бели рози, орхидея Dendrobium, еустома",                price_eur: 65,  flower_count: 17, tag: "Премиум",    image_url: null },
  { id: "4", title: "Пролетна Радост",     description: "Сезонни цветя — лалета, нарциси, хиацинти",               price_eur: 39,  flower_count: 15, tag: null,         image_url: null },
  { id: "5", title: "Корпоративен Шик",    description: "51 смесени рози, монобукет с луксозна опаковка",           price_eur: 110, flower_count: 51, tag: "B2B",        image_url: null },
  { id: "6", title: "Изненада за Именник", description: "Персонализиран букет — свободен избор на флориста",        price_eur: 35,  flower_count: 11, tag: "Именен ден", image_url: null },
];

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

export default async function HomePage() {
  const products = await fetchProducts();
  return <LandingPage products={products} />;
}
