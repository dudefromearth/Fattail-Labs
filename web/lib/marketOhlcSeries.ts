/**
 * Module-level OHLC series store for Options Lab charts.
 *
 * Bars live here (not in React state) so TF switches do not re-render 100k objects.
 * Candles are pre-converted once per fetch for Lightweight Charts.
 */

import type {
  CandlestickData,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import type { OhlcBar, OhlcMeta, OhlcPayload, OhlcTf } from "@/lib/marketOhlcApi";
import {
  fetchMarketOhlc,
  OHLC_FAST_LOOKBACK_DAYS,
  OHLC_FULL_LOOKBACK_DAYS,
} from "@/lib/marketOhlcApi";

const TTL_MS = 30 * 60 * 1000;
const MAX_ENTRIES = 32;

export type SeriesEntry = {
  at: number;
  meta: OhlcMeta;
  candles: CandlestickData[];
  /** True when full ≥3y (or max) history is loaded. */
  complete: boolean;
};

const store = new Map<string, SeriesEntry>();

export function seriesKey(symbol: string, tf: OhlcTf): string {
  return `${(symbol || "").trim().toUpperCase()}|${tf}`;
}

function touch(key: string, entry: SeriesEntry): void {
  store.delete(key);
  store.set(key, entry);
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest == null) break;
    store.delete(oldest);
  }
}

export function getSeries(symbol: string, tf: OhlcTf): SeriesEntry | null {
  const key = seriesKey(symbol, tf);
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    store.delete(key);
    return null;
  }
  touch(key, hit);
  return hit;
}

export function setSeries(
  symbol: string,
  tf: OhlcTf,
  entry: Omit<SeriesEntry, "at">,
): SeriesEntry {
  const key = seriesKey(symbol, tf);
  const full: SeriesEntry = { ...entry, at: Date.now() };
  touch(key, full);
  return full;
}

export function clearSeriesStore(): void {
  store.clear();
}

/** Convert raw Massive bars → LWC candles (monotonic times). */
export function barsToCandles(bars: OhlcBar[], tf: OhlcTf): CandlestickData[] {
  const out: CandlestickData[] = [];
  let lastT: number | string | null = null;
  for (const b of bars || []) {
    if (b.t == null || b.c == null) continue;
    const o = b.o ?? b.c;
    const h = b.h ?? Math.max(o, b.c);
    const l = b.l ?? Math.min(o, b.c);
    let time: Time;
    if (tf === "1d") {
      const d = new Date(b.t);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      time = `${y}-${m}-${day}` as Time;
    } else {
      time = Math.floor(b.t / 1000) as UTCTimestamp;
    }
    if (lastT !== null && time <= lastT) continue;
    lastT = time as number | string;
    out.push({ time, open: o, high: h, low: l, close: b.c });
  }
  return out;
}

function payloadToEntry(
  payload: OhlcPayload,
  fromCache: boolean,
  complete: boolean,
): Omit<SeriesEntry, "at"> {
  const tf = payload.tf;
  return {
    meta: {
      product: payload.product,
      series_ticker: payload.series_ticker,
      proxy_label: payload.proxy_label,
      source: payload.source,
      tf,
      bar_count: payload.bar_count,
      lookback_days_requested: payload.lookback_days_requested,
      history_span_days: payload.history_span_days,
      complete,
      fromCache,
    },
    candles: barsToCandles(payload.bars, tf),
    complete,
  };
}

export type LoadSeriesResult = {
  entry: SeriesEntry;
  /** Whether this result came only from memory (no network this call). */
  fromCache: boolean;
  /** True if a background full backfill should still run. */
  needsBackfill: boolean;
};

/**
 * Load series for chart paint.
 * - Memory hit (complete or partial): return immediately.
 * - Else: fast lookback network, store, return (caller may backfill).
 */
export async function loadSeriesFast(
  symbol: string,
  tf: OhlcTf,
  opts?: { signal?: AbortSignal; force?: boolean },
): Promise<LoadSeriesResult> {
  if (!opts?.force) {
    const cached = getSeries(symbol, tf);
    if (cached && cached.candles.length >= 2) {
      return {
        entry: cached,
        fromCache: true,
        needsBackfill: !cached.complete,
      };
    }
  }

  const fastDays = OHLC_FAST_LOOKBACK_DAYS[tf] ?? 30;
  const payload = await fetchMarketOhlc(symbol, tf, {
    lookbackDays: fastDays,
    signal: opts?.signal,
  });
  const complete =
    fastDays >= OHLC_FULL_LOOKBACK_DAYS || payload.complete === true;
  const entry = setSeries(
    symbol,
    tf,
    payloadToEntry(payload, false, complete),
  );
  return {
    entry,
    fromCache: false,
    needsBackfill: !complete,
  };
}

/** Full ≥3y backfill; upgrades in-memory series when longer than current. */
export async function loadSeriesFull(
  symbol: string,
  tf: OhlcTf,
  opts?: { signal?: AbortSignal },
): Promise<SeriesEntry> {
  const payload = await fetchMarketOhlc(symbol, tf, {
    lookbackDays: OHLC_FULL_LOOKBACK_DAYS,
    signal: opts?.signal,
  });
  const existing = getSeries(symbol, tf);
  // Prefer longer series; never shrink on a race
  if (
    existing &&
    existing.candles.length >= (payload.bars?.length ?? 0) &&
    existing.complete
  ) {
    return existing;
  }
  return setSeries(
    symbol,
    tf,
    payloadToEntry(payload, false, true),
  );
}
