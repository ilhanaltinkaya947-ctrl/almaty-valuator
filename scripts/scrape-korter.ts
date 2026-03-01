#!/usr/bin/env npx tsx
/**
 * Pipeline Step 2: Scrape ЖК from korter.kz
 *
 * Usage: npx tsx scripts/scrape-korter.ts
 *
 * Primary goal: extract CLASS (элит/бизнес/комфорт/эконом)
 * and TECHNOLOGY (монолит/панель/кирпич) for each ЖК in Almaty.
 *
 * Source: korter.kz/новостройки-алматы (~254 complexes)
 * Data location: window.INITIAL_STATE on each detail page
 *
 * Output: scripts/korter.json
 */

import * as cheerio from "cheerio";
import { writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE = "https://korter.kz";
// URL with Cyrillic — fetch handles it fine
const LISTING_URL = `${BASE}/%D0%BD%D0%BE%D0%B2%D0%BE%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B8-%D0%B0%D0%BB%D0%BC%D0%B0%D1%82%D1%8B`;
const LISTING_DELAY = 500;
const DETAIL_DELAY = 400;
const MAX_RETRIES = 3;
const MAX_LISTING_PAGES = 20;

// ─── Types ───────────────────────────────────────────────────────────────────

interface KorterComplex {
  name: string;
  class: string | null;           // mapped to our enum: elite/business_plus/business/comfort_plus/comfort/standard
  class_raw: string | null;       // raw string from Korter, e.g. "III класс (комфорт)"
  wall_material: string | null;   // mapped: monolith/brick/panel
  wall_raw: string | null;        // raw string, e.g. "монолитно-каркасная"
  developer: string | null;
  total_floors: number | null;
  year_built: number | null;
  korter_url: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function fetchPage(url: string): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      console.error(`  [attempt ${attempt}/${MAX_RETRIES}] ${url}: ${err}`);
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * 2 ** (attempt - 1));
      } else {
        throw err;
      }
    }
  }
  throw new Error("unreachable");
}

// ─── Class Mapping ───────────────────────────────────────────────────────────

/**
 * Korter class strings:
 *   "I класс (элит)"    → elite
 *   "II класс (бизнес)" → business
 *   "III класс (комфорт)" → comfort
 *   "IV класс (эконом)" → standard
 *   Mixed: "III класс (комфорт), 6 блок – II класс (бизнес)" → take first
 *   Sometimes: "комфорт+", "бизнес+"
 */
function mapClass(raw: string | null): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();

  // Check for + variants first (more specific)
  if (lower.includes("бизнес+") || lower.includes("бизнес +")) return "business_plus";
  if (lower.includes("комфорт+") || lower.includes("комфорт +")) return "comfort_plus";

  // Roman numeral classes — check longest first to avoid substring matches
  // ("i класс" would match "ii класс", "iii класс", "iv класс" if checked first)
  if (lower.includes("эконом") || lower.includes("iv класс")) return "standard";
  if (lower.includes("комфорт") || lower.includes("iii класс")) return "comfort";
  if (lower.includes("бизнес") || lower.includes("ii класс")) return "business";
  if (lower.includes("элит") || lower.includes("i класс") || lower.includes("премиум")) return "elite";

  return null;
}

// ─── Wall Material Mapping ───────────────────────────────────────────────────

/**
 * Korter technology strings:
 *   "монолитно-каркасная" → monolith
 *   "монолитная" → monolith
 *   "панельная" → panel
 *   "кирпичная" → brick
 *   "монолитно-кирпичная" → monolith
 */
function mapWallMaterial(raw: string | null): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("панел")) return "panel";
  if (lower.includes("кирпич") && !lower.includes("монолит")) return "brick";
  if (lower.includes("монолит") || lower.includes("каркас")) return "monolith";
  return null;
}

function parseYear(raw: unknown): number | null {
  if (raw == null) return null;
  const m = String(raw).match(/(\d{4})/);
  return m ? parseInt(m[1]) : null;
}

function parseFloors(raw: string | null): number | null {
  if (!raw) return null;
  // "6–9–12" → take the max
  const nums = raw.match(/\d+/g);
  if (!nums) return null;
  return Math.max(...nums.map(Number));
}

