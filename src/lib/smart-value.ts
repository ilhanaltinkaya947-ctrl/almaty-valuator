import type {
  EvaluationInput,
  EvaluationResult,
  AutoEvaluationResult,
  CalculationParams,
  BuybackBreakdown,
  ViewType,
  ConditionType,
} from "@/types/evaluation";
import { isAutoCalcType } from "@/types/evaluation";

// ── Constants ──

const DEFAULT_BASE_RATE = 805_000;

const BUYBACK_BREAKDOWN: BuybackBreakdown = {
  targetMargin: 0.15,        // 15% agency profit
  negotiationReserve: 0.10,  // 10% room to negotiate up
  operationalCosts: 0.05,    // 5% operational costs
  buybackCoefficient: 0.70,  // total: 1 - (15+10+5)% = 70% of market
};

const NEGOTIATION_LIMIT_COEFFICIENT = 0.80; // max we pay (-20% from market)

const MANUAL_REVIEW_MESSAGES: Record<string, string> = {
  house: "Дома и коттеджи требуют индивидуального анализа. Наш эксперт свяжется с вами с готовым предложением.",
  commercial: "Коммерческая недвижимость требует индивидуальной экспертизы. Брокер подготовит предложение после осмотра.",
  land: "Земельные участки оцениваются индивидуально. Эксперт свяжется с вами для подготовки предложения.",
};

// ── Coefficient Functions ──

export function getFloorCoefficient(
  floor: number,
  totalFloors: number,
): number {
  if (floor === totalFloors) return 0.95;
  if (floor === 1) return 0.93;
  if (floor <= 3) return 0.97;
  if (floor <= 6) return 1.0;
  if (floor <= 15) return 1.05;
  return 1.08;
}

export function getYearCoefficient(yearBuilt: number): number {
  const age = 2026 - yearBuilt;
  return Math.max(0.7, 1.0 - age * 0.015);
}

const VIEW_COEFFICIENTS: Record<ViewType, number> = {
  mountain: 1.1,
  park: 1.05,
  city: 1.0,
  industrial: 0.95,
};

const CONDITION_COEFFICIENTS: Record<ConditionType, number> = {
  designer: 1.15,
  euro: 1.08,
  good: 1.03,
  average: 1.0,
  rough: 0.85,
};

export function getViewCoefficient(view: ViewType): number {
  return VIEW_COEFFICIENTS[view];
}

export function getConditionCoefficient(condition: ConditionType): number {
  return CONDITION_COEFFICIENTS[condition];
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

  // Branch A: auto calculation for apartments & townhouses
  return evaluateAuto(input, baseRate);
}

/** Auto calculation for apartments and townhouses */
export function evaluateAuto(
  input: EvaluationInput,
  baseRate: number = DEFAULT_BASE_RATE,
): AutoEvaluationResult {
  const kComplex = input.complexCoefficient;
  const kFloor = getFloorCoefficient(input.floor, input.totalFloors);
  const kYear = getYearCoefficient(input.yearBuilt);
  const kView = getViewCoefficient(input.view);
  const kCondition = getConditionCoefficient(input.condition);

  const params: CalculationParams = {
    baseRate,
    kComplex,
    kFloor,
    kYear,
    kView,
    kCondition,
  };

  // Market price (100%)
  const marketPrice = Math.round(
    input.area * baseRate * kComplex * kFloor * kYear * kView * kCondition,
  );
  const marketPricePerSqm = Math.round(marketPrice / input.area);

  // Offer price (buyback: -30% from market)
  const totalPrice = Math.round(marketPrice * BUYBACK_BREAKDOWN.buybackCoefficient);
  const pricePerSqm = Math.round(totalPrice / input.area);

  // Negotiation limit (-20% from market, the max we agree to pay)
  const negotiationLimit = Math.round(marketPrice * NEGOTIATION_LIMIT_COEFFICIENT);

  return {
    needsManualReview: false,
    totalPrice,
    pricePerSqm,
    marketPrice,
    marketPricePerSqm,
    negotiationLimit,
    buybackBreakdown: BUYBACK_BREAKDOWN,
    params,
  };
}
