"use client";

import { useEffect, useRef } from "react";

interface RevealGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function RevealGroup({ children, className = "" }: RevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const items = el.querySelectorAll(".reveal-child");
          items.forEach((child) => child.classList.add("visible"));
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal-group ${className}`}>
      {children}
    </div>
  );
}
