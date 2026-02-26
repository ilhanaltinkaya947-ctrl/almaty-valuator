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

/** Buyback discount structure (internal) */
export interface BuybackBreakdown {
  targetMargin: number;      // 0.15  (15%)
  negotiationReserve: number; // 0.10  (10%)
  operationalCosts: number;   // 0.05  (5%)
  buybackCoefficient: number; // 0.70  (total -30%)
}

export interface EvaluationResult {
  // Public — shown on landing
  totalPrice: number;      // offerPrice (buyback = market × 0.70)
  pricePerSqm: number;     // offerPrice / area

  // Internal — shown in admin/CRM/PDF
  marketPrice: number;      // full market value (100%)
  marketPricePerSqm: number;
  negotiationLimit: number; // market × 0.80 (max we pay after negotiation)
  buybackBreakdown: BuybackBreakdown;

  params: CalculationParams;
}
