import { SectionLabel } from "@/components/ui/SectionLabel";

const LEGAL_ITEMS = [
  "Проверка документов",
  "Подготовка договора",
  "Защита сделки",
  "Нотариальное сопровождение",
];

export function LegalSection() {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden" style={{ backgroundColor: "#08090E" }}>
      {/* Background decorative shield watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.02]">
        <svg width="600" height="600" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={0.3}>
          <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-[1120px] px-6">
        {/* Asymmetric layout — left heading, right content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-20 items-center">
          {/* Left — big statement */}
          <div>
            <SectionLabel>Юридическая защита</SectionLabel>
            <h2
              className="font-semibold tracking-[-0.03em] text-white mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Полное сопровождение
              <br />
              <span className="text-gold-gradient">на всех этапах</span>
            </h2>
            {/* Trust seal */}
            <div
              className="inline-flex items-center gap-2.5 rounded-full px-5 py-2.5"
              style={{
                background: "rgba(200,164,78,0.06)",
                border: "1px solid rgba(200,164,78,0.12)",
              }}
            >
              <svg className="h-4 w-4 text-[#C8A44E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span className="text-[13px] font-medium" style={{ color: "#C8A44E" }}>Гарантия безопасности сделки</span>
            </div>
          </div>

          {/* Right — stacked items with connecting line */}
          <div className="relative pl-6 sm:pl-8">
            {/* Vertical gold line */}
            <div
              className="absolute left-0 top-0 bottom-0 w-px"
              style={{ background: "linear-gradient(to bottom, rgba(200,164,78,0.3), rgba(200,164,78,0.05))" }}
            />

            <div className="space-y-6">
              {LEGAL_ITEMS.map((item, i) => (
                <div key={item} className="group flex items-center gap-4 cursor-default">
                  {/* Dot on the line */}
                  <div
                    className="absolute left-0 -translate-x-1/2 h-2.5 w-2.5 rounded-full transition-all duration-300 group-hover:scale-150 group-hover:shadow-[0_0_12px_rgba(200,164,78,0.5)]"
                    style={{
                      backgroundColor: "#C8A44E",
                      top: `${i * 25 + 3}%`,
                    }}
                  />
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: "rgba(200,164,78,0.06)" }}
                  >
                    <svg className="h-4.5 w-4.5 text-[#C8A44E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[16px] font-semibold text-white group-hover:text-[#E8D5A0] transition-colors duration-300">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
