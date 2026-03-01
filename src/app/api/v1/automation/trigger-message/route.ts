import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateApiKey } from "@/lib/auth-api-key";
import type { Database } from "@/types/database";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

const triggerMessageSchema = z.object({
  lead_id: z.string().uuid(),
  message_type: z.enum([
    "welcome",           // Initial follow-up after evaluation
    "report_ready",      // PDF report ready
    "price_update",      // 30-day price re-check
    "custom",            // Free-form message
  ]),
  custom_text: z.string().optional(),
});

/**
 * POST /api/v1/automation/trigger-message
 * Called by n8n Scenario #2 (Lead Nurturing).
 * Looks up the lead, constructs a message, and queues it for delivery.
 */
export async function POST(req: NextRequest) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const data = triggerMessageSchema.parse(body);

    const supabase = createAdminClient();

    // Fetch lead
    const { data: rawLead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", data.lead_id)
      .single();

    const lead = rawLead as LeadRow | null;

    if (leadError || !lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 },
      );
    }

    // Fetch complex name if linked
    let complexName = "объект";
    if (lead.complex_id) {
      const { data: complex } = await supabase
        .from("complexes")
        .select("name")
        .eq("id", lead.complex_id)
        .single();
      if (complex) complexName = complex.name;
    }

    // Build message based on type
    const leadName = lead.name;
    const price = lead.estimated_price;
    let message: string;

    switch (data.message_type) {
      case "welcome":
        message = `Здравствуйте${leadName ? `, ${leadName}` : ""}! Ваш отчёт по ЖК ${complexName} готов. Есть ли у вас вопросы по расчёту?`;
        break;
      case "report_ready":
        message = `${leadName ?? "Здравствуйте"}! Ваш персональный отчёт по оценке квартиры в ЖК ${complexName} готов. Рыночная стоимость: ${price ? new Intl.NumberFormat("ru-RU").format(price) + " тенге" : "см. отчёт"}.`;
        break;
      case "price_update":
        message = `${leadName ?? "Здравствуйте"}! Стоимость вашей квартиры в ЖК ${complexName} изменилась. Посмотрите обновлённый расчёт в личном кабинете.`;
        break;
      case "custom":
        message = data.custom_text ?? "Сообщение от Алмавыкуп";
        break;
    }

    // Send via WhatsApp if configured, otherwise log for n8n to handle
    let delivery: "sent" | "pending" = "pending";
    if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const { sendText: waSendText } = await import("@/lib/whatsapp");
        await waSendText({ to: lead.phone, text: message });
        delivery = "sent";
      } catch (waErr) {
        console.error("[trigger-message] WhatsApp send failed:", waErr);
      }
    } else {
      console.log(`[trigger-message] ${data.message_type} → ${lead.phone}: ${message}`);
    }

    // Update lead status if it was "new"
    if (lead.status === "new") {
      await supabase
        .from("leads")
        .update({ status: "in_progress", contacted_at: new Date().toISOString() })
        .eq("id", lead.id);
    }

    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      phone: lead.phone,
      message_type: data.message_type,
      message,
      delivery,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
