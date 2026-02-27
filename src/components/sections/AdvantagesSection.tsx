"use client";

import { useEffect, useRef } from "react";

const ITEMS = [
  { icon: "🤝", label: "Без посредников", sub: "Прямой выкуп" },
  { icon: "💳", label: "Оплата сразу", sub: "В день сделки" },
  { icon: "🏚️", label: "Любое состояние", sub: "Даже проблемные" },
  { icon: "⚖️", label: "Юр. поддержка", sub: "Полная защита" },
  { icon: "📋", label: "Помощь с долгами", sub: "Берем на себя" },
  { icon: "🔓", label: "Проблемные объекты", sub: "Решаем вопросы" },
  { icon: "🔒", label: "Конфиденциально", sub: "100% приватность" },
  { icon: "🆓", label: "Бесплатная оценка", sub: "Без обязательств" },
];

export function AdvantagesSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".adv-item").forEach((item, i) => {
            setTimeout(() => item.classList.add("visible"), i * 80);
          });
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-14 sm:py-24" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <div className="text-[13px] font-medium uppercase tracking-[0.2em] mb-4" style={{ color: "#3A8D7B" }}>
            Преимущества
          </div>
          <h2
            className="font-semibold tracking-[-0.03em] text-[#1A2332]"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Почему выбирают нас
          </h2>
        </div>

        {/* 4×2 grid with real visual weight */}
        <div ref={ref} className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {ITEMS.map((item, i) => (
            <div
              key={item.label}
              className="adv-item group rounded-xl sm:rounded-2xl p-4 sm:p-6 cursor-default transition-all duration-500"
              style={{
                background: i === 0 || i === 7
                  ? "linear-gradient(145deg, rgba(58,141,123,0.07), rgba(58,141,123,0.02))"
                  : "#FFFFFF",
                border: i === 0 || i === 7
                  ? "1px solid rgba(58,141,123,0.15)"
                  : "1px solid rgba(0,0,0,0.06)",
                boxShadow: i === 0 || i === 7
                  ? "0 0 40px rgba(58,141,123,0.03)"
                  : "none",
                opacity: 0,
                transform: "translateY(20px)",
              }}
            >
              <span className="text-xl sm:text-2xl block mb-2 sm:mb-3 transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </span>
              <div className="text-[13px] sm:text-[15px] font-semibold text-[#1A2332] mb-0.5 group-hover:text-[#3A8D7B] transition-colors duration-300 leading-snug">
                {item.label}
              </div>
              <div className="text-[12px] sm:text-[13px] text-[#9CA3AF]">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .adv-item.visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .adv-item:hover {
          border-color: rgba(58,141,123,0.1) !important;
          background: rgba(58,141,123,0.04) !important;
        }
      `}</style>
    </section>
  );
}
