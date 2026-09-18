/** A12 / Phase B — full-history /range band. X-invariant; y-pan re-slices locally. */

export type VpBin = { price: number; volume: number };

export type VpBand = {
  lo: number;
  hi: number;
  row: number;
  bins: VpBin[];
  floor: string | null;
  ceiling: string | null;
  truncated: boolean;
  generation: string | null;
  ms: number;
};

/** Visible span padded 100% each side (loaded band ≈ 3× the view). */
export const BAND_MARGIN = 1;

export function displayRow(
  span: number,
  heightPx: number,
  tick: number,
): number {
  const t = tick > 0 ? tick : 0.25;
  const raw = Math.max(span, t) / Math.max(1, heightPx);
  const n = Math.max(1, Math.ceil(raw / t));
  return n * t;
}

export function expandBand(
  lo: number,
  hi: number,
  margin = BAND_MARGIN,
): { lo: number; hi: number } {
  const span = Math.max(hi - lo, 0);
  const pad = span * margin || 1;
  return { lo: lo - pad, hi: hi + pad };
}

export function bandContains(
  band: { lo: number; hi: number },
  lo: number,
  hi: number,
): boolean {
  return lo >= band.lo && hi <= band.hi;
}

export function sliceVisible(
  bins: VpBin[],
  lo: number,
  hi: number,
): { rows: VpBin[]; max: number } {
  const rows = bins.filter((b) => b.price >= lo && b.price <= hi);
  let max = 0;
  for (const r of rows) if (r.volume > max) max = r.volume;
  return { rows, max };
}

export function rangeUrl(opts: {
  target: string;
  source: string;
  from: string;
  to: string;
  lo: number;
  hi: number;
  row: number;
  harness?: "live" | "fixture";
}): string {
  const q = new URLSearchParams({
    harness: opts.harness || "live",
    source: opts.source,
    from: opts.from,
    to: opts.to,
    price_lo: String(opts.lo),
    price_hi: String(opts.hi),
    row: String(opts.row),
  });
  return `/api/dev/sa/v1/range/${encodeURIComponent(opts.target)}?${q}`;
}

export type VpHitRect = { x0: number; y0: number; x1: number; y1: number };

export function hitProfile(
  hits: VpHitRect[] | undefined,
  x: number,
  y: number,
): boolean {
  if (!hits || !hits.length) return false;
  return hits.some((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);
}
