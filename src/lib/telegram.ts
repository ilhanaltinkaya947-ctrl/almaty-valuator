import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type AgentRow = Database["public"]["Tables"]["authorized_agents"]["Row"];

const TELEGRAM_API = "https://api.telegram.org";

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !adminChatId) {
    throw new Error("Telegram bot credentials not configured");
  }
  return { token, adminChatId };
}

export async function callApi(method: string, body: Record<string, unknown>) {
  const { token } = getConfig();

  const res = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${JSON.stringify(data)}`);
  }
  return data.result;
}

// ── Inline Keyboard Types ──

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
}

export type InlineKeyboard = InlineButton[][];

// ── Core Messaging ──

/** Send a text message with optional inline keyboard */
export async function sendMessage(
  chatId: string | number,
  text: string,
  options?: {
    parseMode?: "MarkdownV2" | "HTML";
    replyMarkup?: InlineKeyboard;
  },
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: options?.parseMode ?? "HTML",
  };
  if (options?.replyMarkup) {
    body.reply_markup = { inline_keyboard: options.replyMarkup };
  }
  return callApi("sendMessage", body);
}

/** Edit an existing message's text + keyboard */
export async function editMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboard,
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) {
    body.reply_markup = { inline_keyboard: replyMarkup };
  }
  return callApi("editMessageText", body);
}

/** Answer a callback query (dismiss the loading spinner on button press) */
export async function answerCallback(callbackQueryId: string, text?: string) {
  return callApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

/** Send a message to the admin chat */
export async function notifyAdmin(text: string) {
  const { adminChatId } = getConfig();
  return sendMessage(adminChatId, text);
}

/** Send a document (PDF buffer) to the admin chat */
export async function sendDocumentToAdmin(buffer: ArrayBufferLike, filename: string, caption?: string) {
  const { token, adminChatId } = getConfig();

  const blob = new Blob([new Uint8Array(buffer)] as BlobPart[], { type: "application/pdf" });
  const formData = new FormData();
  formData.append("chat_id", adminChatId);
  formData.append("document", blob, filename);
  if (caption) formData.append("caption", caption);

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendDocument`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${JSON.stringify(data)}`);
  }
  return data.result;
}

// ── Agent Authorization ──

/** Check if a Telegram user is authorized. Returns agent row or null. */
export async function getAgent(telegramId: number): Promise<AgentRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("authorized_agents")
    .select("*")
    .eq("telegram_id", telegramId)
    .eq("is_active", true)
    .single();
  return (data as AgentRow | null) ?? null;
}

/** Check if agent has admin role */
export function isAdmin(agent: AgentRow): boolean {
  return agent.role === "admin";
}

// ── Interactive Lead Cards ──

/** Build inline keyboard for a lead card */
export function buildLeadKeyboard(leadId: string, phone: string): InlineKeyboard {
  const waPhone = phone.replace(/\D/g, "");
  const waText = encodeURIComponent("Здравствуйте! Я ваш менеджер из Алмавыкуп. Готов помочь с оценкой вашей недвижимости.");
  return [
    [
      { text: "✅ Взять в работу", callback_data: `lead:claim:${leadId}` },
      { text: "💬 WhatsApp", url: `https://wa.me/${waPhone}?text=${waText}` },
    ],
    [
      { text: "📋 В работу", callback_data: `lead:progress:${leadId}` },
      { text: "🏆 Закрыть (выиграно)", callback_data: `lead:won:${leadId}` },
    ],
    [
      { text: "📦 Архив", callback_data: `lead:lost:${leadId}` },
    ],
  ];
}

const FLOOR_POSITION_LABELS: Record<string, string> = {
  first: "Первый",
  middle: "Средний",
  last: "Последний",
};

