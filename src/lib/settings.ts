import { createAdminClient } from "@/lib/supabase/admin";

export interface SystemSettings {
  baseRate: number;
  buybackDiscount: number;
  marginTarget: number;
}

const DEFAULTS: SystemSettings = {
  baseRate: 805_000,
  buybackDiscount: 0.70,
  marginTarget: 0.15,
};

const KEY_MAP: Record<string, keyof SystemSettings> = {
  base_rate: "baseRate",
  buyback_discount: "buybackDiscount",
  margin_target: "marginTarget",
};

/** Fetch all system settings from DB, with hardcoded fallbacks */
export async function getSystemSettings(): Promise<SystemSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("key, value_numeric");

  if (error || !data) return { ...DEFAULTS };

  const settings = { ...DEFAULTS };
  for (const row of data) {
    const field = KEY_MAP[row.key];
    if (field) {
      settings[field] = Number(row.value_numeric);
    }
  }
  return settings;
}

/** Update a single system setting by key */
export async function updateSystemSetting(
  key: string,
  value: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("system_settings")
    .update({ value_numeric: value })
    .eq("key", key);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
