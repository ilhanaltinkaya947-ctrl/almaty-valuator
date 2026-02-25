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
    <div ref={ref} className="text-center px-6 sm:px-8">
      <div className="text-[36px] sm:text-[42px] font-bold font-mono tracking-tight leading-none mb-1" style={{ color: "#C8A44E" }}>
        {count}{suffix}
      </div>
      <div className="text-[13px] text-[#5A6478]">{label}</div>
    </div>
  );
}

export function TrustBar() {
  return (
    <section style={{ backgroundColor: "#08090E" }}>
      <div className="mx-auto max-w-[1120px] px-6 py-16 sm:py-20">
        <div className="flex flex-wrap justify-center items-center divide-x divide-[rgba(255,255,255,0.06)]">
          {STATS.map((stat, i) => (
            <AnimatedStat key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} delay={i * 200} />
          ))}
        </div>
      </div>
    </section>
  );
}
