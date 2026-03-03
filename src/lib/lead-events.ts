import { createAdminClient } from "@/lib/supabase/admin";

/** Log an event to the lead_events audit trail (fire-and-forget safe) */
export async function logLeadEvent(params: {
  leadId: string;
  userId?: string | null;
  action: string;
  description: string;
}) {
  try {
    const supabase = createAdminClient();
    await supabase.from("lead_events").insert({
      lead_id: params.leadId,
      user_id: params.userId ?? null,
      action: params.action,
      description: params.description,
    });
  } catch (err) {
    console.error("Failed to log lead event:", err);
  }
}
