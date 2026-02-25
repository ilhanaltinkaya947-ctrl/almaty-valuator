export type ViewType = "mountain" | "park" | "city" | "industrial";

export type ConditionType = "designer" | "euro" | "good" | "average" | "rough";

export interface EvaluationInput {
  complexName: string;
  area: number;
  floor: number;
  totalFloors: number;
  yearBuilt: number;
  view: ViewType;
  condition: ConditionType;
  complexCoefficient: number;
}

export interface CalculationParams {
  baseRate: number;
  kComplex: number;
  kFloor: number;
  kYear: number;
  kView: number;
  kCondition: number;
}

export interface EvaluationResult {
  totalPrice: number;
  pricePerSqm: number;
  params: CalculationParams;
}
