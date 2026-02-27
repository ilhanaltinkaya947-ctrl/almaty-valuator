"use client";

import { useState } from "react";
import type { WallMaterial, ConditionType } from "@/types/evaluation";
import type { PriceZone, BuildingSeriesInfo } from "@/data/zones";
import { Button } from "@/components/ui/Button";

interface ZoneParameterFormProps {
  zone: PriceZone;
  series: BuildingSeriesInfo;
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

export function ZoneParameterForm({
  zone,
  series,
  onSubmit,
  onBack,
}: ZoneParameterFormProps) {
  const defaultYear = Math.round((series.yearMin + series.yearMax) / 2);
  const [area, setArea] = useState(60);
  const [yearBuilt, setYearBuilt] = useState(defaultYear);
  const [wallMaterial, setWallMaterial] = useState<WallMaterial>("panel");
  const [condition, setCondition] = useState<ConditionType>("renovated");
  const [isPledged, setIsPledged] = useState(false);

  return (
    <div className="fade-enter">
      <button
        onClick={onBack}
        className="text-[#7A8299] hover:text-white transition-colors duration-200 mb-4 text-sm flex items-center gap-1 cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Назад к выбору серии дома
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-0.5">Параметры квартиры</h3>
          <p className="text-[#7A8299] text-[13px]">
            {zone.name} &middot; {series.labelRu}
          </p>
        </div>
        <div className="flex gap-1.5">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-mono font-medium"
            style={{ background: "rgba(74,143,212,0.08)", color: "#4A8FD4" }}
          >
            &times;{zone.coefficient.toFixed(2)}
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-mono font-medium"
            style={{ background: "rgba(200,164,78,0.08)", color: "#C8A44E" }}
          >
            &times;{series.modifier.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Area slider */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em]">Площадь</span>
          <span className="text-sm font-bold text-[#C8A44E] font-mono">{area} м&sup2;</span>
        </div>
        <input type="range" min={15} max={200} value={area} onChange={(e) => setArea(Number(e.target.value))} className="w-full" />
        <div className="flex justify-between text-xs text-[#5A6478] mt-1">
          <span>15 м&sup2;</span>
          <span>200 м&sup2;</span>
        </div>
      </div>

      {/* Year built input */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em]">Год постройки</span>
          <span className="text-sm font-bold text-[#C8A44E] font-mono">{yearBuilt}</span>
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
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#08090E] px-5 py-3 text-white text-center font-mono text-base focus:border-[rgba(200,164,78,0.4)] focus:shadow-[0_0_0_3px_rgba(200,164,78,0.1)] focus:outline-none transition-all duration-200"
        />
      </div>

      {/* Wall material — 3 button selector */}
      <div className="mb-6">
        <span className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em] block mb-3">
          Материал стен
        </span>
        <div className="grid grid-cols-3 gap-2">
          {WALL_MATERIAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setWallMaterial(opt.value)}
              className={`rounded-xl p-3 text-center text-sm font-medium transition-all duration-300 cursor-pointer ${
                wallMaterial === opt.value
                  ? "text-white"
                  : "text-[#7A8299] hover:border-[rgba(255,255,255,0.12)]"
              }`}
              style={{
                border: `1px solid ${wallMaterial === opt.value ? "#C8A44E" : "rgba(255,255,255,0.06)"}`,
                background: wallMaterial === opt.value
                  ? "rgba(200,164,78,0.06)"
                  : "rgba(255,255,255,0.02)",
                boxShadow: wallMaterial === opt.value
                  ? "0 0 20px rgba(200,164,78,0.08)"
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
        <span className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em] block mb-3">
          Состояние
        </span>
        <div className="grid grid-cols-2 gap-2">
          {CONDITION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCondition(opt.value)}
              className={`rounded-xl px-4 py-3.5 text-center text-sm font-medium transition-all duration-300 cursor-pointer ${
                condition === opt.value
                  ? "text-white"
                  : "text-[#7A8299] hover:border-[rgba(255,255,255,0.12)]"
              }`}
              style={{
                border: `1px solid ${condition === opt.value ? "#C8A44E" : "rgba(255,255,255,0.06)"}`,
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

      {/* Pledge checkbox */}
      <div className="mb-6 sm:mb-8">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`h-5 w-5 rounded border flex items-center justify-center transition-all duration-200 ${
              isPledged
                ? "bg-[#C8A44E] border-[#C8A44E]"
                : "border-[rgba(255,255,255,0.15)] group-hover:border-[rgba(255,255,255,0.3)]"
            }`}
            onClick={() => setIsPledged(!isPledged)}
          >
            {isPledged && (
              <svg className="h-3 w-3 text-[#08090E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm text-[#7A8299] group-hover:text-white transition-colors duration-200">
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
