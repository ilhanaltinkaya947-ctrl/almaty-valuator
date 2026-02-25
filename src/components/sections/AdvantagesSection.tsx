"use client";

import { useEffect, useRef } from "react";

const ROW_1 = [
  "🤝 Без посредников",
  "💳 Оплата сразу",
  "🏚️ Любое состояние",
  "⚖️ Юр. поддержка",
  "📋 Помощь с долгами",
  "🔓 Проблемные объекты",
  "🔒 Конфиденциально",
  "🆓 Бесплатная оценка",
];

export function AdvantagesSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 sm:py-20 overflow-hidden" style={{ backgroundColor: "#0C0E16" }}>
      <div className="mx-auto max-w-[1120px] px-6 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.2em] mb-4" style={{ color: "#C8A44E" }}>
              Преимущества
            </div>
            <h2
              className="font-semibold tracking-[-0.03em] text-white"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Почему выбирают нас
            </h2>
          </div>
          <span className="text-[13px] text-[#3A4258] font-medium">8 причин →</span>
        </div>
      </div>

      {/* Scrolling pill ticker — infinite marquee */}
      <div ref={ref} className="reveal">
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, #0C0E16, transparent)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, #0C0E16, transparent)" }} />

          <div className="overflow-hidden">
            <div className="flex gap-4 animate-marquee whitespace-nowrap">
              {[...ROW_1, ...ROW_1].map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center shrink-0 rounded-full px-5 py-3 text-[14px] font-medium text-white transition-colors duration-300 hover:bg-[rgba(200,164,78,0.06)] cursor-default"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