/** Send an interactive lead notification to all authorized agents */
export async function notifyLeadInteractive(lead: {
  id: string;
  name?: string | null;
  phone: string;
  address?: string | null;
  property_type?: string | null;
  complex_name?: string | null;
  estimated_price?: number | null;
  area_sqm?: number | null;
  source?: string | null;
  needs_manual_review?: boolean;
  year_built?: number | null;
  wall_material?: string | null;
  is_pledged?: boolean | null;
  intent?: string | null;
  notes?: string | null;
  floor_position?: string | null;
}) {
  const isManual = lead.needs_manual_review === true;
  const price = lead.estimated_price
    ? new Intl.NumberFormat("ru-RU").format(lead.estimated_price) + " ₸"
    : "—";

  const maskedPhone = lead.phone.replace(/(\+7\d{3})\d{4}(\d{2})(\d{2})/, "$1 *** $2 $3");

  const PROPERTY_TYPE_LABELS: Record<string, string> = {
    apartment: "Квартира",
    house: "Частный дом",
    commercial: "Коммерция",
    land: "Земельный участок",
  };

  const WALL_MATERIAL_LABELS: Record<string, string> = {
    panel: "Панель",
    brick: "Кирпич",
    monolith: "Монолит",
  };

  const typeLabel = PROPERTY_TYPE_LABELS[lead.property_type ?? ""] ?? lead.property_type ?? "—";
  const intentBadge = lead.intent === "negotiate" ? "Торг" : "Согласен";

  // Determine if this is an auto-calc apartment lead:
  // Has property_type=apartment OR has estimated_price (calculator always sets it)
  const isAutoApartment = !isManual && (lead.property_type === "apartment" || lead.estimated_price != null);
  // Non-apartment manual review: use dedicated template
  const isNonApartmentManual = isManual && lead.property_type !== "apartment" && lead.property_type != null;

  let text: string;

  if (isNonApartmentManual) {
    // ⚠️ ИНДИВИДУАЛЬНАЯ ОЦЕНКА template
    const lines = [
      `⚠️ <b>ИНДИВИДУАЛЬНАЯ ОЦЕНКА</b> | ${typeLabel}`,
      "",
      `👤 <b>Имя:</b> ${lead.name ?? "—"}`,
      `📞 <b>Телефон:</b> ${maskedPhone}`,
      `📍 <b>Точный адрес:</b> ${lead.address ?? "—"}`,
    ];

    // Add type-specific params from notes
    if (lead.notes) {
      lines.push("");
      lines.push("⚙️ <b>Параметры объекта:</b>");
      const params = lead.notes.split("; ");
      for (const p of params) {
        if (p.startsWith("Адрес:")) continue; // Already shown above
        lines.push(`  • ${p}`);
      }
    }

    lines.push("");
    lines.push(`📍 <b>Источник:</b> ${lead.source ?? "website"}`);
    lines.push("");
    lines.push("❗️ <i>Алгоритм отключен. Требуется ручной расчёт и звонок специалиста.</i>");

    text = lines.join("\n");
  } else if (isAutoApartment) {
    // 🟢 Apartment template with price
    const paramParts: string[] = [];
    if (lead.area_sqm) paramParts.push(`площадь: ${lead.area_sqm} м²`);
    if (lead.floor_position) paramParts.push(`этаж: ${FLOOR_POSITION_LABELS[lead.floor_position] ?? lead.floor_position}`);
    if (lead.wall_material) paramParts.push(`материал: ${WALL_MATERIAL_LABELS[lead.wall_material] ?? lead.wall_material}`);
    if (lead.year_built) paramParts.push(`год: ${lead.year_built}`);
    if (lead.is_pledged) paramParts.push("залог: Да");

    const complexLine = lead.complex_name ?? "—";

    text = [
      `🟢 <b>НОВАЯ ЗАЯВКА</b> | Квартира`,
      "",
      `👤 <b>Имя:</b> ${lead.name ?? "—"} | 📞 <b>Телефон:</b> ${maskedPhone}`,
      ...(lead.address ? [`📍 <b>Адрес:</b> ${lead.address}`] : []),
      `🏢 <b>ЖК:</b> ${complexLine}`,
      `💰 <b>Оценка:</b> ${price} | 📊 <b>Статус:</b> ${intentBadge}`,
      ...(paramParts.length > 0 ? [`⚙️ <b>Параметры:</b> ${paramParts.join(", ")}`] : []),
      "",
      "⬇️ <i>Выберите действие:</i>",
    ].join("\n");
  } else {
    // Fallback apartment manual review
    text = [
      "🚨 <b>Сложный объект — требуется ручной расчёт!</b>",
      "",
      `🏠 <b>Тип:</b> ${typeLabel}`,
      `👤 <b>Имя:</b> ${lead.name ?? "—"}`,
      `📞 <b>Телефон:</b> ${maskedPhone}`,
      ...(lead.address ? [`📌 <b>Адрес:</b> ${lead.address}`] : []),
      `📍 <b>Источник:</b> ${lead.source ?? "website"}`,
      "",
      "⚠️ <i>Автоматический расчёт невозможен.</i>",
      "<i>Требуется экспертная оценка и ручной ввод цены.</i>",
    ].join("\n");
  }

  const keyboard = isManual
    ? buildManualReviewKeyboard(lead.id, lead.phone)
    : buildLeadKeyboard(lead.id, lead.phone);

  // Send to all active agents
  const supabase = createAdminClient();
  const { data: agents } = await supabase
    .from("authorized_agents")
    .select("telegram_id")
    .eq("is_active", true);

  const targets = (agents ?? []) as { telegram_id: number }[];

  // Also send to admin chat as fallback
  const { adminChatId } = getConfig();
  const allChatIds = new Set<string>([adminChatId]);
  for (const a of targets) {
    allChatIds.add(String(a.telegram_id));
  }

  const results = await Promise.allSettled(
    [...allChatIds].map((chatId) =>
      sendMessage(chatId, text, { replyMarkup: keyboard })
    ),
  );

  return results;
}

