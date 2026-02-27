import type { CalculationParams } from "@/types/evaluation";

interface FactorChipsProps {
  params: CalculationParams;
}

interface ChipDef {
  key: string;
  label: string;
  color: string;
  value: number | undefined;
}

export function FactorChips({ params }: FactorChipsProps) {
  const chips: ChipDef[] = [];

  // Zone path: show zone + series chips instead of single ЖК chip
  if (params.kZone != null && params.kSeries != null) {
    chips.push({ key: "kZone",   label: "Район", color: "#4A8FD4", value: params.kZone });
    chips.push({ key: "kSeries", label: "Серия",  color: "#3A8D7B", value: params.kSeries });
  } else {
    chips.push({ key: "kComplex", label: "ЖК", color: "#3A8D7B", value: params.kComplex });
  }

  chips.push({ key: "kYear",     label: "Год",      color: "#7BC67E", value: params.kYear });
  chips.push({ key: "kMaterial", label: "Материал", color: "#D9904A", value: params.kMaterial });

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(({ key, label, color, value }) => {
        if (value == null) return null;
        return (
          <div
            key={key}
            className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium"
            style={{
              background: `${color}14`,
              border: `1px solid ${color}30`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[#6B7280]">{label}</span>
            <span className="font-mono font-bold" style={{ color }}>
              &times;{value.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
