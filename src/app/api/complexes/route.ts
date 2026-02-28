import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMPLEXES } from "@/data/complexes";

/**
 * GET /api/complexes
 * Public endpoint — returns all complexes.
 * Falls back to static data if DB is unavailable.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: complexes } = await supabase
      .from("complexes")
      .select(
        "id, name, district, developer, class, coefficient, year_built, total_floors, avg_price_sqm, wall_material, zone_slug, liquidity_index",
      )
      .order("name");

    return NextResponse.json({ complexes: complexes ?? COMPLEXES });
  } catch {
    // Fallback to static data
    return NextResponse.json({ complexes: COMPLEXES });
  }
}
