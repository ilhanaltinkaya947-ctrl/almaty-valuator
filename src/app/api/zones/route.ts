import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRICE_ZONES, BUILDING_SERIES } from "@/data/zones";

/**
 * GET /api/zones
 * Public endpoint — returns active price zones + building series.
 * Falls back to static data if DB is unavailable.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const [zonesResult, seriesResult] = await Promise.all([
      supabase
        .from("price_zones")
        .select("id, name, slug, district, description, avg_price_sqm, coefficient, sort_order")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("building_series_modifiers")
        .select("*")
        .order("sort_order"),
    ]);

    const zones = zonesResult.data ?? PRICE_ZONES;
    const series = seriesResult.data ?? BUILDING_SERIES;

    return NextResponse.json({ zones, series });
  } catch {
    // Fallback to static data
    return NextResponse.json({
      zones: PRICE_ZONES,
      series: BUILDING_SERIES,
    });
  }
}
