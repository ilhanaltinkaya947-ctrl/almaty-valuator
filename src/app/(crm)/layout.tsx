import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Алмавыкуп CRM",
  description: "Управление заявками",
  robots: "noindex, nofollow",
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "10px 16px",
        background: "#0A0D14",
        borderBottom: "1px solid #1E2A3A",
      }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#C8A44E", marginRight: "auto" }}>
          Алмавыкуп
        </span>
        <a href="/leads" style={{
          fontSize: 13, fontWeight: 600, color: "#8B95A8", textDecoration: "none",
          padding: "4px 10px", borderRadius: 6,
        }}>
          Лиды
        </a>
        <a href="/settings" style={{
          fontSize: 13, fontWeight: 600, color: "#8B95A8", textDecoration: "none",
          padding: "4px 10px", borderRadius: 6,
        }}>
          Настройки
        </a>
        <a href="/mobile" style={{
          fontSize: 13, fontWeight: 600, color: "#8B95A8", textDecoration: "none",
          padding: "4px 10px", borderRadius: 6,
        }}>
          Мобильный
        </a>
      </nav>
      {children}
    </>
  );
}
