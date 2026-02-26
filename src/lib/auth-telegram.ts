import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import crypto from "crypto";

type AgentRow = Database["public"]["Tables"]["authorized_agents"]["Row"];

/**
 * Validate Telegram WebApp InitData.
 * See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string): { valid: boolean; userId?: number } {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return { valid: false };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { valid: false };

  // Build data-check-string (sorted, without hash)
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  // HMAC-SHA256
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) return { valid: false };

  // Extract user id
  try {
    const userStr = params.get("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return { valid: true, userId: user.id };
    }
  } catch {}

  return { valid: true };
}

export async function authenticateRequest(req: NextRequest): Promise<AgentRow | null> {
  const initData = req.headers.get("x-telegram-init-data") ?? "";

  // Try Telegram InitData validation
  if (initData) {
    const { valid, userId } = validateInitData(initData);
    if (valid && userId) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("authorized_agents")
        .select("*")
        .eq("telegram_id", userId)
        .eq("is_active", true)
        .single();
      return (data as AgentRow | null) ?? null;
    }
  }

  // Fallback: API key auth (for testing/n8n)
  const apiKey = req.headers.get("x-api-key");
  if (apiKey && apiKey === process.env.AUTOMATION_API_KEY) {
    return {
      id: "system",
      telegram_id: 0,
      name: "System",
      role: "admin",
      is_active: true,
      created_at: "",
      updated_at: "",
    };
  }

  return null;
}
