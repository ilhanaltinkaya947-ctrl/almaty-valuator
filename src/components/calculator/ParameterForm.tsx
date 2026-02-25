"use client";

import { useState } from "react";
import type { Complex } from "@/data/complexes";
import type { ViewType, ConditionType } from "@/types/evaluation";
import { Button } from "@/components/ui/Button";

interface ParameterFormProps {
  complex: Complex;
  onSubmit: (params: {
    area: number;
    floor: number;
    view: ViewType;
    condition: ConditionType;
  }) => void;
  onBack: () => void;
}

const VIEW_OPTIONS: { value: ViewType; label: string; icon: string }[] = [
  { value: "mountain", label: "Горы", icon: "\u{1F3D4}" },
  { value: "park", label: "Парк", icon: "\u{1F333}" },
  { value: "city", label: "Город", icon: "\u{1F3D9}" },
  { value: "industrial", label: "Промзона", icon: "\u{1F3ED}" },
];

const CONDITION_OPTIONS: { value: ConditionType; label: string }[] = [
  { value: "designer", label: "Дизайнерский" },
  { value: "euro", label: "Евроремонт" },
  { value: "good", label: "Хороший" },
  { value: "average", label: "Средний" },
  { value: "rough", label: "Черновая" },
];

export function ParameterForm({
  complex,
  onSubmit,
  onBack,
}: ParameterFormProps) {
  const [area, setArea] = useState(70);
  const [floor, setFloor] = useState(Math.min(5, complex.totalFloors));
  const [view, setView] = useState<ViewType>("city");
  const [condition, setCondition] = useState<ConditionType>("good");

  return (
    <div className="fade-enter">
      <button
        onClick={onBack}
        className="text-[#7A8299] hover:text-white transition-colors duration-200 mb-4 text-sm flex items-center gap-1 cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Назад к выбору ЖК
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-0.5">Параметры квартиры</h3>
          <p className="text-[#7A8299] text-[13px]">
            {complex.name} &middot; {complex.district}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-mono font-medium"
          style={{ background: "rgba(200,164,78,0.08)", color: "#C8A44E" }}
        >
          &times;{complex.coefficient.toFixed(2)}
        </span>
      </div>

      {/* Area slider */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em]">Площадь</span>
          <span className="text-sm font-bold text-[#C8A44E] font-mono">{area} м&sup2;</span>
        </div>
        <input type="range" min={20} max={300} value={area} onChange={(e) => setArea(Number(e.target.value))} className="w-full" />
        <div className="flex justify-between text-xs text-[#5A6478] mt-1">
          <span>20 м&sup2;</span>
          <span>300 м&sup2;</span>
        </div>
      </div>

      {/* Floor slider */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em]">Этаж</span>
          <span className="text-sm font-bold text-[#C8A44E] font-mono">{floor} из {complex.totalFloors}</span>
        </div>
        <input type="range" min={1} max={complex.totalFloors} value={floor} onChange={(e) => setFloor(Number(e.target.value))} className="w-full" />
        <div className="flex justify-between text-xs text-[#5A6478] mt-1">
          <span>1 этаж</span>
          <span>{complex.totalFloors} этаж</span>
        </div>
      </div>

      {/* View options — glass cards */}
      <div className="mb-6">
        <span className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em] block mb-3">
          Вид из окна
        </span>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setView(opt.value)}
              className={`rounded-xl p-3 sm:p-4 text-center transition-all duration-300 cursor-pointer ${
                view === opt.value
                  ? "border-[#C8A44E] text-white"
                  : "border-[rgba(255,255,255,0.06)] text-[#7A8299] hover:border-[rgba(255,255,255,0.12)]"
              }`}
              style={{
                border: `1px solid ${view === opt.value ? "#C8A44E" : "rgba(255,255,255,0.06)"}`,
                background: view === opt.value
                  ? "rgba(200,164,78,0.06)"
                  : "rgba(255,255,255,0.02)",
                boxShadow: view === opt.value
                  ? "0 0 20px rgba(200,164,78,0.08)"
                  : "none",
              }}
            >
              <span className="text-xl block mb-1">{opt.icon}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Condition — left gold accent on selected */}
      <div className="mb-6 sm:mb-8">
        <span className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em] block mb-2 sm:mb-3">
          Состояние
        </span>
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {CONDITION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCondition(opt.value)}
              className={`rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-all duration-300 cursor-pointer ${
                condition === opt.value
                  ? "text-white"
                  : "text-[#7A8299] hover:border-[rgba(255,255,255,0.12)]"
              }`}
              style={{
                borderLeft: condition === opt.value ? "3px solid #C8A44E" : "1px solid rgba(255,255,255,0.06)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                borderRight: "1px solid rgba(255,255,255,0.06)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: condition === opt.value
                  ? "rgba(200,164,78,0.04)"
                  : "rgba(255,255,255,0.02)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        onClick={() => onSubmit({ area, floor, view, condition })}
        className="w-full text-lg py-4"
      >
        Рассчитать стоимость
      </Button>
    </div>
  );
}
