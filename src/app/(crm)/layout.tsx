import type { Metadata } from "next";
import Script from "next/script";
import Sidebar from "@/components/crm/Sidebar";
import CRMToaster from "@/components/crm/CRMToaster";
import TelegramInit from "@/components/crm/TelegramInit";

export const metadata: Metadata = {
  title: "Алмавыкуп CRM",
  description: "Управление заявками",
  robots: "noindex, nofollow",
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <TelegramInit />
      <CRMToaster />
      <Sidebar />
      <main style={{ marginLeft: 220, height: "100vh", overflowY: "auto" }} className="crm-main">
        {children}
      </main>
      <style>{`
        @media (max-width: 768px) {
          .crm-main {
            margin-left: 0 !important;
            height: 100dvh !important;
          }
        }
      `}</style>
    </>
  );
}
