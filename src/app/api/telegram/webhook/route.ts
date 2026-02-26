import { NextRequest, NextResponse } from "next/server";
import {
  sendMessage,
  editMessage,
  answerCallback,
  getAgent,
  isAdmin,
  type InlineKeyboard,
} from "@/lib/telegram";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type AgentRow = Database["public"]["Tables"]["authorized_agents"]["Row"];

// ── Telegram Update Types ──

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  text?: string;
  from?: TelegramUser;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

// ── Status Labels ──

const STATUS_LABELS: Record<string, string> = {
  new: "🆕 Новый",
  pending_review: "🚨 Ожидает оценки",
  contacted: "📞 На связи",
  in_progress: "🔄 В работе",
  closed_won: "🏆 Закрыт (выиграно)",
  closed_lost: "📦 Архив",
};

/**
 * POST /api/telegram/webhook
 * Handles messages + callback queries from inline buttons.
 */
export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();

    // Handle callback queries (inline button presses)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return NextResponse.json({ ok: true });
    }

    // Handle text messages / commands
    if (update.message?.text && update.message.from) {
      await handleMessage(update.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}

// ── Message Handler ──

async function handleMessage(msg: TelegramMessage) {
  const chatId = String(msg.chat.id);
  const telegramId = msg.from!.id;
  const text = msg.text!.trim();

  // Check agent authorization
  const agent = await getAgent(telegramId);
  if (!agent) {
    await sendMessage(chatId, "⛔ Доступ ограничен. Обратитесь к администратору для получения доступа.");
    return;
  }

  // Parse command and args
  const [command, ...args] = text.split(/\s+/);
  const cmd = command.toLowerCase();

  switch (cmd) {
    case "/start":
      await handleStart(chatId, agent);
      break;
    case "/stats":
      await handleStats(chatId);
      break;
    case "/leads":
      await handleLeads(chatId);
      break;
    case "/set_base":
      await handleSetBase(chatId, agent, args);
      break;
    case "/edit_complex":
      await handleEditComplex(chatId, agent, args);
      break;
    case "/search":
      await handleSearch(chatId, args);
      break;
    case "/crm":
      await handleCrm(chatId);
      break;
    case "/price":
      await handleSetPrice(chatId, agent, args);
      break;
    case "/pending":
      await handlePendingReview(chatId);
      break;
    default:
      await sendMessage(chatId, "Неизвестная команда. Введите /start для списка команд.");
  }
}

// ── Callback Query Handler (Inline Buttons) ──

async function handleCallbackQuery(query: TelegramCallbackQuery) {
  const telegramId = query.from.id;
  const data = query.data ?? "";
  const chatId = query.message?.chat.id;
  const messageId = query.message?.message_id;

  // Check authorization
  const agent = await getAgent(telegramId);
  if (!agent) {
    await answerCallback(query.id, "⛔ Нет доступа");
    return;
  }

  // Parse: lead:action:leadId
  const parts = data.split(":");
  if (parts[0] !== "lead" || parts.length < 3) {
    await answerCallback(query.id, "Неизвестное действие");
    return;
  }

  const action = parts[1];
  const leadId = parts[2];

  const supabase = createAdminClient();

  // Fetch lead
  const { data: rawLead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  const lead = rawLead as LeadRow | null;
  if (!lead) {
    await answerCallback(query.id, "Лид не найден");
    return;
  }

  // Special case: setprice prompts broker to send /price command
  if (action === "setprice") {
    await answerCallback(query.id);
    if (chatId) {
      await sendMessage(chatId, [
        `💰 <b>Назначение цены для лида ${lead.name ?? lead.phone}</b>`,
        "",
        `Отправьте команду:`,
        `<code>/price ${leadId} [сумма]</code>`,
        "",
        `Пример: <code>/price ${leadId} 25000000</code>`,
      ].join("\n"));
    }
    return;
  }

  let newStatus: string;
  let notification: string;

  switch (action) {
    case "claim":
      newStatus = "contacted";
      notification = `✅ ${agent.name} взял в работу`;
      break;
    case "progress":
      newStatus = "in_progress";
      notification = `🔄 ${agent.name} перевёл в работу`;
      break;
    case "won":
      newStatus = "closed_won";
      notification = `🏆 ${agent.name} закрыл (выиграно)`;
      break;
    case "lost":
      newStatus = "closed_lost";
      notification = `📦 ${agent.name} отправил в архив`;
      break;
    default:
      await answerCallback(query.id, "Неизвестное действие");
      return;
  }

  // Update lead in DB
  const updateData: Record<string, unknown> = {
    status: newStatus,
  };
  if (action === "claim") {
    updateData.contacted_at = new Date().toISOString();
  }

  await supabase.from("leads").update(updateData).eq("id", leadId);

  // Update the message to reflect new status
  if (chatId && messageId) {
    const price = lead.estimated_price
      ? new Intl.NumberFormat("ru-RU").format(lead.estimated_price) + " ₸"
      : "—";

    const updatedText = [
      `📢 <b>Лид</b> — ${STATUS_LABELS[newStatus] ?? newStatus}`,
      "",
      `👤 <b>Имя:</b> ${lead.name ?? "—"}`,
      `🏢 <b>ЖК:</b> ${lead.complex_id ?? "—"}`,
      `💰 <b>Оценка:</b> ${price}`,
      `📞 <b>Телефон:</b> ${lead.phone}`,
      "",
      `👷 <b>Ответственный:</b> ${agent.name}`,
      `🕐 ${new Date().toLocaleString("ru-RU", { timeZone: "Asia/Almaty" })}`,
    ].join("\n");

    // Keep WhatsApp button, update status buttons
    const waPhone = lead.phone.replace(/\D/g, "");
    const waText = encodeURIComponent("Здравствуйте! Я ваш менеджер из Алмавыкуп.");
    const keyboard: InlineKeyboard = [
      [{ text: "💬 WhatsApp", url: `https://wa.me/${waPhone}?text=${waText}` }],
    ];

    // If not archived/closed, keep action buttons
    if (newStatus !== "closed_won" && newStatus !== "closed_lost") {
      keyboard.push([
        { text: "📋 В работу", callback_data: `lead:progress:${leadId}` },
        { text: "🏆 Закрыть", callback_data: `lead:won:${leadId}` },
        { text: "📦 Архив", callback_data: `lead:lost:${leadId}` },
      ]);
    }

    await editMessage(chatId, messageId, updatedText, keyboard).catch(() => {});
  }

  await answerCallback(query.id, notification);
}

// ── Command Handlers ──

async function handleStart(chatId: string, agent: AgentRow) {
  const adminCommands = isAdmin(agent)
    ? [
        "",
        "<b>Админ:</b>",
        "/set_base [число] — Изменить базовую ставку",
        "/edit_complex [ЖК] [коэфф] — Изменить коэффициент ЖК",
      ].join("\n")
    : "";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://almavykup.kz";

  await sendMessage(chatId, [
    `👋 Привет, <b>${agent.name}</b>! (${agent.role})`,
    "",
    "<b>Команды:</b>",
    "/stats — Сводка за сегодня",
    "/leads — Последние 5 заявок",
    "/pending — Заявки на ручной расчёт",
    "/search [ЖК] — Поиск жилого комплекса",
    "/price [id] [сумма] — Назначить цену",
    `/crm — Открыть CRM`,
    adminCommands,
  ].join("\n"), {
    replyMarkup: [[
      { text: "📊 Открыть CRM", url: `${appUrl}/mobile` },
    ]],
  });
}

async function handleStats(chatId: string) {
  const supabase = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: allLeads } = await supabase.from("leads").select("*");
  const leads = (allLeads ?? []) as LeadRow[];

  const newToday = leads.filter(
    (l) => new Date(l.created_at) >= today,
  ).length;

  const byStatus = {
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    in_progress: leads.filter((l) => l.status === "in_progress").length,
    closed_won: leads.filter((l) => l.status === "closed_won").length,
    closed_lost: leads.filter((l) => l.status === "closed_lost").length,
  };

  const totalValue = leads.reduce(
    (sum, l) => sum + (l.estimated_price ?? 0),
    0,
  );

  const text = [
    "📊 <b>Статистика</b>",
    "",
    `📥 Новых сегодня: <b>${newToday}</b>`,
    `📋 Всего лидов: <b>${leads.length}</b>`,
    "",
    `🆕 Новые: ${byStatus.new}`,
    `📞 На связи: ${byStatus.contacted}`,
    `🔄 В работе: ${byStatus.in_progress}`,
    `🎉 Закрытые (выиграно): ${byStatus.closed_won}`,
    `❌ Закрытые (проиграно): ${byStatus.closed_lost}`,
    "",
    `💰 Общая оценка: <b>${new Intl.NumberFormat("ru-RU").format(totalValue)} ₸</b>`,
  ].join("\n");

  await sendMessage(chatId, text);
}

async function handleLeads(chatId: string) {
  const supabase = createAdminClient();

  const { data: rawLeads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const leads = (rawLeads ?? []) as LeadRow[];

  if (leads.length === 0) {
    await sendMessage(chatId, "Заявок пока нет.");
    return;
  }

  const lines = leads.map((l, i) => {
    const date = new Date(l.created_at).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    const price = l.estimated_price
      ? new Intl.NumberFormat("ru-RU").format(l.estimated_price) + " ₸"
      : "—";
    const statusLabel = STATUS_LABELS[l.status] ?? l.status;
    return [
      `<b>${i + 1}. ${l.name ?? "—"}</b>`,
      `   📞 ${l.phone} | 💰 ${price}`,
      `   📅 ${date} | ${statusLabel}`,
    ].join("\n");
  });

  await sendMessage(chatId, [
    "📋 <b>Последние 5 заявок</b>",
    "",
    ...lines,
  ].join("\n"));
}

// ── Admin Commands ──

async function handleSetBase(chatId: string, agent: AgentRow, args: string[]) {
  if (!isAdmin(agent)) {
    await sendMessage(chatId, "⛔ Эта команда доступна только администраторам.");
    return;
  }

  const value = parseInt(args[0]);
  if (!value || value < 100000 || value > 5000000) {
    await sendMessage(chatId, "Использование: /set_base [число]\nПример: /set_base 805000\n\nДиапазон: 100 000 — 5 000 000 тг/м²");
    return;
  }

  const supabase = createAdminClient();
  await supabase
    .from("system_settings")
    .update({ value_numeric: value })
    .eq("key", "base_rate");

  await sendMessage(chatId, [
    "✅ <b>Базовая ставка обновлена</b>",
    "",
    `Новое значение: <b>${new Intl.NumberFormat("ru-RU").format(value)} ₸/м²</b>`,
    "",
    `Изменил: ${agent.name}`,
    `Время: ${new Date().toLocaleString("ru-RU", { timeZone: "Asia/Almaty" })}`,
  ].join("\n"));
}

async function handleEditComplex(chatId: string, agent: AgentRow, args: string[]) {
  if (!isAdmin(agent)) {
    await sendMessage(chatId, "⛔ Эта команда доступна только администраторам.");
    return;
  }

  if (args.length < 2) {
    await sendMessage(chatId, "Использование: /edit_complex [название ЖК] [коэффициент]\nПример: /edit_complex Esentai City 2.30\n\nДиапазон коэффициента: 0.50 — 3.00");
    return;
  }

  const coeff = parseFloat(args[args.length - 1]);
  const complexName = args.slice(0, -1).join(" ");

  if (isNaN(coeff) || coeff < 0.5 || coeff > 3.0) {
    await sendMessage(chatId, "❌ Коэффициент должен быть числом от 0.50 до 3.00");
    return;
  }

  const supabase = createAdminClient();

  // Fuzzy match complex name
  const { data: complexes } = await supabase
    .from("complexes")
    .select("id, name, coefficient")
    .ilike("name", `%${complexName}%`)
    .limit(1);

  const matches = (complexes ?? []) as { id: string; name: string; coefficient: number }[];

  if (matches.length === 0) {
    await sendMessage(chatId, `❌ ЖК «${complexName}» не найден. Используйте /search для поиска.`);
    return;
  }

  const complex = matches[0];
  const oldCoeff = complex.coefficient;

  await supabase
    .from("complexes")
    .update({ coefficient: coeff })
    .eq("id", complex.id);

  await sendMessage(chatId, [
    "✅ <b>Коэффициент обновлён</b>",
    "",
    `🏢 <b>ЖК:</b> ${complex.name}`,
    `📉 Было: ${oldCoeff}`,
    `📈 Стало: <b>${coeff}</b>`,
    "",
    `Изменил: ${agent.name}`,
  ].join("\n"));
}

async function handleSearch(chatId: string, args: string[]) {
  if (args.length === 0) {
    await sendMessage(chatId, "Использование: /search [название ЖК]\nПример: /search Esentai");
    return;
  }

  const query = args.join(" ");
  const supabase = createAdminClient();

  const { data: complexes } = await supabase
    .from("complexes")
    .select("*")
    .ilike("name", `%${query}%`)
    .limit(5);

  type ComplexRow = Database["public"]["Tables"]["complexes"]["Row"];
  const results = (complexes ?? []) as ComplexRow[];

  if (results.length === 0) {
    await sendMessage(chatId, `🔍 По запросу «${query}» ничего не найдено.`);
    return;
  }

  const CLASS_LABELS: Record<string, string> = {
    elite: "Elite",
    business_plus: "Business+",
    business: "Business",
    comfort_plus: "Comfort+",
    comfort: "Comfort",
    standard: "Standard",
  };

  const lines = results.map((c) => {
    const avgPrice = c.avg_price_sqm
      ? new Intl.NumberFormat("ru-RU").format(c.avg_price_sqm) + " ₸/м²"
      : "—";
    return [
      `🏢 <b>${c.name}</b>`,
      `   📍 ${c.district} | ${CLASS_LABELS[c.class] ?? c.class}`,
      `   📊 Коэфф: <b>${c.coefficient}</b> | 💰 ${avgPrice}`,
      `   🏗 ${c.year_built ?? "—"} г. | ${c.total_floors ?? "—"} эт.`,
      `   📈 Ликвидность: ${c.liquidity_index ? (c.liquidity_index * 100).toFixed(0) + "%" : "—"}`,
    ].join("\n");
  });

  await sendMessage(chatId, [
    `🔍 <b>Результаты поиска: «${query}»</b>`,
    "",
    ...lines,
  ].join("\n"));
}

async function handleCrm(chatId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://almavykup.kz";

  await sendMessage(chatId, "📊 Откройте CRM для работы с лидами:", {
    replyMarkup: [[
      { text: "📊 Открыть CRM", url: `${appUrl}/mobile` },
    ]],
  });
}

// ── Manual Review Commands ──

async function handlePendingReview(chatId: string) {
  const supabase = createAdminClient();

  const { data: rawLeads } = await supabase
    .from("leads")
    .select("*")
    .eq("needs_manual_review", true)
    .in("status", ["pending_review", "new", "contacted"])
    .order("created_at", { ascending: false })
    .limit(10);

  const leads = (rawLeads ?? []) as LeadRow[];

  if (leads.length === 0) {
    await sendMessage(chatId, "✅ Нет заявок, ожидающих ручного расчёта.");
    return;
  }

  const PROPERTY_TYPE_LABELS: Record<string, string> = {
    house: "🏠 Дом",
    commercial: "🏗 Коммерция",
    land: "🌍 Участок",
  };

  const lines = leads.map((l, i) => {
    const typeLabel = PROPERTY_TYPE_LABELS[l.property_type ?? ""] ?? l.property_type ?? "—";
    const offerStr = l.offer_price
      ? `✅ ${new Intl.NumberFormat("ru-RU").format(l.offer_price)} ₸`
      : "⏳ Не назначена";
    const date = new Date(l.created_at).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    return [
      `<b>${i + 1}. ${l.name ?? "—"}</b> — ${typeLabel}`,
      `   📞 ${l.phone}`,
      `   💰 Оферта: ${offerStr}`,
      `   📅 ${date}`,
      `   <code>/price ${l.id} [сумма]</code>`,
    ].join("\n");
  });

  await sendMessage(chatId, [
    "🚨 <b>Заявки на ручной расчёт</b>",
    "",
    ...lines,
  ].join("\n"));
}

async function handleSetPrice(chatId: string, agent: AgentRow, args: string[]) {
  if (args.length < 2) {
    await sendMessage(chatId, "Использование: /price [lead_id] [сумма]\nПример: /price abc123 25000000");
    return;
  }

  const leadId = args[0];
  const price = parseInt(args[1]);

  if (isNaN(price) || price < 1000000 || price > 10000000000) {
    await sendMessage(chatId, "❌ Цена должна быть числом от 1 000 000 до 10 000 000 000 тг");
    return;
  }

  const supabase = createAdminClient();

  const { data: rawLead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  const lead = rawLead as LeadRow | null;
  if (!lead) {
    await sendMessage(chatId, "❌ Лид не найден. Проверьте ID.");
    return;
  }

  // Update offer_price and move to contacted if pending_review
  const updateData: Record<string, unknown> = {
    offer_price: price,
  };
  if (lead.status === "pending_review" || lead.status === "new") {
    updateData.status = "contacted";
    updateData.contacted_at = new Date().toISOString();
  }

  await supabase.from("leads").update(updateData).eq("id", leadId);

  const formattedPrice = new Intl.NumberFormat("ru-RU").format(price);

  await sendMessage(chatId, [
    "✅ <b>Цена назначена!</b>",
    "",
    `👤 <b>Клиент:</b> ${lead.name ?? "—"}`,
    `📞 <b>Телефон:</b> ${lead.phone}`,
    `🏠 <b>Тип:</b> ${lead.property_type ?? "—"}`,
    `💰 <b>Оферта:</b> ${formattedPrice} ₸`,
    "",
    `👷 Назначил: ${agent.name}`,
  ].join("\n"));

  // Send WhatsApp notification to client if configured
  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const { sendText: waSendText } = await import("@/lib/whatsapp");
      await waSendText({
        to: lead.phone,
        text: `Здравствуйте${lead.name ? `, ${lead.name}` : ""}! Мы провели экспертную оценку вашего объекта. Наше предложение по срочному выкупу: ${formattedPrice} тенге. Для обсуждения деталей свяжитесь с вашим менеджером.`,
      });
      await sendMessage(chatId, "📩 Клиенту отправлено уведомление в WhatsApp.");
    } catch {
      await sendMessage(chatId, "⚠️ Не удалось отправить WhatsApp. Свяжитесь с клиентом вручную.");
    }
  }
}
