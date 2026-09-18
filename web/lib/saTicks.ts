/** A16 — scale increments from instrument tick metadata. No per-symbol constants. */

export function tickDecimals(tick: number): number {
  if (!Number.isFinite(tick) || tick <= 0) return 2;
  const s = tick.toFixed(12).replace(/0+$/, "").replace(/\.$/, "");
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
}

export function snapTick(price: number, tick: number): number {
  if (!Number.isFinite(tick) || tick <= 0 || !Number.isFinite(price)) return price;
  const n = Math.round(price / tick);
  const d = tickDecimals(tick);
  return Number((n * tick).toFixed(d));
}

export function formatTick(price: number, tick: number): string {
  return snapTick(price, tick).toFixed(tickDecimals(tick));
}

/** Greatest common divisor of positive numbers, scaled to integers. */
function gcdInt(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/** Derive tick from payload prices when vp_row is absent — still data, not a constant. */
export function tickFromPrices(prices: number[]): number | null {
  const uniq = [...new Set(prices.filter((p) => Number.isFinite(p)))].sort(
    (a, b) => a - b,
  );
  if (uniq.length < 2) return null;
  const scale = 1e8;
  let g = 0;
  for (let i = 1; i < uniq.length; i++) {
    const d = Math.round((uniq[i] - uniq[i - 1]) * scale);
    if (d <= 0) continue;
    g = g ? gcdInt(g, d) : d;
  }
  if (!g) return null;
  return g / scale;
}

export function resolveTick(opts: {
  vpRow?: number | null;
  prices?: number[];
}): number | null {
  const row = opts.vpRow;
  if (row != null && Number.isFinite(row) && row > 0) return row;
  return tickFromPrices(opts.prices || []);
}

const NICE = [1, 2, 4, 5, 8, 10, 20, 25, 40, 50, 100, 200, 250, 400, 500, 1000];

export function majorStep(
  tick: number,
  span: number,
  targetLabels: number,
): number {
  if (!(tick > 0) || !(span > 0)) return tick;
  const raw = span / Math.max(2, targetLabels);
  const n = Math.max(1, Math.round(raw / tick));
  let best = NICE[NICE.length - 1];
  for (const k of NICE) {
    if (k >= n) {
      best = k;
      break;
    }
  }
  return best * tick;
}

export function priceGrid(
  lo: number,
  hi: number,
  tick: number,
  targetLabels = 8,
): { majors: number[]; minors: number[] } {
  if (!(tick > 0) || hi <= lo) return { majors: [snapTick(lo, tick)], minors: [] };
  const step = majorStep(tick, hi - lo, targetLabels);
  const start = Math.ceil(lo / step) * step;
  const majors: number[] = [];
  for (let p = start; p <= hi + tick / 2; p += step) {
    majors.push(snapTick(p, tick));
  }
  const minors: number[] = [];
  if (step / tick >= 4) {
    const minorStep = step / 5 >= tick * 2 ? step / 5 : tick;
    const m0 = Math.ceil(lo / minorStep) * minorStep;
    for (let p = m0; p <= hi + tick / 2; p += minorStep) {
      const s = snapTick(p, tick);
      if (!majors.some((m) => Math.abs(m - s) < tick / 2)) minors.push(s);
    }
  }
  return { majors, minors };
}
