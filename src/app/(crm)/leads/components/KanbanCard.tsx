"use client";

import {
  Lead,
  STATUS_COLORS,
  NEXT_STATUS,
  NEXT_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  INTENT_LABELS,
  INTENT_COLORS,
  formatPrice,
  timeAgo,
} from "@/lib/crm-constants";

export default function KanbanCard({
  lead,
  onClick,
  onStatusChange,
}: {
  lead: Lead;
  onClick: (lead: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const color = STATUS_COLORS[lead.status] ?? "#1E2A3A";
  const nextStatus = NEXT_STATUS[lead.status];
  const nextLabel = NEXT_STATUS_LABELS[lead.status];
  const nextColor = nextStatus ? (STATUS_COLORS[nextStatus] ?? "#C8A44E") : null;

  return (
    <div
      onClick={() => onClick(lead)}
      style={{
        background: "#111827",
        border: "1px solid #1E2A3A",
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        padding: 10,
        cursor: "pointer",
        marginBottom: 6,
      }}
    >
      {/* Name + property type badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
        <span
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: "#F1F3F7",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {lead.name ?? "Без имени"}
        </span>
        {lead.property_type && PROPERTY_TYPE_LABELS[lead.property_type] && (
          <span
            style={{
              fontSize: 9,
              padding: "1px 5px",
              borderRadius: 6,
              background: "#4A8FD420",
              color: "#4A8FD4",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {PROPERTY_TYPE_LABELS[lead.property_type]}
          </span>
        )}
      </div>

      {/* Price */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#C8A44E", marginTop: 4 }}>
        {lead.offer_price || lead.estimated_price
          ? formatPrice(lead.offer_price ?? lead.estimated_price)
          : <span style={{ color: "#5A6478", fontWeight: 400, fontSize: 11 }}>Ожидает оценки</span>}
      </div>

      {/* Time + intent */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: "#5A6478" }}>
          {timeAgo(lead.created_at)}
          {lead.area_sqm ? ` \u00B7 ${lead.area_sqm} \u043C\u00B2` : ""}
        </span>
        {lead.intent && INTENT_LABELS[lead.intent] && (
          <span
            style={{
              fontSize: 9,
              padding: "1px 5px",
              borderRadius: 6,
              background: (INTENT_COLORS[lead.intent] ?? "#5A6478") + "20",
              color: INTENT_COLORS[lead.intent] ?? "#5A6478",
              fontWeight: 600,
            }}
          >
            {INTENT_LABELS[lead.intent]}
          </span>
        )}
      </div>

      {/* Next step button */}
      {nextStatus && nextLabel && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(lead.id, nextStatus);
          }}
          style={{
            marginTop: 6,
            width: "100%",
            padding: "4px 0",
            borderRadius: 5,
            border: "none",
            background: nextColor + "20",
            color: nextColor ?? "#C8A44E",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
