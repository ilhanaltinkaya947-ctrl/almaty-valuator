"use client";

import { useState } from "react";
import {
  Lead,
  STATUS_COLORS,
  STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  INTENT_LABELS,
  INTENT_COLORS,
  ROLE_NEXT_STATUS,
  ROLE_NEXT_LABELS,
  formatPrice,
  formatDate,
} from "@/lib/crm-constants";

export default function LeadCard({
  lead,
  buybackDiscount,
  onStatusChange,
  onSetPrice,
  onRequestReject,
  onAssign,
  currentAgentId,
  currentRole = "manager",
}: {
  lead: Lead;
  buybackDiscount: number;
  onStatusChange: (id: string, status: string) => void;
  onSetPrice: (id: string, price: number) => void;
  onRequestReject: (id: string, reason: string) => void;
  onAssign: (id: string) => void;
  currentAgentId: string | null;
  currentRole?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const color = STATUS_COLORS[lead.status] ?? "#1E2A3A";

  const offerPrice = lead.estimated_price;
  const marketPrice =
    offerPrice && buybackDiscount > 0
      ? Math.round(offerPrice / buybackDiscount)
      : null;
  const limitPrice = marketPrice ? Math.round(marketPrice * 0.8) : null;
  const margin =
    marketPrice && offerPrice
      ? Math.round((1 - offerPrice / marketPrice) * 100)
      : null;

  const isBroker = currentRole === "manager";
  const waPhone = lead.phone.replace(/\D/g, "");
  const offerText = offerPrice
    ? `Наше предложение по срочному выкупу: ${new Intl.NumberFormat("ru-RU").format(offerPrice)} тенге.`
    : "";
  const waMessage = encodeURIComponent(
    `Здравствуйте${lead.name ? `, ${lead.name}` : ""}! Я менеджер из Алмавыкуп. ${offerText}`
  );
  const waLink = isBroker
    ? `/api/crm/leads/${lead.id}/contact?type=whatsapp`
    : `https://wa.me/${waPhone}?text=${waMessage}`;
  const callLink = isBroker
    ? `/api/crm/leads/${lead.id}/contact?type=call`
    : `tel:${lead.phone}`;

  const roleNextMap = ROLE_NEXT_STATUS[currentRole] ?? {};
  const roleLabelMap = ROLE_NEXT_LABELS[currentRole] ?? {};
  const nextStatus = roleNextMap[lead.status];
  const nextLabel = roleLabelMap[lead.status];
  const nextColor = nextStatus ? (STATUS_COLORS[nextStatus] ?? "#C8A44E") : null;

  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1E2A3A",
        borderRadius: 10,
        padding: 14,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div onClick={() => setExpanded(!expanded)} style={{ cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            <span style={{ color: "#5A6478", fontWeight: 400, fontSize: 12 }}>#{lead.short_id} </span>
            {lead.name ?? "Без имени"}
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {lead.assignee && (
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 8,
                  background: "#C8A44E20",
                  color: "#C8A44E",
                  fontWeight: 600,
                }}
              >
                {lead.assignee.name}
              </span>
            )}
            {lead.property_type && PROPERTY_TYPE_LABELS[lead.property_type] && (
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 8,
                  background: "#4A8FD420",
                  color: "#4A8FD4",
                  fontWeight: 600,
                }}
              >
                {PROPERTY_TYPE_LABELS[lead.property_type]}
              </span>
            )}
            {lead.intent && INTENT_LABELS[lead.intent] && (
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 8,
                  background: (INTENT_COLORS[lead.intent] ?? "#5A6478") + "20",
                  color: INTENT_COLORS[lead.intent] ?? "#5A6478",
                  fontWeight: 600,
                }}
              >
                {INTENT_LABELS[lead.intent]}
              </span>
            )}
            {margin !== null && !lead.needs_manual_review && (
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 8,
                  background: "#25D36620",
                  color: "#25D366",
                  fontWeight: 700,
                }}
              >
                {margin}%
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 10,
                background: color + "25",
                color,
                fontWeight: 600,
              }}
            >
              {STATUS_LABELS[lead.status] ?? lead.status}
            </span>
          </div>
        </div>

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
            {lead.total_expenses ? (
              <div>
                <div style={{ color: "#5A6478", fontSize: 10 }}>Итого</div>
                <div style={{ color: "#F1F3F7", fontWeight: 700 }}>{formatPrice(offerPrice + lead.total_expenses)}</div>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 13, color: "#8B95A8" }}>
            <span>{lead.phone}</span>
            <div style={{ textAlign: "right" }}>
              <span>{lead.offer_price ? formatPrice(lead.offer_price) : "Ожидает оценки"}</span>
              {lead.offer_price && lead.total_expenses ? (
                <div style={{ fontSize: 10, color: "#5A6478" }}>
                  + {formatPrice(lead.total_expenses)} = <span style={{ color: "#F1F3F7", fontWeight: 600 }}>{formatPrice(lead.offer_price + lead.total_expenses)}</span>
                </div>
              ) : null}
            </div>
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

          {/* Rejection reason display */}
          {lead.status === "rejected" && lead.rejection_reason && (
            <div
              style={{
                marginBottom: 10,
                padding: 10,
                background: "#E74C3C15",
                borderRadius: 8,
                border: "1px solid #E74C3C30",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#E74C3C", marginBottom: 2 }}>
                Причина отказа
              </div>
              <div style={{ fontSize: 12, color: "#F1F3F7", lineHeight: 1.4 }}>
                {lead.rejection_reason}
              </div>
            </div>
          )}

          {lead.needs_manual_review && !lead.offer_price && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <input
                type="number"
                placeholder="Цена выкупа"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: "#0A0D14",
                  border: "1px solid #E74C3C",
                  color: "#F1F3F7",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={() => {
                  const p = parseInt(priceInput);
                  if (p > 0) {
                    onSetPrice(lead.id, p);
                    setPriceInput("");
                  }
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "#E74C3C",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
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

          {/* Inline reject reason input */}
          {showRejectInput && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Причина отказа..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: "#0A0D14",
                  border: "1px solid #E74C3C",
                  color: "#F1F3F7",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={() => {
                  onRequestReject(lead.id, rejectReason);
                  setShowRejectInput(false);
                  setRejectReason("");
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "#E74C3C",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Подтвердить
              </button>
              <button
                onClick={() => { setShowRejectInput(false); setRejectReason(""); }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "transparent",
                  color: "#5A6478",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid #5A6478",
                  cursor: "pointer",
                }}
              >
                Отмена
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: "#25D366",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              WhatsApp
            </a>
            <a
              href={callLink}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: "#4A8FD4",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Позвонить
            </a>
            {lead.status === "new" && !lead.assigned_to && (currentRole === "manager" || currentRole === "admin") && (
              <button
                onClick={() => onAssign(lead.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "#C8A44E",
                  color: "#0A0D14",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Взять в работу
              </button>
            )}
            {nextStatus && nextLabel && lead.status !== "new" && (
              <button
                onClick={() => onStatusChange(lead.id, nextStatus)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: nextColor ?? "#C8A44E",
                  color: nextColor === "#9B59B6" || nextColor === "#3498DB" || nextColor === "#25D366" ? "#fff" : "#0A0D14",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {nextLabel}
              </button>
            )}
            {lead.status !== "deal_closed" && lead.status !== "rejected" && !showRejectInput && (
              <button
                onClick={() => setShowRejectInput(true)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "#1A2332",
                  color: "#5A6478",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid #5A6478",
                  cursor: "pointer",
                }}
              >
                Отказ
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
