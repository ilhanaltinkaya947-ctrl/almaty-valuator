import type {
  EvaluationInput,
  EvaluationResult,
  CalculationParams,
  ViewType,
  ConditionType,
} from "@/types/evaluation";

const DEFAULT_BASE_RATE = 738_300;

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

export function evaluatePrice(
  input: EvaluationInput,
  baseRate: number = DEFAULT_BASE_RATE,
): EvaluationResult {
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

  const totalPrice = Math.round(
    input.area * baseRate * kComplex * kFloor * kYear * kView * kCondition,
  );
  const pricePerSqm = Math.round(totalPrice / input.area);

  return { totalPrice, pricePerSqm, params };
}
