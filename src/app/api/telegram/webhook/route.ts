import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/telegram";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    from?: { id: number; first_name: string };
  };
}

/**
 * POST /api/telegram/webhook
 * Receives Telegram bot updates.
 * Supports: /start, /stats, /leads
 */
export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();
    const msg = update.message;

    if (!msg?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(msg.chat.id);
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    // Only respond to admin
    if (chatId !== adminChatId) {
      await sendMessage(chatId, "⛔ Доступ ограничен. Этот бот только для администраторов Алмавыкуп.");
      return NextResponse.json({ ok: true });
    }

    const command = msg.text.trim().toLowerCase();

    if (command === "/start") {
      await sendMessage(chatId, [
        "👋 <b>Алмавыкуп Бот</b>",
        "",
        "Доступные команды:",
        "/stats — Сводка за сегодня",
        "/leads — Последние 5 заявок",
      ].join("\n"));
    } else if (command === "/stats") {
      await handleStats(chatId);
    } else if (command === "/leads") {
      await handleLeads(chatId);
    } else {
      await sendMessage(chatId, "Неизвестная команда. Используйте /stats или /leads");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}

async function handleStats(chatId: string) {
  const supabase = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: allLeads } = await supabase.from("leads").select("*");
  const leads = (allLeads ?? []) as LeadRow[];

  const newToday = leads.filter(
    (l) => new Date(l.created_at) >= today
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
    0
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
    return [
      `<b>${i + 1}. ${l.name ?? "—"}</b>`,
      `   📞 ${l.phone} | 💰 ${price}`,
      `   📅 ${date} | 📌 ${l.status}`,
    ].join("\n");
  });

  await sendMessage(chatId, [
    "📋 <b>Последние 5 заявок</b>",
    "",
    ...lines,
  ].join("\n"));
}
