"use client";

import { useState, useEffect } from "react";
import type { Complex } from "@/data/complexes";
import type {
  ConditionType,
  WallMaterial,
  AutoEvaluationResult,
  PropertyType,
  FloorPosition,
} from "@/types/evaluation";
import { isAutoCalcType } from "@/types/evaluation";
import { evaluateAuto, evaluateVtorichka } from "@/lib/smart-value";
import { PRICE_ZONES } from "@/data/zones";
import type { PriceZone } from "@/data/zones";
import { ComplexSearch } from "./ComplexSearch";
import { ParameterForm } from "./ParameterForm";
import { ResultCard } from "./ResultCard";
import { ZoneSelect } from "./ZoneSelect";
import { formatPhone, unformatPhone } from "@/lib/utils";

type CalcStep = 1 | 2 | 3;
type CalcMode = "complex" | "vtorichka";

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Квартира" },
  { value: "house", label: "Частный дом" },
  { value: "land", label: "Земельный участок" },
  { value: "commercial", label: "Коммерция" },
];

export function Calculator() {
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [calcMode, setCalcMode] = useState<CalcMode>("complex");
  const [step, setStep] = useState<CalcStep>(1);

  // Path A state
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);
  const [result, setResult] = useState<AutoEvaluationResult | null>(null);

  // Shared fields
  const [lastYearBuilt, setLastYearBuilt] = useState<number | undefined>();
  const [lastWallMaterial, setLastWallMaterial] = useState<WallMaterial | undefined>();
  const [lastIsPledged, setLastIsPledged] = useState<boolean>(false);
  const [lastFloorPosition, setLastFloorPosition] = useState<FloorPosition | undefined>();

  // Path B state
  const [zones, setZones] = useState<PriceZone[]>(PRICE_ZONES);
  const [selectedZone, setSelectedZone] = useState<PriceZone | null>(null);

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
    floorPosition: FloorPosition;
  }) {
    if (!selectedComplex) return;

    setLastYearBuilt(params.yearBuilt);
    setLastWallMaterial(params.wallMaterial);
    setLastIsPledged(params.isPledged);
    setLastFloorPosition(params.floorPosition);

    const evalResult = evaluateAuto({
      complexName: selectedComplex.name,
      area: params.area,
      yearBuilt: selectedComplex.yearBuilt,
      wallMaterial: selectedComplex.wallMaterial,
      condition: params.condition,
      complexCoefficient: selectedComplex.coefficient,
      housingClass: selectedComplex.class,
      floorPosition: params.floorPosition,
    });

    setResult(evalResult);
    setStep(3);
  }

  // Path B handlers
  function handleSelectZone(zone: PriceZone) {
    setSelectedZone(zone);
    setStep(2);
  }

  function handleVtorichkaCalculate(params: {
    area: number;
    yearBuilt: number;
    wallMaterial: WallMaterial;
    condition: ConditionType;
    isPledged: boolean;
    floorPosition: FloorPosition;
  }) {
    if (!selectedZone) return;

    setLastYearBuilt(params.yearBuilt);
    setLastWallMaterial(params.wallMaterial);
    setLastIsPledged(params.isPledged);
    setLastFloorPosition(params.floorPosition);

    const evalResult = evaluateVtorichka({
      zoneId: selectedZone.id,
      zoneName: selectedZone.name,
      zoneSlug: selectedZone.slug,
      zoneCoefficient: selectedZone.coefficient,
      area: params.area,
      yearBuilt: params.yearBuilt,
      wallMaterial: params.wallMaterial,
      condition: params.condition,
      floorPosition: params.floorPosition,
    });

    setResult(evalResult);
    setStep(3);
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
    setResult(null);
    setLastYearBuilt(undefined);
    setLastWallMaterial(undefined);
    setLastIsPledged(false);
    setLastFloorPosition(undefined);
  }

  const isAuto = isAutoCalcType(propertyType);

  // Build result label for zone path
  const vtorichkaResultLabel = selectedZone
    ? `Вторичка, район: ${selectedZone.name}`
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

      {/* Sub-toggle: В новом ЖК vs Обычный дом (Вторичка) — only for apartment */}
      {isAuto && (
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => handleModeChange("complex")}
            className={`rounded-full px-5 py-2.5 text-[13px] font-medium transition-all duration-300 cursor-pointer inline-flex items-center gap-1.5 ${
              calcMode === "complex"
                ? "bg-[rgba(58,141,123,0.12)] text-[#3A8D7B] border border-[rgba(58,141,123,0.3)]"
                : "bg-white border border-[rgba(0,0,0,0.06)] text-[#9CA3AF] hover:text-[#6B7280]"
            }`}
          >
            🏢 В новом ЖК
          </button>
          <button
            onClick={() => handleModeChange("vtorichka")}
            className={`rounded-full px-5 py-2.5 text-[13px] font-medium transition-all duration-300 cursor-pointer inline-flex items-center gap-1.5 ${
              calcMode === "vtorichka"
                ? "bg-[rgba(58,141,123,0.12)] text-[#3A8D7B] border border-[rgba(58,141,123,0.3)]"
                : "bg-white border border-[rgba(0,0,0,0.06)] text-[#9CA3AF] hover:text-[#6B7280]"
            }`}
          >
            🏠 Обычный дом (Вторичка)
          </button>
        </div>
      )}

      {/* Path A: ЖК-based auto calculation */}
      {isAuto && calcMode === "complex" && (
        <>
          {step === 1 && <ComplexSearch onSelect={handleSelectComplex} />}
          {step === 2 && selectedComplex && (
            <ParameterForm
              mode="complex"
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
              floorPosition={lastFloorPosition}
              yearBuilt={lastYearBuilt}
              wallMaterial={lastWallMaterial}
              isPledged={lastIsPledged}
            />
          )}
        </>
      )}

      {/* Path B: Vtorichka (zone-based) calculation — 3 steps */}
      {isAuto && calcMode === "vtorichka" && (
        <>
          {step === 1 && (
            <ZoneSelect
              zones={zones}
              selectedZoneId={selectedZone?.id ?? null}
              onSelect={handleSelectZone}
            />
          )}
          {step === 2 && selectedZone && (
            <ParameterForm
              mode="vtorichka"
              zone={selectedZone}
              onSubmit={handleVtorichkaCalculate}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && result && (
            <ResultCard
              result={result}
              complexName={vtorichkaResultLabel}
              onBack={() => setStep(2)}
              zoneId={selectedZone?.id}
              floorPosition={lastFloorPosition}
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

// ── Branch C: Non-apartment — type-specific fields + universal contact ──

const UTILITY_OPTIONS = [
  { value: "electricity", label: "Свет" },
  { value: "water", label: "Вода" },
  { value: "gas", label: "Газ" },
  { value: "sewage", label: "Центральная канализация" },
];

const INPUT_CLS = "w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3.5 text-[#1A2332] placeholder:text-[#9CA3AF] focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none transition-all duration-200";
const LABEL_CLS = "text-[13px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] block mb-2";

function ExpertRequestForm({ propertyType }: { propertyType: PropertyType }) {
  // Type-specific fields
  const [houseArea, setHouseArea] = useState("");
  const [landArea, setLandArea] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [commercialArea, setCommercialArea] = useState("");
  const [utilities, setUtilities] = useState<string[]>([]);
  const [isFenced, setIsFenced] = useState(false);

  // Universal contact fields (all required)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [address, setAddress] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const rawPhone = unformatPhone(phone);
  const isValid = /^\+7\d{10}$/.test(rawPhone) && name.trim() !== "" && address.trim() !== "";

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
  }

  function toggleUtility(val: string) {
    setUtilities((prev) =>
      prev.includes(val) ? prev.filter((u) => u !== val) : [...prev, val]
    );
  }

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);

    // Build type-specific notes
    const paramLines: string[] = [];
    if (propertyType === "house") {
      if (houseArea) paramLines.push(`Площадь дома: ${houseArea} м²`);
      if (landArea) paramLines.push(`Площадь участка: ${landArea} соток`);
      if (yearBuilt) paramLines.push(`Год постройки: ${yearBuilt}`);
    } else if (propertyType === "land") {
      if (landArea) paramLines.push(`Площадь: ${landArea} соток`);
      if (utilities.length > 0) {
        const labels = utilities.map((u) => UTILITY_OPTIONS.find((o) => o.value === u)?.label ?? u);
        paramLines.push(`Коммуникации: ${labels.join(", ")}`);
      }
      paramLines.push(`Обгорожен: ${isFenced ? "Да" : "Нет"}`);
    } else if (propertyType === "commercial") {
      if (commercialArea) paramLines.push(`Площадь: ${commercialArea} м²`);
      if (yearBuilt) paramLines.push(`Год постройки: ${yearBuilt}`);
    }

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: rawPhone,
          name,
          address,
          property_type: propertyType,
          area_sqm: propertyType === "house"
            ? (parseFloat(houseArea) || undefined)
            : propertyType === "commercial"
              ? (parseFloat(commercialArea) || undefined)
              : propertyType === "land"
                ? (parseFloat(landArea) || 0) * 100
                : undefined,
          year_built: (propertyType === "house" || propertyType === "commercial") && yearBuilt
            ? parseInt(yearBuilt)
            : undefined,
          source: "landing",
          needs_manual_review: true,
          status: "new",
          notes: paramLines.length > 0 ? paramLines.join("; ") : undefined,
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
          Наш специалист свяжется с вами в течение 15 минут для индивидуального расчёта.
        </p>
      </div>
    );
  }

  return (
    <div className="fade-enter">
      {/* Warning message */}
      <div
        className="rounded-2xl p-4 sm:p-5 mb-5"
        style={{
          background: "linear-gradient(145deg, rgba(234,179,8,0.06), rgba(234,179,8,0.02))",
          border: "1px solid rgba(234,179,8,0.2)",
        }}
      >
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-[#D97706] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-[14px] text-[#92400E] leading-relaxed">
            Оценка данного типа недвижимости требует индивидуального экспертного анализа. Оставьте заявку, и наш специалист свяжется с вами для точного расчёта.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* ── Type-specific fields ── */}

        {/* House: площадь дома + участок + год */}
        {propertyType === "house" && (
          <>
            <div>
              <label className={LABEL_CLS}>Площадь дома, м²</label>
              <input type="number" value={houseArea} onChange={(e) => setHouseArea(e.target.value)} placeholder="Например: 150" min={1} className={`${INPUT_CLS} font-mono`} />
            </div>
            <div>
              <label className={LABEL_CLS}>Площадь участка, сотки</label>
              <input type="number" value={landArea} onChange={(e) => setLandArea(e.target.value)} placeholder="Например: 6" min={0.5} step={0.5} className={`${INPUT_CLS} font-mono`} />
              <p className="text-xs text-[#9CA3AF] mt-1.5">1 сотка = 100 м²</p>
            </div>
            <div>
              <label className={LABEL_CLS}>Год постройки</label>
              <input type="number" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} placeholder="Например: 2005" min={1950} max={2026} className={`${INPUT_CLS} font-mono`} />
            </div>
          </>
        )}

        {/* Land: площадь + коммуникации */}
        {propertyType === "land" && (
          <>
            <div>
              <label className={LABEL_CLS}>Площадь участка, сотки</label>
              <input type="number" value={landArea} onChange={(e) => setLandArea(e.target.value)} placeholder="Например: 10" min={0.5} step={0.5} className={`${INPUT_CLS} font-mono`} />
              <p className="text-xs text-[#9CA3AF] mt-1.5">1 сотка = 100 м²</p>
            </div>
            <div>
              <label className={LABEL_CLS}>Коммуникации</label>
              <div className="flex flex-wrap gap-2">
                {UTILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => toggleUtility(opt.value)}
                    className={`rounded-full px-4 py-2 text-sm transition-all duration-200 cursor-pointer ${
                      utilities.includes(opt.value)
                        ? "bg-[rgba(58,141,123,0.12)] text-[#3A8D7B] border border-[rgba(58,141,123,0.3)] font-medium"
                        : "bg-white border border-[rgba(0,0,0,0.08)] text-[#6B7280] hover:border-[rgba(0,0,0,0.15)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFenced}
                  onChange={(e) => setIsFenced(e.target.checked)}
                  className="h-5 w-5 rounded border-[rgba(0,0,0,0.15)] text-[#3A8D7B] accent-[#3A8D7B] cursor-pointer"
                />
                <span className="text-[14px] text-[#1A2332]">Участок обгорожен</span>
              </label>
              <p className="text-xs text-[#9CA3AF] mt-1.5 ml-8">Если не отмечено — участок не обгорожен</p>
            </div>
          </>
        )}

        {/* Commercial: площадь + год */}
        {propertyType === "commercial" && (
          <>
            <div>
              <label className={LABEL_CLS}>Площадь помещения, м²</label>
              <input type="number" value={commercialArea} onChange={(e) => setCommercialArea(e.target.value)} placeholder="Например: 200" min={1} className={`${INPUT_CLS} font-mono`} />
            </div>
            <div>
              <label className={LABEL_CLS}>Год постройки</label>
              <input type="number" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} placeholder="Например: 2010" min={1950} max={2026} className={`${INPUT_CLS} font-mono`} />
            </div>
          </>
        )}

        {/* ── Universal contact block (divider + 3 required fields) ── */}
        <div className="pt-2">
          <div className="h-px bg-[rgba(0,0,0,0.06)] mb-4" />
          <div className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] mb-4">
            Контактные данные
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Имя <span className="text-[#E74C3C]">*</span></label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Как к вам обращаться" className={INPUT_CLS} />
        </div>

        <div>
          <label className={LABEL_CLS}>Телефон <span className="text-[#E74C3C]">*</span></label>
          <input type="tel" value={phone} onChange={handlePhoneChange} placeholder="+7 (___) ___-__-__" className={`${INPUT_CLS} font-mono`} />
        </div>

        <div>
          <label className={LABEL_CLS}>Точный адрес объекта <span className="text-[#E74C3C]">*</span></label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом, участок / помещение" className={INPUT_CLS} />
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
