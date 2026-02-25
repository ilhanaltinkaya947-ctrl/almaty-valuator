import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Алмавыкуп — Срочный выкуп недвижимости в Алматы | Оплата сразу",
  description:
    "Срочный выкуп квартир, домов, коммерческой недвижимости и земельных участков в Алматы. Любое состояние. Оплата в день сделки. Бесплатная оценка.",
  keywords:
    "выкуп недвижимости алматы, срочный выкуп квартиры, продать квартиру быстро алматы, скупка недвижимости",
  icons: {
    icon: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
  openGraph: {
    title: "Алмавыкуп — Срочный выкуп недвижимости в Алматы",
    description:
      "Продайте недвижимость быстро и выгодно. Оплата в день сделки.",
    locale: "ru_RU",
    type: "website",
    url: "https://almavykup.kz",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" style={{ backgroundColor: "#08090E" }} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrains.variable} font-sans antialiased`}
        style={{ backgroundColor: "#08090E", color: "#E8EAF0" }}
      >
        {children}
      </body>
    </html>
  );
}
