-- ══════════════════════════════════════════════════
-- 003: Evaluation History
-- ══════════════════════════════════════════════════

CREATE TABLE evaluations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid REFERENCES leads(id) ON DELETE CASCADE,
  complex_id    uuid REFERENCES complexes(id) ON DELETE SET NULL,
  params        jsonb NOT NULL,
  final_price   bigint NOT NULL,
  price_per_sqm integer NOT NULL,
  pdf_url       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_evaluations_lead ON evaluations (lead_id);
CREATE INDEX idx_evaluations_complex ON evaluations (complex_id);
CREATE INDEX idx_evaluations_created ON evaluations (created_at DESC);
