"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Lead, STATUS_COLORS, STATUS_LABELS, formatPrice, formatDate } from "@/lib/crm-constants";

interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
}

type ArchiveFilter = "all" | "deal_closed" | "rejected";

export default function ArchivePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ArchiveFilter>("all");

  const getTg = () => (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram?.WebApp;
  const getInitData = () => getTg()?.initData ?? "";

  const fetchArchive = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/leads?terminal=true&limit=200", {
        headers: { "x-telegram-init-data": getInitData() },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch {
      toast.error("Ошибка загрузки архива");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchArchive(); }, [fetchArchive]);

  const filtered = leads.filter((l) => {
    const matchesFilter = filter === "all" || l.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      (l.name?.toLowerCase().includes(q) ?? false) ||
      l.phone.includes(search) ||
      (l.short_id && String(l.short_id).includes(search));
    return matchesFilter && matchesSearch;
  });

  const FILTER_PILLS: { value: ArchiveFilter; label: string; color: string }[] = [
    { value: "all", label: "Все", color: "#C8A44E" },
    { value: "deal_closed", label: "Закрыта", color: "#22C55E" },
    { value: "rejected", label: "Отказ", color: "#5A6478" },
  ];

  return (
    <div style={{
      color: "#F1F3F7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "16px",
      maxWidth: 1100,
      margin: "0 auto",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#C8A44E", margin: 0 }}>
          Архив
        </h1>
        <span style={{ fontSize: 12, color: "#5A6478" }}>{filtered.length} записей</span>
      </div>

      <input
        type="text"
        placeholder="Поиск по имени, телефону или #ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px", background: "#111827",
          border: "1px solid #1E2A3A", borderRadius: 8, color: "#F1F3F7",
          fontSize: 14, marginBottom: 12, outline: "none", boxSizing: "border-box",
        }}
      />

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {FILTER_PILLS.map((p) => {
          const isActive = filter === p.value;
          return (
            <button
              key={p.value}
              onClick={() => setFilter(p.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 16,
                border: `1px solid ${isActive ? p.color : "#1E2A3A"}`,
                background: isActive ? p.color + "20" : "transparent",
                color: isActive ? p.color : "#8B95A8",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

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
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>#ID</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Клиент</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Телефон</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Статус</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Цена</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Причина</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Дата</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const statusColor = STATUS_COLORS[l.status] ?? "#5A6478";
                return (
                  <tr key={l.id} style={{ borderBottom: "1px solid #1E2A3A10" }}>
                    <td style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>
                      #{l.short_id}
                    </td>
                    <td style={{ padding: "10px 8px", fontWeight: 600, color: "#F1F3F7" }}>
                      {l.name ?? "—"}
                    </td>
                    <td style={{ padding: "10px 8px", color: "#8B95A8" }}>{l.phone}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <span style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: statusColor + "20",
                        color: statusColor,
                        fontWeight: 600,
                      }}>
                        {STATUS_LABELS[l.status] ?? l.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", color: "#C8A44E", fontWeight: 600 }}>
                      {formatPrice(l.offer_price ?? l.estimated_price)}
                    </td>
                    <td style={{
                      padding: "10px 8px",
                      color: "#8B95A8",
                      fontSize: 12,
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {l.rejection_reason ?? "—"}
                    </td>
                    <td style={{ padding: "10px 8px", color: "#5A6478", fontSize: 12 }}>
                      {formatDate(l.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#5A6478", padding: 40, fontSize: 13 }}>
              Ничего не найдено
            </div>
          )}
        </div>
      )}
    </div>
  );
}
