/**
 * Live underlier marks — site-wide pattern (Labs Market Bus plane).
 *
 * ## When to use
 * Any surface that shows underlier **mid / last / live price** for symbols in
 * `market_symbol_universe` (Practice Marked underliers, Admin universe,
 * Positions equity Last, Strategy Lab Symbols, Curate strip, Volume Profile).
 *
 * ## Pattern (do not invent a third path)
 * 1. **Hook** `useLiveUnderlierMarks` — HTTP poll (server `ensure_fresh`) + optional WS.
 * 2. **Bind** only `mb:sym:{SYMBOL}` / mark.symbol === row.symbol (never cross-fill).
 * 3. **Display** via `<LiveMid mark={…} />` so proxy vs native looks the same everywhere.
 *
 * ## Server SoR
 * - Writers: `live_stream` / `sym_feed` / `ensure_fresh_underlier_marks`
 * - Readers: `get_underlier_mark` (bus → MySQL)
 * - Index prints: native feed or options underlying — not silent ETF proxy as SPX mid
 *
 * ## Code short-hand
 * Import from `@/lib/market/liveUnderlierPattern` or `@/components/market/*`.
 */

export type BoundUnderlierMark = {
  /** Product key (always uppercase). */
  symbol: string;
  /** True product mid; null if only a labeled proxy exists. */
  mid: number | null;
  /** ETF/proxy mid when native index print unavailable. */
  proxyMid: number | null;
  viaProxy: boolean;
  feedUsed: string | null;
  source: string | null;
  plane: string | null;
  ageSeconds: number | null;
  stale: boolean;
  prevClose: number | null;
  dayChangePct: number | null;
};

export type RawHttpMarkFields = {
  symbol?: string;
  mid?: number | null;
  proxy_mid?: number | null;
  mark_via_proxy?: boolean;
  mark_feed_used?: string | null;
  mark_source?: string | null;
  mark_plane?: string | null;
  mark_age_seconds?: number | null;
  mark_stale?: boolean | null;
  prev_close?: number | null;
  day_change_pct?: number | null;
};

export type RawStreamMark = {
  symbol?: string;
  mid?: number | null;
  source?: string;
  plane?: string;
  via_proxy?: boolean;
  feed_used?: string;
  asOf?: string | null;
};

function isProxySource(source: string | null | undefined): boolean {
  return Boolean(source && /proxy/i.test(source));
}

/**
 * Bind HTTP row + optional stream mark for **one** product key.
 * Never applies another symbol's mid to this row.
 */
export function bindUnderlierMark(
  product: string,
  http: RawHttpMarkFields | null | undefined,
  stream: RawStreamMark | null | undefined,
): BoundUnderlierMark {
  const symbol = (product || "").trim().toUpperCase();
  const httpSym = (http?.symbol || symbol).toUpperCase();
  const streamOk =
    stream != null &&
    stream.mid != null &&
    Number.isFinite(Number(stream.mid)) &&
    (stream.symbol == null || stream.symbol.toUpperCase() === symbol);

  const httpProxy = Boolean(
    http?.mark_via_proxy || isProxySource(http?.mark_source),
  );
  const streamProxy = Boolean(
    stream?.via_proxy || isProxySource(stream?.source),
  );

  const httpMid =
    httpSym === symbol &&
    http?.mid != null &&
    Number.isFinite(Number(http.mid)) &&
    !httpProxy
      ? Number(http.mid)
      : null;
  const httpProxyMid =
    http?.proxy_mid != null && Number.isFinite(Number(http.proxy_mid))
      ? Number(http.proxy_mid)
      : httpProxy && http?.mid != null
        ? Number(http.mid)
        : null;

  const streamMid =
    streamOk && !streamProxy ? Number(stream!.mid) : null;
  const streamProxyMid =
    streamOk && streamProxy ? Number(stream!.mid) : null;

  // HTTP ensure_fresh is authoritative for tables; stream overlays non-proxy only.
  let mid: number | null = null;
  let proxyMid: number | null = null;
  let viaProxy = false;

  if (httpMid != null) {
    mid = httpMid;
  } else if (streamMid != null) {
    mid = streamMid;
  } else if (httpProxyMid != null || streamProxyMid != null) {
    viaProxy = true;
    proxyMid = streamProxyMid ?? httpProxyMid;
  }

  return {
    symbol,
    mid,
    proxyMid,
    viaProxy,
    feedUsed:
      (streamOk ? stream?.feed_used : null) ||
      http?.mark_feed_used ||
      null,
    source: http?.mark_source || (streamOk ? stream?.source ?? null : null),
    plane:
      httpMid != null
        ? http?.mark_plane || "http+ensure_fresh"
        : streamOk
          ? stream?.plane || "mb:sym"
          : http?.mark_plane || null,
    ageSeconds:
      http?.mark_age_seconds != null
        ? Number(http.mark_age_seconds)
        : null,
    stale: viaProxy || Boolean(http?.mark_stale),
    prevClose:
      !viaProxy && http?.prev_close != null
        ? Number(http.prev_close)
        : null,
    dayChangePct:
      !viaProxy && http?.day_change_pct != null
        ? Number(http.day_change_pct)
        : null,
  };
}

export function formatUnderlierMid(
  n: number | null | undefined,
  digits = 2,
): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatDayPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

/** Default poll for underlier tables (ms). */
export const LIVE_UNDERLIER_POLL_MS = 5000;

/** Server ensure_fresh max age used by list endpoints (documented contract). */
export const LIVE_UNDERLIER_SERVER_MAX_AGE_S = 12;
