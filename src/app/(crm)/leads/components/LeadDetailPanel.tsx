"use client";

import { useState, useEffect, useCallback } from "react";
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
import type { LeadAttachment } from "@/types/database";

interface TelegramWebApp {
  initData: string;
}


export default function LeadDetailPanel({
  lead,
  buybackDiscount,
  onClose,
  onStatusChange,
  onSetPrice,
  onRequestReject,
  onAssign,
  currentAgentId,
}: {
  lead: Lead;
  buybackDiscount: number;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onSetPrice: (id: string, price: number) => void;
  onRequestReject: (lead: Lead) => void;
  onAssign: (id: string) => void;
  currentAgentId: string | null;
}) {
  const [priceInput, setPriceInput] = useState("");
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState<"info" | "docs" | "events">("info");
  const [attachments, setAttachments] = useState<LeadAttachment[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [events, setEvents] = useState<{ id: string; action: string; description: string; created_at: string; user_name: string | null }[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const getTg = () => (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram?.WebApp;
  const getInitData = () => getTg()?.initData ?? "";

  const fetchAttachments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/attachments`, {
        headers: { "x-telegram-init-data": getInitData() },
      });
      if (res.ok) {
        const data = await res.json();
        setAttachments(data.attachments ?? []);
      }
    } catch {
      // silent fail
    } finally {
      setLoadingDocs(false);
    }
  }, [lead.id]);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/events`, {
        headers: { "x-telegram-init-data": getInitData() },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
      }
    } catch {
      // silent fail
    } finally {
      setLoadingEvents(false);
    }
  }, [lead.id]);

  useEffect(() => {
    if (tab === "docs") {
      fetchAttachments();
    }
    if (tab === "events") {
      fetchEvents();
    }
  }, [tab, fetchAttachments, fetchEvents]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxUrl) {
          setLightboxUrl(null);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxUrl]); // eslint-disable-line react-hooks/exhaustive-deps

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
    ? ` Наше предложение по срочному выкупу: ${new Intl.NumberFormat("ru-RU").format(offerPrice)} тенге.`
    : "";
  const waMessage = encodeURIComponent(
    `Здравствуйте${lead.name ? `, ${lead.name}` : ""}! Я менеджер из Алмавыкуп.${offerText}`
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

  const tabStyle = (active: boolean) => ({
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600 as const,
    color: active ? "#C8A44E" : "#5A6478",
    background: "none" as const,
    border: "none" as const,
    borderBottom: active ? "2px solid #C8A44E" : "2px solid transparent",
    cursor: "pointer" as const,
  });

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
            {"\u2715"}
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #1E2A3A", padding: "0 16px" }}>
          <button style={tabStyle(tab === "info")} onClick={() => setTab("info")}>
            Инфо
          </button>
          <button style={tabStyle(tab === "docs")} onClick={() => setTab("docs")}>
            Документы
          </button>
          <button style={tabStyle(tab === "events")} onClick={() => setTab("events")}>
            История
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {tab === "events" ? (
            /* Events tab */
            <div>
              {loadingEvents ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{
                      height: 48, background: "#111827", borderRadius: 8,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }} />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 20px",
                  color: "#5A6478",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 13 }}>Нет событий</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {events.map((ev, idx) => {
                    const ACTION_ICONS: Record<string, string> = {
                      created: "🆕",
                      status_changed: "🔄",
                      assigned: "👤",
                      price_set: "💰",
                      document_added: "📎",
                      jurist_approved: "⚖️",
                    };
                    const icon = ACTION_ICONS[ev.action] ?? "📌";
                    const date = new Date(ev.created_at);
                    const timeStr = date.toLocaleString("ru-RU", {
                      timeZone: "Asia/Almaty",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) + ", " + date.toLocaleString("ru-RU", {
                      timeZone: "Asia/Almaty",
                      day: "numeric",
                      month: "short",
                    });
                    const userName = ev.user_name || "Система";
                    const isLast = idx === events.length - 1;
                    return (
                      <div key={ev.id} style={{ display: "flex", gap: 10 }}>
                        {/* Timeline line + dot */}
                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          width: 24,
                          flexShrink: 0,
                        }}>
                          <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "#111827",
                            border: "2px solid #1E2A3A",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            flexShrink: 0,
                          }}>
                            {icon}
                          </div>
                          {!isLast && (
                            <div style={{
                              width: 2,
                              flex: 1,
                              background: "#1E2A3A",
                              minHeight: 16,
                            }} />
                          )}
                        </div>
                        {/* Content */}
                        <div style={{ paddingBottom: isLast ? 0 : 12, flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: "#F1F3F7", lineHeight: 1.4 }}>
                            {ev.description}
                          </div>
                          <div style={{ fontSize: 10, color: "#5A6478", marginTop: 2 }}>
                            {timeStr}
                            <span style={{ color: "#C8A44E", marginLeft: 6 }}>{userName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : tab === "info" ? (
            <>
              {/* Name + phone */}
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F1F3F7", margin: "0 0 4px" }}>
                <span style={{ color: "#5A6478", fontWeight: 400, fontSize: 14 }}>#{lead.short_id} </span>
                {lead.name ?? "Без имени"}
              </h2>
              <div style={{ fontSize: 13, color: "#8B95A8", marginBottom: 8 }}>{lead.phone}</div>

              {/* Assignee info */}
              {lead.assignee && (
                <div style={{
                  fontSize: 12,
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: "#C8A44E15",
                  color: "#C8A44E",
                  fontWeight: 600,
                  display: "inline-block",
                  marginBottom: 12,
                }}>
                  {lead.assignee.name}
                </div>
              )}

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
                    <div style={{ color: "#5A6478", fontSize: 10 }}>Рынок</div>
                    <div style={{ color: "#8B95A8", fontWeight: 600, fontSize: 13 }}>{formatPrice(marketPrice)}</div>
                  </div>
                  <div>
                    <div style={{ color: "#5A6478", fontSize: 10 }}>Оферта</div>
                    <div style={{ color: "#C8A44E", fontWeight: 700, fontSize: 13 }}>{formatPrice(offerPrice)}</div>
                  </div>
                  <div>
                    <div style={{ color: "#5A6478", fontSize: 10 }}>Лимит</div>
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
                    placeholder="Цена выкупа"
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
                    Назначить
                  </button>
                </div>
              )}
              {lead.needs_manual_review && lead.offer_price && (
                <div style={{ fontSize: 14, color: "#25D366", fontWeight: 600, marginBottom: 16 }}>
                  Оферта: {formatPrice(lead.offer_price)}
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
                <DetailRow label="Дата" value={formatDate(lead.created_at)} />
                {lead.area_sqm && <DetailRow label="Площадь" value={`${lead.area_sqm} м²`} />}
                {lead.floor && <DetailRow label="Этаж" value={String(lead.floor)} />}
                {lead.year_built && <DetailRow label="Год постройки" value={String(lead.year_built)} />}
                {lead.wall_material && <DetailRow label="Материал стен" value={lead.wall_material} />}
                {lead.intent && INTENT_LABELS[lead.intent] && (
                  <DetailRow
                    label="Статус клиента"
                    value={INTENT_LABELS[lead.intent]}
                    valueColor={INTENT_COLORS[lead.intent]}
                  />
                )}
                {lead.is_pledged && <DetailRow label="В залоге" value="Да" valueColor="#E74C3C" />}
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

              {/* Rejection reason block */}
              {lead.status === "rejected" && lead.rejection_reason && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    background: "#E74C3C15",
                    borderRadius: 8,
                    border: "1px solid #E74C3C30",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#E74C3C", marginBottom: 4 }}>
                    Причина отказа
                  </div>
                  <div style={{ fontSize: 12, color: "#F1F3F7", lineHeight: 1.4 }}>
                    {lead.rejection_reason}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Docs tab */
            <div>
              {loadingDocs ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{
                      height: 80, background: "#111827", borderRadius: 8,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }} />
                  ))}
                  <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
                </div>
              ) : attachments.length === 0 ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 20px",
                  color: "#5A6478",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
                  <div style={{ fontSize: 13 }}>
                    Здесь будут фото с объекта и договоры
                  </div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>
                    Отправьте файл боту с подписью <span style={{ color: "#C8A44E" }}>#{lead.short_id}</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: 8,
                }}>
                  {attachments.map((att) => {
                    const isImage = att.file_type.startsWith("image/");
                    return (
                      <div
                        key={att.id}
                        style={{
                          background: "#111827",
                          border: "1px solid #1E2A3A",
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        {isImage ? (
                          <div
                            onClick={() => setLightboxUrl(att.file_url)}
                            style={{
                              width: "100%",
                              height: 120,
                              backgroundImage: `url(${att.file_url})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              cursor: "pointer",
                            }}
                          />
                        ) : (
                          <a
                            href={att.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100%",
                              height: 120,
                              background: "#0A0D14",
                              color: "#5A6478",
                              fontSize: 32,
                              textDecoration: "none",
                            }}
                          >
                            {att.file_type.includes("pdf") ? "📕" : "📎"}
                          </a>
                        )}
                        <div style={{ padding: "6px 8px" }}>
                          <div style={{
                            fontSize: 11,
                            color: "#F1F3F7",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {att.file_name}
                          </div>
                          <div style={{ fontSize: 10, color: "#5A6478", marginTop: 2 }}>
                            {formatDate(att.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* Lightbox */}
          {lightboxUrl && (
            <div
              onClick={() => setLightboxUrl(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                zIndex: 1200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "zoom-out",
              }}
            >
              <img
                src={lightboxUrl}
                alt="Attachment"
                style={{
                  maxWidth: "90vw",
                  maxHeight: "90vh",
                  borderRadius: 8,
                  objectFit: "contain",
                }}
              />
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
            Позвонить
          </a>
          {lead.status === "new" && !lead.assigned_to && (
            <button
              onClick={() => onAssign(lead.id)}
              style={{
                padding: "8px 14px",
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
          {lead.status !== "deal_closed" && lead.status !== "rejected" && (
            <button
              onClick={() => onRequestReject(lead)}
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
              Отказ
            </button>
          )}
        </div>
      </div>
    </>
  );
}
