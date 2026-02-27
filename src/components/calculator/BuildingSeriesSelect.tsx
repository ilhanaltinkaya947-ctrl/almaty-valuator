"use client";

import type { BuildingSeriesInfo } from "@/data/zones";
import type { BuildingSeries } from "@/types/evaluation";

interface BuildingSeriesSelectProps {
  seriesList: BuildingSeriesInfo[];
  selectedSeries: BuildingSeries | null;
  onSelect: (series: BuildingSeriesInfo) => void;
  onBack: () => void;
}

export function BuildingSeriesSelect({
  seriesList,
  selectedSeries,
  onSelect,
  onBack,
}: BuildingSeriesSelectProps) {
  return (
    <div className="fade-enter">
      <button
        onClick={onBack}
        className="text-[#7A8299] hover:text-white transition-colors duration-200 mb-4 text-sm flex items-center gap-1 cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Назад к выбору района
      </button>

      <h3 className="text-lg font-semibold text-white mb-1">Серия дома</h3>
      <p className="text-sm text-[#7A8299] mb-5">
        Выберите тип здания, в котором расположена квартира
      </p>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {seriesList.map((s) => {
          const isSelected = s.series === selectedSeries;
          const modifierLabel = s.modifier >= 1
            ? `+${((s.modifier - 1) * 100).toFixed(0)}%`
            : `${((s.modifier - 1) * 100).toFixed(0)}%`;

          return (
            <button
              key={s.series}
              onClick={() => onSelect(s)}
              className={`relative rounded-xl p-3.5 sm:p-4 text-left transition-all duration-300 cursor-pointer ${
                isSelected ? "text-white" : "text-[#7A8299] hover:text-white"
              }`}
              style={{
                background: isSelected
                  ? "rgba(200,164,78,0.06)"
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${isSelected ? "rgba(200,164,78,0.3)" : "rgba(255,255,255,0.06)"}`,
                boxShadow: isSelected ? "0 0 20px rgba(200,164,78,0.08)" : "none",
              }}
            >
              {/* Modifier badge */}
              <span
                className="absolute top-2.5 right-2.5 text-[10px] font-mono font-bold rounded-full px-2 py-0.5"
                style={{
                  background: s.modifier >= 1 ? "rgba(123,198,126,0.12)" : "rgba(231,76,60,0.12)",
                  color: s.modifier >= 1 ? "#7BC67E" : "#E74C3C",
                }}
              >
                {modifierLabel}
              </span>

              <div className="text-sm font-semibold mb-1 pr-10">{s.labelRu}</div>
              <div className="text-[11px] text-[#5A6478] leading-snug">{s.descriptionRu}</div>
              <div className="text-[10px] text-[#3A4258] mt-1.5 font-mono">
                {s.yearMin}–{s.yearMax} · до {s.floorMax} эт.
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
