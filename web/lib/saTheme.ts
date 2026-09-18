/** A14.1 — TV-benchmark typography. Faces are theme config Coach tunes. */

export const SA_THEME = {
  uiFont: '"Trebuchet MS", "Segoe UI", sans-serif',
  axisFont: '"Trebuchet MS", "Segoe UI", sans-serif',
  axisSize: 26,
  chipSize: 13,
  timeSize: 26,
  letterSpacing: "0px",
  yPadPx: 75,
  bg: "#131722",
  grid: "#ffffff",
  gridOpacity: 0.08,
  axisText: "#d1d4dc",
  panel: "#1e222d",
  candleUpFill: "#4db6ac",
  candleUpStroke: "#00695c",
  candleDownFill: "#ef9a9a",
  candleDownStroke: "#b71c1c",
} as const;

export const SA_INTERVALS = ["1m", "5m", "15m", "1h", "1d"] as const;
export type SaInterval = (typeof SA_INTERVALS)[number];

export function adjacentIntervals(tf: string): SaInterval[] {
  const i = SA_INTERVALS.indexOf(tf as SaInterval);
  if (i < 0) return ["5m", "1h"];
  const out: SaInterval[] = [];
  if (i > 0) out.push(SA_INTERVALS[i - 1]);
  if (i < SA_INTERVALS.length - 1) out.push(SA_INTERVALS[i + 1]);
  return out;
}

export function asHex(color: string, fallback: string): string {
  const c = (color || "").trim();
  const full = /^#([0-9a-f]{6})$/i.exec(c);
  if (full) return `#${full[1].toLowerCase()}`;
  const short = /^#([0-9a-f]{3})$/i.exec(c);
  if (short) {
    const s = short[1];
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toLowerCase();
  }
  return fallback;
}

export function hexToRgba(hex: string, opacity: number): string {
  const h = asHex(hex, "#ffffff").slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.min(1, Math.max(0, opacity));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function adjacentLookbacks(days: number): number[] {
  const d = Math.max(1, days || 5);
  const set = new Set<number>([Math.max(1, d - 2), d === 5 ? 10 : d + 2]);
  set.delete(d);
  return [...set];
}
