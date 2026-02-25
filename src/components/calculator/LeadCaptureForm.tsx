"use client";

import { useState } from "react";
import { formatPhone, unformatPhone } from "@/lib/utils";

interface LeadCaptureFormProps {
  onSubmitted?: (phone: string) => void;
}

export function LeadCaptureForm({ onSubmitted }: LeadCaptureFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
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
    await new Promise((r) => setTimeout(r, 800));
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
        <h4 className="text-lg font-semibold text-white mb-1">Заявка принята!</h4>
        <p className="text-sm text-[#7A8299]">
          Наш эксперт свяжется с вами в течение 15 минут
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 fade-enter">
      <h4 className="font-semibold text-white mb-1">
        Получить точную оценку от эксперта — бесплатно
      </h4>
      <p className="text-sm text-[#7A8299] mb-4">
        Оставьте контакты — мы перезвоним в течение 15 минут
      </p>

      <div className="space-y-3 mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ваше имя"
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#08090E] px-5 py-3 text-white placeholder:text-[#3A4258] focus:border-[rgba(200,164,78,0.4)] focus:shadow-[0_0_0_3px_rgba(200,164,78,0.1)] focus:outline-none transition-all duration-200"
        />
        <input
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="+7 (___) ___-__-__"
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#08090E] px-5 py-3 text-white placeholder:text-[#3A4258] focus:border-[rgba(200,164,78,0.4)] focus:shadow-[0_0_0_3px_rgba(200,164,78,0.1)] focus:outline-none transition-all duration-200 font-mono"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid || loading}
        className="w-full rounded-2xl bg-[#C8A44E] px-6 py-5 font-semibold text-[#08090E] text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(200,164,78,0.3)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {loading ? "Отправка..." : "Получить бесплатную оценку"}
      </button>

      <p className="text-xs text-[#5A6478] text-center mt-3">
        Бесплатно &bull; Без обязательств &bull; Ответ за 15 минут
      </p>
    </div>
  );
}