function cleanName(raw: string): string {
  return raw
    .replace(/^ЖК\s+/i, "")
    .replace(/\s+в\s+Алматы$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Step 1: Collect all complex URLs from listing pages ─────────────────────

async function scrapeListings(): Promise<string[]> {
  const urls: string[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= MAX_LISTING_PAGES; page++) {
    const url = page === 1 ? LISTING_URL : `${LISTING_URL}?page=${page}`;
    console.log(`  Page ${page}: ${url}`);

    try {
      const html = await fetchPage(url);
      const $ = cheerio.load(html);
      let found = 0;

      // Korter detail links follow pattern: /жк-{name}-алматы
      // They are encoded as /%D0%B6%D0%BA-{slug}-%D0%B0%D0%BB%D0%BC%D0%B0%D1%82%D1%8B
      $("a").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;

        // Match both encoded and decoded Cyrillic patterns
        const decoded = decodeURIComponent(href);
        if (!decoded.match(/^\/жк-[^/]+-алматы$/i) && !decoded.match(/^\/жк-[^/]+-алматинская-область$/i)) {
          return;
        }

        // Normalize to full URL
        const fullUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        if (seen.has(fullUrl)) return;

        seen.add(fullUrl);
        urls.push(fullUrl);
        found++;
      });

      console.log(`  → ${found} new links (total: ${urls.length})`);

      // Also try extracting from INITIAL_STATE on listing page
      if (page === 1) {
        const stateLinks = extractLinksFromInitialState(html);
        for (const link of stateLinks) {
          const full = link.startsWith("http") ? link : `${BASE}${link}`;
          if (!seen.has(full)) {
            seen.add(full);
            urls.push(full);
          }
        }
        if (stateLinks.length > 0) {
          console.log(`  → +${stateLinks.length} from INITIAL_STATE (total: ${urls.length})`);
        }
      }

      if (found === 0 && page > 1) {
        console.log("  → No more results, stopping pagination");
        break;
      }
    } catch (err) {
      console.error(`  ✗ Page ${page} failed: ${err}`);
      if (page > 2) break; // likely no more pages
    }

    await sleep(LISTING_DELAY);
  }

  return urls;
}

function extractLinksFromInitialState(html: string): string[] {
  const links: string[] = [];

  try {
    const match = html.match(/window\.INITIAL_STATE\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/);
    if (!match) return links;

    const state = JSON.parse(match[1]);

    // Try common paths where building list might live
    const buildings =
      state?.searchStore?.buildings ??
      state?.buildingsStore?.buildings ??
      state?.catalogStore?.items ??
      [];

    if (Array.isArray(buildings)) {
      for (const b of buildings) {
        const slug = b?.slug ?? b?.url ?? b?.href;
        if (typeof slug === "string" && slug.length > 2) {
          const path = slug.startsWith("/") ? slug : `/${slug}`;
          links.push(path);
        }
      }
    }
  } catch {
    // INITIAL_STATE parsing failed — that's OK, we have HTML links
  }

  return links;
}

// ─── Step 2: Scrape each detail page ─────────────────────────────────────────

/**
 * Korter detail pages use window.INITIAL_STATE with this structure:
 *
 * buildingLandingStore.main.name → "ЖК Eco Park Alatau"
 * buildingLandingStore.main.developers[0].name → "ЭлитСтрой"
 * buildingLandingStore.attributes.house[] → [
 *   { name: "Класс", value: "IV класс (эконом)" },
 *   { name: "Технология строительства", value: "монолитно-каркасная" },
 *   { name: "Этажность", value: "9" },
 *   ...
 * ]
 */
