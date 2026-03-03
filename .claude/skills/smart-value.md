# Smart Value Algorithm

## Purpose
Pure TypeScript function that calculates real estate market value for apartments in Almaty based on 5 dynamic coefficients.

## Formula
```
PRICE = area × baseRate × K_complex × K_floor × K_year × K_view × K_condition
```

## Implementation Rules
- MUST be a pure function — no side effects, no database calls, no global state
- All inputs come as function parameters
- Returns: `{ total: number, pricePerSqm: number, factors: Record<string, number> }`
- All prices are integers in tenge (no decimals)
- Base rate comes from Supabase config table, passed as parameter

## Coefficients Detail

### K_complex (1.0–2.2)
Stored per ЖК in `complexes` table. Represents how much more/less expensive a specific ЖК is vs the city average. Calibrated from krisha.kz data:
```
coefficient = жк_avg_price_sqm / city_base_rate
```

### K_floor
Parabolic curve reflecting Almaty market preferences:
```typescript
function getFloorCoefficient(floor: number, totalFloors: number): number {
  if (floor >= totalFloors) return 0.95;  // last floor: roof leaks, heat
  if (floor === 1) return 0.93;            // ground: noise, no view
  if (floor <= 3) return 0.97;             // low: still noisy
  if (floor <= 6) return 1.00;             // base: walkable without elevator
  if (floor <= 15) return 1.05;            // sweet spot
  if (floor <= 25) return 1.08;            // high: great views
  return 1.06;                             // very high: diminishing returns
}
```

### K_year
Linear degradation from new construction:
```typescript
function getYearCoefficient(yearBuilt: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;
  return Math.max(0.70, 1.0 - age * 0.015);
}
```
Floor at 0.70 (buildings older than 20 years don't degrade further in this model).

### K_view
```typescript
const VIEW_MAP = {
  mountain: 1.10,  // Алатау mountains — premium in Almaty
  park: 1.05,      // Central Park, Botanical Garden
  city: 1.00,      // Standard courtyard/city view
  industrial: 0.95  // Highway, industrial zone
} as const;
```

### K_condition
```typescript
const CONDITION_MAP = {
  designer: 1.15,   // Авторский дизайн-проект
  euro: 1.08,       // Евроремонт
  good: 1.03,       // Хороший косметический
  average: 1.00,    // Без ремонта / среднее
  rough: 0.85       // Черновая отделка
} as const;
```

## Type Definitions
```typescript
interface EvaluationInput {
  area: number;           // m², 15-500
  floor: number;          // 1 to totalFloors
  totalFloors: number;    // from complex data
  view: ViewType;
  condition: ConditionType;
  complexCoefficient: number;
  yearBuilt: number;
  baseRate: number;       // from config table
}

interface EvaluationResult {
  total: number;          // final price in tenge
  pricePerSqm: number;   // price per m²
  factors: {
    kComplex: number;
    kFloor: number;
    kYear: number;
    kView: number;
    kCondition: number;
  };
}
```

## Testing
Write unit tests for edge cases:
- 1st floor, last floor
- Very old building (1970) — should floor at 0.70
- New build (2025) — K_year should be ~1.0
- All view/condition combos
- Extreme areas (15m² studio, 500m² penthouse)
- Verify total = area × pricePerSqm (rounding tolerance ±1)

## Validation with Zod
```typescript
const EvaluationInputSchema = z.object({
  area: z.number().min(15).max(500),
  floor: z.number().min(1).max(100),
  totalFloors: z.number().min(1).max(100),
  view: z.enum(["mountain", "park", "city", "industrial"]),
  condition: z.enum(["designer", "euro", "good", "average", "rough"]),
  complexCoefficient: z.number().min(0.5).max(3.0),
  yearBuilt: z.number().min(1950).max(2030),
  baseRate: z.number().min(100000).max(5000000),
});
```
