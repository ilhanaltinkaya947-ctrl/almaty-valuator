#!/usr/bin/env npx tsx
/**
 * Pipeline Step 4: Import merged complexes into DB
 *
 * Usage: npx tsx scripts/import-db.ts
 *
 * Reads final-complexes.json and POSTs each to /api/v1/automation/sync-complex.
 * Then upserts curated complexes (hand-tuned coefficients take priority).
 *
 * Environment variables:
 *   API_URL             — default: https://almavykup.org.kz/api/v1/automation/sync-complex
 *   AUTOMATION_API_KEY  — default: almavykup-auto-2026-secret
 */

import { readFileSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────

const API_URL =
  process.env.API_URL || "https://almavykup.org.kz/api/v1/automation/sync-complex";
const API_KEY =
  process.env.AUTOMATION_API_KEY || "almavykup-auto-2026-secret";
const DELAY = 100; // ms between requests

// ─── Types ───────────────────────────────────────────────────────────────────

interface MergedComplex {
  name: string;
  district: string;
  developer: string | null;
  class: string;
  coefficient: number;
  map_lat: number | null;
  map_lng: number | null;
  total_floors: number | null;
  avg_price_sqm: number | null;
  year_built: number | null;
  wall_material: string | null;
  krisha_url: string | null;
  krisha_id: number | null;
  source: string;
}

interface SyncPayload {
  name: string;
  district: string;
  developer?: string;
  class: string;
  coefficient: number;
  year_built?: number;
  total_floors?: number;
  map_lat?: number;
  map_lng?: number;
  avg_price_sqm?: number;
  krisha_url?: string;
  wall_material?: string;
  krisha_complex_id?: number;
}

// ─── Curated complexes with hand-tuned coefficients ──────────────────────────
// These override scraped data on conflict (upsert on name).

const CURATED: SyncPayload[] = [
  { name: "Esentai City", district: "Медеуский", developer: "Capital Partners", class: "elite", coefficient: 2.2, year_built: 2015, total_floors: 22, map_lat: 43.2185, map_lng: 76.9296, avg_price_sqm: 1624000, krisha_url: "https://krisha.kz/complex/esentai-city", wall_material: "monolith" },
  { name: "Ritz Carlton Residences", district: "Медеуский", developer: "Capital Partners", class: "elite", coefficient: 2.0, year_built: 2013, total_floors: 18, map_lat: 43.2201, map_lng: 76.9351, avg_price_sqm: 1476600, krisha_url: "https://krisha.kz/complex/ritz-carlton-residences", wall_material: "monolith" },
  { name: "Almaty Towers", district: "Медеуский", developer: "Basis Gold", class: "elite", coefficient: 1.9, year_built: 2016, total_floors: 35, map_lat: 43.2380, map_lng: 76.9457, avg_price_sqm: 1402770, krisha_url: "https://krisha.kz/complex/almaty-towers", wall_material: "monolith" },
  { name: "Metropole", district: "Бостандыкский", developer: "Bazis-A", class: "business_plus", coefficient: 1.8, year_built: 2020, total_floors: 25, map_lat: 43.2330, map_lng: 76.9100, avg_price_sqm: 1328940, krisha_url: "https://krisha.kz/complex/metropole", wall_material: "monolith" },
  { name: "AFD Riviera", district: "Бостандыкский", developer: "AFD Group", class: "business_plus", coefficient: 1.7, year_built: 2023, total_floors: 24, map_lat: 43.2290, map_lng: 76.8950, avg_price_sqm: 1255110, krisha_url: "https://krisha.kz/complex/afd-riviera", wall_material: "monolith" },
  { name: "Тенгри Тауэр", district: "Медеуский", developer: "Tengri Development", class: "business_plus", coefficient: 1.7, year_built: 2017, total_floors: 32, map_lat: 43.2400, map_lng: 76.9500, avg_price_sqm: 1255110, krisha_url: "https://krisha.kz/complex/tengri-tower", wall_material: "monolith" },
  { name: "Premium Tower", district: "Медеуский", developer: "Basis Gold", class: "business_plus", coefficient: 1.65, year_built: 2018, total_floors: 28, map_lat: 43.2350, map_lng: 76.9420, avg_price_sqm: 1218195, krisha_url: "https://krisha.kz/complex/premium-tower", wall_material: "monolith" },
  { name: "Park Avenue", district: "Бостандыкский", developer: "Bazis-A", class: "business_plus", coefficient: 1.6, year_built: 2019, total_floors: 20, map_lat: 43.2310, map_lng: 76.9030, avg_price_sqm: 1181280, krisha_url: "https://krisha.kz/complex/park-avenue", wall_material: "monolith" },
  { name: "Golden Square", district: "Алмалинский", developer: "Golden Group", class: "business_plus", coefficient: 1.6, year_built: 2021, total_floors: 27, map_lat: 43.2560, map_lng: 76.9350, avg_price_sqm: 1181280, krisha_url: "https://krisha.kz/complex/golden-square", wall_material: "monolith" },
  { name: "Botanical Garden Residence", district: "Бостандыкский", developer: "Grupo Verde", class: "business_plus", coefficient: 1.55, year_built: 2024, total_floors: 18, map_lat: 43.2240, map_lng: 76.9120, avg_price_sqm: 1144365, krisha_url: "https://krisha.kz/complex/botanical-garden-residence", wall_material: "monolith" },
  { name: "Orion", district: "Алмалинский", developer: "BI Group", class: "business", coefficient: 1.5, year_built: 2021, total_floors: 30, map_lat: 43.2520, map_lng: 76.9280, avg_price_sqm: 1107450, krisha_url: "https://krisha.kz/complex/orion", wall_material: "monolith" },
  { name: "Clover House", district: "Бостандыкский", developer: "Bazis-A", class: "business", coefficient: 1.45, year_built: 2021, total_floors: 22, map_lat: 43.2280, map_lng: 76.9080, avg_price_sqm: 1070535, krisha_url: "https://krisha.kz/complex/clover-house", wall_material: "monolith" },
  { name: "Highvill", district: "Наурызбайский", developer: "BI Group", class: "business", coefficient: 1.4, year_built: 2022, total_floors: 16, map_lat: 43.2050, map_lng: 76.8420, avg_price_sqm: 1033620, krisha_url: "https://krisha.kz/complex/highvill", wall_material: "monolith" },
  { name: "Nova Residence", district: "Бостандыкский", developer: "Nova Build", class: "business", coefficient: 1.4, year_built: 2024, total_floors: 19, map_lat: 43.2260, map_lng: 76.9050, avg_price_sqm: 1033620, krisha_url: "https://krisha.kz/complex/nova-residence", wall_material: "monolith" },
  { name: "Baiseitova 104", district: "Алмалинский", developer: "Nova Build", class: "business", coefficient: 1.35, year_built: 2022, total_floors: 12, map_lat: 43.2580, map_lng: 76.9400, avg_price_sqm: 996705, krisha_url: "https://krisha.kz/complex/baiseitova-104", wall_material: "brick" },
  { name: "Манхэттен", district: "Бостандыкский", developer: "BI Group", class: "business", coefficient: 1.35, year_built: 2018, total_floors: 22, map_lat: 43.2270, map_lng: 76.8980, avg_price_sqm: 996705, krisha_url: "https://krisha.kz/complex/manhattan", wall_material: "monolith" },
  { name: "Manhattan Astana", district: "Алмалинский", developer: "BI Group", class: "comfort_plus", coefficient: 1.3, year_built: 2020, total_floors: 25, map_lat: 43.2540, map_lng: 76.9320, avg_price_sqm: 959790, krisha_url: "https://krisha.kz/complex/manhattan-astana", wall_material: "monolith" },
  { name: "Green Park", district: "Бостандыкский", developer: "Delta Construction", class: "comfort_plus", coefficient: 1.25, year_built: 2019, total_floors: 14, map_lat: 43.2250, map_lng: 76.9000, avg_price_sqm: 922875, krisha_url: "https://krisha.kz/complex/green-park", wall_material: "monolith" },
  { name: "Sky City", district: "Ауэзовский", developer: "BI Group", class: "comfort", coefficient: 1.15, year_built: 2023, total_floors: 20, map_lat: 43.2150, map_lng: 76.8600, avg_price_sqm: 849045, krisha_url: "https://krisha.kz/complex/sky-city", wall_material: "monolith" },
  { name: "Асыл Арман", district: "Алатауский", developer: "BI Group", class: "comfort", coefficient: 1.1, year_built: 2022, total_floors: 12, map_lat: 43.1980, map_lng: 76.8200, avg_price_sqm: 812130, krisha_url: "https://krisha.kz/complex/asyl-arman", wall_material: "panel" },
  { name: "Сауран Палас", district: "Ауэзовский", developer: "Standard Build", class: "standard", coefficient: 1.0, year_built: 2015, total_floors: 9, map_lat: 43.2100, map_lng: 76.8500, avg_price_sqm: 738300, krisha_url: "https://krisha.kz/complex/sauran-palas", wall_material: "panel" },
  { name: "Жетысу-2", district: "Ауэзовский", class: "standard", coefficient: 0.9, year_built: 1988, total_floors: 9, map_lat: 43.2420, map_lng: 76.8730, avg_price_sqm: 664470, wall_material: "panel" },
  { name: "Аксай-3", district: "Ауэзовский", class: "standard", coefficient: 0.85, year_built: 1985, total_floors: 5, map_lat: 43.2180, map_lng: 76.8400, avg_price_sqm: 627555, wall_material: "panel" },
  { name: "Орбита-1", district: "Бостандыкский", class: "standard", coefficient: 1.05, year_built: 1980, total_floors: 12, map_lat: 43.2200, map_lng: 76.8900, avg_price_sqm: 775215, wall_material: "panel" },
  { name: "Самал-2", district: "Медеуский", class: "standard", coefficient: 1.15, year_built: 1990, total_floors: 14, map_lat: 43.2320, map_lng: 76.9200, avg_price_sqm: 849045, wall_material: "panel" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function syncComplex(payload: SyncPayload): Promise<{ action?: string; error?: string }> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(payload),
  });

  return (await res.json()) as { action?: string; error?: string };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("📦 DB Import — Step 4 of Pipeline");
  console.log("=".repeat(50) + "\n");
  console.log(`API: ${API_URL}\n`);

  const jsonPath = resolve(__dirname, "final-complexes.json");

  if (!existsSync(jsonPath)) {
    console.error("✗ final-complexes.json not found. Run merge-data.ts first.");
    process.exit(1);
  }

  const complexes: MergedComplex[] = JSON.parse(readFileSync(jsonPath, "utf-8"));
  console.log(`📋 Loaded ${complexes.length} merged complexes\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // ── Phase 1: Import merged/scraped data ──
  console.log("Phase 1: Importing merged complexes...\n");

  for (let i = 0; i < complexes.length; i++) {
    const c = complexes[i];

    if (!c.name || !c.district) {
      skipped++;
      continue;
    }

    const payload: SyncPayload = {
      name: c.name,
      district: c.district,
      class: c.class,
      coefficient: c.coefficient,
    };

    if (c.developer) payload.developer = c.developer;
    if (c.year_built) payload.year_built = c.year_built;
    if (c.total_floors) payload.total_floors = c.total_floors;
    if (c.map_lat) payload.map_lat = c.map_lat;
    if (c.map_lng) payload.map_lng = c.map_lng;
    if (c.avg_price_sqm) payload.avg_price_sqm = c.avg_price_sqm;
    if (c.krisha_url) payload.krisha_url = c.krisha_url;
    if (c.wall_material) payload.wall_material = c.wall_material;
    if (c.krisha_id) payload.krisha_complex_id = c.krisha_id;

    try {
      const result = await syncComplex(payload);
      if (result.action === "created") {
        created++;
        process.stdout.write(`  [${i + 1}/${complexes.length}] ✓ ${c.name} (created)\n`);
      } else if (result.action === "updated") {
        updated++;
        process.stdout.write(`  [${i + 1}/${complexes.length}] ✓ ${c.name} (updated)\n`);
      } else {
        errors++;
        console.log(`  [${i + 1}/${complexes.length}] ✗ ${c.name}: ${result.error || "unknown error"}`);
      }
    } catch (err) {
      errors++;
      console.log(`  [${i + 1}/${complexes.length}] ✗ ${c.name}: ${err}`);
    }

    await sleep(DELAY);
  }

  // ── Phase 2: Upsert curated complexes (hand-tuned coefficients win) ──
  console.log("\nPhase 2: Upserting curated complexes (priority)...\n");

  for (let i = 0; i < CURATED.length; i++) {
    const payload = CURATED[i];

    try {
      const result = await syncComplex(payload);
      if (result.action === "created") {
        created++;
      } else if (result.action === "updated") {
        updated++;
      } else {
        errors++;
      }
      process.stdout.write(
        `  [${i + 1}/${CURATED.length}] ✓ ${payload.name} (${result.action || "error"})\n`
      );
    } catch (err) {
      errors++;
      console.log(`  [${i + 1}/${CURATED.length}] ✗ ${payload.name}: ${err}`);
    }

    await sleep(DELAY);
  }

  // Summary
  console.log(`\n${"=".repeat(50)}`);
  console.log(`✓ Created: ${created}`);
  console.log(`✓ Updated: ${updated}`);
  console.log(`⊘ Skipped: ${skipped}`);
  console.log(`✗ Errors:  ${errors}`);
  console.log(`Total:     ${created + updated + skipped + errors}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
