"use client";

import { useState } from "react";
import { formatPhone, unformatPhone } from "@/lib/utils";
import type { WallMaterial, LeadIntent, FloorPosition } from "@/types/evaluation";

interface LeadCaptureFormProps {
  onSubmitted?: (phone: string) => void;
  complexId?: string;
  areaSqm?: number;
  floor?: number;
  estimatedPrice?: number;
  zoneId?: string;
  floorPosition?: FloorPosition;
  yearBuilt?: number;
  wallMaterial?: WallMaterial;
  isPledged?: boolean;
  intent?: LeadIntent;
}

export function LeadCaptureForm({
  onSubmitted,
  complexId,
  areaSqm,
  floor,
  estimatedPrice,
  zoneId,
  floorPosition,
  yearBuilt,
  wallMaterial,
  isPledged,
  intent = "ready",
}: LeadCaptureFormProps) {
  const [phone, setPhone] = useState("+7");
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const rawPhone = unformatPhone(phone);
  const isValid = /^\+7\d{10}$/.test(rawPhone);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
  }

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: rawPhone,
          address: address || undefined,
          complex_id: complexId,
          area_sqm: areaSqm,
          floor,
          estimated_price: estimatedPrice,
          source: "landing",
          zone_id: zoneId,
          floor_position: floorPosition,
          year_built: yearBuilt,
          wall_material: wallMaterial,
          is_pledged: isPledged ?? false,
          intent,
        }),
      });
    } catch {
      // Silently fail — still show success to user
    }
    setLoading(false);
    setSubmitted(true);
    onSubmitted?.(rawPhone);
  }

  if (submitted) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center fade-enter">
        <div className="h-12 w-12 rounded-full bg-[rgba(37,211,102,0.15)] flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4 className="text-lg font-semibold text-[#1A2332] mb-1">Заявка принята!</h4>
        <p className="text-sm text-[#6B7280]">
          {intent === "negotiate"
            ? "Наш эксперт свяжется для обсуждения цены"
            : "Наш эксперт свяжется с вами в течение 15 минут"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 fade-enter" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "rgba(58,141,123,0.15)" }}>
          <svg className="h-3 w-3 text-[#3A8D7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h4 className="font-semibold text-[#1A2332] text-[15px]">
          {intent === "negotiate"
            ? "Обсудить цену с экспертом"
            : "Точная оценка от эксперта — бесплатно"}
        </h4>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-[0.12em] block mb-1.5">
            Номер телефона <span className="text-[#E74C3C]">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="+7 (___) ___-__-__"
            className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3 text-[#1A2332] placeholder:text-[#9CA3AF] focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200 font-mono"
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-[0.12em] block mb-1.5">
            Точный адрес квартиры
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Улица, дом, квартира"
            className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3 text-[#1A2332] placeholder:text-[#9CA3AF] focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid || loading}
        className="w-full rounded-2xl bg-gradient-to-r from-[#66BB6A] to-[#26A69A] px-6 py-5 font-semibold text-white text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(58,141,123,0.3)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {loading
          ? "Отправка..."
          : intent === "negotiate"
            ? "Обсудить цену"
            : "Получить бесплатную оценку"}
      </button>

      <p className="text-[13px] text-[#9CA3AF] text-center mt-3">
        Бесплатно &bull; Без обязательств &bull; Ответ за 15 минут
      </p>
    </div>
  );
}
