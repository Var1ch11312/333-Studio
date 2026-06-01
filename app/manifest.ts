import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AMUR.BG — Цветя с характер",
    short_name: "AMUR",
    description:
      "Хипер-локална доставка на букети в Бургас до 2 часа. Протокол Бели ръкавици.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A0907",
    theme_color: "#C5A059",
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
