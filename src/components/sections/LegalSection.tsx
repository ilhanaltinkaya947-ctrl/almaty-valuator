import { SectionLabel } from "@/components/ui/SectionLabel";

const LEGAL_ITEMS = [
  { icon: "📄", label: "Проверка документов" },
  { icon: "📝", label: "Подготовка договора" },
  { icon: "🛡️", label: "Защита сделки" },
  { icon: "🏛️", label: "Нотариальное сопровождение" },
];

export function LegalSection() {
  return (
    <section className="py-14 sm:py-24 relative" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F0F9F6 12%, #F0F9F6 88%, #FFFFFF 100%)" }}>
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        {/* Full-width card */}
        <div
          className="rounded-3xl overflow-hidden relative"
          style={{
            background: "linear-gradient(145deg, rgba(58,141,123,0.05), rgba(58,141,123,0.01))",
            border: "1px solid rgba(58,141,123,0.1)",
          }}
        >
          {/* Green accent line at top */}
          <div
            className="h-px w-full"
            style={{ background: "linear-gradient(to right, transparent, rgba(58,141,123,0.4), transparent)" }}
          />

          <div className="p-5 sm:p-10 lg:p-14">
            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-14 items-center">
              {/* Left — heading + seal */}
              <div>
                <SectionLabel>Юридическая защита</SectionLabel>
                <h2
                  className="font-semibold tracking-[-0.03em] text-[#1A2332] mb-6"
                  style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}
                >
                  Полное сопровождение
                  <br />
                  <span className="text-gold-gradient">на всех этапах</span>
                </h2>

                <div
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5"
                  style={{
                    background: "rgba(58,141,123,0.06)",
                    border: "1px solid rgba(58,141,123,0.12)",
                  }}
                >
                  <svg className="h-4 w-4 text-[#3A8D7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: "#3A8D7B" }}>
                    Гарантия безопасности сделки
                  </span>
                </div>
              </div>

              {/* Right — 2×2 grid of services */}
              <div className="grid grid-cols-2 gap-3">
                {LEGAL_ITEMS.map((item, i) => (
                  <div
                    key={item.label}
                    className="group rounded-xl p-4 sm:p-5 transition-all duration-300 hover:bg-[rgba(58,141,123,0.04)] hover:-translate-y-0.5"
                    style={{
                      background: i === 0 ? "rgba(58,141,123,0.03)" : "#FFFFFF",
                      border: i === 0 ? "1px solid rgba(58,141,123,0.1)" : "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <span className="text-xl block mb-2.5 transition-transform duration-300 group-hover:scale-110">
                      {item.icon}
                    </span>
                    <span className="text-sm sm:text-[15px] font-semibold text-[#1A2332] group-hover:text-[#3A8D7B] transition-colors duration-300 leading-snug block">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
