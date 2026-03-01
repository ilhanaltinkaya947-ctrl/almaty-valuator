import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateApiKey } from "@/lib/auth-api-key";
import type { Database } from "@/types/database";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

/**
 * GET /api/v1/automation/market-stats
 * Called by n8n Scenario #3 (Admin Insight — daily 21:00 report).
 * Returns aggregated stats for the specified period.
 */
export async function GET(req: NextRequest) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  try {
    const supabase = createAdminClient();
    const url = new URL(req.url);
    const period = url.searchParams.get("period") ?? "today";

    // Calculate date range
    const now = new Date();
    let since: string;

    switch (period) {
      case "week":
        since = new Date(now.getTime() - 7 * 86400000).toISOString();
        break;
      case "month":
        since = new Date(now.getTime() - 30 * 86400000).toISOString();
        break;
      case "today":
      default:
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
    }

    // Parallel queries
    const [leadsResult, evaluationsResult, complexesResult] = await Promise.all([
      supabase
        .from("leads")
        .select("id, status, estimated_price, source, created_at")
        .gte("created_at", since),
      supabase
        .from("evaluations")
        .select("id, final_price, created_at")
        .gte("created_at", since),
      supabase
        .from("complexes")
        .select("id")
        .then(({ count }) => count),
    ]);

    const leads = (leadsResult.data ?? []) as LeadRow[];
    const evaluations = evaluationsResult.data ?? [];

    // Aggregate
    const totalLeads = leads.length;
    const newLeads = leads.filter((l) => l.status === "new").length;
    const inProgressLeads = leads.filter((l) => l.status === "in_progress").length;
    const paidLeads = leads.filter((l) => l.status === "paid").length;

    const totalEvaluations = evaluations.length;
    const totalEstimatedValue = leads.reduce(
      (sum, l) => sum + (l.estimated_price ?? 0),
      0,
    );

    const sourceBreakdown = leads.reduce(
      (acc, l) => {
        acc[l.source] = (acc[l.source] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return NextResponse.json({
      period,
      since,
      stats: {
        total_leads: totalLeads,
        new_leads: newLeads,
        in_progress_leads: inProgressLeads,
        paid: paidLeads,
        total_evaluations: totalEvaluations,
        total_estimated_value: totalEstimatedValue,
        total_complexes: complexesResult ?? 0,
        source_breakdown: sourceBreakdown,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
