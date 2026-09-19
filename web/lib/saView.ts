/** A17 default window + pan/scale bounds so the series stays reachable. */

export const RIGHT_PAD_BARS = 5;

const TF_MS: Record<string, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  "1h": 3_600_000,
  "1d": 86_400_000,
};

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
