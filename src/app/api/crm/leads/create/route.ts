import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/auth-telegram";
import { logLeadEvent } from "@/lib/lead-events";

const manualLeadSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(200),
  phone: z.string().regex(/^\+7\d{10}$/, "Формат: +7XXXXXXXXXX"),
  address: z.string().max(500).optional(),
  source: z.enum(["walk_in", "outdoor_ad", "referral", "manual"]).default("manual"),
  property_type: z.enum(["apartment", "house", "commercial", "land"]).optional(),
  notes: z.string().max(1000).optional(),
});

/** POST /api/crm/leads/create — Create manual offline lead from CRM */
export async function POST(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = manualLeadSchema.parse(body);
    const supabase = createAdminClient();

    // Build notes
    const noteParts: string[] = [];
    if (data.address) noteParts.push(`Адрес: ${data.address}`);
    if (data.notes) noteParts.push(data.notes);
    const combinedNotes = noteParts.length > 0 ? noteParts.join("; ") : null;

    // Determine if manual review is needed
    const needsManualReview = data.property_type
      ? ["house", "commercial", "land"].includes(data.property_type)
      : true;

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        phone: data.phone,
        name: data.name,
        address: data.address ?? null,
        source: data.source,
        property_type: data.property_type ?? null,
        needs_manual_review: needsManualReview,
        status: "new",
        notes: combinedNotes,
        intent: "ready",
      })
      .select()
      .single();

    if (error) {
      // Duplicate phone check
      if (error.message.includes("duplicate") || error.code === "23505") {
        return NextResponse.json(
          { error: "Клиент с таким телефоном уже существует" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const leadRecord = lead as Record<string, unknown>;

    // Log event
    logLeadEvent({
      leadId: leadRecord.id as string,
      userId: agent.id !== "system" ? agent.id : null,
      action: "created",
      description: `Заявка создана вручную (${data.source}, ${agent.name})`,
    }).catch(() => {});

    // Notify via Telegram (fire-and-forget)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID) {
      import("@/lib/telegram").then(({ notifyNewLead }) =>
        notifyNewLead({
          id: leadRecord.id as string,
          short_id: leadRecord.short_id as number | undefined,
          name: data.name,
          phone: data.phone,
          address: data.address,
          property_type: data.property_type,
          source: data.source,
          needs_manual_review: needsManualReview,
          notes: combinedNotes,
        }).catch((err) => console.error("Telegram notify error:", err))
      );
    }

    return NextResponse.json({ lead }, { status: 201 });
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
