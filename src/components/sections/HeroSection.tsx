export function HeroSection() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    size: 2 + (i % 4) * 1.2,
    left: 5 + ((i * 5.3) % 90),
    duration: 10 + (i % 7) * 3,
    delay: (i % 10) * 1.8,
    isGreen: i % 3 === 0,
  }));

  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "#F0F9F6" }}
    >
      {/* Background effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 80%, rgba(58,141,123,0.05) 0%, transparent 50%), " +
            "radial-gradient(ellipse 60% 80% at 80% 20%, rgba(74,143,212,0.04) 0%, transparent 50%)",
        }}
      />
      <div
        className="orb-1 absolute pointer-events-none"
        style={{
          top: "10%", right: "15%", width: "500px", height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(58,141,123,0.07) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="orb-2 absolute pointer-events-none"
        style={{
          bottom: "15%", left: "5%", width: "450px", height: "450px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(74,143,212,0.05) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.015) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />
      {particles.map((p, i) => (
        <div
          key={i}
          className="particle absolute rounded-full"
          style={{
            width: `${p.size}px`, height: `${p.size}px`,
            left: `${p.left}%`, bottom: "-5%",
            backgroundColor: p.isGreen ? "rgba(58,141,123,0.5)" : "rgba(0,0,0,0.06)",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative flex-1 flex items-center">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 w-full py-20 sm:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">
            <div className="max-w-[640px]">
              <div
                className="hero-animate-1 inline-flex items-center gap-2 rounded-full px-3 sm:px-4 py-1.5 mb-6"
                style={{ background: "rgba(58,141,123,0.08)", border: "1px solid rgba(58,141,123,0.15)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#3A8D7B" }} />
                <span className="text-[13px] font-medium uppercase tracking-[0.15em]" style={{ color: "#3A8D7B" }}>
                  Срочный выкуп недвижимости
                </span>
              </div>

              <h1
                className="hero-animate-2 font-semibold leading-[1.06] tracking-[-0.03em] text-[#1A2332] mb-5"
                style={{ fontSize: "clamp(2.2rem, 5.5vw, 4.5rem)" }}
              >
                Продайте вашу
                <br />
                недвижимость{" "}
                <span className="text-gold-gradient">быстро</span>
                <br />
                <span className="text-gold-gradient">и выгодно</span>
              </h1>

              <p className="hero-animate-3 text-[14px] sm:text-[16px] mb-8" style={{ color: "#6B7280" }}>
                Любое состояние · Оплата в день сделки
              </p>

              <div className="hero-animate-4 flex flex-col sm:flex-row gap-3">
                <a
                  href="#calculator"
                  className="gold-btn group inline-flex items-center justify-center gap-2 rounded-full px-8 sm:px-10 py-4 text-[15px] sm:text-[16px] font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(58,141,123,0.35)]"
                  style={{ background: "linear-gradient(to right, #66BB6A, #26A69A)", boxShadow: "0 8px 32px rgba(58,141,123,0.25)" }}
                >
                  Узнать стоимость
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                  </svg>
                </a>
                <a
                  href="tel:+77074503277"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-8 sm:px-10 py-4 text-[15px] sm:text-[16px] font-semibold text-[#1A2332] transition-all duration-300 hover:-translate-y-1 hover:bg-[rgba(0,0,0,0.03)]"
                  style={{ border: "1px solid rgba(0,0,0,0.12)" }}
                >
                  <svg className="h-4 w-4" style={{ color: "#3A8D7B" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  +7 707 450-32-77
                </a>
              </div>

              {/* Trust badges */}
              <div className="hero-animate-4 flex flex-wrap gap-1.5 sm:gap-2 mt-5">
                {[
                  { icon: "✓", text: "500+ сделок" },
                  { icon: "🔒", text: "Безопасно" },
                  { icon: "⚡", text: "Оплата сразу" },
                ].map((b) => (
                  <span
                    key={b.text}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
                    style={{
                      background: "rgba(58,141,123,0.05)",
                      border: "1px solid rgba(58,141,123,0.1)",
                      color: "#6B7280",
                    }}
                  >
                    <span style={{ color: "#3A8D7B" }}>{b.icon}</span>
                    {b.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Rotating rings */}
            <div className="hidden lg:flex items-center justify-center pointer-events-none">
              <div className="relative w-[300px] h-[300px] xl:w-[360px] xl:h-[360px]">
                <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(58,141,123,0.12)", animation: "ringRotate 30s linear infinite" }}>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full" style={{ backgroundColor: "rgba(58,141,123,0.4)" }} />
                </div>
                <div className="absolute inset-[35px] rounded-full" style={{ border: "1px dashed rgba(58,141,123,0.08)", animation: "ringRotate 22s linear infinite reverse" }} />
                <div className="absolute inset-[70px] rounded-full" style={{ border: "1px solid rgba(58,141,123,0.06)", animation: "ringRotate 40s linear infinite" }}>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "rgba(58,141,123,0.3)" }} />
                </div>
                <div className="absolute inset-[105px] rounded-full" style={{ border: "1px solid rgba(58,141,123,0.04)", animation: "ringRotate 50s linear infinite reverse" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full gold-glow-pulse" style={{ background: "radial-gradient(circle, rgba(58,141,123,0.15) 0%, transparent 70%)" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#3A8D7B", boxShadow: "0 0 12px rgba(58,141,123,0.4)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee strip at bottom */}
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.04)", borderBottom: "1px solid rgba(0,0,0,0.04)", backgroundColor: "rgba(255,255,255,0.8)" }}>
        <div className="overflow-hidden py-3">
          <div className="animate-marquee whitespace-nowrap flex">
            {[0, 1].map((idx) => (
              <span key={idx} className="text-[12px] font-medium tracking-[0.2em] uppercase" style={{ color: "#9CA3AF" }}>
                &nbsp;&nbsp;СРОЧНЫЙ ВЫКУП&nbsp;&nbsp;&bull;&nbsp;&nbsp;ОПЛАТА СРАЗУ&nbsp;&nbsp;&bull;&nbsp;&nbsp;ЛЮБОЕ СОСТОЯНИЕ&nbsp;&nbsp;&bull;&nbsp;&nbsp;БЕСПЛАТНАЯ ОЦЕНКА&nbsp;&nbsp;&bull;&nbsp;&nbsp;500+ СДЕЛОК&nbsp;&nbsp;&bull;&nbsp;&nbsp;АЛМАТЫ&nbsp;&nbsp;&bull;&nbsp;&nbsp;СРОЧНЫЙ ВЫКУП&nbsp;&nbsp;&bull;&nbsp;&nbsp;ОПЛАТА СРАЗУ&nbsp;&nbsp;&bull;&nbsp;&nbsp;ЛЮБОЕ СОСТОЯНИЕ&nbsp;&nbsp;&bull;&nbsp;&nbsp;БЕСПЛАТНАЯ ОЦЕНКА&nbsp;&nbsp;&bull;&nbsp;&nbsp;500+ СДЕЛОК&nbsp;&nbsp;&bull;&nbsp;&nbsp;АЛМАТЫ&nbsp;&nbsp;&bull;&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 scroll-indicator">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.15em] text-[#9CA3AF]">Листайте</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "#9CA3AF" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}
