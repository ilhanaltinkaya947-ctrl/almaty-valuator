import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/auth-telegram";
import { logLeadEvent } from "@/lib/lead-events";

/** POST /api/crm/leads/[id]/media — Upload media file from CRM */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: leadId } = await params;
  const supabase = createAdminClient();

  // Verify lead exists
  const { data: lead } = await supabase
    .from("leads")
    .select("id, short_id, name")
    .eq("id", leadId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Лид не найден" }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Файл слишком большой (макс. 20МБ)" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `${leadId}/${fileName}`;

    // Upload to property_media bucket
    const { error: uploadError } = await supabase.storage
      .from("property_media")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("property_media")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Check if agent has a profile (FK constraint)
    let uploadedBy: string | null = null;
    if (agent.id !== "system") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", agent.id)
        .single();
      if (profile) uploadedBy = agent.id;
    }

    // Save to lead_attachments
    const { data: attachment, error: insertError } = await supabase
      .from("lead_attachments")
      .insert({
        lead_id: leadId,
        uploaded_by: uploadedBy,
        file_url: publicUrl,
        file_type: file.type,
        file_name: file.name,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Log event
    logLeadEvent({
      leadId,
      userId: agent.id !== "system" ? agent.id : null,
      action: "document_added",
      description: `Загружен файл: ${file.name} (${agent.name}, CRM)`,
    }).catch(() => {});

    return NextResponse.json({ attachment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
