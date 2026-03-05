import { NextRequest, NextResponse } from "next/server";
import {
  sendMessage,
  editMessage,
  answerCallback,
  callApi,
  getAgent,
  isAdmin,
  editLeadBroadcast,
  notifyJuristsReview,
  type InlineKeyboard,
} from "@/lib/telegram";
import { createAdminClient } from "@/lib/supabase/admin";
import { logLeadEvent } from "@/lib/lead-events";
import type { Database, AgentRole } from "@/types/database";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type AgentRow = Database["public"]["Tables"]["authorized_agents"]["Row"];

// ── Telegram Update Types ──

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
}

interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  text?: string;
  caption?: string;
  from?: TelegramUser;
  photo?: TelegramPhotoSize[];
  document?: TelegramDocument;
  media_group_id?: string;
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

// ── Media Group Dedup (album uploads) ──
const processedMediaGroups = new Set<string>();

// ── Status Labels ──

const STATUS_LABELS: Record<string, string> = {
  new: "🆕 Новый",
  in_progress: "📞 В обработке",
  price_approved: "💰 Оценка утверждена",
  jurist_approved: "⚖️ Проверено юристом",
  director_approved: "✅ Утверждено директором",
  deal_progress: "📝 На сделке",
  awaiting_payout: "💸 Ждёт выплаты",
  deal_closed: "🏆 Сделка закрыта",
  paid: "🏆 Выдано",
  rejected: "📦 Отказ",
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

    // Handle photo/document uploads (file attachment to leads)
    if (update.message && (update.message.photo || update.message.document) && update.message.from) {
      await handleFileUpload(update.message);
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
    const username = msg.from?.username ? ` (@${msg.from.username})` : "";
    await sendMessage(chatId, [
      `⛔ Доступ ограничен.`,
      ``,
      `Ваш Telegram ID: <code>${telegramId}</code>${username}`,
      ``,
      `Отправьте этот ID администратору, чтобы он добавил вас командой:`,
      `<code>/add_agent ${telegramId} ${msg.from?.first_name ?? "Имя"} broker</code>`,
    ].join("\n"));
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
    case "/add_agent":
      await handleAddAgent(chatId, agent, args);
      break;
    case "/remove_agent":
      await handleRemoveAgent(chatId, agent, args);
      break;
    case "/agents":
      await handleListAgents(chatId, agent);
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

  // Handle jurist docs callback: jurist_docs_{short_id}
  if (data.startsWith("jurist_docs_")) {
    await handleJuristDocsCallback(query, agent, data);
    return;
  }

  // Handle send-to-jurist callback: jurist_{short_id}
  if (data.startsWith("jurist_")) {
    await handleJuristCallback(query, agent, data);
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
    case "claim": {
      // Prevent double-claiming
      if (lead.assigned_to && lead.assigned_to !== agent.id) {
        const { data: assigneeProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", lead.assigned_to)
          .single();
        const assigneeName = (assigneeProfile as { full_name: string } | null)?.full_name ?? "другим брокером";
        await answerCallback(query.id, `❌ Уже взято: ${assigneeName}`);
        return;
      }
      newStatus = "in_progress";
      notification = `✅ ${agent.name} взял в работу`;
      break;
    }
    case "progress":
      newStatus = "price_approved";
      notification = `💰 ${agent.name} утвердил оценку`;
      break;
    case "won":
      newStatus = "paid";
      notification = `🏆 ${agent.name} — выдано`;
      break;
    case "lost":
      newStatus = "rejected";
      notification = `📦 ${agent.name} — отказ`;
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
    updateData.assigned_to = agent.id;
  }

  await supabase.from("leads").update(updateData).eq("id", leadId);

  // Log audit event (fire-and-forget)
  const eventAction = action === "claim" ? "assigned" : "status_changed";
  const eventDesc = action === "claim"
    ? `Взял заявку в работу (${agent.name}, Telegram)`
    : `Статус изменён на ${STATUS_LABELS[newStatus] ?? newStatus} (${agent.name}, Telegram)`;
  logLeadEvent({
    leadId: leadId,
    userId: agent.id,
    action: eventAction,
    description: eventDesc,
  }).catch(() => {});

  // Update the message to reflect new status
  if (chatId && messageId) {
    const price = lead.estimated_price
      ? new Intl.NumberFormat("ru-RU").format(lead.estimated_price) + " ₸"
      : "—";

    const leadRecord = lead as LeadRow & { zone_id?: string | null };
    const locationLine = leadRecord.zone_id
      ? `📍 <b>Зона:</b> ${leadRecord.zone_id}`
      : `🏢 <b>ЖК:</b> ${lead.complex_id ?? "—"}`;

    const updatedText = [
      `📢 <b>Лид</b> — ${STATUS_LABELS[newStatus] ?? newStatus}`,
      "",
      `👤 <b>Имя:</b> ${lead.name ?? "—"}`,
      locationLine,
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
    if (newStatus !== "paid" && newStatus !== "rejected") {
      keyboard.push([
        { text: "📋 Далее", callback_data: `lead:progress:${leadId}` },
        { text: "🏆 Выдано", callback_data: `lead:won:${leadId}` },
        { text: "📦 Архив", callback_data: `lead:lost:${leadId}` },
      ]);
    }

    await editMessage(chatId, messageId, updatedText, keyboard).catch(() => {});
  }

  // On claim: edit ALL broadcast messages so other brokers see it's taken
  if (action === "claim") {
    const claimIdTag = lead.short_id ? `#${lead.short_id} ` : "";
    const claimedText = [
      `✅ <b>${claimIdTag}Заявка взята в работу</b>`,
      "",
      `👤 ${lead.name ?? "—"}`,
      `👷 <b>${agent.name}</b>`,
      `🕐 ${new Date().toLocaleString("ru-RU", { timeZone: "Asia/Almaty" })}`,
    ].join("\n");
    editLeadBroadcast(leadId, claimedText).catch(() => {});
  }

  await answerCallback(query.id, notification);
}

// ── Jurist Docs Callback Handler ──

async function handleJuristDocsCallback(
  query: TelegramCallbackQuery,
  _agent: AgentRow,
  data: string,
) {
  const chatId = query.message?.chat.id;
  const shortIdStr = data.replace("jurist_docs_", "");
  const shortId = parseInt(shortIdStr);

  if (isNaN(shortId)) {
    await answerCallback(query.id, "Неверный формат");
    return;
  }

  const supabase = createAdminClient();

  const { data: rawLead } = await supabase
    .from("leads")
    .select("id, name, short_id, phone")
    .eq("short_id", shortId)
    .single();

  const lead = rawLead as { id: string; name: string | null; short_id: number; phone: string } | null;
  if (!lead) {
    await answerCallback(query.id, `Заявка #${shortId} не найдена`);
    return;
  }

  // Fetch attachments
  const { data: attachments } = await supabase
    .from("lead_attachments")
    .select("file_url, file_name, file_type, created_at")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: true });

  const files = (attachments ?? []) as { file_url: string; file_name: string; file_type: string; created_at: string }[];

  if (files.length === 0) {
    await answerCallback(query.id, "Нет прикреплённых документов");
    return;
  }

  const fileLines = files.map((f, i) => {
    const date = new Date(f.created_at).toLocaleString("ru-RU", {
      timeZone: "Asia/Almaty",
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
    return `${i + 1}. <a href="${f.file_url}">${f.file_name}</a> (${date})`;
  }).join("\n");

  const text = [
    `📎 <b>Документы по заявке #${shortId}</b>`,
    "",
    `👤 ${lead.name ?? "—"} | 📞 ${lead.phone}`,
    "",
    fileLines,
  ].join("\n");

  await answerCallback(query.id);
  if (chatId) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://almavykup.kz";
    await sendMessage(chatId, text, {
      replyMarkup: [[
        { text: "📊 Открыть в CRM", web_app: { url: `${appUrl}/leads` } },
      ]],
    });
  }
}

// ── Jurist Callback Handler ──

async function handleJuristCallback(
  query: TelegramCallbackQuery,
  agent: AgentRow,
  data: string,
) {
  const chatId = query.message?.chat.id;
  const messageId = query.message?.message_id;
  const shortId = parseInt(data.replace("jurist_", ""));

  if (isNaN(shortId)) {
    await answerCallback(query.id, "Неверный формат");
    return;
  }

  const supabase = createAdminClient();

  // Find lead by short_id
  const { data: rawLead } = await supabase
    .from("leads")
    .select("id, name, short_id, phone, status, offer_price, estimated_price")
    .eq("short_id", shortId)
    .single();

  const lead = rawLead as {
    id: string; name: string | null; short_id: number; phone: string;
    status: string; offer_price: number | null; estimated_price: number | null;
  } | null;
  if (!lead) {
    await answerCallback(query.id, `Заявка #${shortId} не найдена`);
    return;
  }

  // Update status to price_approved (triggers jurist notification)
  await supabase
    .from("leads")
    .update({ status: "price_approved" })
    .eq("id", lead.id);

  // Log event
  logLeadEvent({
    leadId: lead.id,
    userId: agent.id,
    action: "status_changed",
    description: `Отправлено на проверку юристу (${agent.name}, Telegram)`,
  }).catch(() => {});

  // Count attachments
  const { count } = await supabase
    .from("lead_attachments")
    .select("*", { count: "exact", head: true })
    .eq("lead_id", lead.id);
  const fileCount = count ?? 0;

  // Notify jurists with document list + button (fire-and-forget)
  notifyJuristsReview({
    id: lead.id,
    short_id: lead.short_id,
    name: lead.name,
    phone: lead.phone,
    offer_price: lead.offer_price,
    estimated_price: lead.estimated_price,
  }).catch(() => {});

  await answerCallback(query.id, `✅ Отправлено юристам`);

  // Edit broker's message to confirm
  if (chatId && messageId) {
    await editMessage(
      chatId,
      messageId,
      [
        `✅ Заявка <b>#${shortId}</b> отправлена на проверку юристам`,
        ``,
        `👤 ${lead.name ?? "—"}`,
        `📎 Файлов: ${fileCount}`,
        `👷 ${agent.name}`,
      ].join("\n"),
    ).catch(() => {});
  }
}

// ── File Upload Handler (photos + documents → Supabase Storage) ──

async function handleFileUpload(msg: TelegramMessage) {
  const chatId = String(msg.chat.id);
  const telegramId = msg.from!.id;

  // Check authorization
  const agent = await getAgent(telegramId);
  if (!agent) {
    await sendMessage(chatId, "⛔ Доступ ограничен.");
    return;
  }

  const caption = msg.caption ?? "";

  // 1. Validate caption contains a number
  const idMatch = caption.match(/#?(\d+)/);
  if (!idMatch) {
    await sendMessage(chatId, "❌ Вы не указали номер заявки. Отправьте фото ещё раз и обязательно добавьте номер (например, <code>105</code>) в описание (caption).");
    return;
  }

  const shortId = parseInt(idMatch[1]);

  // 2. Find lead by short_id — clear error if not found
  const supabase = createAdminClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("id, name, short_id")
    .eq("short_id", shortId)
    .single();

  if (!lead) {
    await sendMessage(chatId, `❌ Заявка #${shortId} не найдена в системе. Проверьте номер.`);
    return;
  }

  // 3. Media group dedup — detect if this is part of an album
  const mediaGroupId = msg.media_group_id;
  let isAlbumDuplicate = false;
  if (mediaGroupId) {
    if (processedMediaGroups.has(mediaGroupId)) {
      isAlbumDuplicate = true;
    } else {
      processedMediaGroups.add(mediaGroupId);
      // Auto-cleanup after 60s to prevent memory leak
      setTimeout(() => processedMediaGroups.delete(mediaGroupId), 60_000);
    }
  }

  // Determine file_id and metadata
  let fileId: string;
  let fileName: string;
  let fileType: string;

  if (msg.document) {
    fileId = msg.document.file_id;
    fileName = msg.document.file_name ?? `document_${Date.now()}`;
    fileType = msg.document.mime_type ?? "application/octet-stream";
  } else if (msg.photo && msg.photo.length > 0) {
    const largest = msg.photo[msg.photo.length - 1];
    fileId = largest.file_id;
    fileName = `photo_${Date.now()}.jpg`;
    fileType = "image/jpeg";
  } else {
    return;
  }

  try {
    // Get file path from Telegram
    const fileInfo = await callApi("getFile", { file_id: fileId });
    const filePath = fileInfo.file_path;
    if (!filePath) {
      await sendMessage(chatId, "❌ Не удалось получить файл от Telegram.");
      return;
    }

    // Download file from Telegram
    const token = process.env.TELEGRAM_BOT_TOKEN!;
    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) {
      await sendMessage(chatId, "❌ Ошибка скачивания файла.");
      return;
    }
    const fileBuffer = await fileRes.arrayBuffer();

    // Upload to Supabase Storage
    const storagePath = `${lead.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("crm_documents")
      .upload(storagePath, fileBuffer, {
        contentType: fileType,
        upsert: true,
      });

    if (uploadError) {
      await sendMessage(chatId, `❌ Ошибка загрузки: ${uploadError.message}`);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("crm_documents")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Save record to lead_attachments
    const { error: insertError } = await supabase
      .from("lead_attachments")
      .insert({
        lead_id: lead.id,
        uploaded_by: agent.id,
        file_url: publicUrl,
        file_type: fileType,
        file_name: fileName,
      });

    if (insertError) {
      await sendMessage(chatId, `❌ Ошибка сохранения: ${insertError.message}`);
      return;
    }

    // Log document upload event
    logLeadEvent({
      leadId: lead.id,
      userId: agent.id,
      action: "document_added",
      description: `Загружен файл: ${fileName} (${agent.name}, Telegram)`,
    }).catch(() => {});

    // Only send confirmation + jurist button for first file in an album
    if (!isAlbumDuplicate) {
      // Get total attachment count for this lead
      const { count: totalFiles } = await supabase
        .from("lead_attachments")
        .select("*", { count: "exact", head: true })
        .eq("lead_id", lead.id);

      await sendMessage(chatId, [
        `✅ Файл прикреплён к заявке <b>#${shortId}</b>`,
        ``,
        `👤 ${lead.name ?? "—"}`,
        `📎 Всего файлов: ${totalFiles ?? 1}`,
        `👷 ${agent.name}`,
      ].join("\n"), {
        replyMarkup: [[
          { text: "📤 Отправить юристу", callback_data: `jurist_${shortId}` },
        ]],
      });
    }
  } catch (err) {
    console.error("File upload error:", err);
    await sendMessage(chatId, "❌ Произошла ошибка при загрузке файла.");
  }
}

