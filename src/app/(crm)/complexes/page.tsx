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

// DB enum values → display labels
const CLASS_OPTIONS: { value: string; label: string }[] = [
  { value: "elite", label: "Elite" },
  { value: "business_plus", label: "Business+" },
  { value: "business", label: "Business" },
  { value: "comfort_plus", label: "Comfort+" },
  { value: "comfort", label: "Comfort" },
  { value: "standard", label: "Standard" },
];

const CLASS_COLORS: Record<string, string> = {
  elite: "#C8A44E",
  business_plus: "#9B59B6",
  business: "#4A8FD4",
  comfort_plus: "#3498DB",
  comfort: "#25D366",
  standard: "#8B95A8",
};

export default function ComplexesPage() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingCoeff, setEditingCoeff] = useState<Record<string, string>>({});

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
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error ?? "Ошибка сохранения");
      } else {
        toast.success("Сохранено");
      }
    } catch {
      setComplexes(prev);
      toast.error("Ошибка сети");
    }
  };

  const handleCoeffBlur = (id: string) => {
    const val = editingCoeff[id];
    if (val === undefined) return;
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0.5 && num <= 3.0) {
      patchComplex(id, "coefficient", num);
    }
    setEditingCoeff((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const filtered = complexes.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.district.toLowerCase().includes(search.toLowerCase())
  );

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
          🏢 База ЖК
        </h1>
        <span style={{ fontSize: 12, color: "#5A6478" }}>{complexes.length} объектов</span>
      </div>

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
              {filtered.map((c) => {
                const classColor = CLASS_COLORS[c.class ?? ""] ?? "#8B95A8";
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid #1E2A3A10" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 600, color: "#F1F3F7" }}>{c.name}</td>
                    <td style={{ padding: "10px 8px", color: "#8B95A8" }}>{c.district}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <input
                        type="number"
                        step="0.01"
                        value={editingCoeff[c.id] ?? c.coefficient?.toFixed(2) ?? ""}
                        onChange={(e) => setEditingCoeff((p) => ({ ...p, [c.id]: e.target.value }))}
                        onBlur={() => handleCoeffBlur(c.id)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleCoeffBlur(c.id); }}
                        style={{
                          width: 65, padding: "4px 6px", background: "#0A0D14",
                          border: "1px solid #1E2A3A", borderRadius: 6, color: "#C8A44E",
                          fontSize: 13, fontWeight: 700, outline: "none", textAlign: "right",
                        }}
                      />
                    </td>
                    <td style={{ padding: "10px 8px", color: "#8B95A8" }}>{formatPrice(c.avg_price_sqm)}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <select
                        value={c.class ?? ""}
                        onChange={(e) => patchComplex(c.id, "class", e.target.value)}
                        style={{
                          background: "#111827", color: classColor, border: "1px solid #1E2A3A",
                          borderRadius: 6, padding: "4px 8px", fontSize: 12, cursor: "pointer",
                          outline: "none", fontWeight: 600,
                        }}
                      >
                        <option value="">—</option>
                        {CLASS_OPTIONS.map((cls) => (
                          <option key={cls.value} value={cls.value}>{cls.label}</option>
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
