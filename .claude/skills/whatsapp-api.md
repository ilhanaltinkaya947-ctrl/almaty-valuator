# WhatsApp Business Cloud API (Meta)

## Purpose
Send automated PDF valuation reports to clients via WhatsApp after they submit the form on the landing page. Also receive webhook events for delivery status.

## SDK
Use the official Meta SDK:
```bash
npm install whatsapp
```
Or make direct Graph API calls with fetch (more control, fewer dependencies).

## Direct API Pattern (Recommended)
```typescript
// lib/whatsapp.ts
const WHATSAPP_API = "https://graph.facebook.com/v21.0";

interface SendTemplateOptions {
  to: string;           // E.164 format: 77771234567
  templateName: string;
  language: string;
  components: any[];
  mediaUrl?: string;    // PDF URL for document attachment
}

export async function sendTemplateMessage(opts: SendTemplateOptions) {
  const url = `${WHATSAPP_API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const body: any = {
    messaging_product: "whatsapp",
    to: opts.to,
    type: "template",
    template: {
      name: opts.templateName,
      language: { code: opts.language },
      components: opts.components,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
  }

  return res.json();
}
```

## Sending PDF Report Flow
```typescript
// 1. Upload PDF to WhatsApp Media API first
async function uploadMedia(pdfBuffer: Buffer, filename: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), filename);
  form.append("messaging_product", "whatsapp");
  form.append("type", "application/pdf");

  const res = await fetch(
    `${WHATSAPP_API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`,
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}` },
      body: form,
    }
  );
  const data = await res.json();
  return data.id; // media_id
}

// 2. Send template with document attachment
async function sendValuationReport(
  phone: string,
  clientName: string,
  complexName: string,
  price: string,
  pdfBuffer: Buffer
) {
  const mediaId = await uploadMedia(pdfBuffer, `report-${complexName}.pdf`);

  await sendTemplateMessage({
    to: phone,
    templateName: "property_valuation_report",
    language: "ru",
    components: [
      {
        type: "header",
        parameters: [{ type: "document", document: { id: mediaId, filename: `Оценка_${complexName}.pdf` } }],
      },
      {
        type: "body",
        parameters: [
          { type: "text", text: clientName || "клиент" },
          { type: "text", text: complexName },
          { type: "text", text: price },
        ],
      },
    ],
  });
}
```

## Webhook Verification (GET)
```typescript
// app/api/whatsapp/webhook/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}
```

## Webhook Events (POST)
```typescript
export async function POST(request: Request) {
  const body = await request.json();

  // Message status updates (sent, delivered, read)
  const statuses = body?.entry?.[0]?.changes?.[0]?.value?.statuses;
  if (statuses) {
    for (const status of statuses) {
      console.log(`Message ${status.id}: ${status.status}`);
      // Update lead status in Supabase if needed
    }
  }

  // Incoming messages (replies from clients)
  const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
  if (messages) {
    for (const msg of messages) {
      // Client replied — can trigger broker notification
      console.log(`Reply from ${msg.from}: ${msg.text?.body}`);
    }
  }

  return new Response("OK", { status: 200 });
}
```

## Template Registration
Submit this template in Meta Business Manager → WhatsApp → Message Templates:

**Name:** `property_valuation_report`
**Category:** UTILITY
**Language:** Russian (ru)
**Header:** Document ({{1}})
**Body:**
```
Здравствуйте, {{1}}! 

Ваш персональный отчёт по оценке квартиры в ЖК {{2}} готов.

📊 Рыночная стоимость: {{3}} тенге

Подробный анализ с аналогами и рекомендациями — в прикреплённом документе.

Хотите обсудить стратегию продажи? Просто ответьте на это сообщение.
```

## Phone Number Formatting
Kazakhstan numbers: `+7 (7XX) XXX-XX-XX`
E.164 for API: `77771234567` (no plus, no spaces)
```typescript
function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, "");
}
```

## Important Notes
- Template must be APPROVED by Meta before use (takes 1-24 hours)
- First message MUST use a template. Free-form only in 24h reply window.
- Permanent token: get from System User in Meta Business Settings (not the temporary one)
- Test with personal number first using the test phone number in Meta dashboard
- Rate limit: 80 messages/second on standard tier
