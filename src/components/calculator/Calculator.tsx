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

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Квартира" },
  { value: "house", label: "Частный дом" },
  { value: "commercial", label: "Коммерция" },
  { value: "land", label: "Участок" },
  { value: "other", label: "Другое" },
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
      {/* Property type pills */}
      <div className="mb-6">
        <label className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2.5">
          Тип недвижимости
        </label>
        <div className="flex gap-2 flex-wrap">
          {PROPERTY_TYPES.map((pt) => (
            <button
              key={pt.value}
              onClick={() => handlePropertyTypeChange(pt.value)}
              className={`rounded-full px-4 py-2.5 text-[13px] font-medium transition-all duration-300 cursor-pointer ${
                propertyType === pt.value
                  ? "bg-[rgba(58,141,123,0.12)] text-[#3A8D7B] border border-[rgba(58,141,123,0.3)]"
                  : "bg-white border border-[rgba(0,0,0,0.06)] text-[#9CA3AF] hover:text-[#6B7280]"
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-toggle: ЖК vs Район — only for apartment/townhouse */}
      {isAuto && (
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => handleModeChange("complex")}
            className={`rounded-full px-5 py-2.5 text-[13px] font-medium transition-all duration-300 cursor-pointer inline-flex items-center gap-1.5 ${
              calcMode === "complex"
                ? "bg-[rgba(58,141,123,0.12)] text-[#3A8D7B] border border-[rgba(58,141,123,0.3)]"
                : "bg-white border border-[rgba(0,0,0,0.06)] text-[#9CA3AF] hover:text-[#6B7280]"
            }`}
          >
            🏢 По ЖК
          </button>
          <button
            onClick={() => handleModeChange("zone")}
            className={`rounded-full px-5 py-2.5 text-[13px] font-medium transition-all duration-300 cursor-pointer inline-flex items-center gap-1.5 ${
              calcMode === "zone"
                ? "bg-[rgba(58,141,123,0.12)] text-[#3A8D7B] border border-[rgba(58,141,123,0.3)]"
                : "bg-white border border-[rgba(0,0,0,0.06)] text-[#9CA3AF] hover:text-[#6B7280]"
            }`}
          >
            📍 По району
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

// ── Branch C: Non-apartment — message + detailed lead capture ──

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: "частного дома",
  commercial: "коммерческой недвижимости",
  land: "земельного участка",
  other: "объекта",
};

const EXPERT_DISTRICT_OPTIONS = [
  // Город Алматы
  { group: "Город Алматы", options: [
    "Алмалинский",
    "Алатауский",
    "Ауэзовский",
    "Бостандыкский",
    "Жетысуский",
    "Медеуский",
    "Наурызбайский",
    "Турксибский",
  ]},
  // Алматинская область
  { group: "Алматинская область", options: [
    "Талгарский район",
    "Карасайский район",
    "Илийский район",
    "Енбекшиказахский район",
    "Жамбылский район",
    "Каскеленский район",
    "Талгар",
    "Каскелен",
    "Иссык",
    "Есик",
    "Капшагай",
    "Талгарский тракт",
    "Кульджинский тракт",
    "Бурундай",
    "Отеген батыр",
    "Туздыбастау",
    "Узынагаш",
  ]},
];

const EXPERT_CONDITION_OPTIONS = [
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
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const rawPhone = unformatPhone(phone);
  const isValid = /^\+7\d{10}$/.test(rawPhone);

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
          area_sqm: propertyType === "land" ? (parseFloat(area) || 0) * 100 : (parseFloat(area) || undefined),
          source: "landing",
          needs_manual_review: true,
          status: "pending_review",
          notes: [
            district ? `Район: ${district}` : "",
            address ? `Адрес: ${address}` : "",
            area ? `Площадь: ${area}${propertyType === "land" ? " соток" : " м²"}` : "",
            condition ? `Состояние: ${EXPERT_CONDITION_OPTIONS.find(c => c.value === condition)?.label ?? condition}` : "",
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
        <h3 className="text-lg font-semibold text-[#1A2332] mb-2">Заявка принята!</h3>
        <p className="text-sm text-[#6B7280] max-w-sm mx-auto">
          Наш специалист свяжется с вами в течение 15 минут для точного расчёта стоимости {PROPERTY_TYPE_LABELS[propertyType] ?? "объекта"}.
        </p>
      </div>
    );
  }

  return (
    <div className="fade-enter">
      {/* Message about individual approach */}
      <div
        className="rounded-2xl p-4 sm:p-5 mb-5"
        style={{
          background: "linear-gradient(145deg, rgba(58,141,123,0.06), rgba(58,141,123,0.02))",
          border: "1px solid rgba(58,141,123,0.15)",
        }}
      >
        <div className="flex gap-3">
          <div className="h-9 w-9 rounded-full bg-[rgba(58,141,123,0.12)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="h-4.5 w-4.5 text-[#3A8D7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="text-[14px] text-[#1A2332] leading-relaxed">
            Оценка данного типа недвижимости требует индивидуального подхода. Оставьте заявку, и наш специалист свяжется с вами для точного расчёта.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">
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
          <label className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">
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
          <label className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">
            Район / Населённый пункт
          </label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3.5 pr-10 text-[#1A2332] focus:border-[rgba(58,141,123,0.4)] focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              backgroundSize: "16px",
            }}
          >
            <option value="">Выберите район</option>
            {EXPERT_DISTRICT_OPTIONS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.options.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Address */}
        <div>
          <label className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">
            Адрес объекта
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Улица, дом, микрорайон"
            className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3.5 text-[#1A2332] placeholder:text-[#9CA3AF] focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200"
          />
        </div>

        {/* Area */}
        <div>
          <label className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">
            {propertyType === "land" ? "Площадь, сотки" : "Площадь, м²"}
          </label>
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder={propertyType === "land" ? "Например: 6" : "Например: 120"}
            min={1}
            className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3.5 text-[#1A2332] placeholder:text-[#9CA3AF] focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200 font-mono"
          />
          {propertyType === "land" && (
            <p className="text-xs text-[#9CA3AF] mt-1.5">1 сотка = 100 м²</p>
          )}
        </div>

        {/* Condition */}
        {propertyType !== "land" && (
          <div>
            <label className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">
              Состояние
            </label>
            <div className="flex flex-wrap gap-2">
              {EXPERT_CONDITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCondition(opt.value === condition ? "" : opt.value)}
                  className={`rounded-full px-4 py-2 text-sm transition-all duration-200 cursor-pointer ${
                    condition === opt.value
                      ? "bg-[rgba(58,141,123,0.12)] text-[#3A8D7B] border border-[rgba(58,141,123,0.3)] font-medium"
                      : "bg-white border border-[rgba(0,0,0,0.08)] text-[#6B7280] hover:border-[rgba(0,0,0,0.15)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2">
            Дополнительная информация
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Особенности объекта, наличие долгов, документы, срочность..."
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
        {loading ? "Отправка..." : "Оставить заявку"}
      </button>

      <p className="text-[13px] text-[#9CA3AF] text-center mt-3">
        Бесплатно · Без обязательств · Ответ в течение 15 минут
      </p>
    </div>
  );
}
