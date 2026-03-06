"use client";

import { useState, useEffect, useCallback } from "react";

interface SettingRow {
  id: string;
  key: string;
  value_numeric: number;
  description: string | null;
  updated_at: string;
}

interface ComplexRow {
  id: string;
  name: string;
  district: string;
  class: string;
  coefficient: number;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: { id: number } };
  ready: () => void;
  expand: () => void;
}

const SETTING_LABELS: Record<string, string> = {
  base_rate: "Базовая ставка (₸/м²)",
  buyback_discount: "Коэффициент выкупа",
  margin_target: "Целевая маржа",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [complexes, setComplexes] = useState<ComplexRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ key: string; ok: boolean } | null>(null);

  const getTg = () => (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram?.WebApp;
  const getInitData = () => getTg()?.initData ?? "";

  useEffect(() => {
    const tg = getTg();
    if (tg) { tg.ready(); tg.expand(); }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const initData = getInitData();
      const headers = { "x-telegram-init-data": initData };

      const [settingsRes, complexesRes] = await Promise.all([
        fetch("/api/crm/settings", { headers }),
        fetch("/api/crm/complexes", { headers }),
      ]);

      if (!settingsRes.ok) {
        if (settingsRes.status === 401) { setError("Нет доступа"); return; }
        throw new Error("Failed to fetch settings");
      }

      const settingsData = await settingsRes.json();
      setSettings(settingsData.settings ?? []);
      setIsAdmin(true); // If settings loaded, user is authenticated

      if (complexesRes.ok) {
        const complexesData = await complexesRes.json();
        setComplexes(complexesData.complexes ?? []);
      }
    } catch {
      setError("Ошибка загрузки настроек");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateSetting = async (key: string, value: number) => {
    setSaving(key);
    setFeedback(null);
    try {
      const initData = getInitData();
      const res = await fetch("/api/crm/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify({ key, value_numeric: value }),
      });
      if (res.ok) {
        setSettings((prev) =>
          prev.map((s) => (s.key === key ? { ...s, value_numeric: value } : s))
        );
        setFeedback({ key, ok: true });
      } else {
        const data = await res.json();
        setFeedback({ key, ok: false });
        if (data.error === "Admin access required") setIsAdmin(false);
      }
    } catch {
      setFeedback({ key, ok: false });
    } finally {
      setSaving(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const updateComplex = async (complexId: string, coefficient: number) => {
    setSaving(complexId);
    setFeedback(null);
    try {
      const initData = getInitData();
      const res = await fetch("/api/crm/complexes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify({ complex_id: complexId, coefficient }),
      });
      if (res.ok) {
        setComplexes((prev) =>
          prev.map((c) => (c.id === complexId ? { ...c, coefficient } : c))
        );
        setFeedback({ key: complexId, ok: true });
      } else {
        setFeedback({ key: complexId, ok: false });
      }
    } catch {
      setFeedback({ key: complexId, ok: false });
    } finally {
      setSaving(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0D14", color: "#8B95A8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Загрузка...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0D14", color: "#E74C3C", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        {error}
        <button onClick={fetchData} style={{
          padding: "8px 16px", background: "#C8A44E", color: "#0A0D14",
          border: "none", borderRadius: 6, cursor: "pointer",
        }}>Повторить</button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0D14", color: "#F1F3F7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "16px 16px 100px", maxWidth: 900, margin: "0 auto",
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#C8A44E", margin: "0 0 24px" }}>
        Настройки
      </h1>

      {!isAdmin && (
        <div style={{
          padding: 12, background: "#E74C3C20", border: "1px solid #E74C3C",
          borderRadius: 8, color: "#E74C3C", fontSize: 13, marginBottom: 16,
        }}>
          Только администратор может изменять настройки. Вы можете только просматривать.
        </div>
      )}

      {/* System Settings */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#F1F3F7", marginBottom: 12 }}>
        Параметры алгоритма
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
        {settings.map((s) => (
          <SettingRow
            key={s.key}
            setting={s}
            label={SETTING_LABELS[s.key] ?? s.key}
            saving={saving === s.key}
            feedbackOk={feedback?.key === s.key ? feedback.ok : null}
            onSave={(val) => updateSetting(s.key, val)}
            disabled={!isAdmin}
          />
        ))}
      </div>

      {/* Complex Coefficients */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#F1F3F7", marginBottom: 12 }}>
        Коэффициенты ЖК
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {complexes.map((c) => (
          <ComplexRow
            key={c.id}
            complex={c}
            saving={saving === c.id}
            feedbackOk={feedback?.key === c.id ? feedback.ok : null}
            onSave={(val) => updateComplex(c.id, val)}
            disabled={!isAdmin}
          />
        ))}
      </div>
    </div>
  );
}

function SettingRow({
  setting,
  label,
  saving,
  feedbackOk,
  onSave,
  disabled,
}: {
  setting: SettingRow;
  label: string;
  saving: boolean;
  feedbackOk: boolean | null;
  onSave: (value: number) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState(String(setting.value_numeric));
  const changed = Number(value) !== setting.value_numeric;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
      background: "#111827", border: "1px solid #1E2A3A", borderRadius: 8,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        {setting.description && (
          <div style={{ fontSize: 11, color: "#5A6478" }}>{setting.description}</div>
        )}
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        style={{
          width: 120, padding: "6px 10px", borderRadius: 6, textAlign: "right",
          background: "#0A0D14", border: `1px solid ${changed ? "#C8A44E" : "#1E2A3A"}`,
          color: "#F1F3F7", fontSize: 14, fontWeight: 600, outline: "none",
        }}
        step={setting.key === "base_rate" ? 1000 : 0.01}
      />
      <button
        onClick={() => onSave(Number(value))}
        disabled={disabled || saving || !changed}
        style={{
          padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
          border: "none", cursor: disabled || saving || !changed ? "default" : "pointer",
          background: feedbackOk === true ? "#25D366" : feedbackOk === false ? "#E74C3C" : changed ? "#C8A44E" : "#1E2A3A",
          color: changed ? "#0A0D14" : "#5A6478",
          opacity: disabled || saving ? 0.5 : 1,
        }}
      >
        {saving ? "..." : feedbackOk === true ? "✓" : feedbackOk === false ? "✕" : "Сохранить"}
      </button>
    </div>
  );
}

function ComplexRow({
  complex,
  saving,
  feedbackOk,
  onSave,
  disabled,
}: {
  complex: ComplexRow;
  saving: boolean;
  feedbackOk: boolean | null;
  onSave: (value: number) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState(String(complex.coefficient));
  const changed = Number(value) !== complex.coefficient;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
      background: "#111827", border: "1px solid #1E2A3A", borderRadius: 8,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {complex.name}
        </div>
        <div style={{ fontSize: 11, color: "#5A6478" }}>
          {complex.district} · {complex.class}
        </div>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        step={0.05}
        min={0.5}
        max={3.0}
        style={{
          width: 80, padding: "4px 8px", borderRadius: 6, textAlign: "right",
          background: "#0A0D14", border: `1px solid ${changed ? "#C8A44E" : "#1E2A3A"}`,
          color: "#F1F3F7", fontSize: 13, fontWeight: 600, outline: "none",
        }}
      />
      <button
        onClick={() => onSave(Number(value))}
        disabled={disabled || saving || !changed}
        style={{
          padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
          border: "none", cursor: disabled || saving || !changed ? "default" : "pointer",
          background: feedbackOk === true ? "#25D366" : feedbackOk === false ? "#E74C3C" : changed ? "#C8A44E" : "#1E2A3A",
          color: changed ? "#0A0D14" : "#5A6478",
          opacity: disabled || saving ? 0.5 : 1,
          minWidth: 60,
        }}
      >
        {saving ? "..." : feedbackOk === true ? "✓" : feedbackOk === false ? "✕" : "OK"}
      </button>
    </div>
  );
}
