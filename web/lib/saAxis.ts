/** A19 axis collapse — largest unit that changes; finest drops first as span widens. */

export type TimeUnit = "year" | "month" | "date" | "hm";

/** Visible span (seconds) → surviving time-label unit (finest still shown). */
export function timeUnitForSpan(spanSec: number): TimeUnit {
  if (spanSec > 400 * 86400) return "year";
  if (spanSec > 60 * 86400) return "month";
  if (spanSec > 2 * 86400) return "date";
  return "hm";
}

export function timeLabelAt(d: Date, unit: TimeUnit, prev?: Date): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  if (unit === "year") return String(y);
  if (unit === "month") {
    if (prev && prev.getUTCFullYear() !== y) return String(y);
    return d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  }
  if (unit === "date") {
    if (prev && prev.getUTCMonth() !== m) {
      return d.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    }
    return String(day);
  }
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  if (prev && prev.getUTCDate() !== day) {
    return d.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  }
  return `${hh}:${mm}`;
}

const PRICE_LADDER = [1, 2.5, 5, 10, 25, 50, 100, 250, 500, 1000];

/** Visible price span + instrument tick → major step (finest rung that still fits). */
export function priceStepForSpan(span: number, tick: number): number {
  const t = tick > 0 ? tick : 0.25;
  const minGap = span / 8;
  if (t >= minGap) return t;
  for (const pts of PRICE_LADDER) {
    if (pts >= minGap) return pts;
  }
  return PRICE_LADDER[PRICE_LADDER.length - 1];
}
