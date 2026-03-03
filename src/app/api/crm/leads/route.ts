import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/auth-telegram";
import { sendMessage } from "@/lib/telegram";
import type { Database } from "@/types/database";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

const STATUS_LABELS: Record<string, string> = {
  new: "🆕 Новый",
  in_progress: "📞 В обработке",
  price_approved: "💰 Оценка утверждена",
  jurist_approved: "⚖️ Проверено юристом",
  director_approved: "✅ Утверждено директором",
  deal_progress: "📝 На сделке",
  awaiting_payout: "💸 Ждёт выплаты",
  deal_closed: "🏆 Сделка закрыта",
  paid: "🏆 Выдано",
  rejected: "📦 Отказ",
};

/** Roles that see all leads without restriction */
const FULL_ACCESS_ROLES = new Set(["admin", "jurist", "director"]);

/** GET /api/crm/leads — Fetch leads with optional filters */
export async function GET(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Determine profile role for data isolation
  let profileRole: string | null = null;
  if (agent.id !== "system") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", agent.id)
      .single();
    profileRole = (profile as { role: string } | null)?.role ?? null;
  }

  // admin, jurist, director, system, or unknown profile → full access
  // broker/manager → restricted to own leads + new leads
  const isBroker = profileRole !== null && !FULL_ACCESS_ROLES.has(profileRole);

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

  if (url.searchParams.get("terminal") === "true") {
    query = query.in("status", ["rejected", "deal_closed"]);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  // Data isolation: brokers only see new (unclaimed) + their own assigned leads
  if (isBroker) {
    query = query.or(`status.eq.new,assigned_to.eq.${agent.id}`);
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
    const { lead_id, status, offer_price, rejection_reason, assigned_to } = body;

    if (!lead_id) {
      return NextResponse.json({ error: "lead_id required" }, { status: 400 });
    }

    const validStatuses = ["new", "in_progress", "price_approved", "jurist_approved", "director_approved", "deal_progress", "awaiting_payout", "deal_closed", "paid", "rejected"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch lead before update (for notification context)
    const { data: leadBefore } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
    }
    if (status === "in_progress") {
      updateData.contacted_at = new Date().toISOString();
    }
    if (typeof offer_price === "number" && offer_price > 0) {
      updateData.offer_price = offer_price;
    }
    if (status === "rejected" && typeof rejection_reason === "string") {
      updateData.rejection_reason = rejection_reason;
    }
    if (assigned_to) {
      updateData.assigned_to = assigned_to;
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

    // Send Telegram notification on status change (fire-and-forget)
    if (status && leadBefore) {
      const lead = leadBefore as LeadRow;
      const oldLabel = STATUS_LABELS[lead.status] ?? lead.status;
      const newLabel = STATUS_LABELS[status] ?? status;
      const price = lead.offer_price ?? lead.estimated_price;
      const priceStr = price
        ? new Intl.NumberFormat("ru-RU").format(price) + " ₸"
        : "—";

      const idTag = lead.short_id ? `#${lead.short_id} ` : "";
      const text = [
        `📢 <b>${idTag}Статус изменён</b>`,
        ``,
        `👤 <b>${lead.name ?? "—"}</b> | 📞 ${lead.phone}`,
        `🏠 ${lead.property_type ?? "—"} | 💰 ${priceStr}`,
        ``,
        `${oldLabel}  →  ${newLabel}`,
        ``,
        `👷 <b>${agent.name}</b> | ${new Date().toLocaleString("ru-RU", { timeZone: "Asia/Almaty", hour: "2-digit", minute: "2-digit" })}`,
      ].join("\n");

      // Send to all active agents
      notifyAllAgents(supabase, text).catch(() => {});
    }

    // Send Telegram notification on price change (fire-and-forget)
    if (typeof offer_price === "number" && offer_price > 0 && leadBefore) {
      const lead = leadBefore as LeadRow;
      const priceStr = new Intl.NumberFormat("ru-RU").format(offer_price);

      const priceIdTag = lead.short_id ? `#${lead.short_id} ` : "";
      const text = [
        `💰 <b>${priceIdTag}Цена назначена</b>`,
        ``,
        `👤 <b>${lead.name ?? "—"}</b> | 📞 ${lead.phone}`,
        `💰 <b>${priceStr} ₸</b>`,
        ``,
        `👷 <b>${agent.name}</b>`,
      ].join("\n");

      notifyAllAgents(supabase, text).catch(() => {});
    }

    return NextResponse.json({ success: true, lead_id, updated: updateData, updated_by: agent.name });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/** Send a message to all active authorized agents */
async function notifyAllAgents(supabase: ReturnType<typeof createAdminClient>, text: string) {
  const { data: agents } = await supabase
    .from("authorized_agents")
    .select("telegram_id")
    .eq("is_active", true);

  const targets = (agents ?? []) as { telegram_id: number }[];

  await Promise.allSettled(
    targets.map((a) => sendMessage(String(a.telegram_id), text))
  );
}
