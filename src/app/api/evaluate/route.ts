import { NextResponse } from "next/server";
import { evaluationInputSchema } from "@/lib/validation";
import { evaluatePrice } from "@/lib/smart-value";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = evaluationInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = evaluatePrice(parsed.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
