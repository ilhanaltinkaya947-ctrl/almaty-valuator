#!/usr/bin/env npx tsx
/**
 * Pipeline Step 1: Scrape ЖК from krisha.kz
 *
 * Usage: npx tsx scripts/scrape-krisha.ts
 *
 * Scrapes listing pages for Almaty (~263 complexes) and Almaty region (~84),
 * then fetches each detail page to extract structured data from window.data.
 *
 * Output: scripts/krisha.json
 */

import * as cheerio from "cheerio";
import { writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE = "https://krisha.kz";
const LISTING_DELAY = 500;
const DETAIL_DELAY = 300;
const MAX_RETRIES = 3;

const REGIONS: { name: string; url: string; maxPages: number }[] = [
  { name: "almaty", url: "/complex/search/almaty/", maxPages: 25 },
  { name: "almaty-region", url: "/complex/search/?regionAlias=almatinskaja-oblast", maxPages: 10 },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface KrishaComplex {
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
  class_raw: string | null;        // raw Krisha class string, e.g. "эконом"
  krisha_url: string;
  krisha_id: number | null;
  region: string;
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

function normalizeDistrict(raw: string | null | undefined): string {
  if (!raw) return "Алматы";
  // "Алатауский р-н" → "Алатауский"
  return raw.replace(/\s*р-н\s*$/i, "").replace(/\s*район\s*$/i, "").trim() || "Алматы";
}

function parseYear(raw: unknown): number | null {
  if (raw == null) return null;
  const m = String(raw).match(/(\d{4})/);
  return m ? parseInt(m[1]) : null;
}

function cleanName(raw: string): string {
  return raw
    .replace(/^ЖК\s+/i, "")
    .replace(/\s+в\s+Алматы$/i, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Step 1: Collect all complex URLs from listing pages ─────────────────────

interface ListingEntry {
  slug: string;
  path: string;   // e.g. /complex/show/almaty/kaspii/
  region: string;
}

async function scrapeListings(): Promise<ListingEntry[]> {
  const entries: ListingEntry[] = [];
  const seen = new Set<string>();

  for (const region of REGIONS) {
    console.log(`\n📋 Region: ${region.name}`);
    let emptyStreak = 0;

    for (let page = 1; page <= region.maxPages; page++) {
      const sep = region.url.includes("?") ? "&" : "?";
      const url = `${BASE}${region.url}${sep}page=${page}`;
      console.log(`  Page ${page}: ${url}`);

      try {
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        let found = 0;

        // Krisha uses <a href="/complex/show/almaty/slug/"> on listing cards
        $('a[href*="/complex/show/"]').each((_, el) => {
          const href = $(el).attr("href");
          if (!href) return;

          const slug = href.replace(/\/$/, "").split("/").pop() || "";
          if (!slug || seen.has(slug)) return;

          seen.add(slug);
          entries.push({ slug, path: href, region: region.name });
          found++;
        });

        console.log(`  → ${found} new (total: ${entries.length})`);

        if (found === 0 && ++emptyStreak >= 2) {
          console.log(`  → Stopping pagination for ${region.name}`);
          break;
        } else if (found > 0) {
          emptyStreak = 0;
        }
      } catch (err) {
        console.error(`  ✗ Page ${page} failed: ${err}`);
      }

      await sleep(LISTING_DELAY);
    }
  }

  return entries;
}

// ─── Step 2: Scrape each detail page ─────────────────────────────────────────

/**
 * Krisha detail pages embed `window.data = { complex: { ... } }` in a <script> tag.
 * Known fields in window.data.complex:
 *   name, address, map{lat, lon}, type, class, floorNum, priceSquareFrom, id
 * Developer is shown in HTML near "Застройщик" label.
 */
function extractWindowDataComplex(html: string): Record<string, unknown> | null {
  const $ = cheerio.load(html);
  let result: Record<string, unknown> | null = null;

  $("script").each((_, el) => {
    const text = $(el).html();
    if (!text || !text.includes("window.data")) return;

    // Try to extract the JSON object assigned to window.data
    const match = text.match(/window\.data\s*=\s*(\{[\s\S]*?\})\s*;?\s*(?:<\/script>|$)/);
    if (!match) return;

    try {
      const parsed = JSON.parse(match[1]) as Record<string, unknown>;
      // The data might be the complex directly or nested under .complex
      result = (parsed.complex as Record<string, unknown>) ?? parsed;
    } catch {
      // Malformed JSON — try a broader extraction
      const fallback = text.match(/window\.data\s*=\s*(\{[^;]+\})\s*;/);
      if (fallback) {
        try {
          const parsed = JSON.parse(fallback[1]) as Record<string, unknown>;
          result = (parsed.complex as Record<string, unknown>) ?? parsed;
        } catch { /* skip */ }
      }
    }
  });

  return result;
}

function extractDeveloperFromHtml(html: string): string | null {
  const $ = cheerio.load(html);
  // Look for "Застройщик" label followed by a link or text
  let developer: string | null = null;

  $("*").each((_, el) => {
    const text = $(el).text().trim();
    if (text === "Застройщик" || text === "Девелопер") {
      // The value is usually the next sibling or parent's next element
      const next = $(el).next().text().trim();
      if (next && next.length > 1 && next.length < 100) {
        developer = next;
        return false; // break
      }
      const parent = $(el).parent();
      const parentNext = parent.next().text().trim();
      if (parentNext && parentNext.length > 1 && parentNext.length < 100) {
        developer = parentNext;
        return false;
      }
    }
  });

  return developer;
}

async function scrapeDetail(entry: ListingEntry): Promise<KrishaComplex | null> {
  const url = `${BASE}${entry.path}`;
  try {
    const html = await fetchPage(url);
    const wd = extractWindowDataComplex(html);
    const $ = cheerio.load(html);

    // ── Name ──
    const name = cleanName(
      (wd?.name as string) || $("h1").first().text() || entry.slug.replace(/-/g, " ")
    );

    // ── District from address field ──
    const address = (wd?.address as string) || "";
    // "Алматы, Алатауский р-н, 20-й микрорайон" → extract district part
    const districtMatch = address.match(/([\wа-яА-ЯёЁ-]+(?:ский|ский|ауский)\s*р-н)/i);
    const district = normalizeDistrict(districtMatch?.[1] ?? null);

    // ── Coordinates ──
    const mapObj = wd?.map as Record<string, unknown> | undefined;
    const map_lat = mapObj?.lat ? Number(mapObj.lat) : null;
    const map_lng = (mapObj?.lon ?? mapObj?.lng) ? Number(mapObj?.lon ?? mapObj?.lng) : null;

    // ── Floors ──
    const total_floors = wd?.floorNum ? Number(wd.floorNum) : null;

    // ── Price per m² ──
    const avg_price_sqm = wd?.priceSquareFrom ? Math.round(Number(wd.priceSquareFrom)) : null;

    // ── Year ──
    const year_built = parseYear(wd?.deadline ?? wd?.yearBuilt ?? wd?.year_built);

    // ── Building type (raw) ──
    const wall_material = (wd?.type as string) ?? null; // "монолитный", "панельный", etc.

    // ── Class (raw) ──
    const class_raw = (wd?.class as string) ?? null; // "эконом", "комфорт", etc.

    // ── Developer ──
    const developer =
      (wd?.developer as string) ?? (wd?.builderName as string) ?? extractDeveloperFromHtml(html);

    // ── Krisha ID ──
    const krisha_id = (wd?.id ?? wd?.complexId) ? Number(wd?.id ?? wd?.complexId) : null;

    return {
      name,
      slug: entry.slug,
      district,
      developer,
      map_lat,
      map_lng,
      total_floors,
      avg_price_sqm,
      year_built,
      wall_material,
      class_raw,
      krisha_url: url,
      krisha_id,
      region: entry.region,
    };
  } catch (err) {
    console.error(`  ✗ ${entry.slug}: ${err}`);
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🏗️  Krisha.kz Scraper — Step 1 of Pipeline");
  console.log("=".repeat(50) + "\n");

  // Step 1: listing pages
  const listings = await scrapeListings();
  console.log(`\n✓ Total listings found: ${listings.length}\n`);

  if (listings.length === 0) {
    console.error("✗ No listings found. Check network / krisha.kz accessibility.");
    process.exit(1);
  }

  // Step 2: detail pages
  console.log("Scraping detail pages...\n");
  const results: KrishaComplex[] = [];
  let failed = 0;

  for (let i = 0; i < listings.length; i++) {
    const entry = listings[i];
    process.stdout.write(`  [${i + 1}/${listings.length}] ${entry.slug}... `);

    const data = await scrapeDetail(entry);
    if (data) {
      results.push(data);
      console.log(`✓ ${data.name} (${data.district})`);
    } else {
      failed++;
      console.log("✗ skip");
    }

    if (i < listings.length - 1) await sleep(DETAIL_DELAY);
  }

  // Stats
  console.log(`\n${"=".repeat(50)}`);
  console.log(`✓ Scraped: ${results.length}`);
  console.log(`✗ Failed:  ${failed}`);

  const byRegion: Record<string, number> = {};
  for (const c of results) byRegion[c.region] = (byRegion[c.region] || 0) + 1;
  console.log("\nBy region:");
  for (const [r, n] of Object.entries(byRegion)) console.log(`  ${r}: ${n}`);

  // Save
  const outPath = resolve(__dirname, "krisha.json");
  writeFileSync(outPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\n📁 Saved → ${outPath}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
