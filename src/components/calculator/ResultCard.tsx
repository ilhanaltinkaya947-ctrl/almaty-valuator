"use client";

import type { EvaluationResult } from "@/types/evaluation";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { FactorChips } from "@/components/calculator/FactorChips";
import { BenchmarkTeaser } from "@/components/calculator/BenchmarkTeaser";
import { LeadCaptureForm } from "@/components/calculator/LeadCaptureForm";
import { formatPrice } from "@/lib/utils";

interface ResultCardProps {
  result: EvaluationResult;
  complexName: string;
  onBack: () => void;
}

export function ResultCard({ result, complexName, onBack }: ResultCardProps) {
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
        className="rounded-2xl glass-card p-6 mb-6"
        style={{ borderColor: "rgba(200,164,78,0.2)" }}
      >
        <div className="text-xs text-[#5A6478] uppercase tracking-[0.15em] font-medium mb-1">
          Рыночная стоимость
        </div>
        <div className="font-bold text-[#C8A44E] font-mono mb-1" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
          <AnimatedCounter
            value={result.totalPrice}
            formatter={(v) => formatPrice(Math.round(v))}
          />
        </div>
        <div className="text-sm text-[#4A8FD4]">
          {complexName} &middot; {formatPrice(result.pricePerSqm)}/м&sup2;
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
      <LeadCaptureForm />

      <p className="text-xs text-[#5A6478] text-center mt-4">
        Данная оценка носит информационный характер и не является официальным
        заключением
      </p>
    </div>
  );
}
