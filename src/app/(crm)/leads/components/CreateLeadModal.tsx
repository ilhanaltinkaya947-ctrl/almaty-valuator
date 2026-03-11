"use client";

import { useState } from "react";
import { toast } from "sonner";

interface TelegramWebApp {
  initData: string;
}

const SOURCE_OPTIONS = [
  { value: "walk_in", label: "Визит в офис" },
  { value: "outdoor_ad", label: "Наружная реклама" },
  { value: "referral", label: "Рекомендация" },
  { value: "manual", label: "Другое" },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: "", label: "Не указано" },
  { value: "apartment", label: "Квартира" },
  { value: "house", label: "Дом" },
  { value: "commercial", label: "Коммерция" },
  { value: "land", label: "Участок" },
];

export default function CreateLeadModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [address, setAddress] = useState("");
  const [source, setSource] = useState("walk_in");
  const [propertyType, setPropertyType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(true);

  const getTg = () =>
    (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram
      ?.WebApp;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Введите имя клиента");
      return;
    }
    if (!/^\+7\d{10}$/.test(phone)) {
      toast.error("Телефон: +7 и 10 цифр");
      return;
    }

    setSubmitting(true);
    try {
      const initData = getTg()?.initData ?? "";
      const res = await fetch("/api/crm/leads/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          address: address.trim() || undefined,
          source,
          property_type: propertyType || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error ?? "Ошибка создания");
        return;
      }

      toast.success("Заявка создана");
      onCreated();
      handleClose();
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: "#111827",
    border: "1px solid #1E2A3A",
    borderRadius: 8,
    color: "#F1F3F7",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: 12,
    color: "#5A6478",
    fontWeight: 600 as const,
    marginBottom: 4,
    display: "block" as const,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 1100,
          opacity: visible ? 1 : 0,
          transition: "opacity 250ms",
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: visible
            ? "translate(-50%, -50%) scale(1)"
            : "translate(-50%, -50%) scale(0.95)",
          opacity: visible ? 1 : 0,
          transition: "all 250ms ease",
          width: "min(440px, 90vw)",
          background: "#0A0D14",
          border: "1px solid #1E2A3A",
          borderRadius: 12,
          zIndex: 1101,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #1E2A3A",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "#C8A44E",
            }}
          >
            Новая заявка
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              color: "#5A6478",
              fontSize: 20,
              cursor: "pointer",
              padding: "0 4px",
            }}
          >
            {"\u2715"}
          </button>
        </div>

        {/* Form body */}
        <div
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          <div>
            <label style={labelStyle}>Имя клиента *</label>
            <input
              style={inputStyle}
              placeholder="Фамилия Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Телефон *</label>
            <input
              style={inputStyle}
              placeholder="+77074503277"
              value={phone}
              onChange={(e) => {
                let val = e.target.value.replace(/[^\d+]/g, "");
                if (!val.startsWith("+7")) val = "+7";
                if (val.length > 12) val = val.slice(0, 12);
                setPhone(val);
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>Адрес объекта</label>
            <input
              style={inputStyle}
              placeholder="ул. Абая 100, кв 45"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Источник</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SOURCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSource(opt.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 16,
                    border: `1px solid ${source === opt.value ? "#C8A44E" : "#1E2A3A"}`,
                    background:
                      source === opt.value ? "#C8A44E20" : "transparent",
                    color: source === opt.value ? "#C8A44E" : "#8B95A8",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Тип недвижимости</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              style={{
                ...inputStyle,
                appearance: "none",
                cursor: "pointer",
              }}
            >
              {PROPERTY_TYPE_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  style={{ background: "#111827" }}
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Заметки</label>
            <textarea
              style={{
                ...inputStyle,
                minHeight: 60,
                resize: "vertical",
              }}
              placeholder="Дополнительная информация..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #1E2A3A",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "#1A2332",
              color: "#8B95A8",
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid #1E2A3A",
              cursor: "pointer",
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "8px 20px",
              borderRadius: 6,
              background: submitting ? "#5A6478" : "#C8A44E",
              color: "#0A0D14",
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Создаём..." : "Создать заявку"}
          </button>
        </div>
      </div>
    </>
  );
}
