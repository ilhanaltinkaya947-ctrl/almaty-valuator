import { z } from "zod";

export const evaluationInputSchema = z.object({
  complexName: z.string().min(1),
  area: z.number().min(20).max(300),
  yearBuilt: z.number().int().min(1950).max(2026),
  wallMaterial: z.enum(["panel", "brick", "monolith"]),
  condition: z.enum(["renovated", "rough"]),
  complexCoefficient: z.number().min(0.5).max(3.0),
  housingClass: z.string().min(1),
  propertyType: z.enum(["apartment", "house", "commercial", "land"]).optional(),
  floorPosition: z.enum(["first", "middle", "last"]).default("middle"),
});

export const phoneSchema = z
  .string()
  .regex(/^\+7\d{10}$/, "Введите номер в формате +7XXXXXXXXXX");
