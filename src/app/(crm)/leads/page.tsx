"use client";

import { useState, useEffect, useCallback } from "react";

interface Lead {
  id: string;
  phone: string;
  name: string | null;
  status: string;
  source: string;
  property_type: string | null;
  estimated_price: number | null;
  offer_price: number | null;
  needs_manual_review: boolean;
  created_at: string;
  contacted_at: string | null;
  floor: number | null;
  area_sqm: number | null;
  zone_id: string | null;
  complex_id: string | null;
  year_built: number | null;
  wall_material: string | null;
  notes: string | null;
  intent: string;
  building_series: string | null;
  is_pledged: boolean;
}

interface SettingRow {
  key: string;
  value_numeric: number;
  description: string | null;
}

interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "new", label: "Новые", color: "#C8A44E" },
  { value: "pending_review", label: "На оценку", color: "#E74C3C" },
  { value: "contacted", label: "На связи", color: "#4A8FD4" },
  { value: "in_progress", label: "В работе", color: "#E8A838" },
  { value: "closed_won", label: "Закрыто ✓", color: "#25D366" },
  { value: "closed_lost", label: "Архив", color: "#5A6478" },
];

const STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  pending_review: "На оценку",
  contacted: "На связи",
  in_progress: "В работе",
  closed_won: "Закрыт ✓",
  closed_lost: "Архив",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#C8A44E",
  pending_review: "#E74C3C",
  contacted: "#4A8FD4",
  in_progress: "#E8A838",
  closed_won: "#25D366",
  closed_lost: "#5A6478",
};

const INTENT_LABELS: Record<string, string> = {
  ready: "Согласен",
  negotiate: "Торг",
};

