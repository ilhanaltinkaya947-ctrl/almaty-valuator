import type { CalculationParams } from "@/types/evaluation";

interface FactorChipsProps {
  params: CalculationParams;
}

const CHIP_CONFIG: {
  key: keyof CalculationParams;
  label: string;
  color: string;
}[] = [
  { key: "kComplex", label: "ЖК", color: "#C8A44E" },
  { key: "kFloor", label: "Этаж", color: "#4A8FD4" },
  { key: "kYear", label: "Год", color: "#7BC67E" },
  { key: "kView", label: "Вид", color: "#D9904A" },
  { key: "kCondition", label: "Сост.", color: "#9B6BD6" },
];

export function FactorChips({ params }: FactorChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIP_CONFIG.map(({ key, label, color }) => {
        const val = params[key] as number;
        return (
          <div
            key={key}
            className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium"
            style={{
              background: `${color}14`,
              border: `1px solid ${color}30`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[#7A8299]">{label}</span>
            <span className="font-mono font-bold" style={{ color }}>
              &times;{val.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
