import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { z } from "zod";
import { ReportDocument } from "@/components/pdf/ReportDocument";
import { COMPLEXES, CLASS_LABELS } from "@/data/complexes";
import { evaluateAuto } from "@/lib/smart-value";
import { createRateLimiter, rateLimitResponse } from "@/lib/rate-limit";
import type { ReportData, BenchmarkComplex } from "@/components/pdf/types";
import type { ConditionType, WallMaterial } from "@/types/evaluation";

const limiter = createRateLimiter("pdf", { windowMs: 60_000, maxRequests: 5 });

const CONDITION_LABELS: Record<ConditionType, string> = {
  renovated: "С ремонтом",
  rough: "Черновая",
};

const FLOOR_POSITION_LABELS: Record<string, string> = {
  first: "Первый этаж",
  middle: "Средний этаж",
  last: "Последний этаж",
};

const INTENT_LABELS: Record<string, string> = {
  ready: "Согласен",
  negotiate: "Торг",
};

const pdfRequestSchema = z.object({
  complexName: z.string().min(1),
  area: z.number().min(20).max(300),
  yearBuilt: z.number().int().min(1950).max(2026),
  wallMaterial: z.enum(["panel", "brick", "monolith"]),
  condition: z.enum(["renovated", "rough"]),
  floorPosition: z.enum(["first", "middle", "last"]).optional(),
  intent: z.enum(["ready", "negotiate"]).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed, retryAfterMs } = limiter.check(ip);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  try {
    const body = await req.json();
    const input = pdfRequestSchema.parse(body);

    // Find complex
    const complex = COMPLEXES.find((c) => c.name === input.complexName);
    if (!complex) {
      return NextResponse.json({ error: "Complex not found" }, { status: 404 });
    }

    // Evaluate price
    const floorPosition = input.floorPosition ?? "middle";
    const result = evaluateAuto({
      complexName: complex.name,
      area: input.area,
      yearBuilt: input.yearBuilt,
      wallMaterial: input.wallMaterial as WallMaterial,
      condition: input.condition as ConditionType,
      complexCoefficient: complex.coefficient,
      housingClass: complex.class,
      floorPosition,
    });

    // Derive display floor number from position
    const floorNumber =
      floorPosition === "first" ? 1 :
      floorPosition === "last" ? complex.totalFloors :
      Math.round(complex.totalFloors / 2);

    // Find 3-4 benchmark complexes (same district or similar class)
    const benchmarks: BenchmarkComplex[] = COMPLEXES
      .filter((c) => c.name !== complex.name)
      .filter((c) => c.district === complex.district || c.class === complex.class)
      .sort((a, b) => Math.abs(a.coefficient - complex.coefficient) - Math.abs(b.coefficient - complex.coefficient))
      .slice(0, 4)
      .map((c) => ({
        name: c.name,
        classLabel: CLASS_LABELS[c.class],
        avgPriceSqm: c.avgPriceSqm,
      }));

    // Build report data
    const reportData: ReportData = {
      complexName: complex.name,
      district: complex.district,
      developer: complex.developer,
      classLabel: CLASS_LABELS[complex.class],
      yearBuilt: complex.yearBuilt,
      totalFloors: complex.totalFloors,
      area: input.area,
      floor: floorNumber,
      viewLabel: "—",
      conditionLabel: CONDITION_LABELS[input.condition as ConditionType],
      floorPositionLabel: FLOOR_POSITION_LABELS[floorPosition],
      intentLabel: INTENT_LABELS[input.intent ?? "ready"],
      totalPrice: result.totalPrice,
      pricePerSqm: result.pricePerSqm,
      marketPrice: result.marketPrice,
      marketPricePerSqm: result.marketPricePerSqm,
      baseRate: result.params.baseRate,
      kComplex: result.params.kComplex,
      kYear: result.params.kYear,
      kMaterial: result.params.kMaterial,
      kFloor: result.params.kFloor,
      liquidityIndex: complex.liquidityIndex,
      benchmarks,
      generatedAt: new Date().toLocaleDateString("ru-RU", {
        timeZone: "Asia/Almaty",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };

    // Generate PDF buffer
    const buffer = await renderToBuffer(
      ReportDocument({ data: reportData }),
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="almavykup-${complex.name.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 },
      );
    }
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