const INTENT_COLORS: Record<string, string> = {
  ready: "#25D366",
  negotiate: "#E8A838",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Квартира",
  house: "Дом",
  commercial: "Коммерция",
  land: "Участок",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [buybackDiscount, setBuybackDiscount] = useState(0.7);
  const [error, setError] = useState<string | null>(null);

  const getTg = () => (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram?.WebApp;
  const getInitData = () => getTg()?.initData ?? "";

  useEffect(() => {
    const tg = getTg();
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const initData = getInitData();
      const headers = { "x-telegram-init-data": initData };

      const [leadsRes, settingsRes] = await Promise.all([
        fetch("/api/crm/leads?limit=100", { headers }),
        fetch("/api/crm/settings", { headers }),
      ]);

      if (!leadsRes.ok) throw new Error("Failed to fetch leads");
      const leadsData = await leadsRes.json();
      setLeads(leadsData.leads ?? []);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const bbSetting = (settingsData.settings as SettingRow[])?.find(
          (s: SettingRow) => s.key === "buyback_discount"
        );
        if (bbSetting) setBuybackDiscount(Number(bbSetting.value_numeric));
      }
    } catch {
      setError("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    const initData = getInitData();
    try {
      const res = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify({ lead_id: leadId, status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
      }
    } catch {}
  };

  const setOfferPrice = async (leadId: string, price: number) => {
    const initData = getInitData();
    try {
      const res = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify({ lead_id: leadId, offer_price: price }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, offer_price: price, status: l.status === "pending_review" ? "contacted" : l.status }
              : l
          )
        );
      }
    } catch {}
  };

  const filteredLeads = leads.filter((l) => {
    const matchesFilter = filter === "all" || l.status === filter;
    const matchesSearch =
      !search ||
      (l.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      l.phone.includes(search);
    return matchesFilter && matchesSearch;
  });

  // Split into auto vs manual
  const autoLeads = filteredLeads.filter((l) => !l.needs_manual_review);
  const manualLeads = filteredLeads.filter((l) => l.needs_manual_review);

  const formatPrice = (price: number | null) =>
    price ? new Intl.NumberFormat("ru-RU").format(price) + " ₸" : "—";

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0D14",
      color: "#F1F3F7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "16px",
      maxWidth: 900,
      margin: "0 auto",
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#C8A44E", margin: "0 0 16px" }}>
        Лиды
      </h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Поиск по имени или телефону..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px", background: "#111827",
          border: "1px solid #1E2A3A", borderRadius: 8, color: "#F1F3F7",
          fontSize: 14, marginBottom: 12, outline: "none", boxSizing: "border-box",
        }}
      />

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            style={{
              padding: "6px 12px", borderRadius: 16,
              border: `1px solid ${filter === opt.value ? (opt.color ?? "#C8A44E") : "#1E2A3A"}`,
              background: filter === opt.value ? (opt.color ?? "#C8A44E") + "20" : "transparent",
              color: filter === opt.value ? (opt.color ?? "#C8A44E") : "#8B95A8",
              fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#8B95A8", padding: 40 }}>Загрузка...</div>
      ) : error ? (
        <div style={{ textAlign: "center", color: "#E74C3C", padding: 40 }}>
          {error}
          <br />
          <button onClick={fetchData} style={{
            marginTop: 12, padding: "8px 16px", background: "#C8A44E",
            color: "#0A0D14", border: "none", borderRadius: 6, cursor: "pointer",
          }}>Повторить</button>
        </div>
      ) : (
        <>
          {/* Auto-buyback section */}
          <SectionHeader title="Авто-выкуп" subtitle="Квартиры и таунхаусы" color="#25D366" count={autoLeads.length} />
          {autoLeads.length === 0 ? (
            <EmptyState text="Нет заявок авто-выкупа" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {autoLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  buybackDiscount={buybackDiscount}
                  onStatusChange={updateLeadStatus}
                  onSetPrice={setOfferPrice}
                  formatPrice={formatPrice}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}

          {/* Manual review section */}
          <SectionHeader title="Ручная оценка" subtitle="Дома, коммерция, участки" color="#E8A838" count={manualLeads.length} />
          {manualLeads.length === 0 ? (
            <EmptyState text="Нет заявок на ручную оценку" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {manualLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  buybackDiscount={buybackDiscount}
                  onStatusChange={updateLeadStatus}
                  onSetPrice={setOfferPrice}
                  formatPrice={formatPrice}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle, color, count }: { title: string; subtitle: string; color: string; count: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 8 }}>
      <div style={{ width: 4, height: 20, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 15, fontWeight: 700, color }}>{title}</span>
      <span style={{ fontSize: 12, color: "#5A6478" }}>{subtitle}</span>
      <span style={{
        marginLeft: "auto", fontSize: 12, fontWeight: 600, color,
        background: color + "20", padding: "2px 8px", borderRadius: 10,
      }}>{count}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ textAlign: "center", color: "#5A6478", padding: 20, fontSize: 13 }}>{text}</div>;
}

function LeadCard({
  lead,
  buybackDiscount,
  onStatusChange,
  onSetPrice,
  formatPrice,
  formatDate,
}: {
  lead: Lead;
  buybackDiscount: number;
  onStatusChange: (id: string, status: string) => void;
  onSetPrice: (id: string, price: number) => void;
  formatPrice: (p: number | null) => string;
  formatDate: (d: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [priceInput, setPriceInput] = useState("");

  const color = STATUS_COLORS[lead.status] ?? "#1E2A3A";

  // Derive 3 prices for auto-calc leads
  const offerPrice = lead.estimated_price;
  const marketPrice = offerPrice && buybackDiscount > 0
    ? Math.round(offerPrice / buybackDiscount)
    : null;
  const limitPrice = marketPrice ? Math.round(marketPrice * 0.80) : null;
  const margin = marketPrice && offerPrice
    ? Math.round((1 - offerPrice / marketPrice) * 100)
    : null;

  const waPhone = lead.phone.replace(/\D/g, "");
  const offerText = offerPrice
    ? `Наше предложение по срочному выкупу: ${new Intl.NumberFormat("ru-RU").format(offerPrice)} тенге.`
    : "";
  const waMessage = encodeURIComponent(
    `Здравствуйте${lead.name ? `, ${lead.name}` : ""}! Я менеджер из Алмавыкуп. ${offerText}`
  );

  return (
    <div style={{
      background: "#111827", border: "1px solid #1E2A3A", borderRadius: 10,
      padding: 14, borderLeft: `3px solid ${color}`,
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{ cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{lead.name ?? "Без имени"}</span>
          <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {lead.property_type && PROPERTY_TYPE_LABELS[lead.property_type] && (
              <span style={{
                fontSize: 10, padding: "2px 6px", borderRadius: 8,
                background: "#4A8FD420", color: "#4A8FD4", fontWeight: 600,
              }}>
                {PROPERTY_TYPE_LABELS[lead.property_type]}
              </span>
            )}
            {lead.intent && INTENT_LABELS[lead.intent] && (
              <span style={{
                fontSize: 10, padding: "2px 6px", borderRadius: 8,
                background: (INTENT_COLORS[lead.intent] ?? "#5A6478") + "20",
                color: INTENT_COLORS[lead.intent] ?? "#5A6478", fontWeight: 600,
              }}>
                {INTENT_LABELS[lead.intent]}
              </span>
            )}
            {margin !== null && !lead.needs_manual_review && (
              <span style={{
                fontSize: 10, padding: "2px 6px", borderRadius: 8,
                background: "#25D36620", color: "#25D366", fontWeight: 700,
              }}>
                {margin}%
              </span>
            )}
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 10,
              background: color + "25", color, fontWeight: 600,
            }}>
              {STATUS_LABELS[lead.status] ?? lead.status}
            </span>
          </div>
        </div>

        {/* 3-price display for auto-calc leads */}
        {!lead.needs_manual_review && offerPrice ? (
          <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12 }}>
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
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 13, color: "#8B95A8" }}>
            <span>{lead.phone}</span>
            <span>{lead.offer_price ? formatPrice(lead.offer_price) : "Ожидает оценки"}</span>
          </div>
        )}

        <div style={{ fontSize: 11, color: "#5A6478", marginTop: 4 }}>
          {formatDate(lead.created_at)} · {lead.phone}
          {lead.area_sqm ? ` · ${lead.area_sqm} м²` : ""}
          {lead.floor ? ` · ${lead.floor} эт.` : ""}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1E2A3A" }}>
          {/* Detail rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10, fontSize: 12 }}>
            {lead.area_sqm && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#5A6478" }}>Площадь</span>
                <span style={{ color: "#8B95A8" }}>{lead.area_sqm} м²</span>
              </div>
            )}
            {lead.intent && INTENT_LABELS[lead.intent] && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#5A6478" }}>Статус клиента</span>
                <span style={{ color: INTENT_COLORS[lead.intent] ?? "#8B95A8", fontWeight: 600 }}>
                  {INTENT_LABELS[lead.intent]}
                </span>
              </div>
            )}
            {lead.floor && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#5A6478" }}>Этаж</span>
                <span style={{ color: "#8B95A8" }}>{lead.floor}</span>
              </div>
            )}
            {lead.year_built && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#5A6478" }}>Год постройки</span>
                <span style={{ color: "#8B95A8" }}>{lead.year_built}</span>
              </div>
            )}
            {lead.wall_material && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#5A6478" }}>Материал стен</span>
                <span style={{ color: "#8B95A8" }}>{lead.wall_material}</span>
              </div>
            )}
            {lead.is_pledged && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#5A6478" }}>В залоге</span>
                <span style={{ color: "#E74C3C", fontWeight: 600 }}>Да</span>
              </div>
            )}
            {lead.notes && (
              <div style={{ marginTop: 4, color: "#5A6478", fontSize: 11, lineHeight: 1.4 }}>
                {lead.notes}
              </div>
            )}
          </div>

          {/* Manual price input for manual review leads */}
          {lead.needs_manual_review && !lead.offer_price && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
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

          {lead.needs_manual_review && lead.offer_price && (
            <div style={{ fontSize: 13, color: "#25D366", fontWeight: 600, marginBottom: 10 }}>
              Оферта: {formatPrice(lead.offer_price)}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <a
              href={`https://wa.me/${waPhone}?text=${waMessage}`}
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
              href={`tel:${lead.phone}`}
              style={{
                padding: "6px 12px", borderRadius: 6, background: "#4A8FD4",
                color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none",
              }}
            >
              Позвонить
            </a>
            {(lead.status === "new" || lead.status === "pending_review") && (
              <button
                onClick={() => onStatusChange(lead.id, "contacted")}
                style={{
                  padding: "6px 12px", borderRadius: 6, background: "#C8A44E",
                  color: "#0A0D14", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                }}
              >
                Взять
              </button>
            )}
            {(lead.status === "contacted" || lead.status === "new" || lead.status === "pending_review") && (
              <button
                onClick={() => onStatusChange(lead.id, "in_progress")}
                style={{
                  padding: "6px 12px", borderRadius: 6, background: "#E8A838",
                  color: "#0A0D14", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                }}
              >
                В работу
              </button>
            )}
            {lead.status !== "closed_won" && lead.status !== "closed_lost" && (
              <>
                <button
                  onClick={() => onStatusChange(lead.id, "closed_won")}
                  style={{
                    padding: "6px 12px", borderRadius: 6, background: "#1A2332",
                    color: "#25D366", fontSize: 12, fontWeight: 600, border: "1px solid #25D366", cursor: "pointer",
                  }}
                >
                  Закрыть ✓
                </button>
                <button
                  onClick={() => onStatusChange(lead.id, "closed_lost")}
                  style={{
                    padding: "6px 12px", borderRadius: 6, background: "#1A2332",
                    color: "#5A6478", fontSize: 12, fontWeight: 600, border: "1px solid #5A6478", cursor: "pointer",
                  }}
                >
                  Архив
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
