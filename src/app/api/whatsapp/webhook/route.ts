import { NextRequest, NextResponse } from "next/server";
import { markAsRead, sendText } from "@/lib/whatsapp";
import { notifyAdmin } from "@/lib/telegram";

/**
 * GET /api/whatsapp/webhook
 * Meta webhook verification (challenge-response).
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface WhatsAppChange {
  value: {
    messaging_product: string;
    metadata: { phone_number_id: string };
    contacts?: { profile: { name: string }; wa_id: string }[];
    messages?: WhatsAppMessage[];
    statuses?: { id: string; status: string; timestamp: string }[];
  };
}

/**
 * POST /api/whatsapp/webhook
 * Receives incoming WhatsApp messages and status updates.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Must always return 200 to Meta
    const entries = body.entry ?? [];
    for (const entry of entries) {
      const changes: WhatsAppChange[] = entry.changes ?? [];
      for (const change of changes) {
        const { messages, contacts } = change.value;

        if (!messages?.length) continue;

        for (const msg of messages) {
          const senderName = contacts?.[0]?.profile?.name ?? msg.from;
          const text = msg.text?.body ?? `[${msg.type}]`;

          // Mark as read
          await markAsRead(msg.id).catch(() => {});

          // Notify admin via Telegram
          await notifyAdmin(
            `📩 <b>WhatsApp сообщение</b>\n\n` +
            `👤 ${senderName} (${msg.from})\n` +
            `💬 ${text}`
          ).catch(() => {});

          // Auto-reply
          await sendText({
            to: msg.from,
            text: "Здравствуйте! Спасибо за обращение в Алмавыкуп. Наш менеджер свяжется с вами в ближайшее время.",
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    // Always return 200 to Meta to avoid retries
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}
