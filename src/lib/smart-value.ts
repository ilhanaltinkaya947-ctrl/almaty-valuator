import type {
  EvaluationInput,
  EvaluationResult,
  AutoEvaluationResult,
  CalculationParams,
  BuybackBreakdown,
  WallMaterial,
  ConditionType,
  FloorPosition,
  VtorichkaEvaluationInput,
} from "@/types/evaluation";
import { isAutoCalcType } from "@/types/evaluation";

// ── Constants ──

const DEFAULT_BASE_RATE = 805_000;

const ROUGH_DEDUCTION = 0; // тг/м² deduction for rough finish (neutralized)

const NEGOTIATION_LIMIT_COEFFICIENT = 1.0; // max we pay (neutralized — same as market)

const MANUAL_REVIEW_MESSAGES: Record<string, string> = {
  house: "Дома и коттеджи требуют индивидуального анализа. Наш эксперт свяжется с вами с готовым предложением.",
  commercial: "Коммерческая недвижимость требует индивидуальной экспертизы. Брокер подготовит предложение после осмотра.",
  land: "Земельные участки оцениваются индивидуально. Эксперт свяжется с вами для подготовки предложения.",
};

// ── Coefficient Functions ──

/** Step-function year coefficient (neutralized — all values 1.0) */
export function getYearCoefficient(yearBuilt: number): number {
  if (yearBuilt > 2020) return 1.0;
  if (yearBuilt >= 2011) return 1.0;
  if (yearBuilt >= 2000) return 1.0;
  return 1.0;
}

const MATERIAL_COEFFICIENTS: Record<WallMaterial, number> = {
  panel: 1.0,
  brick: 1.0,
  monolith: 1.0,
};

export function getMaterialCoefficient(wall: WallMaterial): number {
  return MATERIAL_COEFFICIENTS[wall];
}

/** Get adjusted base rate: subtract 175k for rough finish */
export function getAdjustedBase(baseRate: number, condition: ConditionType): number {
  return condition === "rough" ? baseRate - ROUGH_DEDUCTION : baseRate;
}

/** Floor position coefficient (neutralized — all values 1.0) */
export function getFloorCoefficient(position: FloorPosition): number {
  return position === "middle" ? 1.0 : 1.0;
}

/** Buyback multiplier (neutralized — all values 1.0, no discount) */
export function getBuybackMultiplier(opts: {
  housingClass: string;
  wallMaterial: WallMaterial;
  isVtorichka: boolean;
  isGoldenSquare?: boolean;
}): number {
  // Вторичка path (neutralized)
  if (opts.isVtorichka) {
    return opts.isGoldenSquare ? 1.0 : 1.0;
  }

  // ЖК path: strictly by housing class (neutralized)
  switch (opts.housingClass) {
    case "elite":
    case "business_plus":
    case "business":
      return 1.0;
    case "comfort_plus":
      return 1.0;
    case "comfort":
      return 1.0;
    case "standard":
    default:
      return 1.0;
  }
}

// ── Main Evaluation ──

export function evaluatePrice(
  input: EvaluationInput,
  baseRate: number = DEFAULT_BASE_RATE,
): EvaluationResult {
  const propertyType = input.propertyType ?? "apartment";

  // Branch B: manual review for non-auto types
  if (!isAutoCalcType(propertyType)) {
    return {
      needsManualReview: true,
      propertyType,
      message: MANUAL_REVIEW_MESSAGES[propertyType] ?? "Требуется индивидуальная оценка эксперта.",
    };
  }

  // Branch A: auto calculation for apartments
  return evaluateAuto(input, baseRate);
}

