"use client";

import { useEffect, useRef } from "react";

const STEPS = [
  { num: "01", title: "Консультация", time: "15 мин", icon: "📞", highlight: true },
  { num: "02", title: "Осмотр объекта", time: "2-3 ч", icon: "🔍", highlight: false },
  { num: "03", title: "Цена", time: "1 час", icon: "💰", highlight: false },
  { num: "04", title: "Документы", time: "Быстро", icon: "📋", highlight: false },
  { num: "05", title: "Договор", time: "2-3 ч", icon: "✍️", highlight: false },
  { num: "06", title: "Оплата", time: "Сразу", icon: "🎉", highlight: true },
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
    <section id="steps" className="py-14 sm:py-24" style={{ backgroundColor: "#F0F9F6" }}>
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <div className="text-[13px] font-medium uppercase tracking-[0.2em] mb-4" style={{ color: "#3A8D7B" }}>
              Процесс
            </div>
            <h2
              className="font-semibold tracking-[-0.03em] text-[#1A2332]"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              От звонка <span className="text-gold-gradient">до денег</span>
            </h2>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-mono font-medium shrink-0"
            style={{ background: "rgba(58,141,123,0.06)", border: "1px solid rgba(58,141,123,0.12)", color: "#3A8D7B" }}
          >
            📞 → 🎉 от 1 дня
          </div>
        </div>

        {/* 3×2 card grid */}
        <div ref={ref} className="grid grid-cols-3 gap-2 sm:gap-4">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="step-card group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-default transition-all duration-500"
              style={{
                background: step.highlight
                  ? "linear-gradient(145deg, rgba(58,141,123,0.08), rgba(58,141,123,0.02))"
                  : "#FFFFFF",
                border: step.highlight
                  ? "1px solid rgba(58,141,123,0.15)"
                  : "1px solid rgba(0,0,0,0.06)",
                opacity: 0,
                transform: "translateY(24px)",
              }}
            >
              {/* Giant watermark number */}
              <div
                className="absolute -top-3 -right-1 font-mono font-bold leading-none select-none pointer-events-none transition-all duration-500 group-hover:text-[rgba(58,141,123,0.1)]"
                style={{
                  fontSize: "clamp(3.5rem, 7vw, 6rem)",
                  color: step.highlight ? "rgba(58,141,123,0.06)" : "rgba(0,0,0,0.03)",
                }}
              >
                {step.num}
              </div>

              <div className="relative p-3 sm:p-6">
                <span className="text-lg sm:text-xl mb-2 sm:mb-3 block">{step.icon}</span>
                <h3 className="text-sm sm:text-lg font-semibold text-[#1A2332] mb-1.5 sm:mb-2 group-hover:text-[#3A8D7B] transition-colors duration-300">
                  {step.title}
                </h3>
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-mono font-medium"
                  style={{
                    backgroundColor: step.highlight ? "rgba(58,141,123,0.12)" : "rgba(58,141,123,0.06)",
                    color: "#3A8D7B",
                  }}
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
          border-color: rgba(58,141,123,0.12) !important;
          transform: translateY(-2px) !important;
        }
      `}</style>
    </section>
  );
}
