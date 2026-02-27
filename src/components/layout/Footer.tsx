const NAV_LINKS = [
  { href: "#calculator", label: "Калькулятор" },
  { href: "#about", label: "О нас" },
  { href: "#services", label: "Услуги" },
  { href: "#steps", label: "Как мы работаем" },
  { href: "#faq", label: "FAQ" },
  { href: "#contacts", label: "Контакты" },
];

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#F0F9F6",
        borderTop: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      {/* Green accent line */}
      <div
        className="h-px mx-auto max-w-[600px]"
        style={{ background: "linear-gradient(to right, transparent, rgba(58,141,123,0.12), transparent)" }}
      />

      <div className="mx-auto max-w-[1120px] px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Company */}
          <div>
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-full.svg"
                alt="Алмавыкуп"
                className="h-9 sm:h-10 w-auto"
              />
            </div>
            <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
              Срочный выкуп недвижимости в Алматы
            </p>
          </div>

          {/* Navigation */}
          <div>
            <div className="text-[11px] text-[#9CA3AF] mb-4 uppercase tracking-[0.2em] font-medium">
              Навигация
            </div>
            <nav className="grid grid-cols-2 gap-x-6 gap-y-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[13px] text-[#6B7280] hover:text-[#3A8D7B] transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contacts */}
          <div>
            <div className="text-[11px] text-[#9CA3AF] mb-4 uppercase tracking-[0.2em] font-medium">
              Контакты
            </div>
            <div className="flex flex-col gap-2.5 text-[13px]">
              <a
                href="tel:+77074503277"
                className="text-[#3A8D7B] hover:text-[#2D6B5F] transition-colors duration-200 font-medium"
              >
                +7 (707) 450-32-77
              </a>
              <a
                href="mailto:almavykup@gmail.com"
                className="text-[#6B7280] hover:text-[#1A2332] transition-colors duration-200"
              >
                almavykup@gmail.com
              </a>
              <span className="text-[#6B7280]">г. Алматы, Мамыр 4 / дом 119</span>
              <span className="text-[#6B7280]">Пн-Пт: 9:00 - 18:00</span>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-10 pt-6 border-t border-[rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[12px] text-[#9CA3AF]">
            &copy; 2026 Алмавыкуп. Все права защищены.
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/77074503277"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[13px] text-[#25D366] hover:text-[#25D366]/80 transition-colors duration-200"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <a
              href="https://2gis.kz/almaty/geo/9430047375160217/76.844166,43.217433"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#1A2332] transition-colors duration-200"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
              </svg>
              2GIS
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
