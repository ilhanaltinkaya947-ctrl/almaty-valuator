import { Calculator } from "@/components/calculator/Calculator";

export function CalculatorSection() {
  return (
    <section
      id="calculator"
      className="relative py-24 sm:py-32 overflow-hidden"
      style={{ backgroundColor: "#08090E" }}
    >
      {/* Ambient glow — offset to left */}
      <div
        className="absolute top-1/3 -left-[200px] w-[700px] h-[700px] pointer-events-none gold-glow-pulse"
        style={{
          background: "radial-gradient(circle, rgba(200,164,78,0.06) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative mx-auto max-w-[1120px] px-6">
        {/* Asymmetric layout — side badge + calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 lg:gap-16 items-start">
          {/* Left column — vertical branding strip */}
          <div className="hidden lg:flex flex-col items-start pt-8">
            <div
              className="text-[11px] font-medium uppercase tracking-[0.2em] mb-6"
              style={{ color: "#C8A44E" }}
            >
              Онлайн-оценка
            </div>
            <h2
              className="font-semibold tracking-[-0.03em] text-white mb-8 leading-[1.15]"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}
            >
              Узнайте стоимость
              <br />
              <span className="text-gold-gradient">за 2 минуты</span>
            </h2>

            {/* Vertical feature badges */}
            <div className="space-y-4">
              {[
                { icon: "📊", text: "Данные krisha.kz" },
                { icon: "🏘️", text: "25+ жилых комплексов" },
                { icon: "⚡", text: "Мгновенный расчет" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-[13px] text-[#5A6478] font-medium">{f.text}</span>
                </div>
              ))}
            </div>

            {/* Decorative vertical line */}
            <div
              className="w-px flex-1 mt-8 min-h-[80px]"
              style={{
                background: "linear-gradient(to bottom, rgba(200,164,78,0.2), transparent)",
              }}
            />
          </div>

          {/* Right column — calculator */}
          <div>
            {/* Mobile-only heading */}
            <div className="lg:hidden text-center mb-8">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] mb-4" style={{ color: "#C8A44E" }}>
                Онлайн-оценка
              </div>
              <h2
                className="font-semibold tracking-[-0.03em] text-white"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)" }}
              >
                Узнайте стоимость <span className="text-gold-gradient">за 2 минуты</span>
              </h2>
            </div>

            <div
              className="border-glow-animate rounded-3xl p-6 sm:p-10"
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                border: "1px solid rgba(200,164,78,0.1)",
                boxShadow:
                  "0 0 120px rgba(200,164,78,0.04), 0 25px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
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
