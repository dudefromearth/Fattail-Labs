/**
 * Options Lab underlier OHLC — GET /api/me/market/ohlc
 *
 * OhlcTf is **bar period** (what one candle represents), not a chart range:
 * 5m → each bar aggregates 5 minutes of trades, etc.
 *
 * Pass lookbackDays for fast first-paint; omit for full ≥3y history.
 */

export type OhlcTf = "1d" | "4h" | "1h" | "30m" | "10m" | "5m";

export const OHL_C_TIMEFRAMES: { id: OhlcTf; label: string }[] = [
  { id: "1d", label: "Day" },
  { id: "4h", label: "4 hr" },
  { id: "1h", label: "1 hr" },
  { id: "30m", label: "30 min" },
  { id: "10m", label: "10 min" },
  { id: "5m", label: "5 min" },
];

/** Full product lookback (matches server OHLC_LOOKBACK_DAYS). */
export const OHLC_FULL_LOOKBACK_DAYS = 1096;

/**
 * Short window for first paint when switching TF.
 * Sized so fine TFs return a few thousand bars, not 100k+.
 */
export const OHLC_FAST_LOOKBACK_DAYS: Record<OhlcTf, number> = {
  "1d": OHLC_FULL_LOOKBACK_DAYS, // ~750 bars — already small
  "4h": 180,
  "1h": 90,
  "30m": 60,
  "10m": 45,
  "5m": 30,
};

export type OhlcBar = {
  t: number; // ms epoch
  o: number | null;
  h: number | null;
  l: number | null;
  c: number;
  v?: number | null;
};

export type OhlcPayload = {
  ok: boolean;
  product: string;
  series_ticker: string;
  proxy_label?: string | null;
  source: string;
  tf: OhlcTf;
  bar_count: number;
  bars: OhlcBar[];
  from?: string;
  to?: string;
  cache_hit?: boolean;
  lookback_years_requested?: number | null;
  lookback_days_requested?: number;
  history_span_days?: number | null;
  complete?: boolean;
};

export type OhlcMeta = {
  product: string;
  series_ticker: string;
  proxy_label?: string | null;
  source: string;
  tf: OhlcTf;
  bar_count: number;
  lookback_days_requested?: number;
  history_span_days?: number | null;
  complete: boolean;
  fromCache: boolean;
};

export async function fetchMarketOhlc(
  symbol: string,
  tf: OhlcTf,
  opts?: { lookbackDays?: number; signal?: AbortSignal },
): Promise<OhlcPayload> {
  const q = new URLSearchParams({ symbol, tf });
  if (opts?.lookbackDays != null) {
    q.set("lookback_days", String(opts.lookbackDays));
  }
  const r = await fetch(`/api/me/market/ohlc?${q}`, {
    credentials: "same-origin",
    signal: opts?.signal,
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || r.statusText || `HTTP ${r.status}`);
  }
  return r.json() as Promise<OhlcPayload>;
}
