"use client";

import { useEffect } from "react";

const TOP_COLOR = "#F0F9F6";
const BOTTOM_COLOR = "#0F1722";

export function OverscrollColor() {
  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const nearBottom = scrollTop + clientHeight > scrollHeight - 300;
      const color = nearBottom ? BOTTOM_COLOR : TOP_COLOR;
      document.documentElement.style.backgroundColor = color;
      document.body.style.backgroundColor = color;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return null;
}
