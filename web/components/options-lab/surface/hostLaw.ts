/**
 * Surface host clocks — cite OPF §3.7 / Law C. Do not invent τ.
 * EXPIRED = midnight ET after exp date. Settlement = 16:00 America/New_York (PM).
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
