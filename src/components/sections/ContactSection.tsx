"use client";

import { useState } from "react";
import { formatPhone, unformatPhone } from "@/lib/utils";

export function ContactSection() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [propertyType, setPropertyType] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const rawPhone = unformatPhone(phone);
  const isValid = /^\+7\d{10}$/.test(rawPhone) && name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: rawPhone,
          name: name.trim(),
          property_type: propertyType || undefined,
          source: "landing",
        }),
      });
    } catch {
      // Silently fail — still show success to user
    }
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <section id="contacts" className="relative py-10 sm:py-24" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F0F9F6 12%, #F0F9F6 100%)" }}>
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(58,141,123,0.04) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative mx-auto max-w-[1120px] px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-10 items-start">
          {/* Left — heading + form */}
          <div>
            <div className="text-[13px] font-medium uppercase tracking-[0.2em] mb-4" style={{ color: "#3A8D7B" }}>
              Контакты
            </div>
            <h2
              className="font-semibold tracking-[-0.03em] text-[#1A2332] mb-6"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
            >
              Оставьте заявку
            </h2>

            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(58,141,123,0.08)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.04), 0 0 80px rgba(58,141,123,0.02)",
              }}
            >
              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center gap-2 text-[13px] text-[#9CA3AF] mb-5">
                    <span style={{ color: "#3A8D7B" }}>🔒</span>
                    Ваши данные защищены
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Имя"
                      required
                      className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3.5 text-[15px] text-[#1A2332] placeholder:text-[#9CA3AF] focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200"
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="+7 (___) ___-__-__"
                      required
                      className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3.5 text-[15px] text-[#1A2332] placeholder:text-[#9CA3AF] focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3.5 pr-10 text-[15px] text-[#1A2332] focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 14px center",
                        backgroundSize: "16px",
                      }}
                    >
                      <option value="">Тип недвижимости</option>
                      <option value="apartment">Квартира</option>
                      <option value="house">Дом или коттедж</option>
                      <option value="commercial">Коммерция</option>
                      <option value="land">Земельный участок</option>
                    </select>
                    <button
                      type="submit"
                      disabled={!isValid || loading}
                      className="rounded-xl bg-gradient-to-r from-[#66BB6A] to-[#26A69A] px-8 py-3.5 font-semibold text-white text-[15px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(58,141,123,0.3)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap"
                    >
                      {loading ? "..." : "Отправить →"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-10">
                  <div className="h-12 w-12 rounded-full bg-[rgba(37,211,102,0.15)] flex items-center justify-center mx-auto mb-4">
                    <svg className="h-6 w-6 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1A2332] mb-1">Заявка отправлена!</h3>
                  <p className="text-[14px] text-[#6B7280]">Свяжемся в течение 15 минут</p>
                </div>
              )}
            </div>
          </div>

          {/* Right — contact info */}
          <div className="lg:pt-[88px] space-y-2">
            {[
              { icon: "📞", label: "+7 (707) 450-32-77", href: "tel:+77074503277", highlight: true },
              { icon: "✉️", label: "almavykup@gmail.com", href: "mailto:almavykup@gmail.com", highlight: false },
              { icon: "📍", label: "Мамыр 4 / дом 119", href: "https://2gis.kz/almaty/geo/9430047375160217/76.844166,43.217433", highlight: false },
              { icon: "🕐", label: "Пн-Пт: 9:00 - 18:00", href: undefined, highlight: false },
            ].map((info) => {
              const Tag = info.href ? "a" : "div";
              const linkProps = info.href
                ? {
                    href: info.href,
                    target: info.href.startsWith("http") ? ("_blank" as const) : undefined,
                    rel: info.href.startsWith("http") ? "noopener noreferrer" : undefined,
                  }
                : {};
              return (
                <Tag
                  key={info.label}
                  {...linkProps}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 hover:bg-[rgba(58,141,123,0.03)] group"
                  style={{
                    border: info.highlight
                      ? "1px solid rgba(58,141,123,0.12)"
                      : "1px solid rgba(0,0,0,0.06)",
                    background: info.highlight ? "rgba(58,141,123,0.03)" : "#FFFFFF",
                  }}
                >
                  <span className="text-base">{info.icon}</span>
                  <span
                    className="text-[15px] font-medium group-hover:text-[#1A2332] transition-colors"
                    style={{ color: info.highlight ? "#3A8D7B" : "#6B7280" }}
                  >
                    {info.label}
                  </span>
                </Tag>
              );
            })}

            <a
              href="https://2gis.kz/almaty/geo/9430047375160217/76.844166,43.217433"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 mt-2 ml-4 text-[#3A8D7B] hover:text-[#2D6B5F] transition-colors duration-200"
            >
              <span className="text-sm font-medium">Открыть на карте</span>
              <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
