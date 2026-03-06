"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lead,
  SettingRow,
  STATUS_COLORS,
  STATUS_LABELS,
  ROLE_STATUS_OPTIONS,
  ROLE_NEXT_STATUS,
  ROLE_NEXT_LABELS,
  STATUS_OPTIONS,
  formatPrice as sharedFormatPrice,
  formatDate as sharedFormatDate,
} from "@/lib/crm-constants";

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: { id: number; first_name: string; username?: string };
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
}

export default function MobileCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [telegramUser, setTelegramUser] = useState<string | null>(null);
  const [buybackDiscount, setBuybackDiscount] = useState(0.7);
  const [currentRole, setCurrentRole] = useState("manager");

  const getTg = () => (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram?.WebApp;

  useEffect(() => {
    // Init Telegram WebApp
    const tg = getTg();
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setTelegramUser(user.first_name);
      }
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const initData = getTg()?.initData ?? "";
      const headers = { "x-telegram-init-data": initData };

      const [leadsRes, settingsRes, meRes] = await Promise.all([
        fetch("/api/crm/leads", { headers }),
        fetch("/api/crm/settings", { headers }),
        fetch("/api/crm/auth/me", { headers }),
      ]);

      if (!leadsRes.ok) throw new Error("Failed to fetch leads");
      const data = await leadsRes.json();
      setLeads(data.leads ?? []);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const bbSetting = (settingsData.settings as SettingRow[])?.find(
          (s: SettingRow) => s.key === "buyback_discount"
        );
        if (bbSetting) setBuybackDiscount(Number(bbSetting.value_numeric));
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.profileRole) setCurrentRole(meData.profileRole);
      }
    } catch {
      setError("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    const initData = getTg()?.initData ?? "";
    try {
      const res = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({ lead_id: leadId, status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
        );
      }
    } catch {
      // Silently fail
    }
  };

  const setOfferPrice = async (leadId: string, price: number) => {
    const initData = getTg()?.initData ?? "";
    try {
      const res = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({ lead_id: leadId, offer_price: price }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, offer_price: price }
              : l
          ),
        );
      }
    } catch {
      // Silently fail
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesFilter = filter === "all" || l.status === filter;
    const matchesSearch =
      !search ||
      (l.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      l.phone.includes(search);
    return matchesFilter && matchesSearch;
  });

  const formatPrice = (price: number | null) =>
    price ? new Intl.NumberFormat("ru-RU").format(price) + " ₸" : "—";

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0D14",
      color: "#F1F3F7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "16px 16px 100px",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#C8A44E", margin: 0 }}>
            Алмавыкуп CRM
          </h1>
          {telegramUser && (
            <span style={{ fontSize: 13, color: "#8B95A8" }}>
              {telegramUser}
            </span>
          )}
        </div>

        {/* Stats bar */}
        <div style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
          overflowX: "auto",
        }}>
          {[
            { label: "Всего", value: leads.length, color: "#F1F3F7" },
            { label: "Новые", value: leads.filter((l) => l.status === "new").length, color: "#C8A44E" },
            { label: "В работе", value: leads.filter((l) => ["in_progress", "price_approved", "jurist_approved", "director_approved", "deal_progress"].includes(l.status)).length, color: "#4A8FD4" },
            { label: "Выдано", value: leads.filter((l) => l.status === "paid").length, color: "#25D366" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "#111827",
              borderRadius: 8,
              padding: "8px 12px",
              minWidth: 70,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#8B95A8" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Поиск по имени или телефону..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "#111827",
          border: "1px solid #1E2A3A",
          borderRadius: 8,
          color: "#F1F3F7",
          fontSize: 14,
          marginBottom: 12,
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {/* Filter pills */}
      <div style={{
        display: "flex",
        gap: 6,
        marginBottom: 16,
        overflowX: "auto",
        paddingBottom: 4,
      }}>
        {(ROLE_STATUS_OPTIONS[currentRole] ?? STATUS_OPTIONS).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 16,
              border: "1px solid",
              borderColor: filter === opt.value ? (opt.color ?? "#C8A44E") : "#1E2A3A",
              background: filter === opt.value ? (opt.color ?? "#C8A44E") + "20" : "transparent",
              color: filter === opt.value ? (opt.color ?? "#C8A44E") : "#8B95A8",
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

      {/* Lead list */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#8B95A8", padding: 40 }}>
          Загрузка...
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", color: "#E74C3C", padding: 40 }}>
          {error}
          <br />
          <button onClick={fetchLeads} style={{
            marginTop: 12, padding: "8px 16px", background: "#C8A44E",
            color: "#0A0D14", border: "none", borderRadius: 6, cursor: "pointer",
          }}>
            Повторить
          </button>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div style={{ textAlign: "center", color: "#8B95A8", padding: 40 }}>
          Нет заявок
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              buybackDiscount={buybackDiscount}
              onStatusChange={updateLeadStatus}
              onSetPrice={setOfferPrice}
              formatPrice={formatPrice}
              formatDate={formatDate}
              currentRole={currentRole}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  buybackDiscount,
  onStatusChange,
  onSetPrice,
  formatPrice,
  formatDate,
  currentRole = "manager",
}: {
  lead: Lead;
  buybackDiscount: number;
  onStatusChange: (id: string, status: string) => void;
  onSetPrice: (id: string, price: number) => void;
  formatPrice: (p: number | null) => string;
  formatDate: (d: string) => string;
  currentRole?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [priceInput, setPriceInput] = useState("");

  // Derive 3 prices for auto-calc leads
  const offerPrice = lead.estimated_price;
  const marketPrice = offerPrice && buybackDiscount > 0 ? Math.round(offerPrice / buybackDiscount) : null;
  const limitPrice = marketPrice ? Math.round(marketPrice * 0.80) : null;
  const margin = marketPrice && offerPrice ? Math.round((1 - offerPrice / marketPrice) * 100) : null;

  const statusColor = STATUS_COLORS;
  const statusLabel = STATUS_LABELS;

  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1E2A3A",
        borderRadius: 10,
        padding: 14,
        borderLeft: `3px solid ${statusColor[lead.status] ?? "#1E2A3A"}`,
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: "pointer" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            {lead.name ?? "Без имени"}
          </span>
          <span style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 10,
            background: (statusColor[lead.status] ?? "#1E2A3A") + "25",
            color: statusColor[lead.status] ?? "#8B95A8",
            fontWeight: 600,
          }}>
            {statusLabel[lead.status] ?? lead.status}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 13, color: "#8B95A8" }}>
          <span>{lead.phone}</span>
          <span>{formatPrice(lead.estimated_price)}</span>
        </div>
        <div style={{ fontSize: 11, color: "#5A6478", marginTop: 4 }}>
          {formatDate(lead.created_at)} {lead.property_type ? `· ${lead.property_type}` : ""}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1E2A3A" }}>
          {/* 3-price display for auto-calc leads */}
          {!lead.needs_manual_review && offerPrice && (
            <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 12 }}>
              <div>
                <div style={{ color: "#5A6478", fontSize: 10 }}>Рынок</div>
                <div style={{ color: "#8B95A8", fontWeight: 600 }}>{formatPrice(marketPrice)}</div>
              </div>
              <div>
                <div style={{ color: "#5A6478", fontSize: 10 }}>Оферта</div>
                <div style={{ color: "#C8A44E", fontWeight: 700 }}>{formatPrice(offerPrice)}</div>
              </div>
              <div>
                <div style={{ color: "#5A6478", fontSize: 10 }}>Лимит</div>
                <div style={{ color: "#E74C3C", fontWeight: 600 }}>{formatPrice(limitPrice)}</div>
              </div>
              {margin !== null && (
                <div style={{
                  marginLeft: "auto", alignSelf: "center",
                  fontSize: 11, fontWeight: 700, color: "#25D366",
                  background: "#25D36620", padding: "2px 8px", borderRadius: 8,
                }}>
                  {margin}%
                </div>
              )}
            </div>
          )}

          {/* Offer price display / edit for manual review leads */}
          {lead.needs_manual_review && (
            <div style={{ marginBottom: 10 }}>
              {lead.offer_price ? (
                <div style={{ fontSize: 13, color: "#25D366", fontWeight: 600 }}>
                  Оферта: {formatPrice(lead.offer_price)}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="number"
                    placeholder="Цена выкупа"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    style={{
                      flex: 1, padding: "6px 10px", borderRadius: 6,
                      background: "#0A0D14", border: "1px solid #E74C3C",
                      color: "#F1F3F7", fontSize: 13, outline: "none",
                    }}
                  />
                  <button
                    onClick={() => {
                      const p = parseInt(priceInput);
                      if (p > 0) { onSetPrice(lead.id, p); setPriceInput(""); }
                    }}
                    style={{
                      padding: "6px 12px", borderRadius: 6, background: "#E74C3C",
                      color: "#fff", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                    }}
                  >
                    Назначить
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {(() => {
            const roleNextMap = ROLE_NEXT_STATUS[currentRole] ?? {};
            const roleLabelMap = ROLE_NEXT_LABELS[currentRole] ?? {};
            const nextStatus = roleNextMap[lead.status];
            const nextLabel = roleLabelMap[lead.status];
            const nextColor = nextStatus ? (STATUS_COLORS[nextStatus] ?? "#C8A44E") : null;
            const isBroker = currentRole === "manager";
            const showAssign = lead.status === "new" && (currentRole === "manager" || currentRole === "admin");
            const mobileWaLink = isBroker
              ? `/api/crm/leads/${lead.id}/contact?type=whatsapp`
              : `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Здравствуйте${lead.name ? `, ${lead.name}` : ""}! Я менеджер из Алмавыкуп.${offerPrice ? ` Наше предложение: ${new Intl.NumberFormat("ru-RU").format(offerPrice)} ₸.` : ""}`)}`;
            const mobileCallLink = isBroker
              ? `/api/crm/leads/${lead.id}/contact?type=call`
              : `tel:${lead.phone}`;
            return (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <a
                  href={mobileWaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "6px 12px", borderRadius: 6, background: "#25D366",
                    color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none",
                  }}
                >
                  WhatsApp
                </a>
                <a
                  href={mobileCallLink}
                  style={{
                    padding: "6px 12px", borderRadius: 6, background: "#4A8FD4",
                    color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none",
                  }}
                >
                  Позвонить
                </a>
                {showAssign && (
                  <button
                    onClick={() => onStatusChange(lead.id, "in_progress")}
                    style={{
                      padding: "6px 12px", borderRadius: 6, background: "#C8A44E",
                      color: "#0A0D14", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                    }}
                  >
                    Взять в работу
                  </button>
                )}
                {nextStatus && nextLabel && lead.status !== "new" && (
                  <button
                    onClick={() => onStatusChange(lead.id, nextStatus)}
                    style={{
                      padding: "6px 12px", borderRadius: 6,
                      background: nextColor ?? "#C8A44E",
                      color: nextColor === "#9B59B6" || nextColor === "#3498DB" || nextColor === "#25D366" ? "#fff" : "#0A0D14",
                      fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                    }}
                  >
                    {nextLabel}
                  </button>
                )}
                {lead.status !== "deal_closed" && lead.status !== "rejected" && lead.status !== "paid" && (
                  <button
                    onClick={() => onStatusChange(lead.id, "rejected")}
                    style={{
                      padding: "6px 12px", borderRadius: 6, background: "#1A2332",
                      color: "#5A6478", fontSize: 12, fontWeight: 600, border: "1px solid #5A6478",
                      cursor: "pointer",
                    }}
                  >
                    Отказ
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
