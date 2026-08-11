/**
 * US equity session open/closed for Options Lab chain polling.
 * Prefer server Massive marketstatus when available; fall back to NY clock.
 */

export type SessionStatus = {
  /** True only when continuous chain polling should run (RTH open). */
  open: boolean;
  market?: string | null;
  source: "server" | "clock";
  as_of?: string | null;
  reason?: string;
};

/** Rough RTH: Mon–Fri 09:30–16:00 America/New_York (no holiday calendar). */
export function isUsEquityRthOpenByClock(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const wd = get("weekday");
  if (wd === "Sat" || wd === "Sun") return false;
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;
  const mins = hour * 60 + minute;
  // 09:30 inclusive → 16:00 exclusive
  return mins >= 9 * 60 + 30 && mins < 16 * 60;
}

/**
 * Map Massive / Labs session document to open for chain polling.
 * Only full "open" counts — extended hours and closed hold last print.
 */
export function marketDocIsOpen(doc: {
  market?: string | null;
  exchanges?: Record<string, string> | null;
}): boolean {
  const m = String(doc.market || "")
    .trim()
    .toLowerCase();
  if (m === "open") return true;
  if (m === "closed" || m === "extended-hours" || m === "early-close") {
    // early-close during the shortened session may still be "open" from Massive;
    // if they send early-close as market state after close, treat as closed for poll.
    if (m === "early-close") return false;
    return false;
  }
  // Prefer NYSE flag when present
  const nyse = String(doc.exchanges?.nyse || doc.exchanges?.NYSE || "")
    .trim()
    .toLowerCase();
  if (nyse === "open") return true;
  if (nyse === "closed" || nyse === "extended-hours") return false;
  return isUsEquityRthOpenByClock();
}

export async function fetchSessionStatus(
  signal?: AbortSignal,
): Promise<SessionStatus> {
  try {
    const r = await fetch("/api/me/market/session-status", {
      credentials: "same-origin",
      signal,
    });
    if (r.ok) {
      const d = (await r.json()) as {
        open?: boolean;
        market?: string | null;
        source?: string;
        as_of?: string | null;
      };
      if (typeof d.open === "boolean") {
        return {
          open: d.open,
          market: d.market ?? null,
          source: "server",
          as_of: d.as_of ?? null,
        };
      }
    }
  } catch {
    /* fall through to clock */
  }
  const open = isUsEquityRthOpenByClock();
  return {
    open,
    market: open ? "open" : "closed",
    source: "clock",
    reason: open ? "rth_clock" : "outside_rth_or_weekend",
  };
}
