"use client";

import { useState, useMemo } from "react";
import { COMPLEXES, CLASS_LABELS, CLASS_COLORS } from "@/data/complexes";
import type { Complex } from "@/data/complexes";
import { Input } from "@/components/ui/Input";

interface ComplexSearchProps {
  onSelect: (complex: Complex) => void;
}

export function ComplexSearch({ onSelect }: ComplexSearchProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return COMPLEXES;
    const lower = query.toLowerCase();
    return COMPLEXES.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.district.toLowerCase().includes(lower) ||
        c.developer.toLowerCase().includes(lower),
    );
  }, [query]);

  return (
    <div className="fade-enter">
      <h3 className="text-lg font-semibold text-[#1A2332] mb-1">Выберите жилой комплекс</h3>
      <p className="text-[#6B7280] mb-4 text-sm">
        Начните вводить название, район или застройщика
      </p>

      <div className="relative">
        <Input
          placeholder="Поиск по названию, району или застройщику..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-[calc(50%+12px)] -translate-y-1/2 h-5 w-5 rounded-full bg-[rgba(0,0,0,0.06)] hover:bg-[rgba(0,0,0,0.12)] flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="h-3 w-3 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-4 max-h-[380px] overflow-y-auto pr-1 space-y-1" style={{ overscrollBehavior: "contain" }}>
        {filtered.map((complex) => (
          <div
            key={complex.name}
            onClick={() => onSelect(complex)}
            className="flex items-center justify-between py-3.5 px-4 cursor-pointer transition-all duration-200 hover:bg-[rgba(58,141,123,0.04)] rounded-xl border border-transparent hover:border-[rgba(58,141,123,0.08)]"
          >
            <div>
              <div className="font-medium text-[#1A2332]">{complex.name}</div>
              <div className="text-sm text-[#9CA3AF]">
                {complex.district} &middot; {complex.developer}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: CLASS_COLORS[complex.class] + "20",
                  color: CLASS_COLORS[complex.class],
                }}
              >
                {CLASS_LABELS[complex.class]}
              </span>
              <span className="text-[#6B7280] font-mono font-bold text-sm">
                &times;{complex.coefficient.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-[#9CA3AF] text-center py-8">Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}
