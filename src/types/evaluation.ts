export type WallMaterial = "panel" | "brick" | "monolith";

export type ConditionType = "renovated" | "rough";

export type LeadIntent = "ready" | "negotiate";

export type PropertyType = "apartment" | "house" | "commercial" | "land";

export type FloorPosition = "first" | "middle" | "last";

/** Types that support auto calculation */
export const AUTO_CALC_TYPES: PropertyType[] = ["apartment"];

/** Types that require manual expert review */
export const MANUAL_REVIEW_TYPES: PropertyType[] = ["house", "commercial", "land"];

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
  floorPosition: FloorPosition;
}

export interface VtorichkaEvaluationInput {
  zoneId: string;
  zoneName: string;
  zoneSlug: string;
  zoneCoefficient: number;
  area: number;
  yearBuilt: number;
  wallMaterial: WallMaterial;
  condition: ConditionType;
  floorPosition: FloorPosition;
  isGoldenSquare?: boolean;
}

export interface CalculationParams {
  baseRate: number;
  kComplex: number;
  kYear: number;
  kMaterial: number;
  kZone?: number;
  kFloor?: number;
}

/** Buyback discount structure (internal) */
export interface BuybackBreakdown {
  targetMargin: number;       // 0.15  (15%)
  negotiationReserve: number; // 0.10  (10%)
  operationalCosts: number;   // 0.05  (5%)
  buybackCoefficient: number; // 0.70  (total -30%)
}

/** Result for auto-calculable properties (apartments) */
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
