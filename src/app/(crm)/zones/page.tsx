"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
}

interface Zone {
  id: string;
  name: string;
  district: string;
  avg_price_sqm: number | null;
  coefficient: number | null;
  is_active: boolean;
  sort_order: number;
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, { avg_price_sqm?: string; coefficient?: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const getTg = () => (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram?.WebApp;
  const getInitData = () => getTg()?.initData ?? "";

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/zones", {
        headers: { "x-telegram-init-data": getInitData() },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setZones(data.zones ?? []);
    } catch {
      toast.error("Ошибка загрузки зон");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  const getEditValue = (zoneId: string, field: "avg_price_sqm" | "coefficient", original: number | null) => {
    return edits[zoneId]?.[field] ?? (original?.toString() ?? "");
  };

  const handleEditChange = (zoneId: string, field: "avg_price_sqm" | "coefficient", value: string) => {
    setEdits((prev) => ({
      ...prev,
      [zoneId]: { ...prev[zoneId], [field]: value },
    }));
  };

  const saveZone = async (zoneId: string) => {
    const zoneEdits = edits[zoneId];
    if (!zoneEdits) return;

    const payload: Record<string, unknown> = { id: zoneId };
    if (zoneEdits.avg_price_sqm !== undefined) {
      const val = parseInt(zoneEdits.avg_price_sqm);
      if (!isNaN(val) && val > 0) payload.avg_price_sqm = val;
    }
    if (zoneEdits.coefficient !== undefined) {
      const val = parseFloat(zoneEdits.coefficient);
      if (!isNaN(val) && val >= 0.5 && val <= 3.0) payload.coefficient = val;
    }

    if (Object.keys(payload).length <= 1) return;

    setSaving((s) => ({ ...s, [zoneId]: true }));
    try {
      const res = await fetch("/api/crm/zones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": getInitData() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error("Ошибка сохранения");
      } else {
        const data = await res.json();
        setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, ...data.zone } : z)));
        setEdits((prev) => {
          const next = { ...prev };
          delete next[zoneId];
          return next;
        });
        toast.success("Зона обновлена");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setSaving((s) => ({ ...s, [zoneId]: false }));
    }
  };

  const handleBlurSave = (zoneId: string) => {
    if (debounceRefs.current[zoneId]) clearTimeout(debounceRefs.current[zoneId]);
    debounceRefs.current[zoneId] = setTimeout(() => {
      if (edits[zoneId]) saveZone(zoneId);
    }, 600);
  };

  // Group zones by district
  const grouped: Record<string, Zone[]> = {};
  for (const z of zones) {
    const d = z.district || "Другое";
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(z);
  }

  return (
    <div style={{
      color: "#F1F3F7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "16px",
      maxWidth: 1000,
      margin: "0 auto",
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#C8A44E", margin: "0 0 16px" }}>
        📈 Вторичка — Зоны
      </h1>

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
        Object.entries(grouped).map(([district, districtZones]) => (
          <div key={district} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: "#8B95A8",
              marginBottom: 8, padding: "6px 0",
              borderBottom: "1px solid #1E2A3A",
            }}>
              {district}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {districtZones.map((z) => {
                const hasEdits = !!edits[z.id];
                const isSaving = saving[z.id];

                return (
                  <div key={z.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    background: "#111827",
                    borderRadius: 8,
                    border: "1px solid #1E2A3A",
                    flexWrap: "wrap",
                  }}>
                    <span style={{
                      flex: "1 1 180px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#F1F3F7",
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {z.name}
                    </span>

                    <span style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: z.is_active ? "#25D36620" : "#5A647820",
                      color: z.is_active ? "#25D366" : "#5A6478",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {z.is_active ? "Активна" : "Неакт."}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <label style={{ fontSize: 11, color: "#5A6478" }}>₸/м²</label>
                      <input
                        type="number"
                        value={getEditValue(z.id, "avg_price_sqm", z.avg_price_sqm)}
                        onChange={(e) => handleEditChange(z.id, "avg_price_sqm", e.target.value)}
                        onBlur={() => handleBlurSave(z.id)}
                        style={{
                          width: 90, padding: "4px 6px", background: "#0A0D14",
                          border: "1px solid #1E2A3A", borderRadius: 6, color: "#C8A44E",
                          fontSize: 12, outline: "none", textAlign: "right",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <label style={{ fontSize: 11, color: "#5A6478" }}>К</label>
                      <input
                        type="number"
                        step="0.01"
                        value={getEditValue(z.id, "coefficient", z.coefficient)}
                        onChange={(e) => handleEditChange(z.id, "coefficient", e.target.value)}
                        onBlur={() => handleBlurSave(z.id)}
                        style={{
                          width: 65, padding: "4px 6px", background: "#0A0D14",
                          border: "1px solid #1E2A3A", borderRadius: 6, color: "#C8A44E",
                          fontSize: 12, outline: "none", textAlign: "right",
                        }}
                      />
                    </div>

                    <button
                      onClick={() => saveZone(z.id)}
                      disabled={!hasEdits || isSaving}
                      style={{
                        padding: "5px 14px",
                        borderRadius: 6,
                        border: "none",
                        background: hasEdits ? "#C8A44E" : "#1E2A3A",
                        color: hasEdits ? "#0A0D14" : "#5A6478",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: hasEdits ? "pointer" : "default",
                        opacity: isSaving ? 0.6 : 1,
                        flexShrink: 0,
                      }}
                    >
                      {isSaving ? "..." : "Сохранить"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
