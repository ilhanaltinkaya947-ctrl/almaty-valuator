"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const BADGES = [
  { icon: "⚡", label: "Быстро" },
  { icon: "🛡️", label: "Надежно" },
  { icon: "💰", label: "Выгодно" },
  { icon: "🚗", label: "Выезд" },
];

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
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" className="py-20 sm:py-28" style={{ backgroundColor: "#0C0E16" }}>
      <div className="mx-auto max-w-[1120px] px-6">
        {/* Bento grid */}
        <div ref={ref} className="reveal grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 auto-rows-[140px] sm:auto-rows-[160px]">
          {/* Large image card — spans 2 cols + 2 rows */}
          <div
            className="col-span-2 row-span-2 rounded-2xl overflow-hidden relative group"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Image
              src="https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=800"
              alt="Алматы"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(8,9,14,0.85) 0%, rgba(8,9,14,0.2) 50%, rgba(8,9,14,0.05) 100%)",
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="text-[12px] font-medium uppercase tracking-[0.2em] mb-2" style={{ color: "#C8A44E" }}>
                О компании
              </div>
              <h2
                className="font-semibold tracking-[-0.03em] text-white"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)" }}
              >
                Алмавыкуп — надежный
                <br className="hidden sm:block" />
                партнер в Алматы
              </h2>
            </div>
          </div>

          {/* Stat card: 500+ */}
          <div
            className="rounded-2xl flex flex-col items-center justify-center text-center p-4"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
              border: "1px solid rgba(200,164,78,0.1)",
            }}
          >
            <div
              className="font-mono font-bold tracking-tight leading-none mb-1"
              style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", color: "#C8A44E" }}
            >
              500<span style={{ color: "rgba(200,164,78,0.4)" }}>+</span>
            </div>
            <div className="text-[13px] text-[#5A6478]">сделок</div>
          </div>

          {/* Stat card: 15 мин */}
          <div
            className="rounded-2xl flex flex-col items-center justify-center text-center p-4"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="font-mono font-bold tracking-tight leading-none mb-1"
              style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", color: "#C8A44E" }}
            >
              15
            </div>
            <div className="text-[13px] text-[#5A6478]">мин — время ответа</div>
          </div>

          {/* Bottom row: 4 icon badges — each 1 col */}
          {BADGES.map((b) => (
            <div
              key={b.label}
              className="rounded-2xl flex flex-col items-center justify-center text-center gap-2 group cursor-default"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span className="text-2xl transition-transform duration-300 group-hover:scale-125">
                {b.icon}
              </span>
              <span className="text-[13px] font-semibold text-white">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
