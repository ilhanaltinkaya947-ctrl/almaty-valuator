"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/crm-constants";
import type { LeadAttachment } from "@/types/database";

interface TelegramWebApp {
  initData: string;
}

export default function MediaTab({
  leadId,
  shortId,
}: {
  leadId: string;
  shortId: number | null;
}) {
  const [attachments, setAttachments] = useState<LeadAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTg = () =>
    (window as unknown as { Telegram?: { WebApp: TelegramWebApp } }).Telegram
      ?.WebApp;
  const getInitData = () => getTg()?.initData ?? "";

  const fetchAttachments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/attachments`, {
        headers: { "x-telegram-init-data": getInitData() },
      });
      if (res.ok) {
        const data = await res.json();
        setAttachments(data.attachments ?? []);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const uploadFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Макс. размер файла: 20МБ");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/crm/leads/${leadId}/media`, {
        method: "POST",
        headers: { "x-telegram-init-data": getInitData() },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachments((prev) => [...prev, data.attachment]);
        toast.success("Файл загружен");
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error ?? "Ошибка загрузки");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => uploadFile(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  return (
    <div>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: "24px 16px",
          borderRadius: 8,
          border: `2px dashed ${dragging ? "#C8A44E" : "#1E2A3A"}`,
          background: dragging ? "#C8A44E10" : "#111827",
          textAlign: "center",
          cursor: "pointer",
          marginBottom: 16,
          transition: "all 200ms",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }}>
          {uploading ? "⏳" : "📷"}
        </div>
        <div style={{ fontSize: 13, color: "#8B95A8" }}>
          {uploading
            ? "Загрузка..."
            : dragging
              ? "Отпустите для загрузки"
              : "Перетащите фото сюда или нажмите"}
        </div>
        {shortId && (
          <div style={{ fontSize: 11, color: "#5A6478", marginTop: 4 }}>
            Или отправьте боту фото с подписью{" "}
            <span style={{ color: "#C8A44E" }}>#{shortId}</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx"
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: "none" }}
        />
      </div>

      {/* Gallery */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 80,
                background: "#111827",
                borderRadius: 8,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
          <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
        </div>
      ) : attachments.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            color: "#5A6478",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 13 }}>Фото и документы появятся здесь</div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 8,
          }}
        >
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
                  <div
                    style={{
                      fontSize: 11,
                      color: "#F1F3F7",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {att.file_name}
                  </div>
                  <div
                    style={{ fontSize: 10, color: "#5A6478", marginTop: 2 }}
                  >
                    {formatDate(att.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
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
  );
}
