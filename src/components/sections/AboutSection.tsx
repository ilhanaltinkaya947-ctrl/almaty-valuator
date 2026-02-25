"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export function AboutSection() {
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
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" className="py-14 sm:py-24" style={{ backgroundColor: "#0C0E16" }}>
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        <div ref={ref} className="reveal">
          {/* Full-width image hero card */}
          <div
            className="relative rounded-3xl overflow-hidden mb-6"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="relative h-[240px] sm:h-[400px]">
              <Image
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200"
                alt="Алматы"
                fill
                className="object-cover"
                sizes="(max-width: 1120px) 100vw, 1120px"
              />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(8,9,14,0.92) 0%, rgba(8,9,14,0.6) 40%, rgba(8,9,14,0.3) 100%)",
                }}
              />
            </div>

            {/* Content over image */}
            <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-12">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] mb-4" style={{ color: "#C8A44E" }}>
                  О компании
                </div>
                <h2
                  className="font-semibold tracking-[-0.03em] text-white max-w-[500px]"
                  style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
                >
                  Алмавыкуп — надежный
                  <br />
                  партнер <span className="text-gold-gradient">в Алматы</span>
                </h2>
              </div>

              {/* Stats row — floating at bottom */}
              <div className="flex flex-wrap gap-6 sm:gap-10">
                {[
                  { num: "500+", label: "сделок закрыто" },
                  { num: "15", label: "мин — время ответа" },
                  { num: "7+", label: "лет на рынке" },
                ].map((s) => (
                  <div
                    key={s.num}
                    className="rounded-xl px-4 py-3"
                    style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
                  >
                    <div className="font-mono font-bold leading-none" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", color: "#C8A44E" }}>
                      {s.num}
                    </div>
                    <div className="text-[11px] text-[#8B95A8] mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4 mini feature badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { icon: "⚡", label: "Быстро", sub: "Сделка за 1-3 дня" },
              { icon: "🛡️", label: "Надежно", sub: "Юр. сопровождение" },
              { icon: "💰", label: "Выгодно", sub: "Рыночная цена" },
              { icon: "🚗", label: "Выезд", sub: "Бесплатная оценка" },
            ].map((b) => (
              <div
                key={b.label}
                className="group rounded-xl sm:rounded-2xl p-3 sm:p-5 flex items-center gap-2.5 sm:gap-3 cursor-default transition-all duration-300 hover:bg-[rgba(200,164,78,0.04)]"
                style={{ border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span className="text-lg sm:text-xl shrink-0 transition-transform duration-300 group-hover:scale-110">{b.icon}</span>
                <div>
                  <div className="text-[13px] sm:text-[14px] font-semibold text-white">{b.label}</div>
                  <div className="text-[10px] sm:text-[11px] text-[#5A6478]">{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
