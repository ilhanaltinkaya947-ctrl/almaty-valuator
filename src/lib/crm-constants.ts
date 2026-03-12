import type { Client } from "@/types/database";

export interface Lead {
  id: string;
  phone: string;
  name: string | null;
  status: string;
  source: string;
  property_type: string | null;
  estimated_price: number | null;
  offer_price: number | null;
  needs_manual_review: boolean;
  created_at: string;
  contacted_at: string | null;
  floor: number | null;
  area_sqm: number | null;
  zone_id: string | null;
  complex_id: string | null;
  complex_name?: string | null;
  year_built: number | null;
  wall_material: string | null;
  notes: string | null;
  intent: string;
  building_series: string | null;
  is_pledged: boolean;
  address: string | null;
  // ERP fields
  client_id: string | null;
  short_id: number | null;
  rejection_reason: string | null;
  assigned_to: string | null;
  assignee?: { id: string; name: string } | null;
  client?: Client | null;
  total_expenses?: number | null;
}

export interface SettingRow {
  key: string;
  value_numeric: number;
  description?: string | null;
}

export const PIPELINE_STATUSES = [
  "new",
  "in_progress",
  "price_approved",
  "jurist_approved",
  "director_approved",
  "deal_progress",
  "awaiting_payout",
  "deal_closed",
  "rejected",
] as const;

export const ACTIVE_STATUSES = [
  "new",
  "in_progress",
  "price_approved",
  "jurist_approved",
  "director_approved",
  "deal_progress",
  "awaiting_payout",
] as const;

export const TERMINAL_STATUSES = ["rejected", "deal_closed"] as const;

export const STATUS_OPTIONS: readonly { value: string; label: string; color?: string }[] = [
  { value: "all", label: "Все" },
  { value: "new", label: "Новые", color: "#C8A44E" },
  { value: "in_progress", label: "В обработке", color: "#4A8FD4" },
  { value: "price_approved", label: "Оценка", color: "#E8A838" },
  { value: "jurist_approved", label: "Юрист", color: "#9B59B6" },
  { value: "director_approved", label: "Директор", color: "#3498DB" },
  { value: "deal_progress", label: "Сделка", color: "#F39C12" },
  { value: "awaiting_payout", label: "Ждёт выплаты", color: "#EAB308" },
  { value: "deal_closed", label: "Закрыта", color: "#22C55E" },
  { value: "paid", label: "Выдано (legacy)", color: "#25D366" },
  { value: "rejected", label: "Отказ", color: "#5A6478" },
];

export const STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  in_progress: "В обработке",
  price_approved: "Оценка \u2713",
  jurist_approved: "Юрист \u2713",
  director_approved: "Директор \u2713",
  deal_progress: "На сделке",
  awaiting_payout: "Ждёт выплаты",
  deal_closed: "Закрыта \u2713",
  paid: "Выдано \u2713",
  rejected: "Отказ",
};

export const STATUS_COLORS: Record<string, string> = {
  new: "#C8A44E",
  in_progress: "#4A8FD4",
  price_approved: "#E8A838",
  jurist_approved: "#9B59B6",
  director_approved: "#3498DB",
  deal_progress: "#F39C12",
  awaiting_payout: "#EAB308",
  deal_closed: "#22C55E",
  paid: "#25D366",
  rejected: "#5A6478",
};

export const NEXT_STATUS: Record<string, string> = {
  new: "in_progress",
  in_progress: "price_approved",
  price_approved: "jurist_approved",
  jurist_approved: "director_approved",
  director_approved: "awaiting_payout",
  awaiting_payout: "deal_closed",
};

export const NEXT_STATUS_LABELS: Record<string, string> = {
  new: "Взять в работу",
  in_progress: "Оценка \u2713",
  price_approved: "Юрист \u2713",
  jurist_approved: "Директор \u2713",
  director_approved: "На выплату",
  awaiting_payout: "Закрыть сделку \u2713",
};

/** Per-role: which next status this role can push a lead to */
export const ROLE_NEXT_STATUS: Record<string, Record<string, string>> = {
  admin: NEXT_STATUS,
  manager: {
    new: "in_progress",
    in_progress: "price_approved",
  },
  jurist: {
    price_approved: "jurist_approved",
  },
  director: {
    jurist_approved: "director_approved",
    director_approved: "awaiting_payout",
  },
  cashier: {
    awaiting_payout: "deal_closed",
  },
};

