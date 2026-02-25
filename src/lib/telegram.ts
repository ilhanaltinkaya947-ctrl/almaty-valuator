const TELEGRAM_API = "https://api.telegram.org";

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !adminChatId) {
    throw new Error("Telegram bot credentials not configured");
  }
  return { token, adminChatId };
}

async function callApi(method: string, body: Record<string, unknown>) {
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

/** Send a text message with optional Markdown */
export async function sendMessage(chatId: string, text: string, parseMode: "MarkdownV2" | "HTML" = "HTML") {
  return callApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
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

/** Notify admin about a new lead */
export async function notifyNewLead(lead: {
  name?: string | null;
  phone: string;
  property_type?: string | null;
  complex_name?: string | null;
  estimated_price?: number | null;
  source?: string | null;
}) {
  const price = lead.estimated_price
    ? new Intl.NumberFormat("ru-RU").format(lead.estimated_price) + " ₸"
    : "—";

  const text = [
    "🔔 <b>Новая заявка!</b>",
    "",
    `👤 <b>Имя:</b> ${lead.name ?? "—"}`,
    `📞 <b>Телефон:</b> ${lead.phone}`,
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
