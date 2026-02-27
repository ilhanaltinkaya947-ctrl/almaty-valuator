export function CTABanner() {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "#F0F9F6" }}>
      {/* Green gradient band */}
      <div
        className="relative py-10 sm:py-16"
        style={{
          background:
            "linear-gradient(135deg, rgba(58,141,123,0.08) 0%, rgba(58,141,123,0.02) 50%, rgba(58,141,123,0.06) 100%)",
          borderTop: "1px solid rgba(58,141,123,0.1)",
          borderBottom: "1px solid rgba(58,141,123,0.1)",
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(58,141,123,0.06) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative mx-auto max-w-[1000px] px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h2
                className="font-semibold tracking-[-0.03em] text-[#1A2332] mb-2"
                style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)" }}
              >
                Готовы продать?
              </h2>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  { icon: "🔒", text: "Данные защищены" },
                  { icon: "⏰", text: "Ответ 15 мин" },
                  { icon: "✓", text: "Без обязательств" },
                ].map((t) => (
                  <span
                    key={t.text}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium"
                    style={{ background: "rgba(58,141,123,0.06)", color: "#6B7280" }}
                  >
                    <span style={{ color: "#3A8D7B" }}>{t.icon}</span>
                    {t.text}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a
                href="#calculator"
                className="gold-btn group inline-flex items-center justify-center gap-2 rounded-full px-6 sm:px-8 py-3.5 text-[14px] sm:text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(58,141,123,0.35)]"
                style={{
                  background: "linear-gradient(to right, #66BB6A, #26A69A)",
                  boxShadow: "0 8px 32px rgba(58,141,123,0.25)",
                }}
              >
                Рассчитать
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </a>
              <a
                href="https://wa.me/77074503277"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-[15px] font-semibold transition-all duration-300 hover:-translate-y-1"
                style={{ border: "1px solid rgba(37,211,102,0.3)", color: "#25D366" }}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