/** Per-role: button labels for the next status action */
export const ROLE_NEXT_LABELS: Record<string, Record<string, string>> = {
  admin: NEXT_STATUS_LABELS,
  manager: {
    new: "Взять в работу",
    in_progress: "Оценка ✓",
  },
  jurist: {
    price_approved: "Юрист ✓",
  },
  director: {
    jurist_approved: "Директор ✓",
    director_approved: "На выплату",
  },
  cashier: {
    awaiting_payout: "Закрыть сделку ✓",
  },
};

/** Per-role: which status filter pills to show */
export const ROLE_STATUS_OPTIONS: Record<string, readonly { value: string; label: string; color?: string }[]> = {
  admin: STATUS_OPTIONS,
  manager: [
    { value: "all", label: "Все" },
    { value: "new", label: "Новые", color: "#C8A44E" },
    { value: "in_progress", label: "В обработке", color: "#4A8FD4" },
    { value: "price_approved", label: "Оценка", color: "#E8A838" },
  ],
  jurist: [
    { value: "all", label: "Все" },
    { value: "price_approved", label: "На проверку", color: "#E8A838" },
  ],
  director: [
    { value: "all", label: "Все" },
    { value: "jurist_approved", label: "Юрист ✓", color: "#9B59B6" },
    { value: "director_approved", label: "Директор ✓", color: "#3498DB" },
  ],
  cashier: [
    { value: "all", label: "Все" },
    { value: "awaiting_payout", label: "Ждёт выплаты", color: "#EAB308" },
  ],
};

/** Per-role: which kanban columns to show */
export const ROLE_PIPELINE_STATUSES: Record<string, readonly string[]> = {
  admin: ACTIVE_STATUSES,
  manager: ["new", "in_progress", "price_approved"],
  jurist: ["price_approved"],
  director: ["jurist_approved", "director_approved"],
  cashier: ["awaiting_payout"],
};

export const INTENT_LABELS: Record<string, string> = {
  ready: "Согласен",
  negotiate: "Торг",
};

export const INTENT_COLORS: Record<string, string> = {
  ready: "#25D366",
  negotiate: "#E8A838",
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Квартира",
  house: "Дом",
  commercial: "Коммерция",
  land: "Участок",
};

export const CATEGORY_FILTERS = [
  { value: "all", label: "Все", color: "#C8A44E" },
  { value: "ready", label: "Согласен \u2713", color: "#25D366" },
  { value: "negotiate", label: "Торг", color: "#E8A838" },
  { value: "house", label: "Дома", color: "#9B59B6" },
  { value: "commercial", label: "Коммерция", color: "#4A8FD4" },
  { value: "land", label: "Участки", color: "#3498DB" },
];

export function filterLeadsByCategory(leads: Lead[], category: string): Lead[] {
  switch (category) {
    case "ready": return leads.filter(l => !l.needs_manual_review && l.intent === "ready");
    case "negotiate": return leads.filter(l => !l.needs_manual_review && l.intent === "negotiate");
    case "house": return leads.filter(l => l.needs_manual_review && l.property_type === "house");
    case "commercial": return leads.filter(l => l.needs_manual_review && l.property_type === "commercial");
    case "land": return leads.filter(l => l.needs_manual_review && l.property_type === "land");
    default: return leads;
  }
}

export function formatPrice(price: number | null): string {
  return price ? new Intl.NumberFormat("ru-RU").format(price) + " \u20B8" : "\u2014";
}

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  notary: "Нотариус",
  repair: "Ремонт",
  utility_debt: "Долги ЖКХ",
  cleaning: "Уборка",
  other: "Прочее",
};

export const SOURCE_LABELS: Record<string, string> = {
  landing: "Сайт",
  telegram: "Telegram",
  direct: "Прямой",
  manual: "Вручную",
  walk_in: "Визит в офис",
  outdoor_ad: "Наружная реклама",
  referral: "Рекомендация",
};

export function formatDate(date: string): string {
  return new Date(date).toLocaleString("ru-RU", {
    timeZone: "Asia/Almaty",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} д`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} мес`;
}
