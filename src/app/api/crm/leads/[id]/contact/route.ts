import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/auth-telegram";
import { logLeadEvent } from "@/lib/lead-events";

/**
 * GET /api/crm/leads/[id]/contact?type=whatsapp|call
 *
 * Secure contact proxy — returns the real phone/WhatsApp link
 * without exposing the number in the frontend.
 *
 * For brokers: only works for leads assigned to them or status=new.
 * Logs every contact attempt for audit.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: leadId } = await params;
  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // "whatsapp" | "call"

  if (!type || !["whatsapp", "call"].includes(type)) {
    return NextResponse.json({ error: "type must be 'whatsapp' or 'call'" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch the lead
  const { data: lead } = await supabase
    .from("leads")
    .select("id, phone, name, assigned_to, status, short_id")
    .eq("id", leadId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Лид не найден" }, { status: 404 });
  }

  const leadData = lead as {
    id: string;
    phone: string;
    name: string | null;
    assigned_to: string | null;
    status: string;
    short_id: number;
  };

  // Check profile role
  const AGENT_TO_PROFILE_ROLE: Record<string, string> = {
    admin: "admin",
    broker: "manager",
    jurist: "jurist",
    director: "director",
    cashier: "cashier",
  };
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

  // Broker guard: can only contact own leads or new unclaimed leads
  if (profileRole === "manager") {
    const isOwnLead = leadData.assigned_to === agent.id;
    const isNewUnclaimed = leadData.status === "new" && !leadData.assigned_to;
    if (!isOwnLead && !isNewUnclaimed) {
      return NextResponse.json({ error: "Нет доступа к этому контакту" }, { status: 403 });
    }
  }

  // Log the contact attempt (fire-and-forget)
  logLeadEvent({
    leadId: leadData.id,
    userId: agent.id,
    action: "contact_attempt",
    description: `${type === "whatsapp" ? "WhatsApp" : "Звонок"} (${agent.name})`,
  }).catch(() => {});

  const phone = leadData.phone.replace(/\D/g, "");

  if (type === "whatsapp") {
    const offerText = "";
    const greeting = `Здравствуйте${leadData.name ? `, ${leadData.name}` : ""}! Я менеджер из Алмавыкуп.${offerText}`;
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(greeting)}`;
    return NextResponse.redirect(waUrl);
  }

  // type === "call"
  return NextResponse.redirect(`tel:+${phone}`);
}
