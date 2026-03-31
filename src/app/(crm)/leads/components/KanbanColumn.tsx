"use client";

import { Lead, STATUS_LABELS, STATUS_COLORS } from "@/lib/crm-constants";
import KanbanCard from "./KanbanCard";

export default function KanbanColumn({
  status,
  leads,
  onCardClick,
  onStatusChange,
  onRequestReject,
  onAssign,
  currentAgentId,
  currentRole = "manager",
}: {
  status: string;
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
  onRequestReject: (lead: Lead) => void;
  onAssign: (id: string) => void;
  currentAgentId: string | null;
  currentRole?: string;
}) {
  const color = STATUS_COLORS[status] ?? "#1E2A3A";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <div
      style={{
        minWidth: 240,
        maxWidth: 240,
        height: "100%",
        background: "#0D1118",
        borderRadius: 8,
        borderTop: `3px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: "10px 10px 6px",
          display: "flex",
          alignItems: "center",
          gap: 6,
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
          minHeight: 0,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          padding: "4px 8px 8px",
        }}
      >
        {leads.map((lead) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            onClick={onCardClick}
            onStatusChange={onStatusChange}
            onRequestReject={onRequestReject}
            onAssign={onAssign}
            currentAgentId={currentAgentId}
            currentRole={currentRole}
          />
        ))}
        {leads.length === 0 && (
          <div style={{ textAlign: "center", color: "#5A6478", fontSize: 12, padding: "30px 10px" }}>
            <div style={{ fontSize: 22, marginBottom: 4, opacity: 0.5 }}>{"📭"}</div>
            Пусто
          </div>
        )}
      </div>
    </div>
  );
}
