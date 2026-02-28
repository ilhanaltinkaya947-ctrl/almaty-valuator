import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRICE_ZONES } from "@/data/zones";

/**
 * GET /api/zones
 * Public endpoint — returns active price zones.
 * Falls back to static data if DB is unavailable.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: zones } = await supabase
      .from("price_zones")
      .select("id, name, slug, district, description, avg_price_sqm, coefficient, sort_order")
      .eq("is_active", true)
      .order("sort_order");

    return NextResponse.json({ zones: zones ?? PRICE_ZONES });
  } catch {
    // Fallback to static data
    return NextResponse.json({ zones: PRICE_ZONES });
  }
}
