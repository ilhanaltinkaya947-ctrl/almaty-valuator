"use client";

import { useState } from "react";
import { Lead, STATUS_LABELS, STATUS_COLORS } from "@/lib/crm-constants";
import KanbanCard from "./KanbanCard";

export default function KanbanColumn({
  status,
  leads,
  defaultCollapsed,
  onCardClick,
  onStatusChange,
}: {
  status: string;
  leads: Lead[];
  defaultCollapsed: boolean;
  onCardClick: (lead: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const color = STATUS_COLORS[status] ?? "#1E2A3A";
  const label = STATUS_LABELS[status] ?? status;

  if (collapsed) {
    return (
      <div
        onClick={() => setCollapsed(false)}
        style={{
          minWidth: 80,
          maxWidth: 80,
          background: "#0D1118",
          borderRadius: 8,
          borderTop: `3px solid ${color}`,
          padding: "10px 6px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color,
          }}
        >
          {leads.length}
        </span>
        <span
          style={{
            fontSize: 10,
            color: "#8B95A8",
            writingMode: "vertical-lr",
            textOrientation: "mixed",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        minWidth: 240,
        maxWidth: 240,
        background: "#0D1118",
        borderRadius: 8,
        borderTop: `3px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Column header */}
      <div
        onClick={() => defaultCollapsed ? setCollapsed(true) : undefined}
        style={{
          padding: "10px 10px 6px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: defaultCollapsed ? "pointer" : "default",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#F1F3F7" }}>
          {label}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            fontWeight: 600,
            color,
            background: color + "20",
            padding: "1px 7px",
            borderRadius: 8,
          }}
        >
          {leads.length}
        </span>
      </div>

      {/* Cards container */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 8px 8px",
        }}
      >
        {leads.map((lead) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            onClick={onCardClick}
            onStatusChange={onStatusChange}
          />
        ))}
        {leads.length === 0 && (
          <div style={{ textAlign: "center", color: "#5A6478", fontSize: 11, padding: "20px 0" }}>
            Пусто
          </div>
        )}
      </div>
    </div>
  );
}
