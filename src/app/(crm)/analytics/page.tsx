"use client";

import { useState, useEffect } from "react";

interface TelegramWebApp {
  initData: string;
}

interface PipelineMetrics {
  active_leads_count: number;
  active_pipeline_value: number;
  current_month_closed_value: number;
}

interface BrokerRow {
  broker_id: string;
  broker_name: string;
  total_leads_taken: number;
  deals_won: number;
  deals_lost: number;
  conversion_rate: number;
}

interface AnalyticsData {
  pipeline: PipelineMetrics;
  brokers: BrokerRow[];
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + " млрд ₸";
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + " млн ₸";
  }
  return new Intl.NumberFormat("ru-RU").format(value) + " ₸";
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "linear-gradient(145deg, #111827, #0D1320)",
        border: "1px solid #1E2A3A",
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div
        style={{
          width: 120,
          height: 14,
          background: "#1E2A3A",
          borderRadius: 4,
          marginBottom: 16,
        }}
      />
      <div
        style={{
          width: 180,
          height: 32,
          background: "#1E2A3A",
          borderRadius: 4,
        }}
      />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div
      style={{
        background: "linear-gradient(145deg, #111827, #0D1320)",
        border: "1px solid #1E2A3A",
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div
        style={{
          width: 200,
          height: 18,
          background: "#1E2A3A",
          borderRadius: 4,
          marginBottom: 24,
        }}
      />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 48,
            background: "#1E2A3A",
            borderRadius: 4,
            marginBottom: 8,
            opacity: 1 - i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tg = (
      window as unknown as { Telegram?: { WebApp: TelegramWebApp } }
    ).Telegram?.WebApp;
    const initData = tg?.initData ?? "";

    fetch("/api/crm/analytics", {
      headers: { "x-telegram-init-data": initData },
    })
      .then((res) => {
        if (res.status === 403) throw new Error("Доступ запрещён");
        if (!res.ok) throw new Error("Ошибка загрузки данных");
        return res.json();
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0D14", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⛔</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#F1F3F7", marginBottom: 8 }}>
          {error}
        </div>
        <div style={{ fontSize: 14, color: "#5A6478" }}>
          Эта страница доступна только администраторам и директорам
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      emoji: "📊",
      label: "Активные заявки",
      value: data?.pipeline.active_leads_count ?? 0,
      format: (v: number) => String(v),
    },
    {
      emoji: "💰",
      label: "Сумма в работе",
      value: data?.pipeline.active_pipeline_value ?? 0,
      format: formatCurrency,
    },
    {
      emoji: "🏆",
      label: "Выкуплено за месяц",
      value: data?.pipeline.current_month_closed_value ?? 0,
      format: formatCurrency,
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0D14",
      color: "#F1F3F7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "24px 24px 48px",
      maxWidth: 1100,
    }}>
      {/* Header */}
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#F1F3F7",
          marginBottom: 24,
        }}
      >
        📊 Аналитика
      </h1>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
        className="kpi-grid"
      >
        {loading
          ? [1, 2, 3].map((i) => <SkeletonCard key={i} />)
          : kpiCards.map((card) => (
              <div
                key={card.label}
                style={{
                  background: "linear-gradient(145deg, #111827, #0D1320)",
                  border: "1px solid #1E2A3A",
                  borderRadius: 12,
                  padding: 24,
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#C8A44E40")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#1E2A3A")
                }
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#8B95A8",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{card.emoji}</span>
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#C8A44E",
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  {card.format(card.value)}
                </div>
              </div>
            ))}
      </div>

      {/* Broker Leaderboard */}
      {loading ? (
        <SkeletonTable />
      ) : (
        <div
          style={{
            background: "linear-gradient(145deg, #111827, #0D1320)",
            border: "1px solid #1E2A3A",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid #1E2A3A",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#F1F3F7",
                margin: 0,
              }}
            >
              🏅 Рейтинг брокеров
            </h2>
          </div>

          {data?.brokers && data.brokers.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                  minWidth: 500,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #1E2A3A",
                      color: "#5A6478",
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <th style={{ textAlign: "left", padding: "12px 24px", fontWeight: 500 }}>
                      Брокер
                    </th>
                    <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: 500 }}>
                      Взято
                    </th>
                    <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: 500 }}>
                      Успешно
                    </th>
                    <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: 500 }}>
                      Отказы
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 24px", fontWeight: 500 }}>
                      Конверсия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.brokers.map((broker, idx) => (
                    <tr
                      key={broker.broker_id}
                      style={{
                        borderBottom:
                          idx < data.brokers.length - 1
                            ? "1px solid #1E2A3A"
                            : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#1E2A3A30")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "14px 24px",
                          color: "#F1F3F7",
                          fontWeight: 500,
                        }}
                      >
                        {idx === 0 && data.brokers.length > 1 ? "🥇 " : ""}
                        {idx === 1 ? "🥈 " : ""}
                        {idx === 2 ? "🥉 " : ""}
                        {broker.broker_name}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "14px 16px",
                          color: "#8B95A8",
                        }}
                      >
                        {broker.total_leads_taken}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "14px 16px",
                          color: "#25D366",
                          fontWeight: 500,
                        }}
                      >
                        {broker.deals_won}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "14px 16px",
                          color: "#E74C3C",
                        }}
                      >
                        {broker.deals_lost}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "14px 24px",
                          color: "#C8A44E",
                          fontWeight: 600,
                          fontFamily: "var(--font-mono), monospace",
                        }}
                      >
                        {broker.conversion_rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
                color: "#5A6478",
                fontSize: 14,
              }}
            >
              Нет данных. Брокеры пока не брали заявки в работу.
            </div>
          )}
        </div>
      )}

      <style>{`
        .kpi-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
