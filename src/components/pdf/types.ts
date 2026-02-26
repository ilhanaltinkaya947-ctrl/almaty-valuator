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

  // Coefficients
  baseRate: number;
  kComplex: number;
  kFloor: number;
  kYear: number;
  kView: number;
  kCondition: number;

  // Analytics
  liquidityIndex: number;
  benchmarks: BenchmarkComplex[];

  // Meta
  generatedAt: string;
}
