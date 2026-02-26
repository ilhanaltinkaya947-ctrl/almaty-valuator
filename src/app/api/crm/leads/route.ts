import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import crypto from "crypto";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type AgentRow = Database["public"]["Tables"]["authorized_agents"]["Row"];

/**
 * Validate Telegram WebApp InitData.
 * See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function validateInitData(initData: string): { valid: boolean; userId?: number } {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return { valid: false };

  // Parse the query string
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { valid: false };

  // Build data-check-string (sorted, without hash)
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  // HMAC-SHA256
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) return { valid: false };

  // Extract user id
  try {
    const userStr = params.get("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return { valid: true, userId: user.id };
    }
  } catch {}

  return { valid: true };
}

async function authenticateRequest(req: NextRequest): Promise<AgentRow | null> {
  const initData = req.headers.get("x-telegram-init-data") ?? "";

  // Try Telegram InitData validation
  if (initData) {
    const { valid, userId } = validateInitData(initData);
    if (valid && userId) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("authorized_agents")
        .select("*")
        .eq("telegram_id", userId)
        .eq("is_active", true)
        .single();
      return (data as AgentRow | null) ?? null;
    }
  }

  // Fallback: API key auth (for testing/n8n)
  const apiKey = req.headers.get("x-api-key");
  if (apiKey && apiKey === process.env.AUTOMATION_API_KEY) {
    // Return a synthetic admin agent
    return {
      id: "system",
      telegram_id: 0,
      name: "System",
      role: "admin",
      is_active: true,
      created_at: "",
      updated_at: "",
    };
  }

  return null;
}

/** GET /api/crm/leads — Fetch leads with optional filters */
export async function GET(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const limit = parseInt(url.searchParams.get("limit") ?? "50");

  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && status !== "all") {
    query = query.eq("status", status as Database["public"]["Enums"]["lead_status"]);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data: leads, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: (leads ?? []) as LeadRow[] });
}

/** PATCH /api/crm/leads — Update lead status */
export async function PATCH(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { lead_id, status } = await req.json();

    if (!lead_id || !status) {
      return NextResponse.json({ error: "lead_id and status required" }, { status: 400 });
    }

    const validStatuses = ["new", "contacted", "in_progress", "closed_won", "closed_lost"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = { status };
    if (status === "contacted") {
      updateData.contacted_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", lead_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead_id, status, updated_by: agent.name });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
