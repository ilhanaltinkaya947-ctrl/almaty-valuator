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
    <section id="faq" className="py-20 sm:py-28" style={{ backgroundColor: "#0C0E16" }}>
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-14">
          <SectionLabel>Вопросы и ответы</SectionLabel>
          <h2
            className="font-semibold tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Часто задаваемые вопросы
          </h2>
        </div>

        <div
          className="rounded-2xl px-6 sm:px-8"
          style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <Accordion items={FAQ_ITEMS} defaultOpen={0} />
        </div>
      </div>
    </section>
  );
}
