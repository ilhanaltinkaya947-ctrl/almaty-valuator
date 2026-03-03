# Telegram Bot (Telegraf.js)

## Purpose
Mirror of the landing calculator for internal agents. Allows brokers to quickly evaluate properties and create leads from Telegram.

## Packages
```bash
npm install telegraf
```

## Bot Setup
```typescript
// telegram-bot/index.ts
import { Telegraf, Markup } from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Whitelist of authorized Telegram user IDs (from Supabase config)
const AUTHORIZED_IDS: number[] = []; // populated from DB at startup
```

## Commands

### /start
```typescript
bot.command("start", (ctx) => {
  ctx.reply(
    "🏠 *Almaty Valuator Bot*\n\n" +
    "Быстрая оценка квартир в Алматы.\n\n" +
    "Команды:\n" +
    "/eval — Оценить квартиру\n" +
    "/search — Найти ЖК\n" +
    "/lead — Создать лид\n" +
    "/stats — Статистика",
    { parse_mode: "Markdown" }
  );
});
```

### /eval — Interactive evaluation
Use conversational flow with Telegraf scenes or inline keyboards:
```typescript
bot.command("eval", async (ctx) => {
  // Step 1: Ask for ЖК name
  ctx.reply("Введите название ЖК или часть названия:");
  // Then use bot.on("text") with session state to walk through:
  // Step 2: Select from matching results (inline keyboard)
  // Step 3: Area input
  // Step 4: Floor input
  // Step 5: View selection (inline keyboard)
  // Step 6: Condition selection (inline keyboard)
  // Step 7: Show result
});
```

### Quick eval format
Allow one-liner for experienced agents:
```
/eval Metropole 85 12 mountain euro
```
Parse: ЖК name, area m², floor, view, condition.

```typescript
bot.command("eval", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);

  if (args.length >= 5) {
    // Quick mode: /eval [ЖК] [area] [floor] [view] [condition]
    const [complexName, areaStr, floorStr, view, condition] = args;
    // Find complex, calculate, reply
  } else if (args.length === 0) {
    // Interactive mode
    ctx.reply("Введите название ЖК:");
  } else {
    ctx.reply("Формат: /eval [ЖК] [площадь] [этаж] [вид] [состояние]\nПример: /eval Metropole 85 12 mountain euro");
  }
});
```

### /search — Find ЖК
```typescript
bot.command("search", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) return ctx.reply("Использование: /search [название]");

  const results = await searchComplexes(query); // Supabase query

  if (results.length === 0) return ctx.reply("Ничего не найдено.");

  const text = results.slice(0, 5).map((c) =>
    `*${c.name}* (×${c.coefficient})\n${c.district} · ${c.class} · ${c.developer}`
  ).join("\n\n");

  ctx.reply(text, { parse_mode: "Markdown" });
});
```

### /lead — Create lead manually
```typescript
bot.command("lead", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  // /lead +77771234567 Metropole 85
  if (args.length < 1) {
    return ctx.reply("Формат: /lead [телефон] [ЖК] [площадь]");
  }
  // Create lead in Supabase, reply with confirmation
});
```

### /stats — Daily/weekly summary
```typescript
bot.command("stats", async (ctx) => {
  const today = await getLeadCount("today");
  const week = await getLeadCount("week");
  const month = await getLeadCount("month");

  ctx.reply(
    `📊 *Статистика лидов*\n\n` +
    `Сегодня: ${today}\n` +
    `За неделю: ${week}\n` +
    `За месяц: ${month}`,
    { parse_mode: "Markdown" }
  );
});
```

## Result Message Format
```typescript
function formatResult(complex: Complex, result: EvaluationResult, area: number, floor: number): string {
  return [
    `🏠 *${complex.name}*`,
    `${complex.district} · ${complex.class}`,
    ``,
    `💰 *${formatPrice(result.total)} ₸*`,
    `📐 ${formatPrice(result.pricePerSqm)} ₸/м²`,
    ``,
    `📊 Факторы:`,
    `• ЖК: ×${result.factors.kComplex}`,
    `• Этаж ${floor}: ×${result.factors.kFloor.toFixed(2)}`,
    `• Год ${complex.yearBuilt}: ×${result.factors.kYear.toFixed(2)}`,
    `• Вид: ×${result.factors.kView.toFixed(2)}`,
    `• Состояние: ×${result.factors.kCondition.toFixed(2)}`,
  ].join("\n");
}
```

## Inline Keyboards for Selections
```typescript
// View selection
Markup.inlineKeyboard([
  [Markup.button.callback("🏔️ Горы", "view_mountain"), Markup.button.callback("🌳 Парк", "view_park")],
  [Markup.button.callback("🏙️ Город", "view_city"), Markup.button.callback("🏭 Промзона", "view_industrial")],
]);

// Condition selection
Markup.inlineKeyboard([
  [Markup.button.callback("✨ Дизайн", "cond_designer"), Markup.button.callback("🔧 Евро", "cond_euro")],
  [Markup.button.callback("👍 Хороший", "cond_good"), Markup.button.callback("📦 Средний", "cond_average")],
  [Markup.button.callback("🧱 Черновой", "cond_rough")],
]);
```

## Deployment
Two options:

### Option A: Webhook (recommended for production)
```typescript
// In Next.js API route: app/api/telegram/webhook/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  await bot.handleUpdate(body);
  return new Response("OK");
}

// Set webhook on deploy:
// curl -F "url=https://yourdomain.kz/api/telegram/webhook" https://api.telegram.org/bot<TOKEN>/setWebhook
```

### Option B: Long polling (development)
```typescript
// telegram-bot/index.ts — run as separate process
bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
```
Run with: `npx tsx telegram-bot/index.ts`

## Authorization
Only whitelisted Telegram IDs can use the bot:
```typescript
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId || !AUTHORIZED_IDS.includes(userId)) {
    return ctx.reply("⛔ Доступ закрыт. Обратитесь к администратору.");
  }
  return next();
});
```
Store authorized IDs in Supabase `config` table, key `telegram_whitelist`.
