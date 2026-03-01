import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/auth-telegram";

/**
 * GET /api/crm/zones
 * Returns all price zones with latest snapshot data for admin management.
 */
export async function GET(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { data: zones, error } = await supabase
      .from("price_zones")
      .select("*")
      .order("sort_order");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ zones });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateZoneSchema = z.object({
  id: z.string().uuid(),
  avg_price_sqm: z.number().int().positive().optional(),
  coefficient: z.number().min(0.5).max(3.0).optional(),
  is_active: z.boolean().optional(),
  description: z.string().optional(),
  krisha_search_url: z.string().url().optional().nullable(),
});

/**
 * PATCH /api/crm/zones
 * Update a price zone (admin use).
 */
export async function PATCH(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (agent.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateZoneSchema.parse(body);

    const supabase = createAdminClient();

    const updatePayload: Record<string, unknown> = {};
    if (data.avg_price_sqm !== undefined) updatePayload.avg_price_sqm = data.avg_price_sqm;
    if (data.coefficient !== undefined) updatePayload.coefficient = data.coefficient;
    if (data.is_active !== undefined) updatePayload.is_active = data.is_active;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.krisha_search_url !== undefined) updatePayload.krisha_search_url = data.krisha_search_url;

    const { data: zone, error } = await supabase
      .from("price_zones")
      .update(updatePayload)
      .eq("id", data.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ zone });
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
