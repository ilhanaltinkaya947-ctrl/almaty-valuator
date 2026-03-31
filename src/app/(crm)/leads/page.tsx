"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Lead,
  SettingRow,
  STATUS_OPTIONS,
  STATUS_LABELS,
  ROLE_STATUS_OPTIONS,
} from "@/lib/crm-constants";
import ViewToggle from "./components/ViewToggle";
import LeadCard from "./components/LeadCard";
import KanbanBoard from "./components/KanbanBoard";
import CreateLeadModal from "./components/CreateLeadModal";

interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
}

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  profileRole?: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [buybackDiscount, setBuybackDiscount] = useState(0.7);
  const [error, setError] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<AgentInfo | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

      const [leadsRes, settingsRes, meRes] = await Promise.all([
        fetch("/api/crm/leads?limit=100", { headers }),
        fetch("/api/crm/settings", { headers }),
        fetch("/api/crm/auth/me", { headers }),
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

      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentAgent(meData);
      }
    } catch {
      setError("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Background refresh — re-fetch leads from server to sync expense totals etc.
  const refreshLeads = useCallback(async () => {
    try {
      const initData = getInitData();
      const res = await fetch("/api/crm/leads?limit=100", {
        headers: { "x-telegram-init-data": initData },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads ?? []);
      }
    } catch {
      // silent — optimistic state is still valid
    }
  }, []);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    const previousLeads = leads;
    const label = STATUS_LABELS[newStatus] ?? newStatus;

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    try {
      const initData = getInitData();
      const res = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify({ lead_id: leadId, status: newStatus }),
      });
      if (!res.ok) {
        setLeads(previousLeads);
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error ?? "Ошибка сохранения");
      } else {
        toast.success(`Статус → ${label}`);
        refreshLeads();
      }
    } catch {
      setLeads(previousLeads);
      toast.error("Ошибка сети");
    }
  };

  const rejectLead = async (leadId: string, reason: string) => {
    const previousLeads = leads;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, status: "rejected", rejection_reason: reason } : l
      )
    );

    try {
      const initData = getInitData();
      const res = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify({ lead_id: leadId, status: "rejected", rejection_reason: reason }),
      });
      if (!res.ok) {
        setLeads(previousLeads);
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error ?? "Ошибка сохранения");
      } else {
        toast.success("Отказ оформлен");
        refreshLeads();
      }
    } catch {
      setLeads(previousLeads);
      toast.error("Ошибка сети");
    }
  };

  const assignLead = async (leadId: string) => {
    if (!currentAgent) return;
    const previousLeads = leads;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              status: "in_progress",
              assigned_to: currentAgent.id,
              assignee: { id: currentAgent.id, name: currentAgent.name },
            }
          : l
      )
    );

    try {
      const initData = getInitData();
      const res = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify({
          lead_id: leadId,
          status: "in_progress",
          assigned_to: currentAgent.id,
        }),
      });
      if (!res.ok) {
        setLeads(previousLeads);
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error ?? "Ошибка сохранения");
      } else {
        toast.success("Взято в работу");
        refreshLeads();
      }
    } catch {
      setLeads(previousLeads);
      toast.error("Ошибка сети");
    }
  };

  const setOfferPrice = async (leadId: string, price: number) => {
    const previousLeads = leads;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, offer_price: price } : l
      )
    );

    try {
      const initData = getInitData();
      const res = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify({ lead_id: leadId, offer_price: price }),
      });
      if (!res.ok) {
        setLeads(previousLeads);
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error ?? "Ошибка сохранения цены");
      } else {
        toast.success("Цена обновлена");
      }
    } catch {
      setLeads(previousLeads);
      toast.error("Ошибка сети");
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

  const autoLeads = filteredLeads.filter((l) => !l.needs_manual_review);
  const manualLeads = filteredLeads.filter((l) => l.needs_manual_review);

  return (
    <div style={{
      minHeight: "var(--tg-viewport-stable-height, 100vh)",
      background: "#0A0D14",
      color: "#F1F3F7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "16px 16px 100px",
      maxWidth: viewMode === "kanban" ? "100%" : 900,
      margin: "0 auto",
      WebkitTapHighlightColor: "transparent",
      overscrollBehavior: "none",
    }}>
      {/* Header with title + toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#C8A44E", margin: 0 }}>
            {currentAgent?.profileRole === "sales" ? "Инвентарь" : "Лиды"}
          </h1>
          {(currentAgent?.profileRole === "admin" || currentAgent?.profileRole === "manager") && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                background: "#C8A44E",
                color: "#0A0D14",
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "transform 75ms, opacity 75ms",
              }}
            >
              + Новая заявка
            </button>
          )}
        </div>
        <ViewToggle view={viewMode} onChange={handleViewChange} />
      </div>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <CreateLeadModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchData}
        />
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Поиск по имени или телефону..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "12px 14px", background: "#111827",
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
            marginTop: 12, padding: "10px 20px", background: "#C8A44E",
            color: "#0A0D14", border: "none", borderRadius: 6, cursor: "pointer",
            fontSize: 13, fontWeight: 600, transition: "transform 75ms, opacity 75ms",
          }}>Повторить</button>
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard
          leads={leads}
          buybackDiscount={buybackDiscount}
          search={search}
          onStatusChange={updateLeadStatus}
          onSetPrice={setOfferPrice}
          onReject={rejectLead}
          onAssign={assignLead}
          onRefresh={refreshLeads}
          currentAgent={currentAgent}
          currentRole={currentAgent?.profileRole ?? "manager"}
        />
      ) : (
        <>
          {/* Filter pills (list view only) */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
            {(ROLE_STATUS_OPTIONS[currentAgent?.profileRole ?? "admin"] ?? STATUS_OPTIONS).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                style={{
                  padding: "8px 14px", borderRadius: 16,
                  border: `1px solid ${filter === opt.value ? (opt.color ?? "#C8A44E") : "#1E2A3A"}`,
                  background: filter === opt.value ? (opt.color ?? "#C8A44E") + "20" : "transparent",
                  color: filter === opt.value ? (opt.color ?? "#C8A44E") : "#8B95A8",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                  transition: "transform 75ms, opacity 75ms",
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
                  onRequestReject={rejectLead}
                  onAssign={assignLead}
                  currentAgentId={currentAgent?.id ?? null}
                  currentRole={currentAgent?.profileRole ?? "manager"}
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
                  onRequestReject={rejectLead}
                  onAssign={assignLead}
                  currentAgentId={currentAgent?.id ?? null}
                  currentRole={currentAgent?.profileRole ?? "manager"}
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
