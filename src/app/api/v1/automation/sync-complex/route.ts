import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateApiKey } from "@/lib/auth-api-key";

const syncComplexSchema = z.object({
  name: z.string().min(1),
  district: z.string().min(1),
  developer: z.string().optional(),
  class: z.enum(["elite", "business_plus", "business", "comfort_plus", "comfort", "standard"]).default("comfort"),
  coefficient: z.number().min(0.5).max(3.0),
  year_built: z.number().int().optional(),
  total_floors: z.number().int().optional(),
  map_lat: z.number().optional(),
  map_lng: z.number().optional(),
  liquidity_index: z.number().min(0).max(1).optional(),
  avg_price_sqm: z.number().int().optional(),
  krisha_url: z.string().url().optional(),
  wall_material: z.enum(["panel", "brick", "monolith"]).optional(),
  krisha_complex_id: z.number().int().optional(),
});

/**
 * POST /api/v1/automation/sync-complex
 * Called by n8n Scenario #1 (Data Crawler).
 * Upserts a ЖК record — creates if new, updates if exists.
 */
export async function POST(req: NextRequest) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const data = syncComplexSchema.parse(body);

    const supabase = createAdminClient();

    const { data: complex, error } = await supabase
      .from("complexes")
      .upsert(
        {
          name: data.name,
          district: data.district,
          developer: data.developer ?? null,
          class: data.class,
          coefficient: data.coefficient,
          year_built: data.year_built ?? null,
          total_floors: data.total_floors ?? null,
          map_lat: data.map_lat ?? null,
          map_lng: data.map_lng ?? null,
          liquidity_index: data.liquidity_index ?? null,
          avg_price_sqm: data.avg_price_sqm ?? null,
          krisha_url: data.krisha_url ?? null,
          wall_material: data.wall_material ?? null,
          krisha_complex_id: data.krisha_complex_id ?? null,
        },
        { onConflict: "name" },
      )
      .select()
      .single();

    if (error) {
      console.error("sync-complex error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const record = complex as Record<string, unknown>;
    return NextResponse.json({
      complex,
      action: record.created_at === record.updated_at ? "created" : "updated",
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
