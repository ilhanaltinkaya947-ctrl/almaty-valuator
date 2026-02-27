import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluationInputSchema } from "@/lib/validation";
import { evaluatePrice, evaluateZone } from "@/lib/smart-value";
import { getSystemSettings } from "@/lib/settings";

const zoneEvaluationSchema = z.object({
  zoneId: z.string().min(1),
  zoneName: z.string().min(1),
  zoneCoefficient: z.number().min(0.1).max(5.0),
  buildingSeries: z.enum(["stalinka", "khrushchevka", "brezhnevka", "uluchshenka", "individual", "novostroyka"]),
  seriesModifier: z.number().min(0.5).max(2.0),
  area: z.number().min(10).max(500),
  floor: z.number().int().min(1),
  totalFloors: z.number().int().min(1),
  view: z.enum(["mountain", "park", "city", "industrial"]),
  condition: z.enum(["designer", "euro", "good", "average", "rough"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const settings = await getSystemSettings();

    // Zone-based evaluation (Path B)
    if (body.zoneId) {
      const parsed = zoneEvaluationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Некорректные данные", details: parsed.error.flatten() },
          { status: 400 },
        );
      }
      const result = evaluateZone(parsed.data, settings.baseRate, settings.buybackDiscount);
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

    const result = evaluatePrice(parsed.data, settings.baseRate, settings.buybackDiscount);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
