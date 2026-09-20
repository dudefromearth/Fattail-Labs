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

/** Visible price window from pane pixels (not host box / time-axis height). */
export function panePriceWindow(
  coordinateToPrice: (y: number) => number | null,
  paneHeight: number,
): { lo: number; hi: number } | null {
  if (!(paneHeight >= 8)) return null;
  const top = coordinateToPrice(0);
  const bottom = coordinateToPrice(paneHeight);
  if (top == null || bottom == null || top === bottom) return null;
  return { lo: Math.min(top, bottom), hi: Math.max(top, bottom) };
}

export function bandContains(
  band: { lo: number; hi: number },
  lo: number,
  hi: number,
): boolean {
  return lo >= band.lo && hi <= band.hi;
}

/** Identity for a /range epoch — source/TF/span, not tick or y-window. */
export function vpBandEpoch(parts: {
  source: string;
  target?: string;
  from?: string | null;
  to?: string | null;
  priceTf: string;
  harness: string;
  apiBase: string;
}): string {
  return [
    parts.source,
    parts.target ?? "",
    parts.from ?? "",
    parts.to ?? "",
    parts.priceTf,
    parts.harness,
    parts.apiBase,
  ].join("|");
}

export type BandFlight = {
  inflight: boolean;
  pending: boolean;
};

export function beginBandFetch(flight: BandFlight): "go" | "wait" {
  if (flight.inflight) {
    flight.pending = true;
    return "wait";
  }
  flight.inflight = true;
  return "go";
}

export function endBandFetch(flight: BandFlight): "idle" | "again" {
  flight.inflight = false;
  if (!flight.pending) return "idle";
  flight.pending = false;
  return "again";
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
  lo?: number;
  hi?: number;
  row?: number;
  harness?: "live" | "fixture";
  apiBase?: string;
}): string {
  const q = new URLSearchParams({
    harness: opts.harness || "live",
    source: opts.source,
    from: opts.from,
    to: opts.to,
  });
  if (opts.lo != null) q.set("price_lo", String(opts.lo));
  if (opts.hi != null) q.set("price_hi", String(opts.hi));
  if (opts.row != null) q.set("row", String(opts.row));
  const base = opts.apiBase || "/api/app/vp/v1";
  return `${base}/range/${encodeURIComponent(opts.target)}?${q}`;
}

export function windowUrl(opts: {
  target: string;
  source: string;
  fromT: number;
  toT: number;
  row?: number;
  apiBase?: string;
}): string {
  const q = new URLSearchParams({
    source: opts.source,
    from_t: String(Math.floor(opts.fromT)),
    to_t: String(Math.floor(opts.toT)),
  });
  if (opts.row != null) q.set("row", String(opts.row));
  const base = opts.apiBase || "/api/app/vp/v1";
  return `${base}/window/${encodeURIComponent(opts.target)}?${q}`;
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

/** Map host-box click into pane space (excludes price scale + time axis). */
export function hostToPane(
  x: number,
  y: number,
  host: { width: number; height: number },
  pane: { width: number; height: number },
  axis: "left" | "right" | "both",
): { x: number; y: number } | null {
  const leftoverX = Math.max(0, host.width - pane.width);
  const left = axis === "right" ? 0 : axis === "both" ? leftoverX / 2 : leftoverX;
  const px = x - left;
  const py = y;
  if (px < 0 || py < 0 || px > pane.width || py > pane.height) return null;
  return { x: px, y: py };
}
