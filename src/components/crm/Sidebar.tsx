"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  emoji: string;
  label: string;
  href: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { emoji: "📊", label: "Лиды", href: "/leads" },
  { emoji: "👥", label: "Клиенты", href: "/clients" },
  { emoji: "📦", label: "Архив", href: "/archive" },
  { emoji: "🏢", label: "База ЖК", href: "/complexes" },
  { emoji: "📈", label: "Вторичка", href: "/zones" },
  { emoji: "⚙️", label: "Настройки", href: "/settings" },
];

const ROLE_NAV: Record<string, NavItem[]> = {
  admin: ALL_NAV_ITEMS,
  manager: [
    { emoji: "📊", label: "Лиды", href: "/leads" },
    { emoji: "📦", label: "Архив", href: "/archive" },
  ],
  jurist: [
    { emoji: "⚖️", label: "На проверку", href: "/leads" },
    { emoji: "📦", label: "Архив", href: "/archive" },
  ],
  director: [
    { emoji: "📋", label: "На согласование", href: "/leads" },
    { emoji: "📦", label: "Архив", href: "/archive" },
  ],
  cashier: [
    { emoji: "💰", label: "Выплаты", href: "/leads" },
    { emoji: "📦", label: "Архив", href: "/archive" },
  ],
};

interface TelegramWebApp {
  initData: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(ALL_NAV_ITEMS);

  useEffect(() => {
    const tg = (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram?.WebApp;
    const initData = tg?.initData ?? "";

    fetch("/api/crm/auth/me", {
      headers: { "x-telegram-init-data": initData },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profileRole) {
          setNavItems(ROLE_NAV[data.profileRole] ?? ROLE_NAV.manager);
        }
      })
      .catch(() => {});
  }, []);

  if (pathname.startsWith("/mobile")) return null;

  return (
    <>
      {/* Mobile top bar with burger */}
      <div className="crm-topbar">
        <button
          onClick={() => setOpen(true)}
          style={{
            background: "none",
            border: "none",
            color: "#F1F3F7",
            fontSize: 22,
            cursor: "pointer",
            padding: 4,
          }}
          aria-label="Меню"
        >
          ☰
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#C8A44E" }}>
          Алмавыкуп
        </span>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="crm-backdrop"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`crm-sidebar ${open ? "crm-sidebar--open" : ""}`}>
        <div style={{ padding: "20px 16px 24px", borderBottom: "1px solid #1E2A3A" }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#C8A44E" }}>
            Алмавыкуп
          </span>
          <div style={{ fontSize: 11, color: "#5A6478", marginTop: 2 }}>CRM</div>
        </div>

        <nav style={{ padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#C8A44E" : "#8B95A8",
                  background: isActive ? "#C8A44E14" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 16 }}>{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <style>{`
        .crm-topbar {
          display: none;
        }
        .crm-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 220px;
          height: 100vh;
          background: #0D1118;
          border-right: 1px solid #1E2A3A;
          z-index: 100;
          flex-shrink: 0;
        }
        .crm-backdrop {
          display: none;
        }
        @media (max-width: 768px) {
          .crm-topbar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            background: #0D1118;
            border-bottom: 1px solid #1E2A3A;
            position: sticky;
            top: 0;
            z-index: 90;
          }
          .crm-sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            z-index: 110;
          }
          .crm-sidebar--open {
            transform: translateX(0);
          }
          .crm-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 105;
          }
        }
      `}</style>
    </>
  );
}
