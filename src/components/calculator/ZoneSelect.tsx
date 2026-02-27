"use client";

import { useMemo } from "react";
import type { PriceZone } from "@/data/zones";
import { getZonesByDistrict } from "@/data/zones";

interface ZoneSelectProps {
  zones: PriceZone[];
  selectedZoneId: string | null;
  onSelect: (zone: PriceZone) => void;
}

const DISTRICT_ORDER = [
  "Медеуский",
  "Бостандыкский",
  "Алмалинский",
  "Ауэзовский",
  "Жетысуский",
  "Турксибский",
  "Наурызбайский",
  "Алатауский",
];

export function ZoneSelect({ zones, selectedZoneId, onSelect }: ZoneSelectProps) {
  const grouped = useMemo(() => getZonesByDistrict(zones), [zones]);

  return (
    <div className="fade-enter">
      <h3 className="text-lg font-semibold text-white mb-1">Выберите район</h3>
      <p className="text-sm text-[#7A8299] mb-5">
        Укажите зону в Алматы, где расположена ваша квартира
      </p>

      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
        {DISTRICT_ORDER.map((district) => {
          const districtZones = grouped[district];
          if (!districtZones || districtZones.length === 0) return null;

          return (
            <div key={district}>
              <div className="text-[11px] font-medium text-[#5A6478] uppercase tracking-[0.15em] mb-2 sticky top-0 bg-[#0C0E16] py-1 z-10">
                {district}
              </div>
              <div className="space-y-1.5">
                {districtZones.map((zone) => {
                  const isSelected = zone.id === selectedZoneId;
                  const avgFormatted = new Intl.NumberFormat("ru-RU").format(zone.avgPriceSqm);

                  return (
                    <button
                      key={zone.id}
                      onClick={() => onSelect(zone)}
                      className={`w-full text-left rounded-xl px-4 py-3 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "text-white"
                          : "text-[#7A8299] hover:text-white"
                      }`}
                      style={{
                        background: isSelected
                          ? "rgba(200,164,78,0.06)"
                          : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isSelected ? "rgba(200,164,78,0.3)" : "rgba(255,255,255,0.06)"}`,
                        boxShadow: isSelected ? "0 0 20px rgba(200,164,78,0.06)" : "none",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{zone.name}</span>
                        <span className="text-xs font-mono text-[#5A6478]">
                          ~{avgFormatted} ₸/м²
                        </span>
                      </div>
                      {zone.description && (
                        <div className="text-xs text-[#5A6478] mt-0.5">{zone.description}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