async function scrapeDetail(url: string): Promise<KorterComplex | null> {
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    // ── Extract INITIAL_STATE ──
    let state: Record<string, unknown> | null = null;
    $("script").each((_, el) => {
      const text = $(el).html();
      if (!text || !text.includes("INITIAL_STATE")) return;

      const match = text.match(/window\.INITIAL_STATE\s*=\s*(\{[\s\S]*?\})\s*;?\s*$/m);
      if (match) {
        try {
          state = JSON.parse(match[1]);
        } catch { /* skip */ }
      }
    });

    const store = (state as unknown as Record<string, unknown>)?.buildingLandingStore as Record<string, unknown> | undefined;
    const main = store?.main as Record<string, unknown> | undefined;
    const attrs = store?.attributes as Record<string, unknown> | undefined;
    const houseAttrs = (attrs?.house ?? []) as Array<{ name: string; value: string }>;

    // ── Name ──
    const name = cleanName(
      (main?.name as string) ?? $("h1").first().text().trim() ?? ""
    );

    if (!name) return null;

    // ── Class ──
    const classAttr = houseAttrs.find((a) => a.name === "Класс");
    const class_raw = classAttr?.value ?? null;
    const cls = mapClass(class_raw);

    // ── Technology / Wall Material ──
    const techAttr = houseAttrs.find(
      (a) => a.name === "Технология строительства" || a.name === "Технология"
    );
    const wallAttr = houseAttrs.find((a) => a.name === "Стены");
    const wall_raw = techAttr?.value ?? wallAttr?.value ?? null;
    const wall_material = mapWallMaterial(wall_raw);

    // ── Developer ──
    const contactsStore = (state as unknown as Record<string, unknown>)?.contactsStore as Record<string, unknown> | undefined;
    const contactsMain = contactsStore?.main as Record<string, unknown> | undefined;
    const developers = (contactsMain?.developers ?? main?.developers ?? []) as Array<{ name: string }>;
    const developer = developers[0]?.name ?? null;

    // ── Floors ──
    const floorsAttr = houseAttrs.find((a) => a.name === "Этажность");
    const total_floors = parseFloors(floorsAttr?.value ?? null);

    // ── Year from LD+JSON ──
    let year_built: number | null = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const ld = JSON.parse($(el).html() || "");
        if (ld?.yearBuilt) year_built = parseYear(ld.yearBuilt);
      } catch { /* skip */ }
    });

    return {
      name,
      class: cls,
      class_raw,
      wall_material,
      wall_raw,
      developer,
      total_floors,
      year_built,
      korter_url: url,
    };
  } catch (err) {
    console.error(`  ✗ ${url}: ${err}`);
    return null;
  }
}

// ── Fallback: extract data from HTML when INITIAL_STATE is missing ──

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔍 Korter.kz Scraper — Step 2 of Pipeline");
  console.log("=".repeat(50) + "\n");

  // Step 1: collect all detail page URLs from listing
  console.log("Step 1: Scraping listing pages...\n");
  const detailUrls = await scrapeListings();
  console.log(`\n✓ Found ${detailUrls.length} complex URLs\n`);

  if (detailUrls.length === 0) {
    console.error("✗ No complex URLs found.");
    process.exit(1);
  }

  // Step 2: scrape detail pages
  console.log("Step 2: Scraping detail pages for class + technology...\n");
  const results: KorterComplex[] = [];
  let failed = 0;

  for (let i = 0; i < detailUrls.length; i++) {
    const url = detailUrls[i];
    const slug = decodeURIComponent(url.split("/").pop() || "");
    process.stdout.write(`  [${i + 1}/${detailUrls.length}] ${slug}... `);

    const data = await scrapeDetail(url);
    if (data && data.name) {
      results.push(data);
      console.log(`✓ ${data.name} → class=${data.class || "?"} wall=${data.wall_material || "?"}`);
    } else {
      failed++;
      console.log("✗ skip");
    }

    if (i < detailUrls.length - 1) await sleep(DETAIL_DELAY);
  }

  // Stats
  console.log(`\n${"=".repeat(50)}`);
  console.log(`✓ Scraped: ${results.length}`);
  console.log(`✗ Failed:  ${failed}`);

  const withClass = results.filter((r) => r.class).length;
  const withWall = results.filter((r) => r.wall_material).length;
  console.log(`\nData coverage:`);
  console.log(`  class:         ${withClass}/${results.length} (${Math.round((withClass / results.length) * 100)}%)`);
  console.log(`  wall_material: ${withWall}/${results.length} (${Math.round((withWall / results.length) * 100)}%)`);

  const byClass: Record<string, number> = {};
  for (const r of results) {
    const cls = r.class || "unknown";
    byClass[cls] = (byClass[cls] || 0) + 1;
  }
  console.log("\nBy class:");
  for (const [cls, n] of Object.entries(byClass).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cls}: ${n}`);
  }

  // Save
  const outPath = resolve(__dirname, "korter.json");
  writeFileSync(outPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\n📁 Saved → ${outPath}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
