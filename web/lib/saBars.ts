/** A6 honest bars. Never render a bar that fails the wick invariant. */

export type HonestBar = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number | null;
};

export function barInvariant(b: {
  o?: number | null;
  h?: number | null;
  l?: number | null;
  c?: number | null;
}): boolean {
  if (b.o == null || b.h == null || b.l == null || b.c == null) return false;
  if (![b.o, b.h, b.l, b.c].every((n) => Number.isFinite(n))) return false;
  return b.l <= Math.min(b.o, b.c) && Math.max(b.o, b.c) <= b.h;
}

export function honestBars(
  raw: Array<{
    t: number;
    o?: number | null;
    h?: number | null;
    l?: number | null;
    c: number;
    v?: number | null;
  }>,
): { bars: HonestBar[]; gaps: number } {
  const bars: HonestBar[] = [];
  let gaps = 0;
  for (const b of raw) {
    if (barInvariant(b) && b.o != null && b.h != null && b.l != null) {
      bars.push({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v });
    } else {
      gaps += 1;
    }
  }
  return { bars, gaps };
}

export function xFor(t: number, tLo: number, tHi: number, x0: number, x1: number): number {
  if (tHi === tLo) return (x0 + x1) / 2;
  return x0 + ((t - tLo) / (tHi - tLo)) * (x1 - x0);
}

function labelAt(ms: number): string {
  const et = "America/New_York";
  const d = new Date(ms);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: et,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    month: "short",
    day: "numeric",
  }).formatToParts(d);
  const get = (typ: string) => parts.find((p) => p.type === typ)?.value || "";
  const hour = get("hour");
  const minute = get("minute");
  if (hour === "00" && minute === "00") return `${get("month")} ${get("day")}`;
  return `${hour}:${minute}`;
}

const TIME_STEPS_MS = [
  60_000, 5 * 60_000, 15 * 60_000, 30 * 60_000, 60 * 60_000, 2 * 3600_000,
  3 * 3600_000, 6 * 3600_000, 12 * 3600_000, 24 * 3600_000, 7 * 86400_000,
];

export function timeTicks(
  tLo: number,
  tHi: number,
  plotWidthPx = 800,
): { t: number; label: string }[] {
  if (!Number.isFinite(tLo) || !Number.isFinite(tHi) || tHi <= tLo) return [];
  const span = tHi - tLo;
  const target = Math.max(4, Math.min(14, Math.floor(plotWidthPx / 88)));
  const raw = span / target;
  let step = TIME_STEPS_MS[TIME_STEPS_MS.length - 1];
  for (const s of TIME_STEPS_MS) {
    if (s >= raw) {
      step = s;
      break;
    }
  }
  const start = Math.ceil(tLo / step) * step;
  const out: { t: number; label: string }[] = [];
  for (let t = start; t <= tHi + 1; t += step) {
    out.push({ t, label: labelAt(t) });
  }
  if (!out.length || out[0].t - tLo > step * 0.6) {
    out.unshift({ t: tLo, label: labelAt(tLo) });
  }
  return out;
}
