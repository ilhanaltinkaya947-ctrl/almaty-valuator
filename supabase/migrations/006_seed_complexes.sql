-- ══════════════════════════════════════════════════
-- 006: Seed ЖК Reference Data (25 complexes)
-- Calibrated against krisha.kz listings, Feb 2026
-- Base rate: 738,300 tg/m²
-- ══════════════════════════════════════════════════

INSERT INTO complexes (name, district, developer, class, coefficient, year_built, total_floors, map_lat, map_lng, liquidity_index, avg_price_sqm, krisha_url) VALUES
-- ELITE
('Esentai City', 'Медеуский', 'Capital Partners', 'elite', 2.20, 2015, 22, 43.218500, 76.929600, 0.92, 1624000, 'https://krisha.kz/complex/esentai-city'),
('Ritz Carlton Residences', 'Медеуский', 'Capital Partners', 'elite', 2.00, 2013, 18, 43.220100, 76.935100, 0.85, 1476600, 'https://krisha.kz/complex/ritz-carlton-residences'),
('Almaty Towers', 'Медеуский', 'Basis Gold', 'elite', 1.90, 2016, 35, 43.238000, 76.945700, 0.86, 1402770, 'https://krisha.kz/complex/almaty-towers'),

-- BUSINESS+
('Metropole', 'Бостандыкский', 'Bazis-A', 'business_plus', 1.80, 2020, 25, 43.233000, 76.910000, 0.85, 1328940, 'https://krisha.kz/complex/metropole'),
('AFD Riviera', 'Бостандыкский', 'AFD Group', 'business_plus', 1.70, 2023, 24, 43.229000, 76.895000, 0.80, 1255110, 'https://krisha.kz/complex/afd-riviera'),
('Тенгри Тауэр', 'Медеуский', 'Tengri Development', 'business_plus', 1.70, 2017, 32, 43.240000, 76.950000, 0.84, 1255110, 'https://krisha.kz/complex/tengri-tower'),
('Premium Tower', 'Медеуский', 'Basis Gold', 'business_plus', 1.65, 2018, 28, 43.235000, 76.942000, 0.78, 1218195, 'https://krisha.kz/complex/premium-tower'),
('Park Avenue', 'Бостандыкский', 'Bazis-A', 'business_plus', 1.60, 2019, 20, 43.231000, 76.903000, 0.82, 1181280, 'https://krisha.kz/complex/park-avenue'),
('Golden Square', 'Алмалинский', 'Golden Group', 'business_plus', 1.60, 2021, 27, 43.256000, 76.935000, 0.81, 1181280, 'https://krisha.kz/complex/golden-square'),
('Botanical Garden Residence', 'Бостандыкский', 'Grupo Verde', 'business_plus', 1.55, 2024, 18, 43.224000, 76.912000, 0.75, 1144365, 'https://krisha.kz/complex/botanical-garden-residence'),

-- BUSINESS
('Orion', 'Алмалинский', 'BI Group', 'business', 1.50, 2021, 30, 43.252000, 76.928000, 0.90, 1107450, 'https://krisha.kz/complex/orion'),
('Clover House', 'Бостандыкский', 'Bazis-A', 'business', 1.45, 2021, 22, 43.228000, 76.908000, 0.83, 1070535, 'https://krisha.kz/complex/clover-house'),
('Highvill', 'Наурызбайский', 'BI Group', 'business', 1.40, 2022, 16, 43.205000, 76.842000, 0.87, 1033620, 'https://krisha.kz/complex/highvill'),
('Nova Residence', 'Бостандыкский', 'Nova Build', 'business', 1.40, 2024, 19, 43.226000, 76.905000, 0.73, 1033620, 'https://krisha.kz/complex/nova-residence'),
('Baiseitova 104', 'Алмалинский', 'Nova Build', 'business', 1.35, 2022, 12, 43.258000, 76.940000, 0.77, 996705, 'https://krisha.kz/complex/baiseitova-104'),
('Манхэттен', 'Бостандыкский', 'BI Group', 'business', 1.35, 2018, 22, 43.227000, 76.898000, 0.85, 996705, 'https://krisha.kz/complex/manhattan'),

-- COMFORT+
('Manhattan Astana', 'Алмалинский', 'BI Group', 'comfort_plus', 1.30, 2020, 25, 43.254000, 76.932000, 0.91, 959790, 'https://krisha.kz/complex/manhattan-astana'),
('Green Park', 'Бостандыкский', 'Delta Construction', 'comfort_plus', 1.25, 2019, 14, 43.225000, 76.900000, 0.80, 922875, 'https://krisha.kz/complex/green-park'),

-- COMFORT
('Sky City', 'Ауэзовский', 'BI Group', 'comfort', 1.15, 2023, 20, 43.215000, 76.860000, 0.88, 849045, 'https://krisha.kz/complex/sky-city'),
('Асыл Арман', 'Алатауский', 'BI Group', 'comfort', 1.10, 2022, 12, 43.198000, 76.820000, 0.85, 812130, 'https://krisha.kz/complex/asyl-arman'),

-- STANDARD
('Самал-2', 'Медеуский', '—', 'standard', 1.15, 1990, 14, 43.232000, 76.920000, 0.80, 849045, 'https://krisha.kz/map/almaty'),
('Орбита-1', 'Бостандыкский', '—', 'standard', 1.05, 1980, 12, 43.220000, 76.890000, 0.82, 775215, 'https://krisha.kz/map/almaty'),
('Сауран Палас', 'Ауэзовский', 'Standard Build', 'standard', 1.00, 2015, 9, 43.210000, 76.850000, 0.70, 738300, 'https://krisha.kz/complex/sauran-palas'),
('Жетысу-2', 'Ауэзовский', '—', 'standard', 0.90, 1988, 9, 43.242000, 76.873000, 0.75, 664470, 'https://krisha.kz/map/almaty'),
('Аксай-3', 'Ауэзовский', '—', 'standard', 0.85, 1985, 5, 43.218000, 76.840000, 0.78, 627555, 'https://krisha.kz/map/almaty')
ON CONFLICT (name) DO UPDATE SET
  coefficient = EXCLUDED.coefficient,
  avg_price_sqm = EXCLUDED.avg_price_sqm,
  liquidity_index = EXCLUDED.liquidity_index,
  updated_at = now();
