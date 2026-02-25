"use client";

import { useState } from "react";
import type { Complex } from "@/data/complexes";
import type {
  ViewType,
  ConditionType,
  EvaluationResult,
} from "@/types/evaluation";
import { evaluatePrice } from "@/lib/smart-value";
import { ComplexSearch } from "./ComplexSearch";
import { ParameterForm } from "./ParameterForm";
import { ResultCard } from "./ResultCard";
import { formatPhone, unformatPhone } from "@/lib/utils";

type PropertyType = "apartment" | "house" | "commercial" | "land";
type CalcStep = 1 | 2 | 3;

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Квартира" },
  { value: "house", label: "Дом" },
  { value: "commercial", label: "Коммерция" },
  { value: "land", label: "Участок" },
];

export function Calculator() {
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [step, setStep] = useState<CalcStep>(1);
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);

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

    const evalResult = evaluatePrice({
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
            {pt.label}
          </button>
        ))}
      </div>

      {propertyType === "apartment" ? (
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
        <SimplePropertyForm propertyType={propertyType} />
      )}
    </div>
  );
}

const PROPERTY_LABELS: Record<PropertyType, string> = {
  apartment: "",
  house: "дома или коттеджа",
  commercial: "коммерческой недвижимости",
  land: "земельного участка",
};

function SimplePropertyForm({
  propertyType,
}: {
  propertyType: PropertyType;
}) {
  const [phone, setPhone] = useState("+7");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const rawPhone = unformatPhone(phone);
  const isValid = /^\+7\d{10}$/.test(rawPhone);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
  }

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-12 fade-enter">
        <div className="h-12 w-12 rounded-full bg-[rgba(37,211,102,0.15)] flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Заявка принята!</h3>
        <p className="text-sm text-[#7A8299]">
          Наш эксперт свяжется с вами в течение 15 минут для бесплатной оценки
        </p>
      </div>
    );
  }

  return (
    <div className="fade-enter">
      <h3 className="text-lg font-semibold text-white mb-2">
        Бесплатная оценка {PROPERTY_LABELS[propertyType]}
      </h3>
      <p className="text-sm text-[#7A8299] mb-6">
        Оставьте номер телефона — наш эксперт проведёт оценку и свяжется с
        вами в течение 15 минут
      </p>

      <div className="mb-4">
        <label className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em] block mb-2">
          Телефон
        </label>
        <input
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="+7 (___) ___-__-__"
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0C14] px-5 py-4 text-white placeholder:text-[#3A4258] focus:border-[rgba(200,164,78,0.4)] focus:shadow-[0_0_0_3px_rgba(200,164,78,0.1)] focus:outline-none transition-all duration-200 text-lg font-mono"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid || loading}
        className="w-full rounded-full bg-[#C8A44E] px-6 py-3.5 font-semibold text-[#08090E] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(200,164,78,0.3)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {loading ? "Отправка..." : "Получить бесплатную оценку"}
      </button>
    </div>
  );
}
