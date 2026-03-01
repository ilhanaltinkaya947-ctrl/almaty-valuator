"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/crm-constants";

interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
}

interface Complex {
  id: string;
  name: string;
  district: string;
  coefficient: number;
  class: string | null;
  is_golden_square: boolean;
  year_built: number | null;
  total_floors: number | null;
  avg_price_sqm: number | null;
}

const CLASS_OPTIONS = ["Elite", "Business+", "Business", "Comfort+", "Comfort", "Standard"];

export default function ComplexesPage() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const getTg = () => (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram?.WebApp;
  const getInitData = () => getTg()?.initData ?? "";

  const fetchComplexes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/complexes", {
        headers: { "x-telegram-init-data": getInitData() },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComplexes(data.complexes ?? []);
    } catch {
      toast.error("Ошибка загрузки ЖК");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComplexes(); }, [fetchComplexes]);

  const patchComplex = async (id: string, field: string, value: unknown) => {
    const prev = complexes;
    setComplexes((c) => c.map((x) => (x.id === id ? { ...x, [field]: value } : x)));

    try {
      const res = await fetch("/api/crm/complexes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": getInitData() },
        body: JSON.stringify({ complex_id: id, [field]: value }),
      });
      if (!res.ok) {
        setComplexes(prev);
        toast.error("Ошибка сохранения");
      } else {
        toast.success("Сохранено");
      }
    } catch {
      setComplexes(prev);
      toast.error("Ошибка сети");
    }
  };

  const filtered = complexes.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.district.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0D14",
      color: "#F1F3F7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "16px",
      maxWidth: 1100,
      margin: "0 auto",
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#C8A44E", margin: "0 0 16px" }}>
        🏢 База ЖК
      </h1>

      <input
        type="text"
        placeholder="Поиск по названию или району..."
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
              height: 52, background: "#111827", borderRadius: 8,
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
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Название</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Район</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Коэфф.</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Цена/м²</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600 }}>Класс</th>
                <th style={{ padding: "10px 8px", color: "#5A6478", fontWeight: 600, textAlign: "center" }}>Golden Sq</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #1E2A3A10" }}>
                  <td style={{ padding: "10px 8px", fontWeight: 600, color: "#F1F3F7" }}>{c.name}</td>
                  <td style={{ padding: "10px 8px", color: "#8B95A8" }}>{c.district}</td>
                  <td style={{ padding: "10px 8px", color: "#C8A44E", fontWeight: 700 }}>{c.coefficient?.toFixed(2)}</td>
                  <td style={{ padding: "10px 8px", color: "#8B95A8" }}>{formatPrice(c.avg_price_sqm)}</td>
                  <td style={{ padding: "10px 8px" }}>
                    <select
                      value={c.class ?? ""}
                      onChange={(e) => patchComplex(c.id, "class", e.target.value)}
                      style={{
                        background: "#111827", color: "#F1F3F7", border: "1px solid #1E2A3A",
                        borderRadius: 6, padding: "4px 8px", fontSize: 12, cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option value="">—</option>
                      {CLASS_OPTIONS.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "10px 8px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={c.is_golden_square ?? false}
                      onChange={(e) => patchComplex(c.id, "is_golden_square", e.target.checked)}
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#C8A44E" }}
                    />
                  </td>
                </tr>
              ))}
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
