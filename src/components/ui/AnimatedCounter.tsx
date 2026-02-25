"use client";

import { useEffect, useRef, useState, useCallback } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 1200,
  className,
  formatter,
}: AnimatedCounterProps) {
  const fmt = useCallback(
    (v: number) =>
      formatter
        ? formatter(v)
        : new Intl.NumberFormat("ru-RU").format(Math.round(v)),
    [formatter],
  );

  const [display, setDisplay] = useState(() => fmt(0));
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const diff = value - start;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = start + diff * eased;
      setDisplay(fmt(current));

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        prevValue.current = value;
      }
    }

    requestAnimationFrame(tick);
  }, [value, duration, fmt]);

  return <span className={className}>{display}</span>;
}
