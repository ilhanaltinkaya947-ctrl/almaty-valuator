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
    <div className="crm-shell">
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <TelegramInit />
      <CRMToaster />
      <Sidebar />
      <main className="crm-main">
        {children}
      </main>
      <style>{`
        .crm-shell {
          display: flex;
          height: 100vh;
          height: 100dvh;
          overflow: hidden;
        }
        .crm-main {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          overflow-x: hidden;
          background: #0A0D14;
        }
        @media (max-width: 768px) {
          .crm-main {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
