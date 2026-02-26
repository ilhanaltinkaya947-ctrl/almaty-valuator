import { z } from "zod";

export const evaluationInputSchema = z.object({
  complexName: z.string().min(1),
  area: z.number().min(20).max(300),
  floor: z.number().int().min(1),
  totalFloors: z.number().int().min(1),
  yearBuilt: z.number().int().min(1950).max(2026),
  view: z.enum(["mountain", "park", "city", "industrial"]),
  condition: z.enum(["designer", "euro", "good", "average", "rough"]),
  complexCoefficient: z.number().min(0.5).max(3.0),
  propertyType: z.enum(["apartment", "townhouse", "house", "commercial", "land"]).optional(),
});

export const phoneSchema = z
  .string()
  .regex(/^\+7\d{10}$/, "Введите номер в формате +7XXXXXXXXXX");
