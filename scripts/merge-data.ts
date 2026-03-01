#!/usr/bin/env npx tsx
/**
 * Pipeline Step 3: Merge Krisha + Korter data
 *
 * Usage: npx tsx scripts/merge-data.ts
 *
 * Reads krisha.json and korter.json, matches complexes by normalized name
 * (exact match → Levenshtein fuzzy match), and merges:
 *   - District, coordinates, developer, price → from Krisha
 *   - Class, wall_material                    → from Korter (priority)
 *
 * Output: scripts/final-complexes.json
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Types ───────────────────────────────────────────────────────────────────

type HousingClass = "elite" | "business_plus" | "business" | "comfort_plus" | "comfort" | "standard";

interface KrishaEntry {
  name: string;
  slug: string;
  district: string;
  developer: string | null;
  map_lat: number | null;
  map_lng: number | null;
  total_floors: number | null;
  avg_price_sqm: number | null;
  year_built: number | null;
  wall_material: string | null;
  class_raw: string | null;
  krisha_url: string;
  krisha_id: number | null;
  region: string;
}

interface KorterEntry {
  name: string;
  class: string | null;
  class_raw: string | null;
  wall_material: string | null;
  wall_raw: string | null;
  developer: string | null;
  total_floors: number | null;
  year_built: number | null;
  korter_url: string;
}

interface MergedComplex {
  name: string;
  district: string;
  developer: string | null;
  class: HousingClass;
  coefficient: number;
  map_lat: number | null;
  map_lng: number | null;
  total_floors: number | null;
  avg_price_sqm: number | null;
  year_built: number | null;
  wall_material: "panel" | "brick" | "monolith" | null;
  krisha_url: string | null;
  korter_url: string | null;
  krisha_id: number | null;
  source: "krisha+korter" | "krisha_only" | "korter_only";
  match_score: number | null; // similarity score for fuzzy matches
}

// ─── Coefficient Table ───────────────────────────────────────────────────────

const CLASS_COEFF: Record<HousingClass, number> = {
  elite: 2.0,
  business_plus: 1.7,
  business: 1.5,
  comfort_plus: 1.3,
  comfort: 1.15,
  standard: 1.0,
};

// ─── Name Normalization ──────────────────────────────────────────────────────

/**
 * Normalize a complex name for matching:
 * 1. Lowercase
 * 2. Remove "жк", "residence", "residences", "apartments"
 * 3. Remove district/city suffixes ("в алматы", "алматы")
 * 4. Remove common noise words
 * 5. Collapse whitespace, trim
 */
function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[«»"'()]/g, "")
    // Remove common prefixes/suffixes
    .replace(/\bжк\b/g, "")
    .replace(/\bresidence[s]?\b/gi, "")
    .replace(/\bapartment[s]?\b/gi, "")
    .replace(/\bв\s+алматы\b/g, "")
    .replace(/\bалматы\b/g, "")
    .replace(/\bалматинская\s+область\b/g, "")
    // Remove dashes between words for consistency
    .replace(/-/g, " ")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Levenshtein Distance ────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Use two-row approach for memory efficiency
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,     // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/**
 * Similarity score between 0 and 1 (1 = identical)
 */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ─── Map raw class string to our enum ────────────────────────────────────────

/**
 * Map a raw class string (from Krisha or Korter) to our HousingClass enum.
 * Roman numeral checks go from longest to shortest to avoid substring bugs
 * (e.g. "i класс" matching "iii класс").
 */
function mapClassRaw(raw: string | null, fallback: HousingClass = "comfort"): HousingClass {
  if (!raw) return fallback;
  const lower = raw.toLowerCase();

  // Check + variants first (more specific)
  if (lower.includes("бизнес+") || lower.includes("бизнес +")) return "business_plus";
  if (lower.includes("комфорт+") || lower.includes("комфорт +")) return "comfort_plus";

  // Roman numeral classes — check longest first to avoid substring matches
  if (lower.includes("iv класс")) return "standard";
  if (lower.includes("iii класс") || lower.includes("iii (")) return "comfort";
  if (lower.includes("ii класс")) return "business";
  if (lower.includes("i класс")) return "elite";

  // Text-based class names
  if (lower.includes("эконом")) return "standard";
  if (lower.includes("комфорт")) return "comfort";
  if (lower.includes("бизнес")) return "business";
  if (lower.includes("элит") || lower.includes("премиум")) return "elite";

  return fallback;
}

/** Alias for backward compatibility */
function mapKrishaClass(raw: string | null): HousingClass {
  return mapClassRaw(raw);
}

// ─── Map raw wall material ───────────────────────────────────────────────────

function mapWall(raw: string | null): "panel" | "brick" | "monolith" | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("панел")) return "panel";
  if (lower.includes("кирпич") && !lower.includes("монолит")) return "brick";
  if (lower.includes("монолит") || lower.includes("каркас")) return "monolith";
  return null;
}

