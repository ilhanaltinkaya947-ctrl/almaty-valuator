import { describe, it, expect } from "vitest";
import {
  getYearCoefficient,
  getMaterialCoefficient,
  getAdjustedBase,
  getFloorCoefficient,
  getBuybackMultiplier,
  evaluatePrice,
  evaluateAuto,
  evaluateVtorichka,
} from "@/lib/smart-value";
import type { EvaluationInput, VtorichkaEvaluationInput, AutoEvaluationResult } from "@/types/evaluation";

// ── getYearCoefficient ──

describe("getYearCoefficient", () => {
  it("returns 1.0 for year > 2020", () => {
    expect(getYearCoefficient(2021)).toBe(1.0);
    expect(getYearCoefficient(2025)).toBe(1.0);
  });

  it("returns 0.9 for 2011-2020", () => {
    expect(getYearCoefficient(2011)).toBe(0.9);
    expect(getYearCoefficient(2015)).toBe(0.9);
    expect(getYearCoefficient(2020)).toBe(0.9);
  });

  it("returns 0.8 for 2000-2010", () => {
    expect(getYearCoefficient(2000)).toBe(0.8);
    expect(getYearCoefficient(2005)).toBe(0.8);
    expect(getYearCoefficient(2010)).toBe(0.8);
  });

  it("returns 0.7 for year < 2000", () => {
    expect(getYearCoefficient(1999)).toBe(0.7);
    expect(getYearCoefficient(1985)).toBe(0.7);
    expect(getYearCoefficient(1950)).toBe(0.7);
  });

  // Boundary tests
  it("boundary: 2020 → 0.9, 2021 → 1.0", () => {
    expect(getYearCoefficient(2020)).toBe(0.9);
    expect(getYearCoefficient(2021)).toBe(1.0);
  });

  it("boundary: 2010 → 0.8, 2011 → 0.9", () => {
    expect(getYearCoefficient(2010)).toBe(0.8);
    expect(getYearCoefficient(2011)).toBe(0.9);
  });

  it("boundary: 1999 → 0.7, 2000 → 0.8", () => {
    expect(getYearCoefficient(1999)).toBe(0.7);
    expect(getYearCoefficient(2000)).toBe(0.8);
  });
});

// ── getMaterialCoefficient ──

describe("getMaterialCoefficient", () => {
  it("returns 1.0 for panel", () => {
    expect(getMaterialCoefficient("panel")).toBe(1.0);
  });

  it("returns 1.10 for brick", () => {
    expect(getMaterialCoefficient("brick")).toBe(1.10);
  });

  it("returns 1.05 for monolith", () => {
    expect(getMaterialCoefficient("monolith")).toBe(1.05);
  });
});

// ── getAdjustedBase ──

describe("getAdjustedBase", () => {
  it("returns baseRate unchanged for renovated", () => {
    expect(getAdjustedBase(805_000, "renovated")).toBe(805_000);
  });

  it("subtracts 175,000 for rough finish", () => {
    expect(getAdjustedBase(805_000, "rough")).toBe(630_000);
  });

  it("works with custom base rates", () => {
    expect(getAdjustedBase(900_000, "rough")).toBe(725_000);
    expect(getAdjustedBase(900_000, "renovated")).toBe(900_000);
  });
});

// ── getFloorCoefficient ──

describe("getFloorCoefficient", () => {
  it("returns 1.0 for middle floor", () => {
    expect(getFloorCoefficient("middle")).toBe(1.0);
  });

  it("returns 0.95 for first floor", () => {
    expect(getFloorCoefficient("first")).toBe(0.95);
  });

  it("returns 0.95 for last floor", () => {
    expect(getFloorCoefficient("last")).toBe(0.95);
  });
});

// ── getBuybackMultiplier ──

