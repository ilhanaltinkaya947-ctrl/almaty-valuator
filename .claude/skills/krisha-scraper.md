# Krisha.kz Data Scraping

## Purpose
Weekly automated scraping of krisha.kz to keep ЖК pricing data fresh. This is a core competitive advantage — real market data instead of static estimates.

## Strategy
1. For each ЖК in `complexes` table, search krisha.kz for active sale listings
2. Extract: price, area, floor, rooms, date posted
3. Calculate aggregates: avg price/m², median, listing count
4. Update Supabase: `complexes.avg_price_sqm`, `complexes.liquidity_index`, `complexes.coefficient`
5. Store raw snapshots in `krisha_snapshots` for historical trends

## Tech Stack
- **HTTP:** `fetch` or `axios` with custom headers
- **HTML Parsing:** `cheerio` (jQuery-like server-side DOM)
- **Runtime:** Node.js script via `tsx` (TypeScript execution)
- **Scheduling:** Cron on VPS (`0 3 * * 1` — Monday 3 AM)

## Packages
```bash
npm install cheerio axios
npm install -D tsx
```

## Krisha.kz URL Patterns
```
# Search apartments for sale in specific ЖК
https://krisha.kz/prodazha/kvartiry/almaty/?das[live.complex]=COMPLEX_ID

# Search by district
https://krisha.kz/prodazha/kvartiry/almaty-bostandykskij/

# Pagination
https://krisha.kz/prodazha/kvartiry/almaty/?page=2

# Sort by date (newest first)
https://krisha.kz/prodazha/kvartiry/almaty/?das[live.complex]=123&sort_by=added
```

## Scraper Implementation Pattern
```typescript
import axios from "axios";
import * as cheerio from "cheerio";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
};

// Rate limiting: 2-3 seconds between requests
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface Listing {
  price: number;
  area: number;
  pricePerSqm: number;
  rooms: number;
  floor: number;
  totalFloors: number;
  postedDate: string;
  url: string;
}

async function scrapeComplexListings(searchUrl: string): Promise<Listing[]> {
  const listings: Listing[] = [];

  // Scrape up to 3 pages per ЖК
  for (let page = 1; page <= 3; page++) {
    const url = `${searchUrl}&page=${page}`;
    const { data: html } = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(html);

    // Krisha.kz listing cards
    $(".a-card").each((_, el) => {
      const priceText = $(el).find(".a-card__price").text().trim();
      const price = parseInt(priceText.replace(/\s/g, ""), 10);

      const paramsText = $(el).find(".a-card__text-preview").text();
      // Extract area, rooms, floor from params text
      // Pattern: "2-комн. квартира, 65 м², 7/16 этаж"

      const areaMatch = paramsText.match(/([\d,.]+)\s*м²/);
      const floorMatch = paramsText.match(/(\d+)\/(\d+)\s*этаж/);
      const roomsMatch = paramsText.match(/(\d+)-комн/);

      if (price && areaMatch) {
        const area = parseFloat(areaMatch[1].replace(",", "."));
        listings.push({
          price,
          area,
          pricePerSqm: Math.round(price / area),
          rooms: roomsMatch ? parseInt(roomsMatch[1]) : 0,
          floor: floorMatch ? parseInt(floorMatch[1]) : 0,
          totalFloors: floorMatch ? parseInt(floorMatch[2]) : 0,
          postedDate: $(el).find(".a-card__stats-date").text().trim(),
          url: "https://krisha.kz" + $(el).find("a.a-card__title").attr("href"),
        });
      }
    });

    // Check if there's a next page
    if ($(".paginator__btn--next").length === 0) break;
    await delay(2500); // Rate limit
  }

  return listings;
}
```

## Data Processing
```typescript
function calculateAggregates(listings: Listing[]) {
  if (listings.length === 0) return null;

  const prices = listings.map(l => l.pricePerSqm).sort((a, b) => a - b);

  // Remove outliers (bottom 10%, top 10%)
  const trimmed = prices.slice(
    Math.floor(prices.length * 0.1),
    Math.ceil(prices.length * 0.9)
  );

  const avg = Math.round(trimmed.reduce((s, p) => s + p, 0) / trimmed.length);
  const median = trimmed[Math.floor(trimmed.length / 2)];

  // Liquidity: more listings = higher liquidity (0-1 scale)
  // 0 listings = 0.3 (minimum), 20+ = 0.95
  const liquidity = Math.min(0.95, 0.3 + (listings.length / 20) * 0.65);

  return { avg, median, listingCount: listings.length, liquidity: Math.round(liquidity * 100) / 100 };
}
```

## Supabase Update
```typescript
async function updateComplex(complexId: string, aggregates: ReturnType<typeof calculateAggregates>, baseRate: number) {
  if (!aggregates) return;

  const newCoefficient = Math.round((aggregates.avg / baseRate) * 100) / 100;

  await supabaseAdmin
    .from("complexes")
    .update({
      avg_price_sqm: aggregates.avg,
      liquidity_index: aggregates.liquidity,
      coefficient: Math.max(0.5, Math.min(3.0, newCoefficient)), // clamp
      updated_at: new Date().toISOString(),
    })
    .eq("id", complexId);

  // Store snapshot for trends
  await supabaseAdmin
    .from("krisha_snapshots")
    .insert({
      complex_id: complexId,
      avg_price_sqm: aggregates.avg,
      median_price_sqm: aggregates.median,
      listing_count: aggregates.listingCount,
      scraped_at: new Date().toISOString(),
    });
}
```

## Critical Rules
- **Rate limit:** Minimum 2.5 seconds between requests. Never parallelize.
- **Headers:** Always send realistic User-Agent.
- **Error handling:** If krisha.kz returns 403/429, stop immediately. Log and retry next week.
- **Data validation:** Ignore listings with price < 5M tenge or > 500M tenge (outliers/errors).
- **Logging:** Console log every ЖК processed with count + avg price.
- **Idempotent:** Script can be run multiple times safely — uses upsert logic.
- **Never scrape more than 200 pages per run.**

## Cron Setup (VPS)
```bash
# /etc/crontab or crontab -e
0 3 * * 1 cd /app && npx tsx scripts/scrape-krisha.ts >> /var/log/krisha-scraper.log 2>&1
```

## Additional Supabase Table
```sql
CREATE TABLE krisha_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complex_id UUID REFERENCES complexes(id),
  avg_price_sqm INTEGER,
  median_price_sqm INTEGER,
  listing_count INTEGER,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_snapshots_complex ON krisha_snapshots(complex_id, scraped_at DESC);
```
