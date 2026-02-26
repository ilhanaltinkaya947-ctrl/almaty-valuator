import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

const createLeadSchema = z.object({
  phone: z.string().regex(/^\+7\d{10}$/),
  name: z.string().optional(),
  complex_id: z.string().uuid().optional(),
  area_sqm: z.number().positive().optional(),
  floor: z.number().int().positive().optional(),
  estimated_price: z.number().int().positive().optional(),
  source: z.enum(["landing", "telegram", "direct", "manual"]).default("landing"),
  property_type: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createLeadSchema.parse(body);

    const supabase = createAdminClient();

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        phone: data.phone,
        name: data.name ?? null,
        complex_id: data.complex_id ?? null,
        area_sqm: data.area_sqm ?? null,
        floor: data.floor ?? null,
        estimated_price: data.estimated_price ?? null,
        source: data.source,
        property_type: data.property_type ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to create lead" },
        { status: 500 },
      );
    }

    // Notify agents via Telegram with interactive lead card (fire-and-forget)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID) {
      const leadRecord = lead as Record<string, unknown>;
      import("@/lib/telegram").then(({ notifyNewLead }) =>
        notifyNewLead({
          id: leadRecord.id as string,
          name: data.name,
          phone: data.phone,
          property_type: data.property_type,
          estimated_price: data.estimated_price,
          source: data.source,
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
    console.error("Lead creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.AUTOMATION_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") ?? "50");

    let query = supabase
      .from("leads")
      .select("*, complexes(name, district, class)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status as Database["public"]["Enums"]["lead_status"]);
    }

    const { data: leads, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
