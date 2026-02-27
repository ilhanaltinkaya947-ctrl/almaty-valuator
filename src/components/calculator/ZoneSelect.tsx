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
      <h3 className="text-lg font-semibold text-[#1A2332] mb-1">Выберите район</h3>
      <p className="text-sm text-[#6B7280] mb-5">
        Укажите зону в Алматы, где расположена ваша квартира
      </p>

      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
        {DISTRICT_ORDER.map((district) => {
          const districtZones = grouped[district];
          if (!districtZones || districtZones.length === 0) return null;

          return (
            <div key={district}>
              <div className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] mb-2 sticky top-0 bg-white py-1 z-10">
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
                          ? "text-[#1A2332]"
                          : "text-[#6B7280] hover:text-[#1A2332]"
                      }`}
                      style={{
                        background: isSelected
                          ? "rgba(58,141,123,0.06)"
                          : "#FFFFFF",
                        border: `1px solid ${isSelected ? "rgba(58,141,123,0.3)" : "rgba(0,0,0,0.06)"}`,
                        boxShadow: isSelected ? "0 0 20px rgba(58,141,123,0.06)" : "none",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{zone.name}</span>
                        <span className="text-xs font-mono text-[#9CA3AF]">
                          ~{avgFormatted} ₸/м²
                        </span>
                      </div>
                      {zone.description && (
                        <div className="text-xs text-[#9CA3AF] mt-0.5">{zone.description}</div>
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
