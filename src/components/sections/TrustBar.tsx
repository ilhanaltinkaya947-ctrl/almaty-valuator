"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 500, suffix: "+", label: "Сделок закрыто" },
  { value: 24, suffix: "ч", label: "Оценка в день обращения" },
  { value: 100, suffix: "%", label: "Юридическая чистота" },
  { value: 0, suffix: "₸", label: "Бесплатная консультация" },
];

function AnimatedStat({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setStarted(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  useEffect(() => {
    if (!started || value === 0) {
      if (started) setCount(0);
      return;
    }
    const duration = 2000;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [started, value]);

  return (
    <div ref={ref} className="text-center px-4 sm:px-8 py-2 sm:py-0">
      <div className="text-[28px] sm:text-[42px] font-bold font-mono tracking-tight leading-none mb-0.5" style={{ color: "#3A8D7B" }}>
        {count}{suffix}
      </div>
      <div className="text-[11px] sm:text-[13px] text-[#6B7280]">{label}</div>
    </div>
  );
}

export function TrustBar() {
  return (
    <section style={{ backgroundColor: "#F0F9F6" }}>
      {/* Top separator line */}
      <div
        className="h-px mx-auto max-w-[800px]"
        style={{ background: "linear-gradient(to right, transparent, rgba(58,141,123,0.15), transparent)" }}
      />
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6 py-8 sm:py-14">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center items-center sm:divide-x sm:divide-[rgba(0,0,0,0.06)] gap-y-4 sm:gap-y-0">
          {STATS.map((stat, i) => (
            <AnimatedStat key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} delay={i * 200} />
          ))}
        </div>
      </div>
      {/* Bottom separator line */}
      <div
        className="h-px mx-auto max-w-[800px]"
        style={{ background: "linear-gradient(to right, transparent, rgba(58,141,123,0.15), transparent)" }}
      />
    </section>
  );
}