describe("getBuybackMultiplier", () => {
  describe("ЖК path (isVtorichka: false)", () => {
    it("elite → 0.90", () => {
      expect(getBuybackMultiplier({ housingClass: "elite", wallMaterial: "panel", isVtorichka: false })).toBe(0.90);
    });

    it("business_plus → 0.90", () => {
      expect(getBuybackMultiplier({ housingClass: "business_plus", wallMaterial: "brick", isVtorichka: false })).toBe(0.90);
    });

    it("business → 0.90", () => {
      expect(getBuybackMultiplier({ housingClass: "business", wallMaterial: "monolith", isVtorichka: false })).toBe(0.90);
    });

    it("comfort_plus → 0.85", () => {
      expect(getBuybackMultiplier({ housingClass: "comfort_plus", wallMaterial: "panel", isVtorichka: false })).toBe(0.85);
    });

    it("comfort → 0.80", () => {
      expect(getBuybackMultiplier({ housingClass: "comfort", wallMaterial: "panel", isVtorichka: false })).toBe(0.80);
    });

    it("standard → 0.70", () => {
      expect(getBuybackMultiplier({ housingClass: "standard", wallMaterial: "panel", isVtorichka: false })).toBe(0.70);
    });

    it("unknown class defaults to 0.70", () => {
      expect(getBuybackMultiplier({ housingClass: "unknown", wallMaterial: "panel", isVtorichka: false })).toBe(0.70);
    });
  });

  describe("Вторичка path (isVtorichka: true)", () => {
    it("non-golden square → 0.70", () => {
      expect(getBuybackMultiplier({ housingClass: "", wallMaterial: "panel", isVtorichka: true })).toBe(0.70);
    });

    it("golden square → 0.80", () => {
      expect(getBuybackMultiplier({ housingClass: "", wallMaterial: "panel", isVtorichka: true, isGoldenSquare: true })).toBe(0.80);
    });

    it("ignores housingClass in Вторичка path", () => {
      expect(getBuybackMultiplier({ housingClass: "elite", wallMaterial: "brick", isVtorichka: true })).toBe(0.70);
    });
  });
});

// ── evaluatePrice ──

describe("evaluatePrice", () => {
  it("returns auto result for apartments (default propertyType)", () => {
    const input: EvaluationInput = {
      complexName: "Test",
      area: 80,
      yearBuilt: 2022,
      wallMaterial: "panel",
      condition: "renovated",
      complexCoefficient: 1.0,
      housingClass: "standard",
      floorPosition: "middle",
    };
    const result = evaluatePrice(input);
    expect(result.needsManualReview).toBe(false);
  });

  it("returns manual review for house", () => {
    const input: EvaluationInput = {
      complexName: "Test",
      area: 80,
      yearBuilt: 2022,
      wallMaterial: "panel",
      condition: "renovated",
      complexCoefficient: 1.0,
      housingClass: "standard",
      floorPosition: "middle",
      propertyType: "house",
    };
    const result = evaluatePrice(input);
    expect(result.needsManualReview).toBe(true);
    if (result.needsManualReview) {
      expect(result.propertyType).toBe("house");
    }
  });

  it("returns manual review for commercial", () => {
    const result = evaluatePrice({
      complexName: "Test",
      area: 100,
      yearBuilt: 2020,
      wallMaterial: "brick",
      condition: "renovated",
      complexCoefficient: 1.0,
      housingClass: "standard",
      floorPosition: "middle",
      propertyType: "commercial",
    });
    expect(result.needsManualReview).toBe(true);
  });

  it("returns manual review for land", () => {
    const result = evaluatePrice({
      complexName: "Test",
      area: 500,
      yearBuilt: 2020,
      wallMaterial: "panel",
      condition: "renovated",
      complexCoefficient: 1.0,
      housingClass: "standard",
      floorPosition: "middle",
      propertyType: "land",
    });
    expect(result.needsManualReview).toBe(true);
  });
});

// ── evaluateAuto ──

