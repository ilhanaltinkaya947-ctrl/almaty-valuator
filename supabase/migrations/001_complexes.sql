-- ══════════════════════════════════════════════════
-- 001: ЖК Reference Table
-- ══════════════════════════════════════════════════

CREATE TYPE housing_class AS ENUM (
  'elite', 'business_plus', 'business',
  'comfort_plus', 'comfort', 'standard'
);

CREATE TABLE complexes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL UNIQUE,
  district      text NOT NULL,
  developer     text,
  class         housing_class NOT NULL DEFAULT 'comfort',
  coefficient   numeric(4,2) NOT NULL DEFAULT 1.00,
  year_built    integer,
  total_floors  integer,
  image_url     text,
  map_lat       numeric(10,6),
  map_lng       numeric(10,6),
  liquidity_index numeric(3,2) DEFAULT 0.50,
  avg_price_sqm integer,
  krisha_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER complexes_updated_at
  BEFORE UPDATE ON complexes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for search
CREATE INDEX idx_complexes_name ON complexes USING gin (name gin_trgm_ops);
CREATE INDEX idx_complexes_district ON complexes (district);

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