/** Auto calculation for apartments (Path A — ЖК) */
export function evaluateAuto(
  input: EvaluationInput,
  baseRate: number = DEFAULT_BASE_RATE,
): AutoEvaluationResult {
  const kComplex = input.complexCoefficient;
  const kYear = getYearCoefficient(input.yearBuilt);
  const kMaterial = getMaterialCoefficient(input.wallMaterial);
  const kFloor = getFloorCoefficient(input.floorPosition);
  const adjustedBase = getAdjustedBase(baseRate, input.condition);
  const buybackCoefficient = getBuybackMultiplier({
    housingClass: input.housingClass,
    wallMaterial: input.wallMaterial,
    isVtorichka: false,
  });

  const params: CalculationParams = {
    baseRate: adjustedBase,
    kComplex,
    kYear,
    kMaterial,
    kFloor: kFloor !== 1.0 ? kFloor : undefined,
  };

  // Market price (100%)
  const marketPrice = Math.round(
    input.area * adjustedBase * kComplex * kYear * kMaterial,
  );
  const marketPricePerSqm = Math.round(marketPrice / input.area);

  // Offer price (buyback: market × buybackMultiplier × kFloor)
  const totalPrice = Math.round(marketPrice * buybackCoefficient * kFloor);
  const pricePerSqm = Math.round(totalPrice / input.area);

  // Negotiation limit (-20% from market, the max we agree to pay)
  const negotiationLimit = Math.round(marketPrice * NEGOTIATION_LIMIT_COEFFICIENT);

  // Build dynamic breakdown from the buyback coefficient
  const remainder = 1 - buybackCoefficient;
  const dynamicBreakdown: BuybackBreakdown = {
    targetMargin: remainder * 0.5,
    negotiationReserve: remainder * 0.333,
    operationalCosts: remainder * 0.167,
    buybackCoefficient,
  };

  return {
    needsManualReview: false,
    totalPrice,
    pricePerSqm,
    marketPrice,
    marketPricePerSqm,
    negotiationLimit,
    buybackBreakdown: dynamicBreakdown,
    params,
  };
}

// ── Vtorichka Evaluation (Path B: non-ЖК apartments) ──

/** Evaluate price for non-ЖК apartments using zone coefficient.
 *  Buyback uses isVtorichka: true logic.
 */
export function evaluateVtorichka(
  input: VtorichkaEvaluationInput,
  baseRate: number = DEFAULT_BASE_RATE,
): AutoEvaluationResult {
  const kComplex = input.zoneCoefficient;
  const kYear = getYearCoefficient(input.yearBuilt);
  const kMaterial = getMaterialCoefficient(input.wallMaterial);
  const kFloor = getFloorCoefficient(input.floorPosition);
  const adjustedBase = getAdjustedBase(baseRate, input.condition);
  const buybackCoefficient = getBuybackMultiplier({
    housingClass: "",
    wallMaterial: input.wallMaterial,
    isVtorichka: true,
    isGoldenSquare: input.isGoldenSquare,
  });

  const params: CalculationParams = {
    baseRate: adjustedBase,
    kComplex,
    kYear,
    kMaterial,
    kZone: input.zoneCoefficient,
    kFloor: kFloor !== 1.0 ? kFloor : undefined,
  };

  const marketPrice = Math.round(
    input.area * adjustedBase * kComplex * kYear * kMaterial,
  );
  const marketPricePerSqm = Math.round(marketPrice / input.area);

  const totalPrice = Math.round(marketPrice * buybackCoefficient * kFloor);
  const pricePerSqm = Math.round(totalPrice / input.area);

  const negotiationLimit = Math.round(marketPrice * NEGOTIATION_LIMIT_COEFFICIENT);

  const remainder = 1 - buybackCoefficient;
  const dynamicBreakdown: BuybackBreakdown = {
    targetMargin: remainder * 0.5,
    negotiationReserve: remainder * 0.333,
    operationalCosts: remainder * 0.167,
    buybackCoefficient,
  };

  return {
    needsManualReview: false,
    totalPrice,
    pricePerSqm,
    marketPrice,
    marketPricePerSqm,
    negotiationLimit,
    buybackBreakdown: dynamicBreakdown,
    params,
  };
}
