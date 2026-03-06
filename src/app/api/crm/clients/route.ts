import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/auth-telegram";

/** Roles that can access the full client database */
const CLIENT_ACCESS_ROLES = new Set(["admin", "director", "jurist"]);

/** GET /api/crm/clients — Fetch clients with optional search (restricted to admin/director/jurist) */
export async function GET(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Map agent role → profile role
  const AGENT_TO_PROFILE_ROLE: Record<string, string> = {
    admin: "admin",
    broker: "manager",
    jurist: "jurist",
    director: "director",
    cashier: "cashier",
  };

  // Check profile role — brokers and cashiers cannot access client database
  const supabase = createAdminClient();
  let profileRole = AGENT_TO_PROFILE_ROLE[agent.role] ?? "manager";
  if (agent.id !== "system") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", agent.id)
      .single();
    if (profile) {
      profileRole = (profile as { role: string }).role;
    }
  }

  if (!CLIENT_ACCESS_ROLES.has(profileRole)) {
    return NextResponse.json(
      { error: "Доступ к базе клиентов ограничен" },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search");

  let query = supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,phone.ilike.%${search}%,iin.ilike.%${search}%`
    );
  }

  const { data: clients, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ clients: clients ?? [] });
}
