"use client";

import { useState } from "react";
import type { AutoEvaluationResult, WallMaterial, FloorPosition, LeadIntent } from "@/types/evaluation";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { BenchmarkTeaser } from "@/components/calculator/BenchmarkTeaser";
import { LeadCaptureForm } from "@/components/calculator/LeadCaptureForm";
import { formatPrice } from "@/lib/utils";

interface ResultCardProps {
  result: AutoEvaluationResult;
  complexName: string;
  onBack: () => void;
  zoneId?: string;
  floorPosition?: FloorPosition;
  yearBuilt?: number;
  wallMaterial?: WallMaterial;
  isPledged?: boolean;
}

export function ResultCard({ result, complexName, onBack, zoneId, floorPosition, yearBuilt, wallMaterial, isPledged }: ResultCardProps) {
  const [selectedIntent, setSelectedIntent] = useState<LeadIntent | null>(null);

  return (
    <div className="fade-enter">
      <button
        onClick={onBack}
        className="text-[#6B7280] hover:text-[#1A2332] transition-colors duration-200 mb-4 text-sm flex items-center gap-1 cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Изменить параметры
      </button>

      {/* Disclaimer — shown BEFORE the price */}
      <div className="flex items-start gap-2.5 mb-4 px-4 py-3 rounded-xl bg-[rgba(234,179,8,0.06)] border border-[rgba(234,179,8,0.15)]">
        <svg className="h-4 w-4 text-[#D97706] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-[13px] text-[#92400E] leading-relaxed">
          Это примерная стоимость. Точную цену рассчитает специалист после выезда на объект.
        </p>
      </div>

      {/* Price result */}
      <div
        className="relative rounded-2xl p-6 mb-6 overflow-hidden"
        style={{
          background: "linear-gradient(145deg, rgba(58,141,123,0.06), rgba(58,141,123,0.01))",
          border: "1px solid rgba(58,141,123,0.15)",
          boxShadow: "0 0 60px rgba(58,141,123,0.04)",
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute top-0 right-0 w-[200px] h-[200px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(58,141,123,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div className="relative">
          <div className="text-[12px] text-[#6B7280] uppercase tracking-[0.15em] font-medium mb-2">
            Цена срочного выкупа
          </div>
          <div className="font-bold text-[#3A8D7B] font-mono mb-2" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            <AnimatedCounter
              value={result.totalPrice}
              formatter={(v) => formatPrice(Math.round(v))}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#4A8FD4]">{complexName}</span>
            <span className="text-[#9CA3AF]">&middot;</span>
            <span className="text-[#6B7280] font-mono">{formatPrice(result.pricePerSqm)}/м&sup2;</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[13px] text-[#9CA3AF]">
            <svg className="h-3.5 w-3.5 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Выкуп за 24 часа · Без комиссий · Оплата сразу
          </div>
        </div>
      </div>

      {/* Benchmark teaser */}
      <div className="mb-6">
        <BenchmarkTeaser />
      </div>

      {/* Согласен / Торг buttons — shown before lead form */}
      {selectedIntent === null && (
        <div className="mb-6">
          <div className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] mb-3">
            Вас устраивает цена?
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={() => setSelectedIntent("ready")}
              className="rounded-2xl px-4 sm:px-6 py-3 sm:py-4 font-semibold text-white text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(58,141,123,0.3)] cursor-pointer"
              style={{ background: "linear-gradient(135deg, #66BB6A, #26A69A)" }}
            >
              Согласен
            </button>
            <button
              onClick={() => setSelectedIntent("negotiate")}
              className="rounded-2xl px-4 sm:px-6 py-3 sm:py-4 font-semibold text-[#3A8D7B] text-base transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
              style={{
                border: "2px solid rgba(58,141,123,0.3)",
                background: "rgba(58,141,123,0.04)",
              }}
            >
              Торг
            </button>
          </div>
        </div>
      )}

      {/* Lead capture — shown after intent selection */}
      {selectedIntent !== null && (
        <LeadCaptureForm
          estimatedPrice={result.totalPrice}
          complexName={complexName}
          areaSqm={result.totalPrice ? Math.round(result.totalPrice / result.pricePerSqm) : undefined}
          zoneId={zoneId}
          floorPosition={floorPosition}
          yearBuilt={yearBuilt}
          wallMaterial={wallMaterial}
          isPledged={isPledged}
          intent={selectedIntent}
        />
      )}
    </div>
  );
}
