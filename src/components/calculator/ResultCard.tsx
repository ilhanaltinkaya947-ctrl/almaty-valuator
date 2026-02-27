"use client";

import { useState } from "react";
import type { AutoEvaluationResult, WallMaterial } from "@/types/evaluation";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { FactorChips } from "@/components/calculator/FactorChips";
import { BenchmarkTeaser } from "@/components/calculator/BenchmarkTeaser";
import { LeadCaptureForm } from "@/components/calculator/LeadCaptureForm";
import { formatPrice } from "@/lib/utils";

interface ResultCardProps {
  result: AutoEvaluationResult;
  complexName: string;
  onBack: () => void;
  zoneId?: string;
  buildingSeries?: string;
  yearBuilt?: number;
  wallMaterial?: WallMaterial;
  isPledged?: boolean;
}

export function ResultCard({ result, complexName, onBack, zoneId, buildingSeries, yearBuilt, wallMaterial, isPledged }: ResultCardProps) {
  const [negotiateMode, setNegotiateMode] = useState(false);

  return (
    <div className="fade-enter">
      <button
        onClick={onBack}
        className="text-[#7A8299] hover:text-white transition-colors duration-200 mb-4 text-sm flex items-center gap-1 cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Изменить параметры
      </button>

      {/* Price result */}
      <div
        className="relative rounded-2xl p-6 mb-6 overflow-hidden"
        style={{
          background: "linear-gradient(145deg, rgba(200,164,78,0.06), rgba(200,164,78,0.01))",
          border: "1px solid rgba(200,164,78,0.15)",
          boxShadow: "0 0 60px rgba(200,164,78,0.04)",
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute top-0 right-0 w-[200px] h-[200px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(200,164,78,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div className="relative">
          <div className="text-[11px] text-[#8B95A8] uppercase tracking-[0.15em] font-medium mb-2">
            Цена срочного выкупа
          </div>
          <div className="font-bold text-[#C8A44E] font-mono mb-2" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            <AnimatedCounter
              value={result.totalPrice}
              formatter={(v) => formatPrice(Math.round(v))}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#4A8FD4]">{complexName}</span>
            <span className="text-[#3A4258]">&middot;</span>
            <span className="text-[#7A8299] font-mono">{formatPrice(result.pricePerSqm)}/м&sup2;</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#5A6478]">
            <svg className="h-3.5 w-3.5 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Выкуп за 24 часа · Без комиссий · Оплата сразу
          </div>
        </div>
      </div>

      {/* Factor chips */}
      <div className="mb-6">
        <div className="text-xs font-medium text-[#5A6478] uppercase tracking-[0.15em] mb-3">
          Коэффициенты оценки
        </div>
        <FactorChips params={result.params} />
      </div>

      {/* Benchmark teaser */}
      <div className="mb-6">
        <BenchmarkTeaser />
      </div>

      {/* Lead capture */}
      <LeadCaptureForm
        estimatedPrice={result.totalPrice}
        zoneId={zoneId}
        buildingSeries={buildingSeries}
        yearBuilt={yearBuilt}
        wallMaterial={wallMaterial}
        isPledged={isPledged}
        intent={negotiateMode ? "negotiate" : "ready"}
      />

      {/* Negotiate button */}
      {!negotiateMode && (
        <button
          onClick={() => setNegotiateMode(true)}
          className="w-full mt-3 rounded-2xl px-6 py-4 text-sm font-medium transition-all duration-300 cursor-pointer text-[#C8A44E] hover:text-white"
          style={{
            border: "1px solid rgba(200,164,78,0.25)",
            background: "rgba(200,164,78,0.04)",
          }}
        >
          Обсудить цену
        </button>
      )}

      <p className="text-xs text-[#5A6478] text-center mt-4">
        Сумма является ориентировочной. Точная цена фиксируется после осмотра.
      </p>
    </div>
  );
}
