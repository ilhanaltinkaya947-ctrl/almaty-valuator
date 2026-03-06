"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/crm-constants";
import type { Client } from "@/types/database";

interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const getTg = () => (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram?.WebApp;
  const getInitData = () => getTg()?.initData ?? "";

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/crm/clients${params}`, {
        headers: { "x-telegram-init-data": getInitData() },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClients(data.clients ?? []);
    } catch {
      toast.error("Ошибка загрузки клиентов");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchClients(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0D14",
      color: "#F1F3F7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "16px 16px 100px",
      maxWidth: 1100,
      margin: "0 auto",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#C8A44E", margin: 0 }}>
          Клиенты
        </h1>
        <span style={{ fontSize: 12, color: "#5A6478" }}>{clients.length} записей</span>
      </div>

      <input
        type="text"
        placeholder="Поиск по имени, телефону или ИИН..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px", background: "#111827",
          border: "1px solid #1E2A3A", borderRadius: 8, color: "#F1F3F7",
          fontSize: 14, marginBottom: 16, outline: "none", boxSizing: "border-box",
        }}
      />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              height: 48, background: "#111827", borderRadius: 8,
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))}
          <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E2A3A", textAlign: "left" }}>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Имя</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Телефон</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>ИИН</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Теги</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Дата</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #1E2A3A10" }}>
                  <td style={{ padding: "10px 8px", fontWeight: 600, color: "#F1F3F7" }}>
                    {c.full_name ?? "—"}
                  </td>
                  <td style={{ padding: "10px 8px", color: "#8B95A8" }}>{c.phone}</td>
                  <td style={{ padding: "10px 8px", color: "#8B95A8" }}>{c.iin ?? "—"}</td>
                  <td style={{ padding: "10px 8px" }}>
                    {c.tags && c.tags.length > 0 ? (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {c.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: "#C8A44E20",
                              color: "#C8A44E",
                              fontWeight: 600,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#5A6478" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 8px", color: "#5A6478", fontSize: 12 }}>
                    {formatDate(c.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <div style={{ textAlign: "center", color: "#5A6478", padding: 40, fontSize: 13 }}>
              {search ? "Ничего не найдено" : "Нет клиентов"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
