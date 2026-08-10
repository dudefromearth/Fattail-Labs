/** Options Lab underlier OHLC — GET /api/me/market/ohlc */

export type OhlcTf = "1d" | "4h" | "1h" | "30m" | "10m";

export const OHL_C_TIMEFRAMES: { id: OhlcTf; label: string }[] = [
  { id: "1d", label: "Day" },
  { id: "4h", label: "4 hr" },
  { id: "1h", label: "1 hr" },
  { id: "30m", label: "30 min" },
  { id: "10m", label: "10 min" },
];

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
  lookback_years_requested?: number;
  history_span_days?: number | null;
};

export async function fetchMarketOhlc(
  symbol: string,
  tf: OhlcTf,
): Promise<OhlcPayload> {
  const q = new URLSearchParams({ symbol, tf });
  const r = await fetch(`/api/me/market/ohlc?${q}`, {
    credentials: "same-origin",
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || r.statusText || `HTTP ${r.status}`);
  }
  return r.json() as Promise<OhlcPayload>;
}
