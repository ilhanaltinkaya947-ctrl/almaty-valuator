"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lead,
  SettingRow,
  STATUS_OPTIONS,
  formatPrice,
  formatDate,
} from "@/lib/crm-constants";
import ViewToggle from "./components/ViewToggle";
import LeadCard from "./components/LeadCard";
import KanbanBoard from "./components/KanbanBoard";

interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [buybackDiscount, setBuybackDiscount] = useState(0.7);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("crm-view-mode") as "list" | "kanban") ?? "list";
    }
    return "list";
  });

  const handleViewChange = (v: "list" | "kanban") => {
    setViewMode(v);
    localStorage.setItem("crm-view-mode", v);
  };

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
            l.id === leadId ? { ...l, offer_price: price } : l
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

  const autoLeads = filteredLeads.filter((l) => !l.needs_manual_review);
  const manualLeads = filteredLeads.filter((l) => l.needs_manual_review);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0D14",
      color: "#F1F3F7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "16px",
      maxWidth: viewMode === "kanban" ? "100%" : 900,
      margin: "0 auto",
    }}>
      {/* Header with title + toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#C8A44E", margin: 0 }}>
          Лиды
        </h1>
        <ViewToggle view={viewMode} onChange={handleViewChange} />
      </div>

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
      ) : viewMode === "kanban" ? (
        <KanbanBoard
          leads={leads}
          buybackDiscount={buybackDiscount}
          search={search}
          onStatusChange={updateLeadStatus}
          onSetPrice={setOfferPrice}
        />
      ) : (
        <>
          {/* Filter pills (list view only) */}
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
