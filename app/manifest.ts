import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kiss My Flowers — Любов и романтика",
    short_name: "Kiss My Flowers",
    description:
      "Романтични букети с доставка за под 2 часа в Бургас. Любов, опакована с грижа.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBF6F3",
    theme_color: "#A8324A",
    lang: "bg",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: "Разгледай каталога",
        short_name: "Каталог",
        description: "Отвори каталога с букети",
        url: "/",
        icons: [{ src: "/icons/icon-192.svg", sizes: "192x192" }],
      },
      {
        name: "Направи поръчка",
        short_name: "Поръчай",
        description: "Поръчай букет за доставка",
        url: "/checkout",
        icons: [{ src: "/icons/icon-192.svg", sizes: "192x192" }],
      },
    ],
  };
}
