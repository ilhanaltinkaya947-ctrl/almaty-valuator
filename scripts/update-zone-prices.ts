#!/usr/bin/env npx tsx
/**
 * Scrapes krisha.kz secondary market listings for 8 Almaty districts,
 * calculates median price per m², and updates price_zones in Supabase.
 *
 * Usage:
 *   npx tsx scripts/update-zone-prices.ts
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

// ─── Config ──────────────────────────────────────────────────────────────────

const REQUEST_DELAY_MS = 1500; // 1.5s between district requests
const MAX_RETRIES = 3;
const MAX_PAGES = 3; // scrape first 3 pages per district (~60 listings)

// 8 districts → krisha.kz URL slugs
const DISTRICT_MAP: { district: string; krishaSlug: string; zoneSlugs: string[] }[] = [
  {
    district: "Алмалинский",
    krishaSlug: "almaty-almalinskij",
    zoneSlugs: ["centr-arbat", "ploshchad-respubliki", "almaly-zhibek-zholy"],
  },
  {
    district: "Бостандыкский",
    krishaSlug: "almaty-bostandykskij",
    zoneSlugs: ["bostandyk-verhniy", "almagul-kazakhfilm", "orbita-sayran", "tastak"],
  },
  {
    district: "Ауэзовский",
    krishaSlug: "almaty-aujezovskij",
    zoneSlugs: ["mamyr-saina", "orbita-auezov", "aksay", "zhetysu", "mikrorayony"],
  },
  {
    district: "Медеуский",
    krishaSlug: "almaty-medeuskij",
    zoneSlugs: ["medeu-verhniy", "dostyk-koridor", "samal-zholdasbekova", "koktobe-remizovka"],
  },
  {
    district: "Наурызбайский",
    krishaSlug: "almaty-nauryzbajskiy",
    zoneSlugs: ["nurlytau-remizovka", "nauryzbay", "kalkaman-duman"],
  },
  {
    district: "Жетысуский",
    krishaSlug: "almaty-zhetysuskij",
    zoneSlugs: ["taugul-zhandosova", "ainabulak"],
  },
  {
    district: "Турксибский",
    krishaSlug: "almaty-turksibskij",
    zoneSlugs: ["turksib", "altyn-orda"],
  },
  {
    district: "Алатауский",
    krishaSlug: "almaty-alatauskij",
    zoneSlugs: ["alatau-verhniy", "alatau-nizhniy"],
  },
];

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

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

// ─── Scraper ─────────────────────────────────────────────────────────────────

interface ListingData {
  price: number;
  area: number;
  pricePerSqm: number;
}

/**
 * Parse listing cards from a krisha.kz search results page.
 * Extracts price and area from each card to compute price/m².
 */
function parseListings(html: string): ListingData[] {
  const $ = cheerio.load(html);
  const results: ListingData[] = [];

  $(".a-card").each((_, el) => {
    const card = $(el);

    // Price — strip all whitespace including non-breaking spaces (\u00a0)
    const priceText = card.find(".a-card__price").first().text().replace(/[\s\u00a0]/g, "");
    const priceMatch = priceText.match(/([\d]+)/);
    if (!priceMatch) return;
    const price = parseInt(priceMatch[1]);
    if (price < 1_000_000 || price > 1_000_000_000) return; // skip outliers

    // Area — extract from title/header like "2-комн. квартира · 65 м²"
    const headerText = card.find(".a-card__header-left, .a-card__title").first().text();
    const areaMatch = headerText.match(/([\d.,]+)[\s\u00a0]*м/);
    if (!areaMatch) return;
    const area = parseFloat(areaMatch[1].replace(",", "."));
    if (area < 10 || area > 500) return; // skip outliers

    const pricePerSqm = Math.round(price / area);
    if (pricePerSqm < 200_000 || pricePerSqm > 3_000_000) return; // skip outliers

    results.push({ price, area, pricePerSqm });
  });

  return results;
}

async function scrapeDistrict(krishaSlug: string): Promise<ListingData[]> {
  const allListings: ListingData[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://krisha.kz/prodazha/kvartiry/${krishaSlug}/?page=${page}`;
    try {
      const html = await fetchPage(url);
      const listings = parseListings(html);
      allListings.push(...listings);

      if (listings.length === 0) break; // no more results

      if (page < MAX_PAGES) await sleep(500);
    } catch (err) {
      console.error(`  Failed page ${page} for ${krishaSlug}: ${err}`);
      break;
    }
  }

  return allListings;
}

