/**
 * Surface host clocks — cite OPF §3.7 / Law C. Do not invent τ.
 * EXPIRED = midnight ET after exp date. Settlement = 16:00 America/New_York (PM).
 *
 * Clocks name the **claim** (live / residual / expired). They never unmount
 * the tent or forbid analysis (Coach 2026-08-18 · DL-445).
 */

import { isOptionPointerExpired } from "@/lib/options-lab/analyzerBook";

export type SurfaceHostClock = "live" | "residual" | "expired";

function nyParts(now: Date): { ymd: string; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const bag: Record<string, string> = {};
  for (const p of fmt.formatToParts(now)) {
    if (p.type !== "literal") bag[p.type] = p.value;
  }
  return {
    ymd: `${bag.year}-${bag.month}-${bag.day}`,
    minutes: Number(bag.hour) * 60 + Number(bag.minute),
  };
}

export function surfaceHostClock(
  expiration: string,
  now: Date = new Date(),
): SurfaceHostClock {
  const exp = expiration.slice(0, 10);
  if (!exp) return "expired";
  if (isOptionPointerExpired(exp, now)) return "expired";
  const ny = nyParts(now);
  if (ny.ymd === exp && ny.minutes >= 16 * 60) return "residual";
  return "live";
}

/** Listed YYYY-MM-DD dates on a card: package front plus every leg. */
export function listedExpirationsOf(input: {
  expiration?: string;
  legs?: ReadonlyArray<{ expiration?: string }>;
}): string[] {
  const out = new Set<string>();
  const front = (input.expiration || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(front)) out.add(front);
  for (const l of input.legs || []) {
    const e = (l.expiration || "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(e)) out.add(e);
  }
  return [...out];
}

/**
 * Book clock from remaining listed life — not the front pointer alone.
 * Any still-live expiration keeps the book live (calendar after 0DTE
 * settlement, weekly chosen after today's close).
 */
export function surfaceBookClock(
  expirations: readonly string[],
  now: Date = new Date(),
): SurfaceHostClock {
  let residual = false;
  for (const e of expirations) {
    const c = surfaceHostClock(e, now);
    if (c === "live") return "live";
    if (c === "residual") residual = true;
  }
  return residual ? "residual" : "expired";
}

/**
 * Law C names the mark claim. It never forbids a residual / ghost sheet.
 * Holes that still block a tent are IV NO · CHECK LEGS · WAITING · UPDATING.
 */
export function surfaceClockBlocksAnalysis(
  _clock: SurfaceHostClock,
): false {
  return false;
}

export function surfaceAsOfLabel(
  clock: SurfaceHostClock,
  timeMachine: boolean,
): string {
  if (timeMachine) return "time machine";
  if (clock === "residual") return "residual";
  if (clock === "expired") return "expired";
  return "live";
}
