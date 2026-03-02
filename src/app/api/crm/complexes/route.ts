import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/auth-telegram";

/** GET /api/crm/complexes — Returns all complexes */
export async function GET(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("complexes")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ complexes: data ?? [] });
}

const updateComplexSchema = z.object({
  complex_id: z.string(),
  coefficient: z.number().min(0.5).max(3.0).optional(),
  class: z.enum(["elite", "business_plus", "business", "comfort_plus", "comfort", "standard"]).optional(),
  is_golden_square: z.boolean().optional(),
});

/** PATCH /api/crm/complexes — Update complex fields (admin-only) */
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
    const data = updateComplexSchema.parse(body);

    const updatePayload: Record<string, unknown> = {};
    if (data.coefficient !== undefined) updatePayload.coefficient = data.coefficient;
    if (data.class !== undefined) updatePayload.class = data.class;
    if (data.is_golden_square !== undefined) updatePayload.is_golden_square = data.is_golden_square;

    if (!updatePayload.coefficient && !updatePayload.class && updatePayload.is_golden_square === undefined) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("complexes")
      .update(updatePayload)
      .eq("id", data.complex_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, complex_id: data.complex_id, updated_by: agent.name });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
