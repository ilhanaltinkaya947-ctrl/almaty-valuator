-- Pipeline metrics: active leads count, active pipeline value, current month closed deals value
CREATE OR REPLACE FUNCTION get_pipeline_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'active_leads_count', (
      SELECT COUNT(*)
      FROM leads
      WHERE status NOT IN ('deal_closed', 'paid', 'rejected')
    ),
    'active_pipeline_value', (
      SELECT COALESCE(SUM(COALESCE(offer_price, 0)), 0)
      FROM leads
      WHERE status NOT IN ('deal_closed', 'paid', 'rejected')
    ),
    'current_month_closed_value', (
      SELECT COALESCE(SUM(COALESCE(offer_price, 0)), 0)
      FROM leads
      WHERE status IN ('deal_closed', 'paid')
        AND updated_at >= date_trunc('month', NOW())
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Broker performance: leads taken, deals won/lost, conversion rate
CREATE OR REPLACE FUNCTION get_broker_performance()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_data), '[]'::json)
  INTO result
  FROM (
    SELECT json_build_object(
      'broker_id', l.assigned_to,
      'broker_name', COALESCE(p.full_name, 'Не назначен'),
      'total_leads_taken', COUNT(*),
      'deals_won', COUNT(*) FILTER (WHERE l.status IN ('deal_closed', 'paid')),
      'deals_lost', COUNT(*) FILTER (WHERE l.status = 'rejected'),
      'conversion_rate', ROUND(
        CASE
          WHEN COUNT(*) > 0
          THEN (COUNT(*) FILTER (WHERE l.status IN ('deal_closed', 'paid')))::numeric / COUNT(*)::numeric * 100
          ELSE 0
        END, 1
      )
    ) AS row_data
    FROM leads l
    LEFT JOIN profiles p ON p.id = l.assigned_to
    WHERE l.assigned_to IS NOT NULL
    GROUP BY l.assigned_to, p.full_name
    ORDER BY COUNT(*) DESC
  ) sub;

  RETURN result;
END;
$$;
