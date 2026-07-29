/**
 * Journal day-book presentation helpers (PH1-3).
 * Open/close matching lives on the server (trade_log_domain).
 */

import type { Trade } from "@/lib/tradeLog";
import type { ServerDayBook, ServerDayBookItem } from "@/lib/tradeLogAnalytics";

export type DayBookItem = {
  trade: Trade;
  role: "open" | "fill_open" | "fill_close";
  opened_on: string;
  closed_on: string | null;
  expires_on: string | null;
};

export type DayBook = {
  day: string;
  activity: DayBookItem[];
  open: DayBookItem[];
  items: DayBookItem[];
  openIds: Set<number>;
};

export function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mapItem(raw: ServerDayBookItem): DayBookItem {
  return {
    trade: raw.trade,
    role: raw.role,
    opened_on: raw.opened_on,
    closed_on: raw.closed_on,
    expires_on: raw.expires_on,
  };
}

/** Map server analytics/day-book → UI DayBook. */
export function dayBookFromServer(raw: ServerDayBook): DayBook {
  return {
    day: raw.day,
    activity: (raw.activity || []).map(mapItem),
    open: (raw.open || []).map(mapItem),
    items: (raw.items || []).map(mapItem),
    openIds: new Set(raw.open_ids || []),
  };
}

export function emptyDayBook(dayYmd: string): DayBook {
  return {
    day: dayYmd,
    activity: [],
    open: [],
    items: [],
    openIds: new Set(),
  };
}

export function dayBookBadge(item: DayBookItem, dayYmd: string): string {
  if (item.role === "fill_close") return "Closed";
  if (item.role === "open") {
    return item.opened_on === dayYmd ? "Opened" : "Open";
  }
  if (item.opened_on === dayYmd) return "Opened";
  return "Filled";
}
