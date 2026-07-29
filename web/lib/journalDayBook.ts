/**
 * Journal day book — Trade Log context for a calendar day.
 * Includes same-day fills AND positions still open that day
 * (opened earlier, not yet closed, not past expiry).
 */

import type { Trade } from "@/lib/tradeLog";

export type DayBookItem = {
  trade: Trade;
  /** open = still open on day; fill_open/fill_close = activity that day */
  role: "open" | "fill_open" | "fill_close";
  opened_on: string;
  closed_on: string | null;
  /** Human expiry if any (options) */
  expires_on: string | null;
};

function ymdFromExec(exec_at: string | null | undefined): string | null {
  if (!exec_at) return null;
  if (exec_at.length >= 10 && exec_at[4] === "-" && exec_at[7] === "-") {
    return exec_at.slice(0, 10);
  }
  const d = new Date(exec_at);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Majority leg pos_effect → open vs close fill. */
export function tradeIsCloseFill(t: Trade): boolean {
  const effects = (t.legs || []).map((l) => l.pos_effect).filter(Boolean);
  if (effects.length === 0) return false;
  const closes = effects.filter((e) => e === "TO_CLOSE").length;
  const opens = effects.filter((e) => e === "TO_OPEN").length;
  return closes > opens;
}

export function tradeExpiry(t: Trade): string | null {
  const exp = (t.legs || []).map((l) => l.expiry).filter(Boolean) as string[];
  if (exp.length === 0) return null;
  // Earliest expiry on the structure (multi-exp rare in v1)
  return exp.slice().sort()[0] ?? null;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/** Min positive leg size (unit size for butterfly 1-2-1 vs 3-6-3). */
export function unitQty(t: Trade): number {
  const qs = (t.legs || [])
    .map((l) => Math.abs(Number(l.quantity) || 0))
    .filter((q) => q > 0);
  if (qs.length === 0) return 1;
  return qs.reduce((a, b) => gcd(a, b), qs[0]);
}

/**
 * Structure key for matching open fills to close fills.
 * Sides/pos_effect ignored; quantities reduced by GCD so 3-6-3 matches 1-2-1.
 */
export function structureKey(t: Trade): string {
  const legs = t.legs || [];
  const under =
    legs.find((l) => l.underlier)?.underlier ||
    legs.find((l) => l.symbol)?.symbol ||
    t.strategy;
  const exp = tradeExpiry(t) || "";
  const g = unitQty(t);
  const struct = legs
    .map((l) => {
      const q = Math.abs(Number(l.quantity) || 0) / g;
      const strike = l.strike != null ? String(l.strike) : "";
      const right = l.right || "";
      const ac = l.asset_class || "";
      return `${q}@${strike}${right}:${ac}`;
    })
    .sort()
    .join("|");
  // Account-scoped; strategy+underlier+expiry+normalized geometry
  return `${t.account_id}|${t.strategy}|${under}|${exp}|${struct}`;
}

/** Cash flow to trader in price points (credit received +, debit paid −). */
export function netCashPoints(t: Trade): number | null {
  if (t.net_price == null || Number.isNaN(Number(t.net_price))) return null;
  const p = Math.abs(Number(t.net_price));
  if (t.net_side === "CREDIT") return p;
  if (t.net_side === "DEBIT") return -p;
  return Number(t.net_price);
}

type MatchedOpen = {
  open: Trade;
  openDay: string;
  close: Trade | null;
  closeDay: string | null;
};

/**
 * FIFO match TO_CLOSE fills onto TO_OPEN fills with the same structure.
 * Unmatched opens remain open indefinitely (until expiry filter).
 */
export function matchOpenClose(trades: Trade[]): MatchedOpen[] {
  const sorted = [...trades].sort((a, b) => {
    const ta = a.exec_at || "";
    const tb = b.exec_at || "";
    if (ta !== tb) return ta < tb ? -1 : 1;
    return a.id - b.id;
  });

  const queues = new Map<string, MatchedOpen[]>();
  const result: MatchedOpen[] = [];

  for (const t of sorted) {
    const day = ymdFromExec(t.exec_at);
    if (!day) continue;
    // Skip pure notes from position book
    if (t.strategy === "NOTE" && (t.legs || []).length === 0) continue;

    const key = structureKey(t);
    const isClose = tradeIsCloseFill(t);

    if (!isClose) {
      const m: MatchedOpen = {
        open: t,
        openDay: day,
        close: null,
        closeDay: null,
      };
      const q = queues.get(key) || [];
      q.push(m);
      queues.set(key, q);
      result.push(m);
      continue;
    }

    // Close: attach to earliest unmatched open of same structure
    const q = queues.get(key) || [];
    const openSlot = q.find((m) => m.close == null);
    if (openSlot) {
      openSlot.close = t;
      openSlot.closeDay = day;
    }
    // Orphan close fills are still "activity" on their day — handled separately
  }

  return result;
}

/**
 * Positions open on calendar day `dayYmd` (YYYY-MM-DD):
 * opened on or before day, not closed on or before day, not past expiry.
 */
export function opensOnDay(trades: Trade[], dayYmd: string): DayBookItem[] {
  const matched = matchOpenClose(trades);
  const out: DayBookItem[] = [];

  for (const m of matched) {
    if (m.openDay > dayYmd) continue;
    if (m.closeDay != null && m.closeDay <= dayYmd) continue;
    const exp = tradeExpiry(m.open);
    if (exp && exp < dayYmd) continue; // expired before this day

    out.push({
      trade: m.open,
      role: "open",
      opened_on: m.openDay,
      closed_on: m.closeDay,
      expires_on: exp,
    });
  }

  // Newest opens first for the journal session
  out.sort((a, b) => {
    if (a.opened_on !== b.opened_on) return a.opened_on < b.opened_on ? 1 : -1;
    return b.trade.id - a.trade.id;
  });
  return out;
}

/** Fills whose exec calendar day is `dayYmd`. */
export function fillsOnDay(trades: Trade[], dayYmd: string): DayBookItem[] {
  const out: DayBookItem[] = [];
  for (const t of trades) {
    const day = ymdFromExec(t.exec_at);
    if (day !== dayYmd) continue;
    if (t.strategy === "NOTE" && (t.legs || []).length === 0) continue;
    const isClose = tradeIsCloseFill(t);
    out.push({
      trade: t,
      role: isClose ? "fill_close" : "fill_open",
      opened_on: day,
      closed_on: isClose ? day : null,
      expires_on: tradeExpiry(t),
    });
  }
  out.sort((a, b) => {
    const ta = a.trade.exec_at || "";
    const tb = b.trade.exec_at || "";
    if (ta !== tb) return ta < tb ? 1 : -1;
    return b.trade.id - a.trade.id;
  });
  return out;
}

export type DayBook = {
  day: string;
  /** Fills executed this calendar day */
  activity: DayBookItem[];
  /** Positions still open through this day (may have opened earlier) */
  open: DayBookItem[];
  /**
   * Union for the day panel — any trade that was:
   * - opened that day, or
   * - closed that day, or
   * - still open that day (opened earlier, not yet closed).
   * De-duped by trade id (an open fill still open is listed once as open).
   */
  items: DayBookItem[];
  openIds: Set<number>;
};

/**
 * Single list: opened | closed | currently open on `day`.
 * Order: still-open first (newest opens), then same-day closes/fills.
 */
export function unionDayBookItems(
  open: DayBookItem[],
  activity: DayBookItem[],
): DayBookItem[] {
  const seen = new Set<number>();
  const items: DayBookItem[] = [];

  for (const o of open) {
    if (seen.has(o.trade.id)) continue;
    seen.add(o.trade.id);
    items.push(o);
  }
  for (const a of activity) {
    if (seen.has(a.trade.id)) continue;
    seen.add(a.trade.id);
    items.push(a);
  }
  return items;
}

export function buildDayBook(trades: Trade[], day: Date): DayBook {
  const dayYmd = ymdLocal(day);
  const activity = fillsOnDay(trades, dayYmd);
  const open = opensOnDay(trades, dayYmd);
  const items = unionDayBookItems(open, activity);
  return {
    day: dayYmd,
    activity,
    open,
    items,
    openIds: new Set(open.map((i) => i.trade.id)),
  };
}

export function dayBookBadge(item: DayBookItem, dayYmd: string): string {
  if (item.role === "fill_close") return "Closed";
  if (item.role === "open") {
    return item.opened_on === dayYmd ? "Opened" : "Open";
  }
  // fill_open that wasn't still open (e.g. opened and closed same day)
  if (item.opened_on === dayYmd) return "Opened";
  return "Filled";
}

/** Days that have activity OR open interest (for calendar dots). */
export function daysWithBookInterest(
  trades: Trade[],
  rangeStart: string,
  rangeEnd: string,
): Set<string> {
  const days = new Set<string>();
  // Activity days
  for (const t of trades) {
    const d = ymdFromExec(t.exec_at);
    if (d && d >= rangeStart && d <= rangeEnd) days.add(d);
  }
  // Open positions: every day from open to close/expiry (cap for perf)
  const matched = matchOpenClose(trades);
  for (const m of matched) {
    const exp = tradeExpiry(m.open);
    let end = m.closeDay || exp || rangeEnd;
    if (exp && (!m.closeDay || exp < m.closeDay)) {
      // Still open until close; expire day itself may still note the structure
      end = m.closeDay || rangeEnd;
    }
    if (m.closeDay) end = m.closeDay;
    // Walk open..end inclusive within requested range (limit span 400 days)
    const start = m.openDay > rangeStart ? m.openDay : rangeStart;
    const stop = end < rangeEnd ? end : rangeEnd;
    if (start > stop) continue;
    // If closed, open interest is days openDay .. day before closeDay
    // For journal "worthy of note" include open through close day for closes?
    // Open means still held that morning — use openDay <= d < closeDay, or openDay <= d if no close
    const closeExclusive = m.closeDay; // not open on/after close day
    let cur = parseYmd(start);
    const last = parseYmd(stop);
    if (!cur || !last) continue;
    let guard = 0;
    while (cur <= last && guard < 400) {
      const y = ymdLocal(cur);
      if (!closeExclusive || y < closeExclusive) {
        if (exp && y > exp) break;
        days.add(y);
      }
      cur.setDate(cur.getDate() + 1);
      guard += 1;
    }
  }
  return days;
}

function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
