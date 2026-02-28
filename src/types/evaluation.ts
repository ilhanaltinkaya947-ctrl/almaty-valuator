export type WallMaterial = "panel" | "brick" | "monolith";

export type ConditionType = "renovated" | "rough";

export type LeadIntent = "ready" | "negotiate";

export type PropertyType = "apartment" | "townhouse" | "house" | "commercial" | "land" | "other";

/** Types that support auto calculation */
export const AUTO_CALC_TYPES: PropertyType[] = ["apartment", "townhouse"];

/** Types that require manual expert review */
export const MANUAL_REVIEW_TYPES: PropertyType[] = ["house", "commercial", "land", "other"];

export function isAutoCalcType(type: PropertyType): boolean {
  return AUTO_CALC_TYPES.includes(type);
}

export interface EvaluationInput {
  complexName: string;
  area: number;
  yearBuilt: number;
  wallMaterial: WallMaterial;
  condition: ConditionType;
  complexCoefficient: number;
  housingClass: string;
  propertyType?: PropertyType;
}

export interface CalculationParams {
  baseRate: number;
  kComplex: number;
  kYear: number;
  kMaterial: number;
  kZone?: number;
  kSeries?: number;
}

/** Buyback discount structure (internal) */
export interface BuybackBreakdown {
  targetMargin: number;       // 0.15  (15%)
  negotiationReserve: number; // 0.10  (10%)
  operationalCosts: number;   // 0.05  (5%)
  buybackCoefficient: number; // 0.70  (total -30%)
}

/** Result for auto-calculable properties (apartments, townhouses) */
export interface AutoEvaluationResult {
  needsManualReview: false;

  // Public — shown on landing
  totalPrice: number;      // offerPrice (buyback = market × multiplier)
  pricePerSqm: number;     // offerPrice / area

  // Internal — shown in admin/CRM/PDF
  marketPrice: number;      // full market value (100%)
  marketPricePerSqm: number;
  negotiationLimit: number; // market × 0.80 (max we pay after negotiation)
  buybackBreakdown: BuybackBreakdown;

  params: CalculationParams;
}

/** Result for properties requiring expert review (houses, commercial, land) */
export interface ManualReviewResult {
  needsManualReview: true;
  propertyType: PropertyType;
  message: string;
}

export type EvaluationResult = AutoEvaluationResult | ManualReviewResult;

// ── Zone-based evaluation (Path B) ──

export type BuildingSeries =
  | "stalinka"
  | "khrushchevka"
  | "brezhnevka"
  | "uluchshenka"
  | "individual"
  | "novostroyka";

export interface ZoneEvaluationInput {
  zoneId: string;
  zoneName: string;
  zoneCoefficient: number;
  buildingSeries: BuildingSeries;
  seriesModifier: number;
  area: number;
  yearBuilt: number;
  wallMaterial: WallMaterial;
  condition: ConditionType;
}
