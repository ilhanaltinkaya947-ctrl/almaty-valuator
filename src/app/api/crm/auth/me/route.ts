import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-telegram";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/crm/auth/me — Return current agent info + profile role */
export async function GET(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch profile role for role-based UI
  let profileRole: string = "manager";
  if (agent.id !== "system") {
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", agent.id)
      .single();
    if (profile) {
      profileRole = (profile as { role: string }).role;
    }
  } else {
    profileRole = "admin";
  }

  return NextResponse.json({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    profileRole,
  });
}
