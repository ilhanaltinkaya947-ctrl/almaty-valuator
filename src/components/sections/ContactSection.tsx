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
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <section
      id="contacts"
      className="relative py-20 sm:py-28"
      style={{ backgroundColor: "#0A0C14" }}
    >
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-16 items-start">
          {/* Left — Form with integrated heading */}
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.2em] mb-4" style={{ color: "#C8A44E" }}>
              Контакты
            </div>
            <h2
              className="font-semibold tracking-[-0.03em] text-white mb-8"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Оставьте заявку
            </h2>

            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  {/* Trust strip */}
                  <div className="flex items-center gap-2 text-[12px] text-[#5A6478] mb-6">
                    <span style={{ color: "#C8A44E" }}>🔒</span>
                    Ваши данные защищены
                  </div>

                  {/* Inline name + phone row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Имя"
                      required
                      className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#08090E] px-4 py-3.5 text-[15px] text-white placeholder:text-[#3A4258] focus:border-[rgba(200,164,78,0.4)] focus:shadow-[0_0_0_3px_rgba(200,164,78,0.1)] focus:outline-none transition-all duration-200"
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="+7 (___) ___-__-__"
                      required
                      className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#08090E] px-4 py-3.5 text-[15px] text-white placeholder:text-[#3A4258] focus:border-[rgba(200,164,78,0.4)] focus:shadow-[0_0_0_3px_rgba(200,164,78,0.1)] focus:outline-none transition-all duration-200 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#08090E] px-4 py-3.5 text-[15px] text-white focus:border-[rgba(200,164,78,0.4)] focus:shadow-[0_0_0_3px_rgba(200,164,78,0.1)] focus:outline-none transition-all duration-200"
                    >
                      <option value="" className="bg-[#08090E]">Тип недвижимости</option>
                      <option value="apartment" className="bg-[#08090E]">Квартира</option>
                      <option value="house" className="bg-[#08090E]">Дом или коттедж</option>
                      <option value="commercial" className="bg-[#08090E]">Коммерция</option>
                      <option value="land" className="bg-[#08090E]">Земельный участок</option>
                    </select>
                    <button
                      type="submit"
                      disabled={!isValid || loading}
                      className="rounded-xl bg-[#C8A44E] px-8 py-3.5 font-semibold text-[#0C0E16] text-[15px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(200,164,78,0.3)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap"
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
                  <h3 className="text-lg font-semibold text-white mb-1">Заявка отправлена!</h3>
                  <p className="text-[14px] text-[#7A8299]">Свяжемся в течение 15 минут</p>
                </div>
              )}
            </div>
          </div>

          {/* Right — Compact contact cards */}
          <div className="lg:pt-[88px]">
            <div className="space-y-3">
              {[
                { icon: "📞", label: "+7 (707) 450-32-77", href: "tel:+77074503277" },
                { icon: "✉️", label: "almavykup@gmail.com", href: "mailto:almavykup@gmail.com" },
                { icon: "📍", label: "Мамыр 4 / дом 119", href: "https://2gis.kz/almaty/geo/9430047375160217/76.844166,43.217433" },
                { icon: "🕐", label: "Пн-Пт: 9:00 - 18:00", href: undefined },
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
                    className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 hover:bg-[rgba(255,255,255,0.03)] group"
                    style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <span className="text-base">{info.icon}</span>
                    <span className="text-[14px] font-medium text-[#B8BCC8] group-hover:text-white transition-colors">
                      {info.label}
                    </span>
                  </Tag>
                );
              })}
            </div>

            <a
              href="https://2gis.kz/almaty/geo/9430047375160217/76.844166,43.217433"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 mt-4 ml-4 text-[#C8A44E] hover:text-[#E8D5A0] transition-colors duration-200"
            >
              <span className="text-[13px] font-medium">Открыть на карте</span>
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
