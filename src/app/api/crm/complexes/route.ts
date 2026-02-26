import { NextRequest, NextResponse } from "next/server";
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

/** PATCH /api/crm/complexes — Update complex coefficient (admin-only) */
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
    const { complex_id, coefficient } = body;

    if (!complex_id || typeof coefficient !== "number") {
      return NextResponse.json({ error: "complex_id and coefficient required" }, { status: 400 });
    }

    if (coefficient < 0.5 || coefficient > 3.0) {
      return NextResponse.json({ error: "Coefficient must be between 0.50 and 3.00" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("complexes")
      .update({ coefficient })
      .eq("id", complex_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, complex_id, coefficient, updated_by: agent.name });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