describe("evaluateAuto", () => {
  it("computes correct values for a standard case", () => {
    // 80m², 2022, panel, renovated, coeff 1.0, standard, middle floor
    // baseRate = 805_000 (default), adjustedBase = 805_000 (renovated)
    // kYear = 1.0 (2022 > 2020), kMaterial = 1.0 (panel), kFloor = 1.0 (middle)
    // marketPrice = 80 × 805_000 × 1.0 × 1.0 × 1.0 = 64_400_000
    // buyback = 0.70 (standard)
    // totalPrice = 64_400_000 × 0.70 × 1.0 = 45_080_000
    // negotiationLimit = 64_400_000 × 0.80 = 51_520_000
    const input: EvaluationInput = {
      complexName: "Test",
      area: 80,
      yearBuilt: 2022,
      wallMaterial: "panel",
      condition: "renovated",
      complexCoefficient: 1.0,
      housingClass: "standard",
      floorPosition: "middle",
    };
    const result = evaluateAuto(input);

    expect(result.marketPrice).toBe(64_400_000);
    expect(result.totalPrice).toBe(45_080_000);
    expect(result.negotiationLimit).toBe(51_520_000);
    expect(result.pricePerSqm).toBe(Math.round(45_080_000 / 80));
    expect(result.marketPricePerSqm).toBe(Math.round(64_400_000 / 80));
  });

  it("applies complex coefficient correctly", () => {
    const input: EvaluationInput = {
      complexName: "Elite Place",
      area: 100,
      yearBuilt: 2022,
      wallMaterial: "panel",
      condition: "renovated",
      complexCoefficient: 2.0,
      housingClass: "elite",
      floorPosition: "middle",
    };
    const result = evaluateAuto(input);

    // marketPrice = 100 × 805_000 × 2.0 × 1.0 × 1.0 = 161_000_000
    expect(result.marketPrice).toBe(161_000_000);
    // buyback = 0.90 (elite), totalPrice = 161M × 0.90 = 144_900_000
    expect(result.totalPrice).toBe(144_900_000);
  });

  it("applies rough finish deduction", () => {
    const input: EvaluationInput = {
      complexName: "Test",
      area: 50,
      yearBuilt: 2022,
      wallMaterial: "panel",
      condition: "rough",
      complexCoefficient: 1.0,
      housingClass: "standard",
      floorPosition: "middle",
    };
    const result = evaluateAuto(input);

    // adjustedBase = 805_000 - 175_000 = 630_000
    // marketPrice = 50 × 630_000 × 1.0 × 1.0 × 1.0 = 31_500_000
    expect(result.marketPrice).toBe(31_500_000);
    expect(result.params.baseRate).toBe(630_000);
  });

  it("applies floor coefficient for first floor", () => {
    const input: EvaluationInput = {
      complexName: "Test",
      area: 100,
      yearBuilt: 2022,
      wallMaterial: "panel",
      condition: "renovated",
      complexCoefficient: 1.0,
      housingClass: "standard",
      floorPosition: "first",
    };
    const result = evaluateAuto(input);

    // marketPrice = 100 × 805_000 × 1.0 × 1.0 × 1.0 = 80_500_000
    // kFloor does NOT affect market price, only totalPrice
    expect(result.marketPrice).toBe(80_500_000);
    // totalPrice = 80_500_000 × 0.70 × 0.95 = 53_532_500
    expect(result.totalPrice).toBe(53_532_500);
    expect(result.params.kFloor).toBe(0.95);
  });

  it("omits kFloor from params when middle floor", () => {
    const input: EvaluationInput = {
      complexName: "Test",
      area: 80,
      yearBuilt: 2022,
      wallMaterial: "panel",
      condition: "renovated",
      complexCoefficient: 1.0,
      housingClass: "standard",
      floorPosition: "middle",
    };
    const result = evaluateAuto(input);
    expect(result.params.kFloor).toBeUndefined();
  });

  it("applies year + material coefficients together", () => {
    const input: EvaluationInput = {
      complexName: "Test",
      area: 60,
      yearBuilt: 2005,
      wallMaterial: "brick",
      condition: "renovated",
      complexCoefficient: 1.0,
      housingClass: "comfort",
      floorPosition: "middle",
    };
    const result = evaluateAuto(input);

    // kYear = 0.8 (2000-2010), kMaterial = 1.10 (brick)
    // marketPrice = 60 × 805_000 × 1.0 × 0.8 × 1.10 = 42_504_000
    expect(result.marketPrice).toBe(42_504_000);
    // buyback = 0.80 (comfort)
    // totalPrice = 42_504_000 × 0.80 = 34_003_200
    expect(result.totalPrice).toBe(34_003_200);
  });

  it("uses custom base rate when provided", () => {
    const input: EvaluationInput = {
      complexName: "Test",
      area: 100,
      yearBuilt: 2022,
      wallMaterial: "panel",
      condition: "renovated",
      complexCoefficient: 1.0,
      housingClass: "standard",
      floorPosition: "middle",
    };
    const result = evaluateAuto(input, 900_000);

    // marketPrice = 100 × 900_000 × 1.0 × 1.0 × 1.0 = 90_000_000
    expect(result.marketPrice).toBe(90_000_000);
  });
});

// ── evaluateVtorichka ──

