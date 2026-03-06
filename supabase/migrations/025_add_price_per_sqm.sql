ALTER TABLE complexes ADD COLUMN IF NOT EXISTS price_per_sqm integer;

UPDATE complexes SET price_per_sqm = avg_price_sqm WHERE avg_price_sqm IS NOT NULL AND avg_price_sqm > 0;

UPDATE system_settings SET value_numeric = 1.0 WHERE key = 'buyback_discount';
UPDATE system_settings SET value_numeric = 0 WHERE key = 'margin_target';
