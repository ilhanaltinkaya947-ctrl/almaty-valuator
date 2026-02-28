export interface BenchmarkComplex {
  name: string;
  classLabel: string;
  avgPriceSqm: number;
}

export interface ReportData {
  // Property
  complexName: string;
  district: string;
  developer: string;
  classLabel: string;
  yearBuilt: number;
  totalFloors: number;
  area: number;
  floor: number;
  viewLabel: string;
  conditionLabel: string;

  // Price — buyback model
  totalPrice: number;        // offer price (buyback, -30%)
  pricePerSqm: number;      // offer per sqm
  marketPrice: number;       // full market value
  marketPricePerSqm: number;

  // Labels
  floorPositionLabel: string;
  intentLabel: string;

  // Coefficients
  baseRate: number;
  kComplex: number;
  kYear: number;
  kMaterial: number;
  kFloor?: number;

  // Analytics
  liquidityIndex: number;
  benchmarks: BenchmarkComplex[];

  // Meta
  generatedAt: string;
}
