"use client";

import { useState, useEffect } from "react";
import {
  Lead,
  STATUS_COLORS,
  STATUS_LABELS,
  NEXT_STATUS,
  NEXT_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  INTENT_LABELS,
  INTENT_COLORS,
  formatPrice,
  formatDate,
} from "@/lib/crm-constants";

export default function LeadDetailPanel({
  lead,
  buybackDiscount,
  onClose,
  onStatusChange,
  onSetPrice,
}: {
  lead: Lead;
  buybackDiscount: number;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onSetPrice: (id: string, price: number) => void;
}) {
  const [priceInput, setPriceInput] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

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

  const waPhone = lead.phone.replace(/\D/g, "");
  const offerText = offerPrice
    ? ` \u041D\u0430\u0448\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043F\u043E \u0441\u0440\u043E\u0447\u043D\u043E\u043C\u0443 \u0432\u044B\u043A\u0443\u043F\u0443: ${new Intl.NumberFormat("ru-RU").format(offerPrice)} \u0442\u0435\u043D\u0433\u0435.`
    : "";
  const waMessage = encodeURIComponent(
    `\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435${lead.name ? `, ${lead.name}` : ""}! \u042F \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440 \u0438\u0437 \u0410\u043B\u043C\u0430\u0432\u044B\u043A\u0443\u043F.${offerText}`
  );

  const nextStatus = NEXT_STATUS[lead.status];
  const nextLabel = NEXT_STATUS_LABELS[lead.status];
  const nextColor = nextStatus ? (STATUS_COLORS[nextStatus] ?? "#C8A44E") : null;

  const DetailRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
      <span style={{ color: "#5A6478", fontSize: 12 }}>{label}</span>
      <span style={{ color: valueColor ?? "#8B95A8", fontSize: 12, fontWeight: 600 }}>{value}</span>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 999,
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms",
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(400px, 100vw)",
          background: "#0A0D14",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease",
          borderLeft: "1px solid #1E2A3A",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #1E2A3A",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              color: "#8B95A8",
              fontSize: 20,
              cursor: "pointer",
              padding: "0 4px",
            }}
          >
            \u2715
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {/* Name + phone */}
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F1F3F7", margin: "0 0 4px" }}>
            {lead.name ?? "\u0411\u0435\u0437 \u0438\u043C\u0435\u043D\u0438"}
          </h2>
          <div style={{ fontSize: 13, color: "#8B95A8", marginBottom: 16 }}>{lead.phone}</div>

          {/* 3-price block for auto-calc */}
          {!lead.needs_manual_review && offerPrice ? (
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 16,
                padding: 12,
                background: "#111827",
                borderRadius: 8,
                border: "1px solid #1E2A3A",
              }}
            >
              <div>
                <div style={{ color: "#5A6478", fontSize: 10 }}>{"\u0420\u044B\u043D\u043E\u043A"}</div>
                <div style={{ color: "#8B95A8", fontWeight: 600, fontSize: 13 }}>{formatPrice(marketPrice)}</div>
              </div>
              <div>
                <div style={{ color: "#5A6478", fontSize: 10 }}>{"\u041E\u0444\u0435\u0440\u0442\u0430"}</div>
                <div style={{ color: "#C8A44E", fontWeight: 700, fontSize: 13 }}>{formatPrice(offerPrice)}</div>
              </div>
              <div>
                <div style={{ color: "#5A6478", fontSize: 10 }}>{"\u041B\u0438\u043C\u0438\u0442"}</div>
                <div style={{ color: "#E74C3C", fontWeight: 600, fontSize: 13 }}>{formatPrice(limitPrice)}</div>
              </div>
              {margin !== null && (
                <div
                  style={{
                    marginLeft: "auto",
                    alignSelf: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#25D366",
                    background: "#25D36620",
                    padding: "2px 8px",
                    borderRadius: 8,
                  }}
                >
                  {margin}%
                </div>
              )}
            </div>
          ) : null}

          {/* Manual price input */}
          {lead.needs_manual_review && !lead.offer_price && (
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              <input
                type="number"
                placeholder="\u0426\u0435\u043D\u0430 \u0432\u044B\u043A\u0443\u043F\u0430"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: "#111827",
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
                  padding: "8px 14px",
                  borderRadius: 6,
                  background: "#E74C3C",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {"\u041D\u0430\u0437\u043D\u0430\u0447\u0438\u0442\u044C"}
              </button>
            </div>
          )}
          {lead.needs_manual_review && lead.offer_price && (
            <div style={{ fontSize: 14, color: "#25D366", fontWeight: 600, marginBottom: 16 }}>
              {"\u041E\u0444\u0435\u0440\u0442\u0430:"} {formatPrice(lead.offer_price)}
            </div>
          )}

          {/* Detail rows */}
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: "#111827",
              borderRadius: 8,
              border: "1px solid #1E2A3A",
            }}
          >
            <DetailRow label={"\u0414\u0430\u0442\u0430"} value={formatDate(lead.created_at)} />
            {lead.area_sqm && <DetailRow label={"\u041F\u043B\u043E\u0449\u0430\u0434\u044C"} value={`${lead.area_sqm} \u043C\u00B2`} />}
            {lead.floor && <DetailRow label={"\u042D\u0442\u0430\u0436"} value={String(lead.floor)} />}
            {lead.year_built && <DetailRow label={"\u0413\u043E\u0434 \u043F\u043E\u0441\u0442\u0440\u043E\u0439\u043A\u0438"} value={String(lead.year_built)} />}
            {lead.wall_material && <DetailRow label={"\u041C\u0430\u0442\u0435\u0440\u0438\u0430\u043B \u0441\u0442\u0435\u043D"} value={lead.wall_material} />}
            {lead.intent && INTENT_LABELS[lead.intent] && (
              <DetailRow
                label={"\u0421\u0442\u0430\u0442\u0443\u0441 \u043A\u043B\u0438\u0435\u043D\u0442\u0430"}
                value={INTENT_LABELS[lead.intent]}
                valueColor={INTENT_COLORS[lead.intent]}
              />
            )}
            {lead.is_pledged && <DetailRow label={"\u0412 \u0437\u0430\u043B\u043E\u0433\u0435"} value={"\u0414\u0430"} valueColor="#E74C3C" />}
          </div>

          {lead.notes && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                background: "#111827",
                borderRadius: 8,
                border: "1px solid #1E2A3A",
                color: "#8B95A8",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {lead.notes}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: 16,
            borderTop: "1px solid #1E2A3A",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <a
            href={`https://wa.me/${waPhone}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 14px",
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
            href={`tel:${lead.phone}`}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              background: "#4A8FD4",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {"\u041F\u043E\u0437\u0432\u043E\u043D\u0438\u0442\u044C"}
          </a>
          {nextStatus && nextLabel && (
            <button
              onClick={() => onStatusChange(lead.id, nextStatus)}
              style={{
                padding: "8px 14px",
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
          {lead.status !== "paid" && lead.status !== "rejected" && (
            <button
              onClick={() => onStatusChange(lead.id, "rejected")}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                background: "#1A2332",
                color: "#5A6478",
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid #5A6478",
                cursor: "pointer",
              }}
            >
              {"\u041E\u0442\u043A\u0430\u0437"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