/** Keyboard for manual review leads */
export function buildManualReviewKeyboard(leadId: string, phone: string): InlineKeyboard {
  const waPhone = phone.replace(/\D/g, "");
  const waText = encodeURIComponent("Здравствуйте! Я эксперт из Алмавыкуп. Хочу обсудить ваш объект недвижимости.");
  return [
    [
      { text: "✅ Взять на оценку", callback_data: `lead:claim:${leadId}` },
      { text: "💬 WhatsApp", url: `https://wa.me/${waPhone}?text=${waText}` },
    ],
    [
      { text: "💰 Назначить цену", callback_data: `lead:setprice:${leadId}` },
      { text: "📦 Архив", callback_data: `lead:lost:${leadId}` },
    ],
  ];
}

// ── notifyNewLead (dispatches to interactive or plain) ──

export async function notifyNewLead(lead: {
  id?: string;
  name?: string | null;
  phone: string;
  address?: string | null;
  property_type?: string | null;
  complex_name?: string | null;
  estimated_price?: number | null;
  area_sqm?: number | null;
  source?: string | null;
  needs_manual_review?: boolean;
  year_built?: number | null;
  wall_material?: string | null;
  is_pledged?: boolean | null;
  intent?: string | null;
  notes?: string | null;
  floor_position?: string | null;
}) {
  // If we have a lead ID, send interactive card
  if (lead.id) {
    return notifyLeadInteractive({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      address: lead.address,
      property_type: lead.property_type,
      complex_name: lead.complex_name,
      estimated_price: lead.estimated_price,
      area_sqm: lead.area_sqm,
      source: lead.source,
      needs_manual_review: lead.needs_manual_review,
      year_built: lead.year_built,
      wall_material: lead.wall_material,
      is_pledged: lead.is_pledged,
      intent: lead.intent,
      notes: lead.notes,
      floor_position: lead.floor_position,
    });
  }

  // Fallback: plain text notification
  const price = lead.estimated_price
    ? new Intl.NumberFormat("ru-RU").format(lead.estimated_price) + " ₸"
    : "—";

  const text = [
    "🔔 <b>Новая заявка!</b>",
    "",
    `👤 <b>Имя:</b> ${lead.name ?? "—"}`,
    `📞 <b>Телефон:</b> ${lead.phone}`,
    ...(lead.address ? [`📌 <b>Адрес:</b> ${lead.address}`] : []),
    `🏠 <b>Тип:</b> ${lead.property_type ?? "—"}`,
    `🏢 <b>ЖК:</b> ${lead.complex_name ?? "—"}`,
    `💰 <b>Оценка:</b> ${price}`,
    `📍 <b>Источник:</b> ${lead.source ?? "website"}`,
  ].join("\n");

  return notifyAdmin(text);
}

/** Format and send daily stats */
export async function sendDailyStats(stats: {
  total_leads: number;
  new_today: number;
  contacted: number;
  closed_won: number;
  total_estimated_value: number;
}) {
  const value = new Intl.NumberFormat("ru-RU").format(stats.total_estimated_value);

  const text = [
    "📊 <b>Ежедневная сводка</b>",
    "",
    `📥 Новых за сегодня: <b>${stats.new_today}</b>`,
    `📋 Всего лидов: <b>${stats.total_leads}</b>`,
    `📞 На связи: <b>${stats.contacted}</b>`,
    `✅ Закрыто: <b>${stats.closed_won}</b>`,
    `💰 Общая оценка: <b>${value} ₸</b>`,
  ].join("\n");

  return notifyAdmin(text);
}