describe("evaluateVtorichka", () => {
  const baseInput: VtorichkaEvaluationInput = {
    zoneId: "zone-1",
    zoneName: "Достык корридор",
    zoneSlug: "dostyk-koridor",
    zoneCoefficient: 1.1,
    area: 75,
    yearBuilt: 2010,
    wallMaterial: "panel",
    condition: "renovated",
    floorPosition: "middle",
  };

  it("computes correct values for a standard vtorichka case", () => {
    const result = evaluateVtorichka(baseInput);

    // adjustedBase = 805_000 (renovated)
    // kYear = 0.8 (2010 is in 2000-2010 range)
    // kMaterial = 1.0 (panel)
    // marketPrice = 75 × 805_000 × 1.1 × 0.8 × 1.0 = 53_130_000
    expect(result.marketPrice).toBe(53_130_000);

    // buyback = 0.70 (vtorichka, not golden square)
    // kFloor = 1.0 (middle)
    // totalPrice = 53_130_000 × 0.70 = 37_191_000
    expect(result.totalPrice).toBe(37_191_000);

    // negotiationLimit = 53_130_000 × 0.80 = 42_504_000
    expect(result.negotiationLimit).toBe(42_504_000);
  });

  it("applies golden square premium", () => {
    const result = evaluateVtorichka({ ...baseInput, isGoldenSquare: true });

    // Same market price: 53_130_000
    expect(result.marketPrice).toBe(53_130_000);

    // buyback = 0.80 (golden square)
    // totalPrice = 53_130_000 × 0.80 = 42_504_000
    expect(result.totalPrice).toBe(42_504_000);
  });

  it("uses zone coefficient as kComplex", () => {
    const result = evaluateVtorichka(baseInput);
    expect(result.params.kComplex).toBe(1.1);
    expect(result.params.kZone).toBe(1.1);
  });

  it("applies first floor penalty in vtorichka", () => {
    const result = evaluateVtorichka({ ...baseInput, floorPosition: "first" });

    // totalPrice = marketPrice × 0.70 × 0.95
    const expectedMarket = 53_130_000;
    expect(result.marketPrice).toBe(expectedMarket);
    expect(result.totalPrice).toBe(Math.round(expectedMarket * 0.70 * 0.95));
  });
});

// ── Invariants ──

describe("Invariants", () => {
  const inputs: EvaluationInput[] = [
    { complexName: "A", area: 30, yearBuilt: 2022, wallMaterial: "panel", condition: "renovated", complexCoefficient: 0.85, housingClass: "standard", floorPosition: "middle" },
    { complexName: "B", area: 200, yearBuilt: 1985, wallMaterial: "brick", condition: "rough", complexCoefficient: 2.2, housingClass: "elite", floorPosition: "first" },
    { complexName: "C", area: 100, yearBuilt: 2015, wallMaterial: "monolith", condition: "renovated", complexCoefficient: 1.5, housingClass: "comfort_plus", floorPosition: "last" },
    { complexName: "D", area: 65, yearBuilt: 2000, wallMaterial: "panel", condition: "rough", complexCoefficient: 1.0, housingClass: "comfort", floorPosition: "middle" },
  ];

  it("totalPrice is always ≤ marketPrice", () => {
    for (const input of inputs) {
      const result = evaluateAuto(input);
      expect(result.totalPrice).toBeLessThanOrEqual(result.marketPrice);
    }
  });

  it("negotiationLimit equals market × 0.80", () => {
    for (const input of inputs) {
      const result = evaluateAuto(input);
      expect(result.negotiationLimit).toBe(Math.round(result.marketPrice * 0.80));
    }
  });

  it("all prices are integers", () => {
    for (const input of inputs) {
      const result = evaluateAuto(input);
      expect(Number.isInteger(result.totalPrice)).toBe(true);
      expect(Number.isInteger(result.marketPrice)).toBe(true);
      expect(Number.isInteger(result.pricePerSqm)).toBe(true);
      expect(Number.isInteger(result.marketPricePerSqm)).toBe(true);
      expect(Number.isInteger(result.negotiationLimit)).toBe(true);
    }
  });

  it("pricePerSqm equals totalPrice / area (rounded)", () => {
    for (const input of inputs) {
      const result = evaluateAuto(input);
      expect(result.pricePerSqm).toBe(Math.round(result.totalPrice / input.area));
    }
  });

  it("buybackBreakdown components sum to 1 - buybackCoefficient", () => {
    for (const input of inputs) {
      const result = evaluateAuto(input);
      const bb = result.buybackBreakdown;
      const remainder = 1 - bb.buybackCoefficient;
      const sum = bb.targetMargin + bb.negotiationReserve + bb.operationalCosts;
      expect(sum).toBeCloseTo(remainder, 10);
    }
  });
});
