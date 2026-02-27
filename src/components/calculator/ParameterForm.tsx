"use client";

import { useState } from "react";
import type { Complex } from "@/data/complexes";
import type { WallMaterial, ConditionType } from "@/types/evaluation";
import { Button } from "@/components/ui/Button";

interface ParameterFormProps {
  complex: Complex;
  onSubmit: (params: {
    area: number;
    yearBuilt: number;
    wallMaterial: WallMaterial;
    condition: ConditionType;
    isPledged: boolean;
  }) => void;
  onBack: () => void;
}

const WALL_MATERIAL_OPTIONS: { value: WallMaterial; label: string }[] = [
  { value: "panel", label: "Панель" },
  { value: "brick", label: "Кирпич" },
  { value: "monolith", label: "Монолит" },
];

const CONDITION_OPTIONS: { value: ConditionType; label: string }[] = [
  { value: "renovated", label: "С ремонтом" },
  { value: "rough", label: "Черновая" },
];

export function ParameterForm({
  complex,
  onSubmit,
  onBack,
}: ParameterFormProps) {
  const [area, setArea] = useState(70);
  const [yearBuilt, setYearBuilt] = useState(complex.yearBuilt);
  const [wallMaterial, setWallMaterial] = useState<WallMaterial>("monolith");
  const [condition, setCondition] = useState<ConditionType>("renovated");
  const [isPledged, setIsPledged] = useState(false);

  return (
    <div className="fade-enter">
      <button
        onClick={onBack}
        className="text-[#6B7280] hover:text-[#1A2332] transition-colors duration-200 mb-4 text-sm flex items-center gap-1 cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Назад к выбору ЖК
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#1A2332] mb-0.5">Параметры квартиры</h3>
          <p className="text-[#6B7280] text-[13px]">
            {complex.name} &middot; {complex.district}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-mono font-medium"
          style={{ background: "rgba(58,141,123,0.08)", color: "#3A8D7B" }}
        >
          &times;{complex.coefficient.toFixed(2)}
        </span>
      </div>

      {/* Area slider */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-medium text-[#9CA3AF] uppercase tracking-[0.15em]">Площадь</span>
          <span className="text-sm font-bold text-[#3A8D7B] font-mono">{area} м&sup2;</span>
        </div>
        <input type="range" min={20} max={300} value={area} onChange={(e) => setArea(Number(e.target.value))} className="w-full" />
        <div className="flex justify-between text-xs text-[#9CA3AF] mt-1">
          <span>20 м&sup2;</span>
          <span>300 м&sup2;</span>
        </div>
      </div>

      {/* Year built input */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-medium text-[#9CA3AF] uppercase tracking-[0.15em]">Год постройки</span>
          <span className="text-sm font-bold text-[#3A8D7B] font-mono">{yearBuilt}</span>
        </div>
        <input
          type="number"
          min={1950}
          max={2026}
          value={yearBuilt}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= 1950 && v <= 2026) setYearBuilt(v);
          }}
          className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3 text-[#1A2332] text-center font-mono text-base focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200"
        />
      </div>

      {/* Wall material — 3 button selector */}
      <div className="mb-6">
        <span className="text-xs font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-3">
          Материал стен
        </span>
        <div className="grid grid-cols-3 gap-2">
          {WALL_MATERIAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setWallMaterial(opt.value)}
              className={`rounded-xl p-3 text-center text-sm font-medium transition-all duration-300 cursor-pointer ${
                wallMaterial === opt.value
                  ? "text-[#1A2332]"
                  : "text-[#6B7280] hover:border-[rgba(0,0,0,0.15)]"
              }`}
              style={{
                border: `1px solid ${wallMaterial === opt.value ? "#3A8D7B" : "rgba(0,0,0,0.06)"}`,
                background: wallMaterial === opt.value
                  ? "rgba(58,141,123,0.06)"
                  : "#FFFFFF",
                boxShadow: wallMaterial === opt.value
                  ? "0 0 20px rgba(58,141,123,0.08)"
                  : "none",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Condition — 2-option toggle */}
      <div className="mb-6">
        <span className="text-xs font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-3">
          Состояние
        </span>
        <div className="grid grid-cols-2 gap-2">
          {CONDITION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCondition(opt.value)}
              className={`rounded-xl px-4 py-3.5 text-center text-sm font-medium transition-all duration-300 cursor-pointer ${
                condition === opt.value
                  ? "text-[#1A2332]"
                  : "text-[#6B7280] hover:border-[rgba(0,0,0,0.15)]"
              }`}
              style={{
                border: `1px solid ${condition === opt.value ? "#3A8D7B" : "rgba(0,0,0,0.06)"}`,
                background: condition === opt.value
                  ? "rgba(58,141,123,0.04)"
                  : "#FFFFFF",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pledge checkbox */}
      <div className="mb-6 sm:mb-8">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`h-5 w-5 rounded border flex items-center justify-center transition-all duration-200 ${
              isPledged
                ? "bg-[#3A8D7B] border-[#3A8D7B]"
                : "border-[rgba(0,0,0,0.15)] group-hover:border-[rgba(0,0,0,0.3)]"
            }`}
            onClick={() => setIsPledged(!isPledged)}
          >
            {isPledged && (
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm text-[#6B7280] group-hover:text-[#1A2332] transition-colors duration-200">
            Квартира в залоге (ипотека)
          </span>
        </label>
      </div>

      <Button
        variant="primary"
        onClick={() => onSubmit({ area, yearBuilt, wallMaterial, condition, isPledged })}
        className="w-full text-lg py-4"
      >
        Рассчитать стоимость
      </Button>
    </div>
  );
}