// ─── Matching Logic ──────────────────────────────────────────────────────────

const EXACT_THRESHOLD = 1.0;
const FUZZY_THRESHOLD = 0.8; // minimum similarity to consider a match

interface MatchResult {
  korterIdx: number;
  score: number;
}

function findBestMatch(
  krishaName: string,
  korterNames: string[],
  usedKorter: Set<number>
): MatchResult | null {
  const normK = normalizeName(krishaName);
  let bestIdx = -1;
  let bestScore = 0;

  for (let i = 0; i < korterNames.length; i++) {
    if (usedKorter.has(i)) continue;

    const normC = korterNames[i];
    const score = similarity(normK, normC);

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }

    // Short-circuit on exact match
    if (score === EXACT_THRESHOLD) break;
  }

  if (bestIdx >= 0 && bestScore >= FUZZY_THRESHOLD) {
    return { korterIdx: bestIdx, score: bestScore };
  }

  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log("🔀 Merge Pipeline — Step 3");
  console.log("=".repeat(50) + "\n");

  // Load data
  const krishaPath = resolve(__dirname, "krisha.json");
  const korterPath = resolve(__dirname, "korter.json");

  if (!existsSync(krishaPath)) {
    console.error("✗ krisha.json not found. Run scrape-krisha.ts first.");
    process.exit(1);
  }
  if (!existsSync(korterPath)) {
    console.error("✗ korter.json not found. Run scrape-korter.ts first.");
    process.exit(1);
  }

  const krisha: KrishaEntry[] = JSON.parse(readFileSync(krishaPath, "utf-8"));
  const korter: KorterEntry[] = JSON.parse(readFileSync(korterPath, "utf-8"));

  console.log(`📋 Krisha: ${krisha.length} complexes`);
  console.log(`📋 Korter: ${korter.length} complexes\n`);

  // Pre-normalize Korter names
  const korterNormalized = korter.map((k) => normalizeName(k.name));

  // Track which Korter entries have been matched
  const usedKorter = new Set<number>();
  const merged: MergedComplex[] = [];

  let matched = 0;
  let krishaOnly = 0;

  // Phase 1: Match each Krisha entry to a Korter entry
  console.log("Phase 1: Matching Krisha → Korter...\n");

  for (const k of krisha) {
    const match = findBestMatch(k.name, korterNormalized, usedKorter);

    if (match) {
      usedKorter.add(match.korterIdx);
      const c = korter[match.korterIdx];
      matched++;

      // Merge: District from Krisha, class + wall_material from Korter
      // Always re-map from class_raw to avoid stale pre-mapped values
      const cls = mapClassRaw(c.class_raw, mapClassRaw(k.class_raw));
      const wall = (c.wall_material as "panel" | "brick" | "monolith" | null) ?? mapWall(k.wall_material);

      merged.push({
        name: k.name, // Krisha name (canonical)
        district: k.district,
        developer: k.developer || c.developer,
        class: cls,
        coefficient: CLASS_COEFF[cls],
        map_lat: k.map_lat,
        map_lng: k.map_lng,
        total_floors: k.total_floors || c.total_floors,
        avg_price_sqm: k.avg_price_sqm,
        year_built: k.year_built || c.year_built,
        wall_material: wall,
        krisha_url: k.krisha_url,
        korter_url: c.korter_url,
        krisha_id: k.krisha_id,
        source: "krisha+korter",
        match_score: Math.round(match.score * 100) / 100,
      });

      if (match.score < 1.0) {
        console.log(`  ≈ "${k.name}" ↔ "${c.name}" (score: ${match.score.toFixed(2)})`);
      }
    } else {
      krishaOnly++;
      const cls = mapKrishaClass(k.class_raw);

      merged.push({
        name: k.name,
        district: k.district,
        developer: k.developer,
        class: cls,
        coefficient: CLASS_COEFF[cls],
        map_lat: k.map_lat,
        map_lng: k.map_lng,
        total_floors: k.total_floors,
        avg_price_sqm: k.avg_price_sqm,
        year_built: k.year_built,
        wall_material: mapWall(k.wall_material),
        krisha_url: k.krisha_url,
        korter_url: null,
        krisha_id: k.krisha_id,
        source: "krisha_only",
        match_score: null,
      });
    }
  }

  // Phase 2: Add unmatched Korter entries (Korter-only)
  let korterOnly = 0;

  for (let i = 0; i < korter.length; i++) {
    if (usedKorter.has(i)) continue;

    const c = korter[i];
    if (!c.name) continue;
    korterOnly++;

    const cls = mapClassRaw(c.class_raw);

    merged.push({
      name: c.name,
      district: "Алматы", // Korter doesn't always have district
      developer: c.developer,
      class: cls,
      coefficient: CLASS_COEFF[cls],
      map_lat: null,
      map_lng: null,
      total_floors: c.total_floors,
      avg_price_sqm: null,
      year_built: c.year_built,
      wall_material: (c.wall_material as "panel" | "brick" | "monolith" | null) ?? null,
      krisha_url: null,
      korter_url: c.korter_url,
      krisha_id: null,
      source: "korter_only",
      match_score: null,
    });
  }

  // Stats
  console.log(`\n${"=".repeat(50)}`);
  console.log(`✓ Matched (both sources): ${matched}`);
  console.log(`  Krisha-only:            ${krishaOnly}`);
  console.log(`  Korter-only:            ${korterOnly}`);
  console.log(`  Total merged:           ${merged.length}`);

  const byClass: Record<string, number> = {};
  for (const m of merged) byClass[m.class] = (byClass[m.class] || 0) + 1;
  console.log("\nBy class:");
  for (const [cls, n] of Object.entries(byClass).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cls}: ${n}`);
  }

  const bySource: Record<string, number> = {};
  for (const m of merged) bySource[m.source] = (bySource[m.source] || 0) + 1;
  console.log("\nBy source:");
  for (const [src, n] of Object.entries(bySource)) console.log(`  ${src}: ${n}`);

  const withCoords = merged.filter((m) => m.map_lat && m.map_lng).length;
  const withPrice = merged.filter((m) => m.avg_price_sqm).length;
  const withWall = merged.filter((m) => m.wall_material).length;
  console.log(`\nData coverage:`);
  console.log(`  coordinates:   ${withCoords}/${merged.length}`);
  console.log(`  avg_price_sqm: ${withPrice}/${merged.length}`);
  console.log(`  wall_material: ${withWall}/${merged.length}`);

  // Save
  const outPath = resolve(__dirname, "final-complexes.json");
  writeFileSync(outPath, JSON.stringify(merged, null, 2), "utf-8");
  console.log(`\n📁 Saved → ${outPath}`);
}

main();
