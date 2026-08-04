import { useState, useEffect, useRef, useCallback } from 'react';
import { CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { isExpired, markExpired } from './authSentinel';

/**
 * usePriceTimeCandles — fetches OHLC candle data for Price-Time chart.
 *
 * Fetches /api/models/candles/{symbol}?days=N
 * The response includes ALL timeframes in one payload. The full response is
 * cached in a ref so switching timeframes is instant (no re-fetch).
 * Auto-refreshes every 60s while mounted.
 */

const POLL_INTERVAL = 60_000;

interface RawCandle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

type Timeframe = '1m' | '3m' | '5m' | '10m' | '15m' | '30m' | '1h' | '2h' | '4h';

interface CandleResponse {
  candles_1m?: RawCandle[];
  candles_3m?: RawCandle[];
  candles_5m?: RawCandle[];
  candles_10m?: RawCandle[];
  candles_15m?: RawCandle[];
  candles_30m?: RawCandle[];
  candles_1h?: RawCandle[];
  candles_2h?: RawCandle[];
  candles_4h?: RawCandle[];
}

function mapCandles(raw: RawCandle[]): CandlestickData[] {
  return raw
    .map((r) => ({
      time: r.t as UTCTimestamp,
      open: r.o,
      high: r.h,
      low: r.l,
      close: r.c,
    }))
    .sort((a, b) => (a.time as number) - (b.time as number));
}

export function usePriceTimeCandles(
  symbol: string,
  days: number = 30,
  timeframe: Timeframe = '5m',
): {
  candles: CandlestickData[];
  loading: boolean;
  error: string | null;
} {
  const [candles, setCandles] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Full response cache — switching timeframes reads from here without re-fetching
  const cacheRef = useRef<CandleResponse | null>(null);

  // Slice the cached response for the current timeframe
  const applyTimeframe = useCallback((cache: CandleResponse, tf: Timeframe) => {
    const key = `candles_${tf}` as keyof CandleResponse;
    const raw = cache[key];
    setCandles(raw && raw.length > 0 ? mapCandles(raw) : []);
    setError(null);
  }, []);

  // Fetch all timeframes, cache response, apply current timeframe
  const fetchCandles = useCallback(async (tf: Timeframe) => {
    if (isExpired()) return;
    let cancelled = false;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/models/candles/${encodeURIComponent(symbol)}?days=${days}`,
        { credentials: 'include' }
      );
      if (cancelled) return;

      if (res.status === 401) { markExpired(); return; }
      if (!res.ok) {
        setError(`Candles fetch failed: ${res.status}`);
        return;
      }

      const json = await res.json();
      if (cancelled) return;

      const data: CandleResponse = json.data ?? json;
      cacheRef.current = data;
      applyTimeframe(data, tf);
    } catch (e) {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : 'Candles fetch failed');
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }

    return () => { cancelled = true; };
  }, [symbol, days, applyTimeframe]);

  // When symbol or days change: clear cache, re-fetch
  useEffect(() => {
    cacheRef.current = null;
    setCandles([]);
    setError(null);
  }, [symbol, days]);

  // When timeframe changes: use cache if available, else fetch
  useEffect(() => {
    if (cacheRef.current) {
      applyTimeframe(cacheRef.current, timeframe);
      return;
    }

    let cancelInFlight: (() => void) | undefined;
    const run = async () => {
      const cancel = await fetchCandles(timeframe);
      cancelInFlight = cancel;
    };
    run();

    timerRef.current = setInterval(() => {
      fetchCandles(timeframe);
    }, POLL_INTERVAL);

    return () => {
      if (cancelInFlight) cancelInFlight();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeframe, fetchCandles, applyTimeframe]);

  return { candles, loading, error };
}
