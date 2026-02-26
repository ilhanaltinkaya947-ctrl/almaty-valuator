import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/auth-telegram";

/** GET /api/crm/settings — Returns all system_settings rows */
export async function GET(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .order("key");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data ?? [] });
}

/** PATCH /api/crm/settings — Update a single setting (admin-only) */
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
    const { key, value_numeric } = body;

    if (!key || typeof value_numeric !== "number") {
      return NextResponse.json({ error: "key and value_numeric required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("system_settings")
      .update({ value_numeric })
      .eq("key", key);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, key, value_numeric, updated_by: agent.name });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