// ── Command Handlers ──

async function handleStart(chatId: string, agent: AgentRow) {
  const adminCommands = isAdmin(agent)
    ? [
        "",
        "<b>Админ:</b>",
        "/set_base [число] — Изменить базовую ставку",
        "/edit_complex [ЖК] [коэфф] — Изменить коэффициент ЖК",
        "/add_agent [telegram_id] [имя] [роль] — Добавить сотрудника",
        "/remove_agent [telegram_id] — Удалить сотрудника",
        "/agents — Список сотрудников",
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
      { text: "📊 Открыть CRM", web_app: { url: `${appUrl}/leads` } },
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
    in_progress: leads.filter((l) => l.status === "in_progress").length,
    price_approved: leads.filter((l) => l.status === "price_approved").length,
    jurist_approved: leads.filter((l) => l.status === "jurist_approved").length,
    director_approved: leads.filter((l) => l.status === "director_approved").length,
    deal_progress: leads.filter((l) => l.status === "deal_progress").length,
    paid: leads.filter((l) => l.status === "paid").length,
    rejected: leads.filter((l) => l.status === "rejected").length,
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
    `📞 В обработке: ${byStatus.in_progress}`,
    `💰 Оценка: ${byStatus.price_approved}`,
    `⚖️ Юрист: ${byStatus.jurist_approved}`,
    `✅ Директор: ${byStatus.director_approved}`,
    `📝 На сделке: ${byStatus.deal_progress}`,
    `🏆 Выдано: ${byStatus.paid}`,
    `📦 Отказ: ${byStatus.rejected}`,
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
      { text: "📊 Открыть CRM", web_app: { url: `${appUrl}/leads` } },
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
    .in("status", ["new", "in_progress"])
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

  // Update offer_price and move to in_progress if new
  const updateData: Record<string, unknown> = {
    offer_price: price,
  };
  if (lead.status === "new") {
    updateData.status = "in_progress";
    updateData.contacted_at = new Date().toISOString();
  }

  await supabase.from("leads").update(updateData).eq("id", leadId);

  // Log price_set event (fire-and-forget)
  logLeadEvent({
    leadId: leadId,
    userId: agent.id,
    action: "price_set",
    description: `Цена назначена: ${new Intl.NumberFormat("ru-RU").format(price)} ₸ (${agent.name}, Telegram)`,
  }).catch(() => {});

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

// ── Agent Management Commands ──

const ROLE_LABELS: Record<string, string> = {
  admin: "👑 Админ",
  broker: "👷 Брокер",
  jurist: "⚖️ Юрист",
  director: "📋 Директор",
  cashier: "💰 Кассир",
};

// Map agent role → profile role
const AGENT_TO_PROFILE_ROLE: Record<string, string> = {
  admin: "admin",
  broker: "manager",
  jurist: "jurist",
  director: "director",
  cashier: "cashier",
};

/** Upsert into profiles table so role-based routing (jurist notifications etc.) works */
async function upsertProfile(
  supabase: ReturnType<typeof createAdminClient>,
  agentId: string,
  name: string,
  agentRole: string,
  telegramId: number,
) {
  const profileRole = AGENT_TO_PROFILE_ROLE[agentRole] ?? "manager";
  await supabase
    .from("profiles")
    .upsert(
      {
        id: agentId,
        full_name: name,
        role: profileRole as Database["public"]["Tables"]["profiles"]["Row"]["role"],
        telegram_chat_id: String(telegramId),
      },
      { onConflict: "id" },
    )
    .then(({ error }) => {
      if (error) console.error("Profile upsert error:", error.message);
    });
}

async function handleAddAgent(chatId: string, agent: AgentRow, args: string[]) {
  if (!isAdmin(agent)) {
    await sendMessage(chatId, "⛔ Только администратор может добавлять сотрудников.");
    return;
  }

  const VALID_ROLES = ["admin", "broker", "jurist", "director", "cashier"];

  if (args.length < 2) {
    await sendMessage(chatId, [
      "Использование: /add_agent [telegram_id] [имя] [роль]",
      "",
      "Роли: <b>admin</b>, <b>broker</b>, <b>jurist</b>, <b>director</b>, <b>cashier</b> (по умолчанию broker)",
      "",
      "Пример: <code>/add_agent 123456789 Иван jurist</code>",
      "",
      "💡 Чтобы узнать telegram_id — попросите человека написать боту, ID покажется в ошибке доступа, или используйте @userinfobot",
    ].join("\n"));
    return;
  }

  const telegramId = parseInt(args[0]);
  if (isNaN(telegramId)) {
    await sendMessage(chatId, "❌ telegram_id должен быть числом.");
    return;
  }

  const lastArg = args[args.length - 1];
  const hasRole = args.length >= 3 && VALID_ROLES.includes(lastArg);
  const role = hasRole ? (lastArg as AgentRole) : ("broker" as const);
  const name = hasRole ? args.slice(1, -1).join(" ") : args.slice(1).join(" ");

  const supabase = createAdminClient();

  // Check if already exists
  const { data: existing } = await supabase
    .from("authorized_agents")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (existing) {
    // Reactivate if disabled
    await supabase
      .from("authorized_agents")
      .update({ is_active: true, name, role })
      .eq("telegram_id", telegramId);

    // Also upsert into profiles
    await upsertProfile(supabase, existing.id, name, role, telegramId);

    await sendMessage(chatId, [
      "✅ <b>Сотрудник обновлён</b>",
      "",
      `👤 <b>${name}</b>`,
      `🆔 Telegram ID: <code>${telegramId}</code>`,
      `🔑 Роль: ${ROLE_LABELS[role] ?? role}`,
    ].join("\n"));
    return;
  }

  const { data: inserted, error } = await supabase
    .from("authorized_agents")
    .insert({ telegram_id: telegramId, name, role })
    .select("id")
    .single();

  if (error || !inserted) {
    await sendMessage(chatId, `❌ Ошибка: ${error?.message ?? "unknown"}`);
    return;
  }

  // Also upsert into profiles
  await upsertProfile(supabase, inserted.id, name, role, telegramId);

  await sendMessage(chatId, [
    "✅ <b>Сотрудник добавлен!</b>",
    "",
    `👤 <b>${name}</b>`,
    `🆔 Telegram ID: <code>${telegramId}</code>`,
    `🔑 Роль: ${ROLE_LABELS[role] ?? role}`,
    "",
    "Теперь этот человек может написать боту /start и получит доступ к CRM.",
  ].join("\n"));
}

async function handleRemoveAgent(chatId: string, agent: AgentRow, args: string[]) {
  if (!isAdmin(agent)) {
    await sendMessage(chatId, "⛔ Только администратор может удалять сотрудников.");
    return;
  }

  if (args.length < 1) {
    await sendMessage(chatId, "Использование: /remove_agent [telegram_id]\nПример: <code>/remove_agent 123456789</code>");
    return;
  }

  const telegramId = parseInt(args[0]);
  if (isNaN(telegramId)) {
    await sendMessage(chatId, "❌ telegram_id должен быть числом.");
    return;
  }

  const supabase = createAdminClient();
  const { data: target } = await supabase
    .from("authorized_agents")
    .select("name")
    .eq("telegram_id", telegramId)
    .single();

  if (!target) {
    await sendMessage(chatId, "❌ Сотрудник не найден.");
    return;
  }

  await supabase
    .from("authorized_agents")
    .update({ is_active: false })
    .eq("telegram_id", telegramId);

  await sendMessage(chatId, `✅ <b>${(target as { name: string }).name}</b> деактивирован.`);
}

async function handleListAgents(chatId: string, agent: AgentRow) {
  if (!isAdmin(agent)) {
    await sendMessage(chatId, "⛔ Только администратор может просматривать список.");
    return;
  }

  const supabase = createAdminClient();
  const { data: agents } = await supabase
    .from("authorized_agents")
    .select("*")
    .order("created_at");

  type AgentInfo = { telegram_id: number; name: string; role: string; is_active: boolean };
  const list = (agents ?? []) as AgentInfo[];

  if (list.length === 0) {
    await sendMessage(chatId, "Нет зарегистрированных сотрудников.");
    return;
  }

  const lines = list.map((a, i) => {
    const status = a.is_active ? "✅" : "❌";
    const roleLabel = ROLE_LABELS[a.role] ?? a.role;
    return `${i + 1}. ${status} <b>${a.name}</b> — ${roleLabel}\n   ID: <code>${a.telegram_id}</code>`;
  });

  await sendMessage(chatId, [
    "👥 <b>Список сотрудников</b>",
    "",
    ...lines,
  ].join("\n"));
}
