"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  EXPENSE_CATEGORY_LABELS,
  formatPrice,
  formatDate,
} from "@/lib/crm-constants";
import type { DealExpense } from "@/types/database";

interface TelegramWebApp {
  initData: string;
}

const CATEGORY_OPTIONS = [
  { value: "notary", label: "Нотариус", icon: "📋" },
  { value: "repair", label: "Ремонт", icon: "🔧" },
  { value: "utility_debt", label: "Долги ЖКХ", icon: "💡" },
  { value: "cleaning", label: "Уборка", icon: "🧹" },
  { value: "other", label: "Прочее", icon: "📌" },
];

export default function FinancesTab({
  leadId,
  buyoutPrice,
  onExpenseChange,
  readOnly = false,
}: {
  leadId: string;
  buyoutPrice: number | null;
  onExpenseChange?: () => void;
  readOnly?: boolean;
}) {
  const [expenses, setExpenses] = useState<DealExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("notary");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getTg = () =>
    (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram
      ?.WebApp;
  const getInitData = () => getTg()?.initData ?? "";

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/expenses`, {
        headers: { "x-telegram-init-data": getInitData() },
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses ?? []);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAdd = async () => {
    const parsed = parseFloat(amount.replace(/\s/g, ""));
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Введите сумму");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": getInitData(),
        },
        body: JSON.stringify({
          category,
          amount: parsed,
          description: description.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setExpenses((prev) => [...prev, data.expense]);
        setAmount("");
        setDescription("");
        toast.success("Расход добавлен");
        onExpenseChange?.();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error ?? "Ошибка");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    const prev = expenses;
    setExpenses((e) => e.filter((x) => x.id !== expenseId));

    try {
      const res = await fetch(
        `/api/crm/leads/${leadId}/expenses?expense_id=${expenseId}`,
        {
          method: "DELETE",
          headers: { "x-telegram-init-data": getInitData() },
        },
      );
      if (!res.ok) {
        setExpenses(prev);
        toast.error("Ошибка удаления");
      } else {
        toast.success("Удалено");
        onExpenseChange?.();
      }
    } catch {
      setExpenses(prev);
      toast.error("Ошибка сети");
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCost = (buyoutPrice ?? 0) + totalExpenses;

  return (
    <div>
      {/* Summary card */}
      <div
        style={{
          padding: 14,
          background: "#111827",
          borderRadius: 8,
          border: "1px solid #1E2A3A",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "#5A6478" }}>Цена выкупа</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#C8A44E" }}>
            {formatPrice(buyoutPrice)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "#5A6478" }}>
            Расходы ({expenses.length})
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#E74C3C" }}>
            + {formatPrice(totalExpenses)}
          </span>
        </div>
        <div
          style={{
            borderTop: "1px solid #1E2A3A",
            paddingTop: 8,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F7" }}>
            Итого себестоимость
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#F1F3F7" }}>
            {formatPrice(totalCost)}
          </span>
        </div>
      </div>

      {/* Add expense form (hidden in read-only mode) */}
      {!readOnly && (
        <div
          style={{
            padding: 12,
            background: "#111827",
            borderRadius: 8,
            border: "1px solid #1E2A3A",
            marginBottom: 16,
          }}
        >
          <div
            style={{ fontSize: 12, fontWeight: 700, color: "#C8A44E", marginBottom: 10 }}
          >
            Добавить расход
          </div>

          {/* Category pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 10,
            }}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCategory(opt.value)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 12,
                  border: `1px solid ${category === opt.value ? "#C8A44E" : "#1E2A3A"}`,
                  background:
                    category === opt.value ? "#C8A44E20" : "transparent",
                  color: category === opt.value ? "#C8A44E" : "#8B95A8",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {/* Amount + description */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Сумма, ₸"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 6,
                background: "#0A0D14",
                border: "1px solid #1E2A3A",
                color: "#F1F3F7",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              placeholder="Описание (необязательно)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 6,
                background: "#0A0D14",
                border: "1px solid #1E2A3A",
                color: "#F1F3F7",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              onClick={handleAdd}
              disabled={submitting}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                background: submitting ? "#5A6478" : "#C8A44E",
                color: "#0A0D14",
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {submitting ? "..." : "+"}
            </button>
          </div>
        </div>
      )}

      {/* Expense list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 48,
                background: "#111827",
                borderRadius: 8,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
          <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
        </div>
      ) : expenses.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            color: "#5A6478",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 13 }}>Расходов пока нет</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {expenses.map((exp) => {
            const catIcon =
              CATEGORY_OPTIONS.find((c) => c.value === exp.category)?.icon ??
              "📌";
            return (
              <div
                key={exp.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "#111827",
                  borderRadius: 8,
                  border: "1px solid #1E2A3A",
                }}
              >
                <span style={{ fontSize: 16 }}>{catIcon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#F1F3F7",
                    }}
                  >
                    {EXPENSE_CATEGORY_LABELS[exp.category] ?? exp.category}
                    {exp.description && (
                      <span
                        style={{
                          color: "#5A6478",
                          fontWeight: 400,
                          marginLeft: 6,
                        }}
                      >
                        — {exp.description}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "#5A6478", marginTop: 2 }}>
                    {formatDate(exp.created_at)}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#E74C3C",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatPrice(Number(exp.amount))}
                </div>
                {!readOnly && (
                  <button
                    onClick={() => handleDelete(exp.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#5A6478",
                      fontSize: 14,
                      cursor: "pointer",
                      padding: "0 4px",
                      flexShrink: 0,
                    }}
                    title="Удалить"
                  >
                    {"\u2715"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
