"use client";

import { useState, useEffect } from "react";
import type { Complex } from "@/data/complexes";
import type {
  ConditionType,
  WallMaterial,
  AutoEvaluationResult,
  PropertyType,
  BuildingSeries,
} from "@/types/evaluation";
import { isAutoCalcType } from "@/types/evaluation";
import { evaluateAuto, evaluateZone } from "@/lib/smart-value";
import { PRICE_ZONES, BUILDING_SERIES } from "@/data/zones";
import type { PriceZone, BuildingSeriesInfo } from "@/data/zones";
import { ComplexSearch } from "./ComplexSearch";
import { ParameterForm } from "./ParameterForm";
import { ResultCard } from "./ResultCard";
import { ZoneSelect } from "./ZoneSelect";
import { BuildingSeriesSelect } from "./BuildingSeriesSelect";
import { ZoneParameterForm } from "./ZoneParameterForm";
import { formatPhone, unformatPhone } from "@/lib/utils";

type CalcStep = 1 | 2 | 3 | 4;
type CalcMode = "complex" | "zone";

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: "apartment", label: "Квартира", icon: "🏢" },
  { value: "townhouse", label: "Таунхаус", icon: "🏘" },
  { value: "house", label: "Дом", icon: "🏠" },
  { value: "commercial", label: "Коммерция", icon: "🏗" },
  { value: "land", label: "Участок", icon: "🌍" },
];

