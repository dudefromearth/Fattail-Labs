/** A17 default window + pan/scale bounds so the series stays reachable. */

export const RIGHT_PAD_BARS = 5;

const TF_MS: Record<string, number> = {
  "1m": 60_000,
  "2m": 120_000,
  "5m": 300_000,
  "10m": 600_000,
  "15m": 900_000,
  "30m": 1_800_000,
  "1h": 3_600_000,
  "2h": 7_200_000,
  "4h": 14_400_000,
  "1d": 86_400_000,
  "2d": 172_800_000,
  "7d": 604_800_000,
};

/** Store/native TF the OHLC endpoint actually serves. */
export function nativeOhlcTf(tf: string): string {
  if (tf === "2m") return "1m";
  if (tf === "10m" || tf === "30m") return "5m";
  if (tf === "2h" || tf === "4h") return "1h";
  if (tf === "2d" || tf === "7d") return "1d";
  return tf;
}

export function resampleOhlc<
  T extends {
    t: number;
    o: number;
    h: number;
    l: number;
    c: number;
    v?: number | null;
  },
>(bars: T[], periodMs: number): T[] {
  if (!(periodMs > 0) || bars.length < 2) return bars;
  const out: T[] = [];
  let bucket = Number.NaN;
  let cur: T | null = null;
  for (const b of bars) {
    const k = Math.floor(b.t / periodMs) * periodMs;
    if (cur == null || k !== bucket) {
      if (cur) out.push(cur);
      bucket = k;
      cur = { ...b, t: k };
    } else {
      cur.h = Math.max(cur.h, b.h);
      cur.l = Math.min(cur.l, b.l);
      cur.c = b.c;
      if (cur.v != null || b.v != null) {
        cur.v = (cur.v || 0) + (b.v || 0);
      }
    }
  }
  if (cur) out.push(cur);
  return out;
}

export function tfMs(tf: string): number {
  return TF_MS[tf] || 300_000;
}

export function defaultTimeWindow(
  dataLo: number,
  dataHi: number,
  tfMs: number,
  lookbackDays: number,
): { lo: number; hi: number } {
  const pad = tfMs * RIGHT_PAD_BARS;
  const hi = dataHi + pad;
  const want = Math.max(tfMs * 48, Math.max(1, lookbackDays) * 86400_000);
  const lo = Math.max(dataLo, hi - want);
  return { lo, hi };
}

export function clampWindow(
  lo: number,
  hi: number,
  dataLo: number,
  dataHi: number,
  minSpan: number,
): { lo: number; hi: number } {
  let span = Math.max(minSpan, hi - lo);
  const dataSpan = Math.max(minSpan, dataHi - dataLo);
  const keep = Math.min(span * 0.25, dataSpan * 0.5);
  let a = lo;
  let b = a + span;
  if (b < dataLo + keep) {
    b = dataLo + keep;
    a = b - span;
  }
  if (a > dataHi - keep) {
    a = dataHi - keep;
    b = a + span;
  }
  return { lo: a, hi: b };
}
