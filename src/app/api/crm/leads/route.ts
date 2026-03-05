import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/auth-telegram";
import { sendMessage } from "@/lib/telegram";
import { logLeadEvent } from "@/lib/lead-events";
import type { Database, UserRole } from "@/types/database";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

/** Mask phone number for broker data protection: +77074503277 → +7 *** ***-**-77 */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `+${digits[0]} *** ***-**-${digits.slice(-2)}`;
}

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

const validStatuses = ["new", "in_progress", "price_approved", "jurist_approved", "director_approved", "deal_progress", "awaiting_payout", "deal_closed", "paid", "rejected"];

/** Role-based status transition permissions */
const ROLE_TRANSITIONS: Record<string, string[]> = {
  admin: validStatuses,
  manager: ["in_progress", "price_approved", "rejected"],
  jurist: ["jurist_approved", "rejected"],
  director: ["director_approved", "awaiting_payout", "rejected"],
  cashier: ["deal_closed"],
};

/** GET /api/crm/leads — Fetch leads with role-based filtering */
export async function GET(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Determine profile role for data isolation
  let profileRole = "admin";
  if (agent.id !== "system") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", agent.id)
      .single();
    profileRole = (profile as { role: string } | null)?.role ?? "manager";
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const limit = parseInt(url.searchParams.get("limit") ?? "50");
  const isTerminal = url.searchParams.get("terminal") === "true";

  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && status !== "all") {
    query = query.eq("status", status as Database["public"]["Enums"]["lead_status"]);
  }

  if (isTerminal) {
    query = query.in("status", ["rejected", "deal_closed"]);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  // Role-based data isolation
  if (isTerminal) {
    // Archive view: brokers only see their own archived leads
    if (profileRole === "manager") {
      query = query.eq("assigned_to", agent.id);
    }
    // admin, director, jurist, cashier see all archived leads
  } else {
    switch (profileRole) {
      case "admin":
        // Full access — no filter
        break;
      case "manager":
        query = query.or(`status.eq.new,assigned_to.eq.${agent.id}`);
        break;
      case "jurist":
        query = query.eq("status", "price_approved");
        break;
      case "director":
        query = query.in("status", ["jurist_approved", "director_approved"]);
        break;
      case "cashier":
        query = query.eq("status", "awaiting_payout");
        break;
      default:
        query = query.eq("assigned_to", agent.id);
        break;
    }
  }

  const { data: leads, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let result = (leads ?? []) as LeadRow[];

  // Mask phone numbers for brokers — protect client base
  if (profileRole === "manager") {
    result = result.map((lead) => ({
      ...lead,
      phone: maskPhone(lead.phone),
    }));
  }

  return NextResponse.json({ leads: result });
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

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch profile role for permission guard
    let profileRole = "admin";
    if (agent.id !== "system") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", agent.id)
        .single();
      profileRole = (profile as { role: string } | null)?.role ?? "manager";
    }

    // Permission guard: check if this role can set the requested status
    if (status) {
      const allowedStatuses = ROLE_TRANSITIONS[profileRole] ?? [];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Роль "${profileRole}" не может установить статус "${status}"` },
          { status: 403 }
        );
      }
    }

    // Fetch lead before update (for notification context + ownership check)
    const { data: leadBefore } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (!leadBefore) {
      return NextResponse.json({ error: "Лид не найден" }, { status: 404 });
    }

    const existingLead = leadBefore as LeadRow;

    // Broker guard: cannot claim/reassign a lead already taken by another broker
    if (profileRole === "manager" && assigned_to) {
      if (existingLead.assigned_to && existingLead.assigned_to !== agent.id) {
        return NextResponse.json(
          { error: "Эта заявка уже взята другим брокером" },
          { status: 403 }
        );
      }
    }

    // Broker guard: cannot change status of a lead assigned to another broker
    if (profileRole === "manager" && status && existingLead.assigned_to && existingLead.assigned_to !== agent.id) {
      return NextResponse.json(
        { error: "Вы не можете изменить статус чужой заявки" },
        { status: 403 }
      );
    }

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

    // Log audit events (fire-and-forget)
    const userId = agent.id !== "system" ? agent.id : null;
    if (status) {
      const statusLabel = STATUS_LABELS[status] ?? status;
      logLeadEvent({
        leadId: lead_id,
        userId,
        action: "status_changed",
        description: `Статус изменён на ${statusLabel} (${agent.name})`,
      }).catch(() => {});
    }
    if (assigned_to) {
      logLeadEvent({
        leadId: lead_id,
        userId,
        action: "assigned",
        description: `Взял заявку в работу (${agent.name})`,
      }).catch(() => {});
    }
    if (typeof offer_price === "number" && offer_price > 0) {
      logLeadEvent({
        leadId: lead_id,
        userId,
        action: "price_set",
        description: `Цена назначена: ${new Intl.NumberFormat("ru-RU").format(offer_price)} ₸ (${agent.name})`,
      }).catch(() => {});
    }

    // Role-specific Telegram notifications on status change (fire-and-forget)
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

      // Notify relevant roles based on the new status
      notifyByRole(supabase, status, text, lead.assigned_to).catch(() => {});
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

      notifyByRole(supabase, "price_set", text, lead.assigned_to).catch(() => {});
    }

    return NextResponse.json({ success: true, lead_id, updated: updateData, updated_by: agent.name });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/** Send notification to relevant roles based on the status change */
async function notifyByRole(
  supabase: ReturnType<typeof createAdminClient>,
  newStatus: string,
  text: string,
  assignedTo: string | null,
) {
  // Determine which profile roles should be notified
  let targetRoles: UserRole[];
  switch (newStatus) {
    case "price_approved":
    case "price_set":
      targetRoles = ["jurist", "admin"];
      break;
    case "jurist_approved":
      targetRoles = ["director", "admin"];
      break;
    case "director_approved":
    case "awaiting_payout":
      targetRoles = ["cashier", "admin"];
      break;
    default:
      targetRoles = ["admin"];
      break;
  }

  // Get telegram_chat_id for profiles with these roles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, telegram_chat_id")
    .in("role", targetRoles)
    .not("telegram_chat_id", "is", null);

  const targets = new Set<string>();
  for (const p of (profiles ?? []) as { id: string; telegram_chat_id: string }[]) {
    targets.add(p.telegram_chat_id);
  }

  // Also notify the assigned broker (if any)
  if (assignedTo) {
    const { data: assigneeProfile } = await supabase
      .from("profiles")
      .select("telegram_chat_id")
      .eq("id", assignedTo)
      .single();
    const chatId = (assigneeProfile as { telegram_chat_id: string | null } | null)?.telegram_chat_id;
    if (chatId) targets.add(chatId);
  }

  await Promise.allSettled(
    [...targets].map((chatId) => sendMessage(chatId, text))
  );
}