export function Calculator() {
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [calcMode, setCalcMode] = useState<CalcMode>("complex");
  const [step, setStep] = useState<CalcStep>(1);

  // Path A state
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);
  const [result, setResult] = useState<AutoEvaluationResult | null>(null);

  // Shared new fields
  const [lastYearBuilt, setLastYearBuilt] = useState<number | undefined>();
  const [lastWallMaterial, setLastWallMaterial] = useState<WallMaterial | undefined>();
  const [lastIsPledged, setLastIsPledged] = useState<boolean>(false);

  // Path B state
  const [zones, setZones] = useState<PriceZone[]>(PRICE_ZONES);
  const [seriesList, setSeriesList] = useState<BuildingSeriesInfo[]>(BUILDING_SERIES);
  const [selectedZone, setSelectedZone] = useState<PriceZone | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<BuildingSeriesInfo | null>(null);

  // Fetch zones from API on mount
  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then((data) => {
        if (data.zones?.length) {
          const mapped: PriceZone[] = data.zones.map((z: Record<string, unknown>) => ({
            id: z.id as string,
            name: z.name as string,
            slug: z.slug as string,
            district: z.district as string,
            description: (z.description as string) ?? "",
            avgPriceSqm: z.avg_price_sqm as number,
            coefficient: Number(z.coefficient),
            sortOrder: z.sort_order as number,
          }));
          setZones(mapped);
        }
        if (data.series?.length) {
          const mapped: BuildingSeriesInfo[] = data.series.map((s: Record<string, unknown>) => ({
            series: s.series as BuildingSeries,
            labelRu: s.label_ru as string,
            descriptionRu: (s.description_ru as string) ?? "",
            yearMin: s.year_min as number,
            yearMax: s.year_max as number,
            floorMin: (s.floor_min as number) ?? 1,
            floorMax: (s.floor_max as number) ?? 16,
            modifier: Number(s.modifier),
            sortOrder: s.sort_order as number,
          }));
          setSeriesList(mapped);
        }
      })
      .catch(() => {
        // Keep static fallback
      });
  }, []);

  // Path A handlers
  function handleSelectComplex(complex: Complex) {
    setSelectedComplex(complex);
    setStep(2);
  }

  function handleCalculate(params: {
    area: number;
    yearBuilt: number;
    wallMaterial: WallMaterial;
    condition: ConditionType;
    isPledged: boolean;
  }) {
    if (!selectedComplex) return;

    setLastYearBuilt(params.yearBuilt);
    setLastWallMaterial(params.wallMaterial);
    setLastIsPledged(params.isPledged);

    const evalResult = evaluateAuto({
      complexName: selectedComplex.name,
      area: params.area,
      yearBuilt: params.yearBuilt,
      wallMaterial: params.wallMaterial,
      condition: params.condition,
      complexCoefficient: selectedComplex.coefficient,
      housingClass: selectedComplex.class,
    });

    setResult(evalResult);
    setStep(3);
  }

  // Path B handlers
  function handleSelectZone(zone: PriceZone) {
    setSelectedZone(zone);
    setStep(2);
  }

  function handleSelectSeries(series: BuildingSeriesInfo) {
    setSelectedSeries(series);
    setStep(3);
  }

  function handleZoneCalculate(params: {
    area: number;
    yearBuilt: number;
    wallMaterial: WallMaterial;
    condition: ConditionType;
    isPledged: boolean;
  }) {
    if (!selectedZone || !selectedSeries) return;

    setLastYearBuilt(params.yearBuilt);
    setLastWallMaterial(params.wallMaterial);
    setLastIsPledged(params.isPledged);

    const evalResult = evaluateZone({
      zoneId: selectedZone.id,
      zoneName: selectedZone.name,
      zoneCoefficient: selectedZone.coefficient,
      buildingSeries: selectedSeries.series,
      seriesModifier: selectedSeries.modifier,
      area: params.area,
      yearBuilt: params.yearBuilt,
      wallMaterial: params.wallMaterial,
      condition: params.condition,
    });

    setResult(evalResult);
    setStep(4);
  }

  function handlePropertyTypeChange(type: PropertyType) {
    setPropertyType(type);
    resetState();
  }

  function handleModeChange(mode: CalcMode) {
    setCalcMode(mode);
    resetState();
  }

  function resetState() {
    setStep(1);
    setSelectedComplex(null);
    setSelectedZone(null);
    setSelectedSeries(null);
    setResult(null);
    setLastYearBuilt(undefined);
    setLastWallMaterial(undefined);
    setLastIsPledged(false);
  }

  const isAuto = isAutoCalcType(propertyType);

  // Build result label for zone path
  const zoneResultLabel = selectedZone && selectedSeries
    ? `${selectedZone.name} · ${selectedSeries.labelRu}`
    : "";

  return (
    <div>
      {/* Property type toggle — pill style */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {PROPERTY_TYPES.map((pt) => (
          <button
            key={pt.value}
            onClick={() => handlePropertyTypeChange(pt.value)}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 cursor-pointer ${
              propertyType === pt.value
                ? "bg-gradient-to-r from-[#66BB6A] to-[#26A69A] text-white"
                : "bg-transparent border border-[rgba(0,0,0,0.08)] text-[#6B7280] hover:border-[rgba(0,0,0,0.15)] hover:text-[#1A2332]"
            }`}
          >
            {pt.icon} {pt.label}
          </button>
        ))}
      </div>

      {/* Sub-toggle: ЖК vs Район — only for apartment/townhouse */}
      {isAuto && (
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => handleModeChange("complex")}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-300 cursor-pointer ${
              calcMode === "complex"
                ? "bg-[rgba(58,141,123,0.12)] text-[#3A8D7B] border border-[rgba(58,141,123,0.3)]"
                : "bg-transparent border border-[rgba(0,0,0,0.06)] text-[#9CA3AF] hover:text-[#6B7280]"
            }`}
          >
            Жилой комплекс
          </button>
          <button
            onClick={() => handleModeChange("zone")}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-300 cursor-pointer ${
              calcMode === "zone"
                ? "bg-[rgba(58,141,123,0.12)] text-[#3A8D7B] border border-[rgba(58,141,123,0.3)]"
                : "bg-transparent border border-[rgba(0,0,0,0.06)] text-[#9CA3AF] hover:text-[#6B7280]"
            }`}
          >
            Без ЖК (по району)
          </button>
        </div>
      )}

      {/* Path A: ЖК-based auto calculation */}
      {isAuto && calcMode === "complex" && (
        <>
          {step === 1 && <ComplexSearch onSelect={handleSelectComplex} />}
          {step === 2 && selectedComplex && (
            <ParameterForm
              complex={selectedComplex}
              onSubmit={handleCalculate}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && result && selectedComplex && (
            <ResultCard
              result={result}
              complexName={selectedComplex.name}
              onBack={() => setStep(2)}
              yearBuilt={lastYearBuilt}
              wallMaterial={lastWallMaterial}
              isPledged={lastIsPledged}
            />
          )}
        </>
      )}

      {/* Path B: Zone-based calculation */}
      {isAuto && calcMode === "zone" && (
        <>
          {step === 1 && (
            <ZoneSelect
              zones={zones}
              selectedZoneId={selectedZone?.id ?? null}
              onSelect={handleSelectZone}
            />
          )}
          {step === 2 && selectedZone && (
            <BuildingSeriesSelect
              seriesList={seriesList}
              selectedSeries={selectedSeries?.series ?? null}
              onSelect={handleSelectSeries}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && selectedZone && selectedSeries && (
            <ZoneParameterForm
              zone={selectedZone}
              series={selectedSeries}
              onSubmit={handleZoneCalculate}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && result && (
            <ResultCard
              result={result}
              complexName={zoneResultLabel}
              onBack={() => setStep(3)}
              zoneId={selectedZone?.id}
              buildingSeries={selectedSeries?.series}
              yearBuilt={lastYearBuilt}
              wallMaterial={lastWallMaterial}
              isPledged={lastIsPledged}
            />
          )}
        </>
      )}

      {/* Path C: Expert review form (houses, commercial, land) */}
      {!isAuto && <ExpertRequestForm propertyType={propertyType} />}
    </div>
  );
}

// ── Branch C: Expert Request Form ──

const PROPERTY_LABELS: Record<string, string> = {
  house: "дома или коттеджа",
  commercial: "коммерческой недвижимости",
  land: "земельного участка",
};

const DISTRICT_OPTIONS = [
  "Алмалинский",
  "Ауэзовский",
  "Бостандыкский",
  "Жетысуский",
  "Медеуский",
  "Наурызбайский",
  "Турксибский",
  "Алатауский",
];

const CONDITION_OPTIONS = [
  { value: "excellent", label: "Отличное" },
  { value: "good", label: "Хорошее" },
  { value: "average", label: "Среднее" },
  { value: "needs_repair", label: "Требует ремонта" },
  { value: "rough", label: "Черновая / Аварийное" },
];

function ExpertRequestForm({ propertyType }: { propertyType: PropertyType }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const rawPhone = unformatPhone(phone);
  const isValid = /^\+7\d{10}$/.test(rawPhone) && district && area;

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
  }

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: rawPhone,
          name: name || undefined,
          property_type: propertyType,
          area_sqm: parseFloat(area) || undefined,
          source: "landing",
          needs_manual_review: true,
          status: "pending_review",
          notes: [
            `Район: ${district}`,
            condition ? `Состояние: ${condition}` : "",
            description ? `Описание: ${description}` : "",
          ].filter(Boolean).join("; "),
        }),
      });
    } catch {
      // Submit anyway to show success
    }

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-12 fade-enter">
        <div className="h-14 w-14 rounded-full bg-[rgba(58,141,123,0.12)] flex items-center justify-center mx-auto mb-4">
          <svg className="h-7 w-7 text-[#3A8D7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#1A2332] mb-2">Заявка на экспертный выкуп принята!</h3>
        <p className="text-sm text-[#6B7280] max-w-sm mx-auto">
          Данный тип недвижимости требует индивидуального анализа. Наш эксперт свяжется с вами в течение 15 минут с готовым предложением.
        </p>
      </div>
    );
  }

  return (
    <div className="fade-enter">
      {/* Expert review badge */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[rgba(58,141,123,0.06)] border border-[rgba(58,141,123,0.15)]">
        <svg className="h-4 w-4 text-[#3A8D7B] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs text-[#3A8D7B]">
          Экспертная оценка — индивидуальный расчёт для {PROPERTY_LABELS[propertyType] ?? "объекта"}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-[#1A2332] mb-1">
        Заявка на экспертный выкуп
      </h3>
      <p className="text-sm text-[#6B7280] mb-6">
        Заполните форму — эксперт проведёт анализ и подготовит индивидуальное предложение
      </p>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">
            Ваше имя
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как к вам обращаться"
            className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3.5 text-[#1A2332] placeholder:text-[#9CA3AF] focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">
            Телефон <span className="text-[#E74C3C]">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="+7 (___) ___-__-__"
            className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3.5 text-[#1A2332] placeholder:text-[#9CA3AF] focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200 font-mono"
          />
        </div>

        {/* District */}
        <div>
          <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">
            Район <span className="text-[#E74C3C]">*</span>
          </label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3.5 text-[#1A2332] focus:border-[rgba(58,141,123,0.4)] focus:outline-none transition-all duration-200 appearance-none"
          >
            <option value="">Выберите район</option>
            {DISTRICT_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Area */}
        <div>
          <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">
            Площадь, м² <span className="text-[#E74C3C]">*</span>
          </label>
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Например: 120"
            min={1}
            className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3.5 text-[#1A2332] placeholder:text-[#9CA3AF] focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200 font-mono"
          />
        </div>

        {/* Condition */}
        <div>
          <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">
            Состояние
          </label>
          <div className="flex flex-wrap gap-2">
            {CONDITION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCondition(opt.value === condition ? "" : opt.value)}
                className={`rounded-full px-4 py-2 text-sm transition-all duration-200 cursor-pointer ${
                  condition === opt.value
                    ? "bg-gradient-to-r from-[#66BB6A] to-[#26A69A] text-white font-medium"
                    : "border border-[rgba(0,0,0,0.08)] text-[#6B7280] hover:border-[rgba(0,0,0,0.15)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">
            Описание объекта
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Дополнительная информация: адрес, особенности, долги, документы..."
            rows={3}
            className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3.5 text-[#1A2332] placeholder:text-[#9CA3AF] focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200 resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid || loading}
        className="w-full mt-6 rounded-full bg-gradient-to-r from-[#66BB6A] to-[#26A69A] px-6 py-3.5 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(58,141,123,0.3)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {loading ? "Отправка..." : "Отправить заявку на экспертный выкуп"}
      </button>

      <p className="text-xs text-[#9CA3AF] text-center mt-3">
        Бесплатно · Без обязательств · Ответ в течение 15 минут
      </p>
    </div>
  );
}