// ─── Supabase ────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  return createClient(url, key);
}

// ─── Main ────────────────────────────────────────────────────────────────────

interface UpdateResult {
  zone: string;
  slug: string;
  oldPrice: number;
  newPrice: number;
  change: string;
}

async function main() {
  console.log("=".repeat(60));
  console.log("  Krisha.kz Zone Price Updater (Вторичка)");
  console.log("=".repeat(60));
  console.log();

  const supabase = getSupabase();

  // Fetch current zones from DB
  const { data: zones, error: zonesError } = await supabase
    .from("price_zones")
    .select("id, name, slug, district, avg_price_sqm, coefficient")
    .eq("is_active", true)
    .order("sort_order");

  if (zonesError || !zones) {
    console.error("Failed to fetch zones:", zonesError);
    process.exit(1);
  }

  const zoneMap = new Map(zones.map((z) => [z.slug, z]));
  const updates: UpdateResult[] = [];

  for (let i = 0; i < DISTRICT_MAP.length; i++) {
    const entry = DISTRICT_MAP[i];
    console.log(`\n[${ i + 1}/${DISTRICT_MAP.length}] ${entry.district} (${entry.krishaSlug})`);

    const listings = await scrapeDistrict(entry.krishaSlug);
    const prices = listings.map((l) => l.pricePerSqm);
    const districtMedian = median(prices);

    console.log(`  Объявлений: ${listings.length} | Медиана: ${districtMedian.toLocaleString("ru-RU")} тг/м²`);

    if (listings.length < 5) {
      console.log(`  Слишком мало данных, пропускаю обновление`);
      continue;
    }

    // Update each zone in this district
    // Zones within a district keep their relative spread:
    // new_zone_price = districtMedian × (old_zone_price / old_district_avg)
    const districtZones = entry.zoneSlugs
      .map((slug) => zoneMap.get(slug))
      .filter((z) => z != null);

    if (districtZones.length === 0) continue;

    const oldDistrictAvg =
      districtZones.reduce((sum, z) => sum + z.avg_price_sqm, 0) / districtZones.length;

    for (const zone of districtZones) {
      // Proportional scaling: keep zone's relative position within district
      const ratio = oldDistrictAvg > 0 ? zone.avg_price_sqm / oldDistrictAvg : 1;
      const newPrice = Math.round(districtMedian * ratio);

      // Update DB
      const { error: updateError } = await supabase
        .from("price_zones")
        .update({ avg_price_sqm: newPrice })
        .eq("id", zone.id);

      if (updateError) {
        console.error(`  DB update failed for ${zone.slug}: ${updateError.message}`);
        continue;
      }

      // Insert snapshot
      await supabase.from("zone_price_snapshots").insert({
        zone_id: zone.id,
        avg_price_sqm: newPrice,
        median_price_sqm: districtMedian,
        listing_count: listings.length,
      });

      const changePct = oldDistrictAvg > 0
        ? (((newPrice - zone.avg_price_sqm) / zone.avg_price_sqm) * 100).toFixed(1)
        : "0.0";
      const changeStr = Number(changePct) >= 0 ? `+${changePct}%` : `${changePct}%`;

      updates.push({
        zone: zone.name,
        slug: zone.slug,
        oldPrice: zone.avg_price_sqm,
        newPrice,
        change: changeStr,
      });
    }

    // Rate limit between districts
    if (i < DISTRICT_MAP.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  // ── Results table ──
  console.log("\n" + "=".repeat(60));
  console.log("  РЕЗУЛЬТАТЫ ОБНОВЛЕНИЯ ЦЕН");
  console.log("=".repeat(60));
  console.log();
  console.log(
    "Район".padEnd(28) +
    "Старая".padStart(12) +
    "Новая".padStart(12) +
    "Δ".padStart(9)
  );
  console.log("-".repeat(61));

  for (const u of updates) {
    console.log(
      u.zone.padEnd(28) +
      u.oldPrice.toLocaleString("ru-RU").padStart(12) +
      u.newPrice.toLocaleString("ru-RU").padStart(12) +
      u.change.padStart(9)
    );
  }

  console.log("-".repeat(61));
  console.log(`Обновлено зон: ${updates.length}`);
  console.log();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
