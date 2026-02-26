import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/auth-telegram";
import type { Database } from "@/types/database";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

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

/** PATCH /api/crm/leads — Update lead status and/or offer_price */
export async function PATCH(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { lead_id, status, offer_price } = body;

    if (!lead_id) {
      return NextResponse.json({ error: "lead_id required" }, { status: 400 });
    }

    const validStatuses = ["new", "pending_review", "contacted", "in_progress", "closed_won", "closed_lost"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
    }
    if (status === "contacted") {
      updateData.contacted_at = new Date().toISOString();
    }
    if (typeof offer_price === "number" && offer_price > 0) {
      updateData.offer_price = offer_price;
      // Auto-transition from pending_review to contacted when price is set
      if (!status) {
        const { data: rawLead } = await supabase
          .from("leads")
          .select("status")
          .eq("id", lead_id)
          .single();
        const currentLead = rawLead as { status: string } | null;
        if (currentLead?.status === "pending_review" || currentLead?.status === "new") {
          updateData.status = "contacted";
          updateData.contacted_at = new Date().toISOString();
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", lead_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead_id, updated: updateData, updated_by: agent.name });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
