import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateApiKey } from "@/lib/auth-api-key";
import { notifyAdmin } from "@/lib/telegram";

const CLASS_COEFFICIENT_DEFAULTS: Record<string, number> = {
  elite: 2.0,
  business_plus: 1.7,
  business: 1.5,
  comfort_plus: 1.3,
  comfort: 1.15,
  standard: 1.0,
};

const enrichComplexSchema = z.object({
  name: z.string().min(1),
  district: z.string().min(1),
  developer: z.string().optional(),
  class: z.enum(["elite", "business_plus", "business", "comfort_plus", "comfort", "standard"]).default("comfort"),
  coefficient: z.number().min(0.5).max(3.0).optional(),
  year_built: z.number().int().optional(),
  total_floors: z.number().int().optional(),
  avg_price_sqm: z.number().int().optional(),
  liquidity_index: z.number().min(0).max(1).optional(),
  krisha_url: z.string().url().optional(),
});

/**
 * POST /api/v1/enrich-complex
 * Called by n8n automation to upsert complex data from developer sites
 * (bi.group, bazis.kz, ramsqz.com, etc.)
 * Auto-calculates coefficient from housing class if not provided.
 * Sends Telegram notification when a new complex is discovered.
 */
export async function POST(req: NextRequest) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const data = enrichComplexSchema.parse(body);

    // Auto-calculate coefficient from class if not provided
    const coefficient = data.coefficient ?? CLASS_COEFFICIENT_DEFAULTS[data.class] ?? 1.0;

    const supabase = createAdminClient();

    // Check if complex already exists
    const { data: existing } = await supabase
      .from("complexes")
      .select("id, coefficient")
      .eq("name", data.name)
      .single();

    const isNew = !existing;

    const { data: complex, error } = await supabase
      .from("complexes")
      .upsert(
        {
          name: data.name,
          district: data.district,
          developer: data.developer ?? null,
          class: data.class,
          coefficient,
          year_built: data.year_built ?? null,
          total_floors: data.total_floors ?? null,
          avg_price_sqm: data.avg_price_sqm ?? null,
          liquidity_index: data.liquidity_index ?? null,
          krisha_url: data.krisha_url ?? null,
        },
        { onConflict: "name" },
      )
      .select()
      .single();

    if (error) {
      console.error("enrich-complex error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify admin about new complexes
    if (isNew) {
      await notifyAdmin([
        `🆕 <b>Обнаружен новый ЖК!</b>`,
        "",
        `🏢 <b>${data.name}</b>`,
        `🏗 Застройщик: ${data.developer ?? "—"}`,
        `📍 Район: ${data.district}`,
        `📊 Класс: ${data.class}`,
        `📈 Коэффициент: <b>${coefficient}</b>`,
        "",
        `Добавлен в базу выкупа автоматически.`,
      ].join("\n")).catch(() => {});
    }

    return NextResponse.json({
      complex,
      action: isNew ? "created" : "updated",
      coefficient,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
