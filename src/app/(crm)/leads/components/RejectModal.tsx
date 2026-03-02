"use client";

import { useState } from "react";

export default function RejectModal({
  leadName,
  onConfirm,
  onCancel,
}: {
  leadName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 1100,
        }}
      />
      {/* Dialog */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(400px, 90vw)",
          background: "#111827",
          borderRadius: 12,
          border: "1px solid #1E2A3A",
          zIndex: 1101,
          padding: 24,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F1F3F7", margin: "0 0 4px" }}>
          Отказ
        </h3>
        <div style={{ fontSize: 13, color: "#8B95A8", marginBottom: 16 }}>
          {leadName}
        </div>

        <textarea
          placeholder="Причина отказа..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "#0A0D14",
            border: "1px solid #1E2A3A",
            borderRadius: 8,
            color: "#F1F3F7",
            fontSize: 13,
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
            marginBottom: 16,
          }}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "transparent",
              color: "#8B95A8",
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid #5A6478",
              cursor: "pointer",
            }}
          >
            Отмена
          </button>
          <button
            onClick={() => onConfirm(reason)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "#E74C3C",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Подтвердить отказ
          </button>
        </div>
      </div>
    </>
  );
}
