import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/auth-telegram";
import { logLeadEvent } from "@/lib/lead-events";
import type { DealExpense } from "@/types/database";

const expenseSchema = z.object({
  category: z.enum(["notary", "repair", "utility_debt", "cleaning", "other"]),
  amount: z.number().positive().max(10_000_000_000),
  description: z.string().max(500).optional(),
});

/** GET /api/crm/leads/[id]/expenses — List all expenses for a lead */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: leadId } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("deal_expenses")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expenses: (data ?? []) as DealExpense[] });
}

/** POST /api/crm/leads/[id]/expenses — Add a new expense */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: leadId } = await params;

  try {
    const body = await req.json();
    const data = expenseSchema.parse(body);
    const supabase = createAdminClient();

    // Verify lead exists
    const { data: lead } = await supabase
      .from("leads")
      .select("id, short_id")
      .eq("id", leadId)
      .single();

    if (!lead) {
      return NextResponse.json({ error: "Лид не найден" }, { status: 404 });
    }

    const { data: expense, error } = await supabase
      .from("deal_expenses")
      .insert({
        lead_id: leadId,
        category: data.category,
        amount: data.amount,
        description: data.description ?? null,
        created_by: agent.id !== "system" ? agent.id : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log event (fire-and-forget)
    const CATEGORY_LABELS: Record<string, string> = {
      notary: "Нотариус",
      repair: "Ремонт",
      utility_debt: "Долги ЖКХ",
      cleaning: "Уборка",
      other: "Прочее",
    };
    const catLabel = CATEGORY_LABELS[data.category] ?? data.category;
    const amountStr = new Intl.NumberFormat("ru-RU").format(data.amount);
    logLeadEvent({
      leadId,
      userId: agent.id !== "system" ? agent.id : null,
      action: "expense_added",
      description: `Расход: ${catLabel} — ${amountStr} ₸ (${agent.name})`,
    }).catch(() => {});

    return NextResponse.json({ expense }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/** DELETE /api/crm/leads/[id]/expenses — Delete an expense */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: leadId } = await params;
  const url = new URL(req.url);
  const expenseId = url.searchParams.get("expense_id");

  if (!expenseId) {
    return NextResponse.json({ error: "expense_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("deal_expenses")
    .delete()
    .eq("id", expenseId)
    .eq("lead_id", leadId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logLeadEvent({
    leadId,
    userId: agent.id !== "system" ? agent.id : null,
    action: "expense_deleted",
    description: `Расход удалён (${agent.name})`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
