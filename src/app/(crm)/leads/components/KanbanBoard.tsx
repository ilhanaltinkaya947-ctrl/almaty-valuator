"use client";

import { useState, useMemo } from "react";
import {
  Lead,
  PIPELINE_STATUSES,
  TERMINAL_STATUSES,
  CATEGORY_FILTERS,
  filterLeadsByCategory,
  formatPrice,
} from "@/lib/crm-constants";
import KanbanColumn from "./KanbanColumn";
import LeadDetailPanel from "./LeadDetailPanel";

export default function KanbanBoard({
  leads,
  buybackDiscount,
  search,
  onStatusChange,
  onSetPrice,
}: {
  leads: Lead[];
  buybackDiscount: number;
  search: string;
  onStatusChange: (id: string, status: string) => void;
  onSetPrice: (id: string, price: number) => void;
}) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    let result = leads;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          (l.name?.toLowerCase().includes(q) ?? false) ||
          l.phone.includes(search)
      );
    }
    return filterLeadsByCategory(result, category);
  }, [leads, search, category]);

  const categoryCounts = useMemo(() => {
    let searchFiltered = leads;
    if (search) {
      const q = search.toLowerCase();
      searchFiltered = searchFiltered.filter(
        (l) =>
          (l.name?.toLowerCase().includes(q) ?? false) ||
          l.phone.includes(search)
      );
    }
    const counts: Record<string, number> = {};
    for (const f of CATEGORY_FILTERS) {
      counts[f.value] = filterLeadsByCategory(searchFiltered, f.value).length;
    }
    return counts;
  }, [leads, search]);

  const grouped = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of PIPELINE_STATUSES) {
      map[s] = [];
    }
    for (const lead of filtered) {
      if (map[lead.status]) {
        map[lead.status].push(lead);
      }
    }
    return map;
  }, [filtered]);

  const totalActive = filtered.filter(
    (l) => !(TERMINAL_STATUSES as readonly string[]).includes(l.status)
  ).length;
  const totalOfferSum = filtered.reduce(
    (sum, l) => sum + (l.offer_price ?? l.estimated_price ?? 0),
    0
  );

  const handleStatusChange = (id: string, status: string) => {
    onStatusChange(id, status);
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead({ ...selectedLead, status });
    }
  };

  const handleSetPrice = (id: string, price: number) => {
    onSetPrice(id, price);
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead({ ...selectedLead, offer_price: price });
    }
  };

  return (
    <div>
      {/* Summary bar */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 12,
          padding: "8px 12px",
          background: "#111827",
          borderRadius: 8,
          border: "1px solid #1E2A3A",
          fontSize: 12,
        }}
      >
        <span style={{ color: "#8B95A8" }}>
          Активных: <span style={{ color: "#F1F3F7", fontWeight: 700 }}>{totalActive}</span>
        </span>
        <span style={{ color: "#8B95A8" }}>
          Сумма оферт: <span style={{ color: "#C8A44E", fontWeight: 700 }}>{formatPrice(totalOfferSum || null)}</span>
        </span>
      </div>

      {/* Category filter pills */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 12,
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {CATEGORY_FILTERS.map((f) => {
          const isActive = category === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setCategory(f.value)}
              style={{
                padding: "5px 12px",
                borderRadius: 16,
                border: `1px solid ${isActive ? f.color : "#1E2A3A"}`,
                background: isActive ? f.color + "22" : "transparent",
                color: isActive ? f.color : "#8B95A8",
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              {f.label} ({categoryCounts[f.value] ?? 0})
            </button>
          );
        })}
      </div>

      {/* Kanban columns */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          height: "calc(100vh - 160px)",
          paddingBottom: 8,
        }}
      >
        {PIPELINE_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            leads={grouped[status]}
            defaultCollapsed={(TERMINAL_STATUSES as readonly string[]).includes(status)}
            onCardClick={setSelectedLead}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {/* Detail panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          buybackDiscount={buybackDiscount}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
          onSetPrice={handleSetPrice}
        />
      )}
    </div>
  );
}
