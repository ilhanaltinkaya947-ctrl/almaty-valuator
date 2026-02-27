-- 011_price_zones.sql
-- Price zones for non-ЖК apartments + building series modifiers

-- ── Building series enum ──
CREATE TYPE building_series AS ENUM (
  'stalinka',
  'khrushchevka',
  'brezhnevka',
  'uluchshenka',
  'individual',
  'novostroyka'
);

-- ── Price zones table ──
CREATE TABLE price_zones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  district    text NOT NULL,
  description text,
  avg_price_sqm  integer NOT NULL DEFAULT 0,
  coefficient    numeric(4,2) NOT NULL DEFAULT 1.00,
  krisha_search_url text,
  map_lat     numeric(8,5),
  map_lng     numeric(8,5),
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Building series modifiers table ──
CREATE TABLE building_series_modifiers (
  series         building_series PRIMARY KEY,
  label_ru       text NOT NULL,
  description_ru text,
  year_min       integer,
  year_max       integer,
  floor_min      integer DEFAULT 1,
  floor_max      integer DEFAULT 16,
  modifier       numeric(4,2) NOT NULL DEFAULT 1.00,
  sort_order     integer NOT NULL DEFAULT 0
);

-- ── Zone price snapshots (history for n8n updates) ──
CREATE TABLE zone_price_snapshots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id          uuid NOT NULL REFERENCES price_zones(id) ON DELETE CASCADE,
  avg_price_sqm    integer NOT NULL,
  median_price_sqm integer,
  listing_count    integer,
  scraped_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_zone_snapshots_zone ON zone_price_snapshots(zone_id, scraped_at DESC);

-- ── Add zone_id and building_series columns to leads ──
ALTER TABLE leads
  ADD COLUMN zone_id uuid REFERENCES price_zones(id),
  ADD COLUMN building_series building_series;

-- ── Auto-recompute coefficient trigger ──
-- coefficient = avg_price_sqm / base_rate (from system_settings)
CREATE OR REPLACE FUNCTION recompute_zone_coefficient()
RETURNS trigger AS $$
DECLARE
  base numeric;
BEGIN
  SELECT value_numeric INTO base
    FROM system_settings
    WHERE key = 'base_rate'
    LIMIT 1;

  IF base IS NOT NULL AND base > 0 THEN
    NEW.coefficient := ROUND((NEW.avg_price_sqm::numeric / base)::numeric, 2);
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_zone_coefficient
  BEFORE INSERT OR UPDATE OF avg_price_sqm ON price_zones
  FOR EACH ROW
  EXECUTE FUNCTION recompute_zone_coefficient();

-- ── RLS ──
ALTER TABLE price_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_series_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_price_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "price_zones_public_read" ON price_zones
  FOR SELECT USING (true);

CREATE POLICY "building_series_public_read" ON building_series_modifiers
  FOR SELECT USING (true);

CREATE POLICY "zone_snapshots_public_read" ON zone_price_snapshots
  FOR SELECT USING (true);

-- Service-role write (for n8n / admin)
CREATE POLICY "price_zones_service_write" ON price_zones
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "building_series_service_write" ON building_series_modifiers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "zone_snapshots_service_write" ON zone_price_snapshots
  FOR ALL USING (auth.role() = 'service_role');
