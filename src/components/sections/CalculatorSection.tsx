import { Calculator } from "@/components/calculator/Calculator";

export function CalculatorSection() {
  return (
    <section
      id="calculator"
      className="relative py-14 sm:py-24 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #F0F9F6 0%, #F0F9F6 85%, #FFFFFF 100%)" }}
    >
      {/* Ambient glow — offset to left */}
      <div
        className="absolute top-1/3 -left-[200px] w-[700px] h-[700px] pointer-events-none gold-glow-pulse"
        style={{
          background: "radial-gradient(circle, rgba(58,141,123,0.06) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative mx-auto max-w-[1120px] px-4 sm:px-6">
        {/* Asymmetric layout — side badge + calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 lg:gap-16 items-start">
          {/* Left column — vertical branding strip */}
          <div className="hidden lg:flex flex-col items-start pt-8">
            <div
              className="text-[13px] font-medium uppercase tracking-[0.2em] mb-6"
              style={{ color: "#3A8D7B" }}
            >
              Онлайн-оценка
            </div>
            <h2
              className="font-semibold tracking-[-0.03em] text-[#1A2332] mb-8 leading-[1.15]"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}
            >
              Узнайте стоимость
              <br />
              <span className="text-gold-gradient">за 2 минуты</span>
            </h2>

            {/* Vertical feature badges */}
            <div className="space-y-3">
              {[
                { icon: "📊", text: "Данные krisha.kz" },
                { icon: "🏘️", text: "25+ жилых комплексов" },
                { icon: "⚡", text: "Мгновенный расчет" },
              ].map((f) => (
                <div
                  key={f.text}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
                  style={{ background: "rgba(58,141,123,0.04)", border: "1px solid rgba(58,141,123,0.08)" }}
                >
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-sm text-[#6B7280] font-medium">{f.text}</span>
                </div>
              ))}
            </div>

            {/* Decorative vertical line with dot */}
            <div className="flex flex-col items-center mt-8 flex-1 min-h-[80px]">
              <div
                className="w-px flex-1"
                style={{
                  background: "linear-gradient(to bottom, rgba(58,141,123,0.25), rgba(58,141,123,0.05), transparent)",
                }}
              />
              <div
                className="w-2 h-2 rounded-full mt-2 gold-glow-pulse"
                style={{ backgroundColor: "rgba(58,141,123,0.4)" }}
              />
            </div>
          </div>

          {/* Right column — calculator */}
          <div>
            {/* Mobile-only heading */}
            <div className="lg:hidden mb-6">
              <div className="text-[13px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: "#3A8D7B" }}>
                Онлайн-оценка
              </div>
              <h2
                className="font-semibold tracking-[-0.03em] text-[#1A2332]"
                style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}
              >
                Узнайте стоимость <span className="text-gold-gradient">за 2 минуты</span>
              </h2>
              {/* Mobile feature badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { icon: "📊", text: "Данные krisha.kz" },
                  { icon: "🏘️", text: "25+ ЖК" },
                  { icon: "⚡", text: "Мгновенно" },
                ].map((f) => (
                  <span
                    key={f.text}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
                    style={{ background: "rgba(58,141,123,0.06)", border: "1px solid rgba(58,141,123,0.1)", color: "#6B7280" }}
                  >
                    <span>{f.icon}</span>
                    {f.text}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="border-glow-animate rounded-2xl sm:rounded-3xl p-4 sm:p-8"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(58,141,123,0.1)",
                boxShadow:
                  "0 0 120px rgba(58,141,123,0.04), 0 25px 60px rgba(0,0,0,0.06)",
              }}
            >
              <Calculator />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
