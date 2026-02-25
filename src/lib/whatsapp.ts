const WHATSAPP_API = "https://graph.facebook.com/v21.0";

function getConfig() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("WhatsApp credentials not configured");
  }
  return { token, phoneNumberId };
}

interface SendTextParams {
  to: string;
  text: string;
}

interface SendDocumentParams {
  to: string;
  documentUrl: string;
  filename: string;
  caption?: string;
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

/** Normalize KZ phone to WhatsApp format (7XXXXXXXXXX) */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Handle +7, 8, or raw 7 prefix
  if (digits.startsWith("8") && digits.length === 11) {
    return "7" + digits.slice(1);
  }
  if (digits.startsWith("7") && digits.length === 11) {
    return digits;
  }
  return digits;
}

/** Send a plain text message */
export async function sendText({ to, text }: SendTextParams): Promise<WhatsAppResponse> {
  const { token, phoneNumberId } = getConfig();

  const res = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: normalizePhone(to),
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WhatsApp API error ${res.status}: ${JSON.stringify(err)}`);
  }

  return res.json();
}

/** Send a document (PDF) via URL */
export async function sendDocument({
  to,
  documentUrl,
  filename,
  caption,
}: SendDocumentParams): Promise<WhatsAppResponse> {
  const { token, phoneNumberId } = getConfig();

  const res = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: normalizePhone(to),
      type: "document",
      document: {
        link: documentUrl,
        filename,
        caption,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WhatsApp API error ${res.status}: ${JSON.stringify(err)}`);
  }

  return res.json();
}

/** Mark a message as read */
export async function markAsRead(messageId: string): Promise<void> {
  const { token, phoneNumberId } = getConfig();

  await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}
