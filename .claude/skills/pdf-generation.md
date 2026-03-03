# PDF Report Generation

## Purpose
Server-side generation of premium valuation reports using @react-pdf/renderer. These PDFs are the core conversion tool — sent via WhatsApp to capture and nurture leads.

## Packages
```bash
npm install @react-pdf/renderer
```

## Architecture
PDF components live in `src/components/pdf/`. They use React but are SERVER-ONLY — never imported in client components.

Generation happens in API route `app/api/pdf/route.ts`:
```typescript
import ReactPDF from "@react-pdf/renderer";
import { ReportDocument } from "@/components/pdf/ReportDocument";

export async function POST(request: Request) {
  const data = await request.json();
  const stream = await ReactPDF.renderToStream(<ReportDocument data={data} />);
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${data.complexName}.pdf"`,
    },
  });
}
```

## Report Structure (5 Blocks)

### Block 1: Паспорт объекта
- ЖК name, class badge, district
- Developer, year built, total floors
- ЖК facade image (from Supabase Storage URL)
- Static map via Google Static Maps API:
```
https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x200&markers=color:red|${lat},${lng}&key=${API_KEY}
```

### Block 2: Ценовой анализ
- Large price display: "48 500 000 ₸"
- Price per m²: comparison bar (district avg vs this ЖК)
- Factor chips: "+10% вид на горы", "+5% средний этаж", etc.
- Each factor shows its coefficient value

### Block 3: Сравнение с аналогами
- Table of 3-4 comparable apartments
- Source: same ЖК or same class ± same district from krisha.kz data
- Columns: ЖК, Площадь, Этаж, Цена, Цена/м², Дата
- Liquidity index bar for the selected ЖК

### Block 4: Аналитика застройщика
- Developer name + completed projects count
- Historical price dynamics (text description, NOT chart)
- LEGAL: Use "историческая динамика цен" never "прогноз"
- Example: "За последние 12 месяцев средняя цена в ЖК Metropole выросла на 8.5%"

### Block 5: Call to Action
- Broker photo placeholder (round avatar)
- Broker name + title
- Direct WhatsApp deeplink: `https://wa.me/7700XXXXXXX?text=...`
- CTA: "Хотите продать по этой цене? Получите бесплатную консультацию"
- Disclaimer: "Данная оценка носит информационный характер и не является официальным заключением"

## Component Pattern
```typescript
import { Document, Page, Text, View, StyleSheet, Image, Font, Link } from "@react-pdf/renderer";

// Register Cyrillic font
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf", fontWeight: 300 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf", fontWeight: 400 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf", fontWeight: 500 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: 700 },
  ],
});

const colors = {
  bg: "#0B0E17",
  card: "#121829",
  accent: "#4A90D9",
  gold: "#C9A961",
  text: "#E8ECF4",
  textMuted: "#8892A8",
  border: "#1E2A45",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    padding: 40,
    fontFamily: "Roboto",
    color: colors.text,
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.gold,
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceMain: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.gold,
    marginBottom: 4,
  },
  pricePerSqm: {
    fontSize: 12,
    color: colors.accent,
  },
  factorChip: {
    flexDirection: "row",
    backgroundColor: "#4A90D915",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  disclaimer: {
    fontSize: 7,
    color: colors.textMuted,
    marginTop: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
});
```

## Image Handling
For remote images (ЖК photos, maps), @react-pdf fetches them at render time:
```tsx
<Image src={complex.imageUrl} style={{ width: 200, height: 130, borderRadius: 6 }} />
```
If image fails to load, use a fallback solid-color placeholder.

For the Google Static Map:
```tsx
<Image
  src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&maptype=roadmap&markers=color:0x4A90D9|${lat},${lng}&style=feature:all|element:geometry|color:0x1A1A2E&style=feature:water|color:0x121829&key=${process.env.GOOGLE_MAPS_API_KEY}`}
  style={{ width: "100%", height: 120, borderRadius: 6 }}
/>
```

## Testing PDF Output
Create a test route `app/api/pdf/test/route.ts` that generates a sample PDF with hardcoded data and returns it directly (viewable in browser). Use this during development.

## Performance
- PDF generation takes 2-5 seconds depending on images
- Cache generated PDFs in Supabase Storage
- Store URL in `evaluations.pdf_url`
- If same evaluation is requested again, serve cached version

## Fonts
CRITICAL: @react-pdf needs explicit font registration for Cyrillic characters. Without it, Russian text renders as boxes. Always register a font that supports Cyrillic (Roboto, Noto Sans, PT Sans).
