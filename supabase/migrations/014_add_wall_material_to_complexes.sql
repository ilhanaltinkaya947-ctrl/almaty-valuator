-- ══════════════════════════════════════════════════
-- 014: Add wall_material, zone_slug, krisha_complex_id to complexes
-- ══════════════════════════════════════════════════

ALTER TABLE complexes ADD COLUMN IF NOT EXISTS wall_material text
  CHECK (wall_material IN ('panel', 'brick', 'monolith'));

ALTER TABLE complexes ADD COLUMN IF NOT EXISTS zone_slug text;

ALTER TABLE complexes ADD COLUMN IF NOT EXISTS krisha_complex_id integer;

-- Index for deduplication by krisha ID
CREATE INDEX IF NOT EXISTS idx_complexes_krisha_id ON complexes (krisha_complex_id)
  WHERE krisha_complex_id IS NOT NULL;
