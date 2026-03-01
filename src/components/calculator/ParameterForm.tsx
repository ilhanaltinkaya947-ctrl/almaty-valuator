"use client";

import { useState } from "react";
import type { Complex } from "@/data/complexes";
import type { PriceZone } from "@/data/zones";
import type { WallMaterial, ConditionType, FloorPosition } from "@/types/evaluation";
import { Button } from "@/components/ui/Button";

interface ParameterFormProps {
  mode: "complex" | "vtorichka";
  complex?: Complex;
  zone?: PriceZone;
  onSubmit: (params: {
    area: number;
    yearBuilt: number;
    wallMaterial: WallMaterial;
    condition: ConditionType;
    isPledged: boolean;
    floorPosition: FloorPosition;
    isGoldenSquare?: boolean;
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

const FLOOR_OPTIONS: { value: FloorPosition; label: string }[] = [
  { value: "first", label: "Первый" },
  { value: "middle", label: "Средний" },
  { value: "last", label: "Последний" },
];

export function ParameterForm({
  mode,
  complex,
  zone,
  onSubmit,
  onBack,
}: ParameterFormProps) {
  const [area, setArea] = useState(mode === "complex" ? 70 : 60);
  const [areaInput, setAreaInput] = useState(String(mode === "complex" ? 70 : 60));
  const [yearBuilt, setYearBuilt] = useState(mode === "complex" && complex ? complex.yearBuilt : 2000);
  const [yearInput, setYearInput] = useState(String(mode === "complex" && complex ? complex.yearBuilt : 2000));
  const [wallMaterial, setWallMaterial] = useState<WallMaterial>(
    mode === "complex" && complex ? complex.wallMaterial : "panel",
  );
  const [condition, setCondition] = useState<ConditionType>("renovated");
  const [isPledged, setIsPledged] = useState(false);
  const [floorPosition, setFloorPosition] = useState<FloorPosition>("middle");
  const [isGoldenSquare, setIsGoldenSquare] = useState(false);

  const title = mode === "complex" && complex
    ? `${complex.name} · ${complex.district}`
    : zone
      ? `${zone.name} · ${zone.district}`
      : "";

  const backLabel = mode === "complex" ? "Назад к выбору ЖК" : "Назад к выбору района";

  return (
    <div className="fade-enter">
      <button
        onClick={onBack}
        className="text-[#6B7280] hover:text-[#1A2332] transition-colors duration-200 mb-4 text-sm flex items-center gap-1 cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {backLabel}
      </button>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#1A2332] mb-0.5">Параметры квартиры</h3>
        <p className="text-[#6B7280] text-[13px]">{title}</p>
      </div>

      {/* Area slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em]">Площадь</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              min={20}
              max={300}
              value={areaInput}
              onChange={(e) => {
                setAreaInput(e.target.value);
                const v = Number(e.target.value);
                if (v >= 20 && v <= 300) setArea(v);
              }}
              onBlur={() => {
                const v = Number(areaInput);
                const clamped = Math.max(20, Math.min(300, isNaN(v) ? 20 : v));
                setArea(clamped);
                setAreaInput(String(clamped));
              }}
              className="w-16 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-2 py-1 text-base font-bold text-[#3A8D7B] font-mono text-center focus:border-[rgba(58,141,123,0.4)] focus:outline-none transition-all duration-200"
            />
            <span className="text-sm text-[#9CA3AF]">м²</span>
          </div>
        </div>
        <input
          type="range"
          min={20}
          max={300}
          value={area}
          onChange={(e) => {
            const v = Number(e.target.value);
            setArea(v);
            setAreaInput(String(v));
          }}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-[#9CA3AF] mt-1">
          <span>20 м²</span>
          <span>300 м²</span>
        </div>
      </div>

      {/* Floor position — 3 pill buttons */}
      <div className="mb-6">
        <span className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-3">
          Этаж
        </span>
        <div className="grid grid-cols-3 gap-2">
          {FLOOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFloorPosition(opt.value)}
              className={`rounded-xl p-3 text-center text-sm font-medium transition-all duration-300 cursor-pointer ${
                floorPosition === opt.value
                  ? "text-[#1A2332]"
                  : "text-[#6B7280] hover:border-[rgba(0,0,0,0.15)]"
              }`}
              style={{
                border: `1px solid ${floorPosition === opt.value ? "#3A8D7B" : "rgba(0,0,0,0.06)"}`,
                background: floorPosition === opt.value
                  ? "rgba(58,141,123,0.06)"
                  : "#FFFFFF",
                boxShadow: floorPosition === opt.value
                  ? "0 0 20px rgba(58,141,123,0.08)"
                  : "none",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vtorichka only: year built + wall material */}
      {mode === "vtorichka" && (
        <>
          {/* Year built input */}
          <div className="mb-6">
            <span className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">Год постройки</span>
            <input
              type="number"
              inputMode="numeric"
              min={1950}
              max={2026}
              value={yearInput}
              onChange={(e) => {
                setYearInput(e.target.value);
                const v = Number(e.target.value);
                if (v >= 1950 && v <= 2026) setYearBuilt(v);
              }}
              onBlur={() => {
                const v = Number(yearInput);
                const clamped = Math.max(1950, Math.min(2026, isNaN(v) ? 2000 : v));
                setYearBuilt(clamped);
                setYearInput(String(clamped));
              }}
              placeholder="Например: 1985"
              className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3 text-[#1A2332] text-center font-mono text-base focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200"
            />
          </div>

          {/* Wall material — 3 button selector */}
          <div className="mb-6">
            <span className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-3">
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
        </>
      )}

      {/* Condition — 2-option toggle */}
      <div className="mb-6">
        <span className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-3">
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

      {/* Golden Square checkbox — only for vtorichka in Алмалинский / Медеуский */}
      {mode === "vtorichka" && zone && (zone.district === "Алмалинский" || zone.district === "Медеуский") && (
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`h-5 w-5 rounded border flex items-center justify-center transition-all duration-200 ${
                isGoldenSquare
                  ? "bg-[#C8A44E] border-[#C8A44E]"
                  : "border-[rgba(0,0,0,0.15)] group-hover:border-[rgba(0,0,0,0.3)]"
              }`}
              onClick={() => setIsGoldenSquare(!isGoldenSquare)}
            >
              {isGoldenSquare && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm text-[#6B7280] group-hover:text-[#1A2332] transition-colors duration-200">
              Находится в Золотом квадрате?
            </span>
          </label>
        </div>
      )}

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
        onClick={() => onSubmit({ area, yearBuilt, wallMaterial, condition, isPledged, floorPosition, isGoldenSquare: isGoldenSquare || undefined })}
        className="w-full text-lg py-4"
      >
        Рассчитать стоимость
      </Button>
    </div>
  );
}
