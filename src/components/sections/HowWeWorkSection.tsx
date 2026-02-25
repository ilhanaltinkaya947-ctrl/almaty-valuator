"use client";

import { useEffect, useRef } from "react";

const STEPS = [
  { num: "01", title: "Консультация", time: "15 мин", icon: "📞" },
  { num: "02", title: "Осмотр", time: "2-3 ч", icon: "🔍" },
  { num: "03", title: "Цена", time: "1 час", icon: "💰" },
  { num: "04", title: "Документы", time: "Быстро", icon: "📋" },
  { num: "05", title: "Договор", time: "2-3 ч", icon: "✍️" },
  { num: "06", title: "Оплата", time: "Сразу", icon: "🎉" },
];

export function HowWeWorkSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".step-card").forEach((card, i) => {
            setTimeout(() => card.classList.add("visible"), i * 100);
          });
          observer.unobserve(el);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="steps" className="py-20 sm:py-28" style={{ backgroundColor: "#08090E" }}>
      <div className="mx-auto max-w-[1120px] px-6">
        {/* Heading with inline timeline hint */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.2em] mb-4" style={{ color: "#C8A44E" }}>
              Процесс
            </div>
            <h2
              className="font-semibold tracking-[-0.03em] text-white"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              От звонка до денег
            </h2>
          </div>
          {/* Summary pill */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-mono font-medium shrink-0"
            style={{ background: "rgba(200,164,78,0.06)", color: "#C8A44E" }}
          >
            <span>📞</span>
            <span className="text-[#3A4258]">→</span>
            <span>🎉</span>
            <span className="ml-1 text-[#5A6478]">от 1 дня</span>
          </div>
        </div>

        {/* 3×2 card grid with oversized watermark numbers */}
        <div ref={ref} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="step-card group relative rounded-2xl p-5 sm:p-6 overflow-hidden cursor-default transition-all duration-700"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
                opacity: 0,
                transform: "translateY(24px)",
              }}
            >
              {/* Giant watermark number */}
              <div
                className="absolute -top-4 -right-2 font-mono font-bold leading-none select-none pointer-events-none transition-all duration-500 group-hover:text-[rgba(200,164,78,0.12)]"
                style={{
                  fontSize: "clamp(5rem, 8vw, 7rem)",
                  color: "rgba(255,255,255,0.02)",
                }}
              >
                {step.num}
              </div>

              {/* Content */}
              <div className="relative">
                <span className="text-xl mb-3 block">{step.icon}</span>
                <h3 className="text-[15px] sm:text-[17px] font-semibold text-white mb-2 group-hover:text-[#E8D5A0] transition-colors duration-300">
                  {step.title}
                </h3>
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium"
                  style={{ backgroundColor: "rgba(200,164,78,0.06)", color: "#C8A44E" }}
                >
                  {step.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .step-card.visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .step-card:hover {
          background: rgba(200,164,78,0.03) !important;
          border-color: rgba(200,164,78,0.1) !important;
        }
      `}</style>
    </section>
  );
}
