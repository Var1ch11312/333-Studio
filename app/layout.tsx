import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "AMUR.BG — Доставка на цветя в Бургас",
  description:
    'Премиум доставка на букети в Бургас за под 2 часа. Протокол „Бели ръкавици“ — елегантно връчване с фото потвърждение.',
  keywords: ["цветя", "Бургас", "доставка цветя", "букети", "amur.bg"],
  openGraph: {
    title: "AMUR.BG",
    description: "Премиум доставка на букети в Бургас",
    locale: "bg_BG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bg"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
