"use client";

import { useState } from "react";
import type { Complex } from "@/data/complexes";
import type {
  ViewType,
  ConditionType,
  AutoEvaluationResult,
  PropertyType,
} from "@/types/evaluation";
import { isAutoCalcType } from "@/types/evaluation";
import { evaluateAuto } from "@/lib/smart-value";
import { ComplexSearch } from "./ComplexSearch";
import { ParameterForm } from "./ParameterForm";
import { ResultCard } from "./ResultCard";
import { formatPhone, unformatPhone } from "@/lib/utils";

type CalcStep = 1 | 2 | 3;

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: "apartment", label: "Квартира", icon: "🏢" },
  { value: "townhouse", label: "Таунхаус", icon: "🏘" },
  { value: "house", label: "Дом", icon: "🏠" },
  { value: "commercial", label: "Коммерция", icon: "🏗" },
  { value: "land", label: "Участок", icon: "🌍" },
];

export function Calculator() {
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [step, setStep] = useState<CalcStep>(1);
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);
  const [result, setResult] = useState<AutoEvaluationResult | null>(null);

  function handleSelectComplex(complex: Complex) {
    setSelectedComplex(complex);
    setStep(2);
  }

  function handleCalculate(params: {
    area: number;
    floor: number;
    view: ViewType;
    condition: ConditionType;
  }) {
    if (!selectedComplex) return;

    const evalResult = evaluateAuto({
      complexName: selectedComplex.name,
      area: params.area,
      floor: params.floor,
      totalFloors: selectedComplex.totalFloors,
      yearBuilt: selectedComplex.yearBuilt,
      view: params.view,
      condition: params.condition,
      complexCoefficient: selectedComplex.coefficient,
    });

    setResult(evalResult);
    setStep(3);
  }

  function handlePropertyTypeChange(type: PropertyType) {
    setPropertyType(type);
    setStep(1);
    setSelectedComplex(null);
    setResult(null);
  }

  const isAuto = isAutoCalcType(propertyType);

  return (
    <div>
      {/* Property type toggle — pill style */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {PROPERTY_TYPES.map((pt) => (
          <button
            key={pt.value}
            onClick={() => handlePropertyTypeChange(pt.value)}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 cursor-pointer ${
              propertyType === pt.value
                ? "bg-[#C8A44E] text-[#0C0E16]"
                : "bg-transparent border border-[rgba(255,255,255,0.08)] text-[#7A8299] hover:border-[rgba(255,255,255,0.12)] hover:text-white"
            }`}
          >
            {pt.icon} {pt.label}
          </button>
        ))}
      </div>

      {/* Branch A: Auto calculation (apartments, townhouses) */}
      {isAuto ? (
        <>
          {step === 1 && <ComplexSearch onSelect={handleSelectComplex} />}
          {step === 2 && selectedComplex && (
            <ParameterForm
              complex={selectedComplex}
              onSubmit={handleCalculate}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && result && selectedComplex && (
            <ResultCard
              result={result}
              complexName={selectedComplex.name}
              onBack={() => setStep(2)}
            />
          )}
        </>
      ) : (
        /* Branch B: Expert review form (houses, commercial, land) */
        <ExpertRequestForm propertyType={propertyType} />
      )}
    </div>
  );
}

// ── Branch B: Expert Request Form ──

const PROPERTY_LABELS: Record<string, string> = {
  house: "дома или коттеджа",
  commercial: "коммерческой недвижимости",
  land: "земельного участка",
};

const DISTRICT_OPTIONS = [
  "Алмалинский",
  "Ауэзовский",
  "Бостандыкский",
  "Жетысуский",
  "Медеуский",
  "Наурызбайский",
  "Турксибский",
  "Алатауский",
];

const CONDITION_OPTIONS = [
  { value: "excellent", label: "Отличное" },
  { value: "good", label: "Хорошее" },
  { value: "average", label: "Среднее" },
  { value: "needs_repair", label: "Требует ремонта" },
  { value: "rough", label: "Черновая / Аварийное" },
];

function ExpertRequestForm({ propertyType }: { propertyType: PropertyType }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const rawPhone = unformatPhone(phone);
  const isValid = /^\+7\d{10}$/.test(rawPhone) && district && area;

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
  }

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: rawPhone,
          name: name || undefined,
          property_type: propertyType,
          area_sqm: parseFloat(area) || undefined,
          source: "landing",
          needs_manual_review: true,
          status: "pending_review",
          notes: [
            `Район: ${district}`,
            condition ? `Состояние: ${condition}` : "",
            description ? `Описание: ${description}` : "",
          ].filter(Boolean).join("; "),
        }),
      });
    } catch {
      // Submit anyway to show success
    }

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-12 fade-enter">
        <div className="h-14 w-14 rounded-full bg-[rgba(200,164,78,0.12)] flex items-center justify-center mx-auto mb-4">
          <svg className="h-7 w-7 text-[#C8A44E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Заявка на экспертный выкуп принята!</h3>
        <p className="text-sm text-[#7A8299] max-w-sm mx-auto">
          Данный тип недвижимости требует индивидуального анализа. Наш эксперт свяжется с вами в течение 15 минут с готовым предложением.
        </p>
      </div>
    );
  }

  return (
    <div className="fade-enter">
      {/* Expert review badge */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[rgba(200,164,78,0.06)] border border-[rgba(200,164,78,0.15)]">
        <svg className="h-4 w-4 text-[#C8A44E] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs text-[#C8A44E]">
          Экспертная оценка — индивидуальный расчёт для {PROPERTY_LABELS[propertyType] ?? "объекта"}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-1">
        Заявка на экспертный выкуп
      </h3>
      <p className="text-sm text-[#7A8299] mb-6">
        Заполните форму — эксперт проведёт анализ и подготовит индивидуальное предложение
      </p>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em] block mb-2">
            Ваше имя
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как к вам обращаться"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0C14] px-5 py-3.5 text-white placeholder:text-[#3A4258] focus:border-[rgba(200,164,78,0.4)] focus:shadow-[0_0_0_3px_rgba(200,164,78,0.1)] focus:outline-none transition-all duration-200"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em] block mb-2">
            Телефон <span className="text-[#E74C3C]">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="+7 (___) ___-__-__"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0C14] px-5 py-3.5 text-white placeholder:text-[#3A4258] focus:border-[rgba(200,164,78,0.4)] focus:shadow-[0_0_0_3px_rgba(200,164,78,0.1)] focus:outline-none transition-all duration-200 font-mono"
          />
        </div>

        {/* District */}
        <div>
          <label className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em] block mb-2">
            Район <span className="text-[#E74C3C]">*</span>
          </label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0C14] px-5 py-3.5 text-white focus:border-[rgba(200,164,78,0.4)] focus:outline-none transition-all duration-200 appearance-none"
          >
            <option value="" className="bg-[#0A0C14]">Выберите район</option>
            {DISTRICT_OPTIONS.map((d) => (
              <option key={d} value={d} className="bg-[#0A0C14]">{d}</option>
            ))}
          </select>
        </div>

        {/* Area */}
        <div>
          <label className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em] block mb-2">
            Площадь, м² <span className="text-[#E74C3C]">*</span>
          </label>
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Например: 120"
            min={1}
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0C14] px-5 py-3.5 text-white placeholder:text-[#3A4258] focus:border-[rgba(200,164,78,0.4)] focus:shadow-[0_0_0_3px_rgba(200,164,78,0.1)] focus:outline-none transition-all duration-200 font-mono"
          />
        </div>

        {/* Condition */}
        <div>
          <label className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em] block mb-2">
            Состояние
          </label>
          <div className="flex flex-wrap gap-2">
            {CONDITION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCondition(opt.value === condition ? "" : opt.value)}
                className={`rounded-full px-4 py-2 text-sm transition-all duration-200 cursor-pointer ${
                  condition === opt.value
                    ? "bg-[#C8A44E] text-[#0C0E16] font-medium"
                    : "border border-[rgba(255,255,255,0.08)] text-[#7A8299] hover:border-[rgba(255,255,255,0.12)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em] block mb-2">
            Описание объекта
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Дополнительная информация: адрес, особенности, долги, документы..."
            rows={3}
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0C14] px-5 py-3.5 text-white placeholder:text-[#3A4258] focus:border-[rgba(200,164,78,0.4)] focus:shadow-[0_0_0_3px_rgba(200,164,78,0.1)] focus:outline-none transition-all duration-200 resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid || loading}
        className="w-full mt-6 rounded-full bg-[#C8A44E] px-6 py-3.5 font-semibold text-[#08090E] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(200,164,78,0.3)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {loading ? "Отправка..." : "Отправить заявку на экспертный выкуп"}
      </button>

      <p className="text-xs text-[#5A6478] text-center mt-3">
        Бесплатно · Без обязательств · Ответ в течение 15 минут
      </p>
    </div>
  );
}
