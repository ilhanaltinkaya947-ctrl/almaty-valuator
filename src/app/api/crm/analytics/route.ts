import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-telegram";
import { createAdminClient } from "@/lib/supabase/admin";

interface PipelineMetrics {
  active_leads_count: number;
  active_pipeline_value: number;
  current_month_closed_value: number;
}

interface BrokerPerformance {
  broker_id: string;
  broker_name: string;
  total_leads_taken: number;
  deals_won: number;
  deals_lost: number;
  conversion_rate: number;
}

/** GET /api/crm/analytics — Analytics dashboard data (admin/director only) */
export async function GET(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Determine profile role
  let profileRole = "admin";
  if (agent.id !== "system") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", agent.id)
      .single();
    profileRole = (profile as { role: string } | null)?.role ?? "manager";
  }

  // Only admin and director can access analytics
  if (profileRole !== "admin" && profileRole !== "director") {
    return NextResponse.json(
      { error: "Доступ запрещён. Только для администраторов и директоров." },
      { status: 403 }
    );
  }

  // Call both RPCs in parallel
  const [metricsResult, brokerResult] = await Promise.all([
    supabase.rpc("get_pipeline_metrics"),
    supabase.rpc("get_broker_performance"),
  ]);

  if (metricsResult.error) {
    return NextResponse.json(
      { error: `Pipeline metrics error: ${metricsResult.error.message}` },
      { status: 500 }
    );
  }

  if (brokerResult.error) {
    return NextResponse.json(
      { error: `Broker performance error: ${brokerResult.error.message}` },
      { status: 500 }
    );
  }

  const pipeline = metricsResult.data as PipelineMetrics;
  const brokers = brokerResult.data as BrokerPerformance[];

  return NextResponse.json({
    pipeline: {
      active_leads_count: pipeline?.active_leads_count ?? 0,
      active_pipeline_value: pipeline?.active_pipeline_value ?? 0,
      current_month_closed_value: pipeline?.current_month_closed_value ?? 0,
    },
    brokers: brokers ?? [],
  });
}
