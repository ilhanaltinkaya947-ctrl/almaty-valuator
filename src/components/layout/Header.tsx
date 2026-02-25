"use client";

import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "#calculator", label: "Калькулятор" },
  { href: "#about", label: "О нас" },
  { href: "#services", label: "Услуги" },
  { href: "#steps", label: "Как мы работаем" },
  { href: "#faq", label: "FAQ" },
  { href: "#contacts", label: "Контакты" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`header-animate fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[rgba(8,9,14,0.8)] backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-[rgba(255,255,255,0.06)]"
          : "bg-transparent"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        <div className="flex items-center justify-between h-[56px] sm:h-[64px] lg:h-[72px]">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-icon.svg"
              alt=""
              className="h-7 w-7 sm:h-8 sm:w-8"
            />
            <span className="text-[15px] font-semibold tracking-tight">
              <span style={{ color: "#D4B970" }}>Алма</span>
              <span className="text-white">выкуп</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[14px] font-medium text-[#7A8299] hover:text-white transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop right side */}
          <div className="hidden lg:flex items-center gap-5">
            <a
              href="tel:+77074503277"
              className="text-[14px] font-medium text-[#7A8299] hover:text-white transition-colors duration-300"
            >
              +7 (707) 450-32-77
            </a>
            <a
              href="#contacts"
              className="rounded-full bg-[#C8A44E] px-5 py-2 text-[13px] font-semibold text-[#08090E] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(200,164,78,0.2)]"
            >
              Оставить заявку
            </a>
          </div>

          {/* Mobile hamburger */}
          <div className="flex lg:hidden items-center gap-1">
            <a
              href="tel:+77074503277"
              className="p-2.5 text-[#7A8299] hover:text-[#C8A44E] transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </a>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 text-[#7A8299] hover:text-white transition-colors cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile fullscreen overlay */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-[56px] sm:top-[64px] bg-[rgba(8,9,14,0.97)] backdrop-blur-xl z-40">
          <nav className="flex flex-col items-center justify-center h-full gap-6">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-2xl font-medium text-[#7A8299] hover:text-white transition-colors"
                style={{
                  animation: `heroFadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 80}ms forwards`,
                  opacity: 0,
                }}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contacts"
              onClick={() => setMenuOpen(false)}
              className="mt-4 rounded-full bg-[#C8A44E] px-8 py-3.5 text-[15px] font-semibold text-[#08090E]"
              style={{
                animation: `heroFadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${NAV_LINKS.length * 80}ms forwards`,
                opacity: 0,
              }}
            >
              Оставить заявку
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
