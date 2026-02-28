import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluationInputSchema } from "@/lib/validation";
import { evaluatePrice, evaluateVtorichka } from "@/lib/smart-value";
import { getSystemSettings } from "@/lib/settings";

const vtorichkaEvaluationSchema = z.object({
  zoneId: z.string().min(1),
  zoneName: z.string().min(1),
  zoneSlug: z.string().min(1),
  zoneCoefficient: z.number().min(0.1).max(5.0),
  area: z.number().min(10).max(500),
  yearBuilt: z.number().int().min(1950).max(2026),
  wallMaterial: z.enum(["panel", "brick", "monolith"]),
  condition: z.enum(["renovated", "rough"]),
  floorPosition: z.enum(["first", "middle", "last"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const settings = await getSystemSettings();

    // Zone-based evaluation (Path B — Vtorichka)
    if (body.zoneId) {
      const parsed = vtorichkaEvaluationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Некорректные данные", details: parsed.error.flatten() },
          { status: 400 },
        );
      }
      const result = evaluateVtorichka(parsed.data, settings.baseRate);
      return NextResponse.json(result);
    }

    // Complex-based evaluation (Path A)
    const parsed = evaluationInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = evaluatePrice(parsed.data, settings.baseRate);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
