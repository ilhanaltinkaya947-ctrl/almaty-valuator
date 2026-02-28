import { SectionLabel } from "@/components/ui/SectionLabel";
import { Accordion } from "@/components/ui/Accordion";

const FAQ_ITEMS = [
  {
    question: "Как быстро вы можете выкупить недвижимость?",
    answer: "Осмотр в день обращения, сделка за 1-3 дня.",
  },
  {
    question: "Какие документы нужны для продажи?",
    answer: "Удостоверение личности и правоустанавливающие документы — остальное поможем восстановить.",
  },
  {
    question: "Выкупаете ли вы недвижимость с долгами?",
    answer: "Да, учитываем долги при расчете цены.",
  },
  {
    question: "Как формируется цена выкупа?",
    answer: "На основе рыночной стоимости, состояния и местоположения объекта.",
  },
  {
    question: "Можно ли получить деньги в день сделки?",
    answer: "Да — наличными или переводом в день подписания.",
  },
  {
    question: "Выкупаете ли вы недвижимость в плохом состоянии?",
    answer: "Да, любое состояние — после ремонта, пожара, с проблемными документами.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-10 sm:py-24" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-14 items-start">
          {/* Left — sticky heading + CTA */}
          <div className="lg:sticky lg:top-28">
            <SectionLabel>Вопросы и ответы</SectionLabel>
            <h2
              className="font-semibold tracking-[-0.03em] text-[#1A2332] mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 2.6rem)" }}
            >
              Частые
              <br />
              <span className="text-gold-gradient">вопросы</span>
            </h2>
            <p className="text-[15px] text-[#6B7280] mb-8">
              Не нашли ответ? Свяжитесь с нами.
            </p>
            <a
              href="tel:+77074503277"
              className="inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "rgba(58,141,123,0.08)",
                border: "1px solid rgba(58,141,123,0.15)",
                color: "#3A8D7B",
              }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              +7 707 450-32-77
            </a>
          </div>

          {/* Right — accordion */}
          <div
            className="rounded-2xl px-6 sm:px-8"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <Accordion items={FAQ_ITEMS} defaultOpen={0} />
          </div>
        </div>
      </div>
    </section>
  );
}
