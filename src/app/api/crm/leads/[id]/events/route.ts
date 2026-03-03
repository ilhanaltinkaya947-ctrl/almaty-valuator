import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/auth-telegram";

/** GET /api/crm/leads/[id]/events — Fetch audit trail for a lead */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: events, error } = await supabase
    .from("lead_events")
    .select("id, lead_id, user_id, action, description, created_at, profiles(full_name)")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the joined profile name
  const formatted = (events ?? []).map((e) => {
    const raw = e as Record<string, unknown>;
    const profile = raw.profiles as { full_name: string } | null;
    return {
      id: e.id,
      lead_id: e.lead_id,
      user_id: e.user_id,
      action: e.action,
      description: e.description,
      created_at: e.created_at,
      user_name: profile?.full_name ?? null,
    };
  });

  return NextResponse.json({ events: formatted });
}
