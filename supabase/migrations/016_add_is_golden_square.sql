-- Add is_golden_square boolean flag to complexes and leads
ALTER TABLE complexes ADD COLUMN is_golden_square boolean NOT NULL DEFAULT false;
ALTER TABLE leads ADD COLUMN is_golden_square boolean NOT NULL DEFAULT false;

-- Remove the zone entry — golden square is a property flag, not a zone
DELETE FROM price_zones WHERE slug = 'zolotoy-kvadrat';
