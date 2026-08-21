/**
 * What-if clocks — AZ-TM T2/T3/T6/T7.
 * Last-trade remaining ≠ OPF PM settlement τ (16:00).
 */

import {
  expirationInstantMs,
  nyDateTimeToUtcMs,
  tauYearsToPmExpiry,
} from "@/lib/risk-graph/surfaceTimeAxis";
import { MIN_TAU } from "@/lib/risk-graph/surfaceModel";

const INDEX_PM = new Set(["SPX", "XSP", "NDX", "RUT"]);

export function isIndexPmProduct(symbol: string): boolean {
  return INDEX_PM.has((symbol || "").toUpperCase());
}

/** Last-trade wall on the expiration date (ET). Index 16:15 · equity 16:00. */
export function lastTradeInstantMs(
  expiration: string,
  symbol: string,
): number {
  const ymd = expiration.slice(0, 10);
  if (isIndexPmProduct(symbol)) return nyDateTimeToUtcMs(ymd, 16, 15);
  return nyDateTimeToUtcMs(ymd, 16, 0);
}

/** Hours until last trade. 0 after last trade. */
export function remainingLastTradeHours(
  expiration: string,
  symbol: string,
  nowMs: number,
): number {
  const rem = (lastTradeInstantMs(expiration, symbol) - nowMs) / 3_600_000;
  if (!Number.isFinite(rem) || rem <= 0) return 0;
  return rem;
}

/** Today's last-trade wall in America/New_York (index 16:15 · equity 16:00). */
export function sessionEodMs(symbol: string, nowMs: number = Date.now()): number {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(nowMs));
  return lastTradeInstantMs(ymd, symbol);
}

export function whatIfTimeStepHours(remainingHours: number): number {
  if (remainingHours <= 8) return 5 / 60;
  if (remainingHours <= 24) return 15 / 60;
  return 1;
}

/** OPF §3.7 PM τ — 16:00 ET, 1-minute floor. Use for every What-if τ eval. */
export function tauYearsWhatIf(
  expiration: string,
  nowMs: number,
): number {
  return tauYearsToPmExpiry(expiration, nowMs);
}

export function tauYearsWhatIfAfterElapsed(
  expiration: string,
  nowMs: number,
  elapsedHours: number,
): number {
  const elapsed = Number.isFinite(elapsedHours) ? Math.max(0, elapsedHours) : 0;
  const asOf = nowMs + elapsed * 3_600_000;
  const tau = tauYearsWhatIf(expiration, asOf);
  if (tau <= 0) return 0;
  return Math.max(tau, MIN_TAU);
}

export function formatEtClock(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(ms))
    .replace(/\s/g, " ");
}

export function formatHoursLeft(hours: number): string {
  if (!(hours > 0)) return "0m left";
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m left`;
  if (m === 0) return `${h}h left`;
  return `${h}h ${m}m left`;
}

/** T7: `11:45 AM · 4h 30m left` (ET). */
export function formatWhatIfTimeReadout(
  nowMs: number,
  elapsedHours: number,
  remainingHours: number,
): string {
  const left = Math.max(0, remainingHours - Math.max(0, elapsedHours));
  const clock = formatEtClock(nowMs + Math.max(0, elapsedHours) * 3_600_000);
  return `${clock} ET · ${formatHoursLeft(left)}`;
}

export { expirationInstantMs };
