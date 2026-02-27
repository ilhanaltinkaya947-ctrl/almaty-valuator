import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateApiKey } from "@/lib/auth-api-key";

const syncZonePriceSchema = z.object({
  slug: z.string().min(1),
  avg_price_sqm: z.number().int().positive(),
  median_price_sqm: z.number().int().positive().optional(),
  listing_count: z.number().int().nonnegative().optional(),
});

/**
 * POST /api/v1/automation/sync-zone-price
 * Called by n8n to update a zone's avg price from krisha.kz scraping.
 * Updates the price_zones row and inserts a zone_price_snapshots record.
 */
export async function POST(req: NextRequest) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const data = syncZonePriceSchema.parse(body);

    const supabase = createAdminClient();

    // Find zone by slug
    const { data: zone, error: findError } = await supabase
      .from("price_zones")
      .select("id, name, avg_price_sqm, coefficient")
      .eq("slug", data.slug)
      .single();

    if (findError || !zone) {
      return NextResponse.json(
        { error: `Zone with slug "${data.slug}" not found` },
        { status: 404 },
      );
    }

    const zoneRecord = zone as { id: string; name: string; avg_price_sqm: number; coefficient: number };
    const oldPrice = zoneRecord.avg_price_sqm;

    // Update zone avg price (trigger auto-recomputes coefficient)
    const { error: updateError } = await supabase
      .from("price_zones")
      .update({ avg_price_sqm: data.avg_price_sqm })
      .eq("id", zoneRecord.id);

    if (updateError) {
      console.error("sync-zone-price update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Insert snapshot
    await supabase.from("zone_price_snapshots").insert({
      zone_id: zoneRecord.id,
      avg_price_sqm: data.avg_price_sqm,
      median_price_sqm: data.median_price_sqm ?? null,
      listing_count: data.listing_count ?? null,
    });

    // Fetch updated zone to return new coefficient
    const { data: updated } = await supabase
      .from("price_zones")
      .select("avg_price_sqm, coefficient")
      .eq("id", zoneRecord.id)
      .single();

    const updatedRecord = updated as { avg_price_sqm: number; coefficient: number } | null;

    return NextResponse.json({
      zone: zoneRecord.name,
      slug: data.slug,
      old_avg_price_sqm: oldPrice,
      new_avg_price_sqm: data.avg_price_sqm,
      new_coefficient: updatedRecord?.coefficient ?? null,
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
