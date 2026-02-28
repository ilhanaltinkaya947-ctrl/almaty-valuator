"use client";

import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "#calculator", label: "Калькулятор", icon: "📊" },
  { href: "#about", label: "О компании", icon: "🏢" },
  { href: "#faq", label: "Вопросы", icon: "❓" },
  { href: "#contacts", label: "Контакты", icon: "📞" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Prevent body scroll when menu is open (iOS-safe)
  useEffect(() => {
    if (menuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [menuOpen]);

  return (
    <>
      <header
        className={`header-animate fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || menuOpen
            ? "bg-white border-b border-[rgba(0,0,0,0.06)]"
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
                <span style={{ color: "#3A8D7B" }}>Алма</span>
                <span className="text-[#1A2332]">выкуп</span>
              </span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[15px] font-medium text-[#6B7280] hover:text-[#1A2332] transition-colors duration-300"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Desktop right side */}
            <div className="hidden lg:flex items-center gap-5">
              <a
                href="tel:+77074503277"
                className="text-[15px] font-medium text-[#6B7280] hover:text-[#1A2332] transition-colors duration-300"
              >
                +7 (707) 450-32-77
              </a>
              <a
                href="#contacts"
                className="rounded-full bg-gradient-to-r from-[#66BB6A] to-[#26A69A] px-5 py-2 text-[14px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(58,141,123,0.2)]"
              >
                Оставить заявку
              </a>
            </div>

            {/* Mobile hamburger */}
            <div className="flex lg:hidden items-center gap-1">
              <a
                href="tel:+77074503277"
                className="p-2.5 text-[#6B7280] hover:text-[#3A8D7B] transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </a>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2.5 text-[#6B7280] hover:text-[#1A2332] transition-colors cursor-pointer"
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
      </header>

      {/* Mobile overlay — rendered as sibling for z-index reliability */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[49]"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          onClick={() => setMenuOpen(false)}
        >
          {/* Menu panel */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{ backgroundColor: "#FFFFFF" }}
            onClick={(e) => e.stopPropagation()}
          >
          {/* Spacer for header height */}
          <div className="h-[56px] sm:h-[64px]" />

          <nav className="flex flex-col px-5 pt-4 pb-6 gap-2">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-4 px-4 py-4 rounded-2xl text-[17px] font-medium text-[#1A2332] transition-all duration-200 active:scale-[0.98]"
                style={{
                  animation: `heroFadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${i * 60}ms forwards`,
                  opacity: 0,
                  backgroundColor: "#F5F5F5",
                  border: "1px solid rgba(0,0,0,0.04)",
                }}
              >
                <span className="text-lg">{link.icon}</span>
                {link.label}
                <svg className="h-4 w-4 ml-auto text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </a>
            ))}

            {/* CTA button */}
            <a
              href="#contacts"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 mt-4 rounded-2xl px-8 py-4 text-[16px] font-semibold text-white"
              style={{
                animation: `heroFadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${NAV_LINKS.length * 60}ms forwards`,
                opacity: 0,
                background: "linear-gradient(135deg, #66BB6A, #26A69A)",
                boxShadow: "0 8px 24px rgba(58,141,123,0.3)",
              }}
            >
              Оставить заявку
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
              </svg>
            </a>

            {/* WhatsApp quick action */}
            <a
              href="https://wa.me/77074503277"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 mt-2 rounded-2xl px-8 py-4 text-[15px] font-semibold"
              style={{
                animation: `heroFadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${(NAV_LINKS.length + 1) * 60}ms forwards`,
                opacity: 0,
                border: "1px solid rgba(37,211,102,0.2)",
                color: "#25D366",
                backgroundColor: "#F0FFF4",
              }}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </nav>
          </div>
        </div>
      )}
    </>
  );
}
