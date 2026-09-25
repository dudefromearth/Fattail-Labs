/** Visible-range window fetch. Pan/zoom/force-event re-query; empty window waits. */

export const FORCE_VP_EVENT = "sa-vp-update";

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

export type ProfileRowsLayout = "number-of-rows" | "ticks-per-row";

/**
 * The server requires row to be an exact positive-integer multiple of the
 * native tick (display_rebin.py: row_not_multiple_of_substrate /
 * row_below_substrate) — checked with an exact Decimal(str(...)) comparison,
 * no float tolerance. It rejects a mismatch with a named_state error body
 * at HTTP 200, not a 4xx, so a caller that only checks r.ok never sees it.
 * "Number of rows" mode divides an arbitrary price span by N, which is
 * essentially never already a clean multiple, and even "ticks per row"
 * (tick × integer) isn't safe for a tick like SPY's 0.10 — 0.1 isn't an
 * exact binary fraction, so plain float math can produce trailing noise
 * (0.7000000000000001) the server's exact comparison rejects. Round up to
 * the nearest valid multiple (never coarser than requested) and fix the
 * decimal precision to the tick's own so the value serializes exactly.
 */
export function snapToTickMultiple(row: number, tick: number): number {
  if (!(tick > 0)) return row;
  const n = Math.max(1, Math.ceil(row / tick - 1e-9));
  const snapped = n * tick;
  const decimals = Math.max(0, (String(tick).split(".")[1] || "").length);
  return Number(snapped.toFixed(decimals));
}

/**
 * TV Volume Profile grain.
 * Number of rows: visible price span / N (not rounded).
 * Ticks per row: tick × N.
 * Either way, snapped to a substrate-valid multiple before it ever reaches
 * the network — see snapToTickMultiple.
 */
export function profileRowGrain(opts: {
  layout: ProfileRowsLayout;
  rowSize: number;
  span: number;
  tick: number;
}): number {
  const t = opts.tick > 0 ? opts.tick : 0.25;
  const size =
    Number.isFinite(opts.rowSize) && opts.rowSize > 0 ? opts.rowSize : 1;
  const raw =
    opts.layout === "number-of-rows"
      ? Math.max(opts.span, t) / Math.max(1, size)
      : t * size;
  return snapToTickMultiple(raw, t);
}

/**
 * Fallback when prefs are absent: finer of one scale tick vs one canvas pixel.
 * Never coarsen by rounding up to a tick multiple.
 */
export function displayRow(
  span: number,
  heightPx: number,
  tick: number,
): number {
  const t = tick > 0 ? tick : 0.25;
  const pricePerPx = Math.max(span, t) / Math.max(1, heightPx);
  if (!(pricePerPx > 0)) return t;
  return Math.min(t, pricePerPx);
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

export const RANGE_DEBOUNCE_MS = 160;

export type VisibleCandleWindow = {
  fromT: number;
  toT: number;
  count: number;
  fromIdx: number;
  toIdx: number;
};

export type VpShapeClass = "rebuild" | "diff";

export type VpShapeEvent = {
  class: VpShapeClass;
  reason: "load" | "symbol" | "timeframe" | "refresh" | "pan" | "zoom" | "resize";
  window: VisibleCandleWindow;
};

export function asUnixMs(t: number): number {
  if (!Number.isFinite(t) || t <= 0) return 0;
  if (t > 1e12) return t;
  return t * 1000;
}

/** Candles that intersect a millisecond window. times are unix seconds. */
export function candlesInMsRange(
  times: number[],
  loMs: number,
  hiMs: number,
  barMs: number,
): VisibleCandleWindow | null {
  if (!times.length || !(barMs > 0) || !(hiMs > loMs)) return null;
  let fromIdx = -1;
  let toIdx = -1;
  for (let i = 0; i < times.length; i++) {
    const open = times[i] * 1000;
    const close = open + barMs;
    if (close > loMs && open < hiMs) {
      if (fromIdx < 0) fromIdx = i;
      toIdx = i;
    }
  }
  if (fromIdx < 0 || toIdx < fromIdx) return null;
  return {
    fromIdx,
    toIdx,
    count: toIdx - fromIdx + 1,
    fromT: times[fromIdx] * 1000,
    toT: times[toIdx] * 1000 + barMs,
  };
}

/**
 * Exact candles on the canvas from LWC logical range.
 * Partial bars at the edges count. Right-pad empty space does not.
 */
export function visibleCandleWindow(opts: {
  logical: { from: number; to: number } | null;
  times: number[];
  tfMs: number;
}): VisibleCandleWindow | null {
  const times = opts.times;
  const n = times.length;
  if (!opts.logical || n === 0 || !(opts.tfMs > 0)) return null;
  const fromIdx = Math.max(0, Math.floor(opts.logical.from));
  const toIdx = Math.min(n - 1, Math.floor(opts.logical.to));
  if (toIdx < fromIdx) return null;
  return {
    fromIdx,
    toIdx,
    count: toIdx - fromIdx + 1,
    fromT: times[fromIdx] * 1000,
    toT: times[toIdx] * 1000 + opts.tfMs,
  };
}

/** Visible Range only. Empty window → wait. Never falls through to /range. */
export function profileFetchPlan(opts: {
  fromT: number;
  toT: number;
  target: string;
  source: string;
  row?: number;
  apiBase?: string;
}): { kind: "window" | "wait"; url?: string } {
  if (!(opts.fromT > 0 && opts.toT > opts.fromT)) return { kind: "wait" };
  return {
    kind: "window",
    url: windowUrl({
      target: opts.target,
      source: opts.source,
      fromT: opts.fromT,
      toT: opts.toT,
      row: opts.row,
      apiBase: opts.apiBase,
    }),
  };
}

export function scheduleDebounced(
  hold: { current: ReturnType<typeof setTimeout> | null },
  ms: number,
  fn: () => void,
): void {
  if (hold.current) clearTimeout(hold.current);
  hold.current = setTimeout(fn, ms);
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
