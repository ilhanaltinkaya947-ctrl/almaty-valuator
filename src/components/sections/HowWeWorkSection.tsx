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
    <section id="steps" className="py-14 sm:py-24" style={{ backgroundColor: "#08090E" }}>
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.2em] mb-4" style={{ color: "#C8A44E" }}>
              Процесс
            </div>
            <h2
              className="font-semibold tracking-[-0.03em] text-white"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              От звонка <span className="text-gold-gradient">до денег</span>
            </h2>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-mono font-medium shrink-0"
            style={{ background: "rgba(200,164,78,0.06)", border: "1px solid rgba(200,164,78,0.12)", color: "#C8A44E" }}
          >
            📞 → 🎉 от 1 дня
          </div>
        </div>

        {/* 3×2 card grid */}
        <div ref={ref} className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="step-card group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-default transition-all duration-500"
              style={{
                background: step.highlight
                  ? "linear-gradient(145deg, rgba(200,164,78,0.08), rgba(200,164,78,0.02))"
                  : "rgba(255,255,255,0.02)",
                border: step.highlight
                  ? "1px solid rgba(200,164,78,0.15)"
                  : "1px solid rgba(255,255,255,0.05)",
                opacity: 0,
                transform: "translateY(24px)",
              }}
            >
              {/* Giant watermark number */}
              <div
                className="absolute -top-3 -right-1 font-mono font-bold leading-none select-none pointer-events-none transition-all duration-500 group-hover:text-[rgba(200,164,78,0.1)]"
                style={{
                  fontSize: "clamp(3.5rem, 7vw, 6rem)",
                  color: step.highlight ? "rgba(200,164,78,0.06)" : "rgba(255,255,255,0.02)",
                }}
              >
                {step.num}
              </div>

              <div className="relative p-4 sm:p-6">
                <span className="text-lg sm:text-xl mb-2 sm:mb-3 block">{step.icon}</span>
                <h3 className="text-[13px] sm:text-[17px] font-semibold text-white mb-1.5 sm:mb-2 group-hover:text-[#E8D5A0] transition-colors duration-300">
                  {step.title}
                </h3>
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium"
                  style={{
                    backgroundColor: step.highlight ? "rgba(200,164,78,0.12)" : "rgba(200,164,78,0.06)",
                    color: "#C8A44E",
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
          border-color: rgba(200,164,78,0.12) !important;
          transform: translateY(-2px) !important;
        }
      `}</style>
    </section>
  );
}
