import { useState, useEffect, useRef, useCallback } from 'react';
import { isExpired, markExpired } from './authSentinel';

export interface GexData {
  symbol: string;
  ts: number | null;
  strikes: number[];
  call_gex: number[];
  put_gex: number[];
  net_gex: number[];
  expirations_available: string[];
}

export interface GexByStrike {
  [strike: number]: { calls: number; puts: number };
}

/** Polling interval for GEX data (ms) */
const POLL_INTERVAL = 30_000;

/**
 * Fetches GEX data from /api/market/gex and converts to by-strike map.
 * When `expiration` is provided (ISO date string), filters to that expiration only.
 * Always returns expirationsAvailable so callers can build DTE selectors.
 * Polls every 30s while enabled. Returns null when disabled or no data.
 */
export function useGex(symbol: string, enabled: boolean, expiration?: string): {
  gexByStrike: GexByStrike | null;
  expirationsAvailable: string[];
  loading: boolean;
  error: string | null;
} {
  const [gexByStrike, setGexByStrike] = useState<GexByStrike | null>(null);
  const [expirationsAvailable, setExpirationsAvailable] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGex = useCallback(async () => {
    if (isExpired()) return;
    try {
      const url = `/api/market/gex?symbol=${encodeURIComponent(symbol)}${expiration ? `&expiration=${encodeURIComponent(expiration)}` : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.status === 401) { markExpired(); return; }
      if (!res.ok) {
        setError(`GEX fetch failed: ${res.status}`);
        return;
      }
      const data: GexData = await res.json();

      // Always update available expirations regardless of strike data
      if (data.expirations_available?.length) {
        setExpirationsAvailable(data.expirations_available);
      }

      if (!data.strikes || data.strikes.length === 0) {
        setGexByStrike(null);
        return;
      }

      const byStrike: GexByStrike = {};
      for (let i = 0; i < data.strikes.length; i++) {
        byStrike[data.strikes[i]] = {
          calls: data.call_gex[i] ?? 0,
          puts: data.put_gex[i] ?? 0,
        };
      }
      setGexByStrike(byStrike);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'GEX fetch failed');
    } finally {
      setLoading(false);
    }
  }, [symbol, expiration]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setGexByStrike(null);
      return;
    }

    setLoading(true);
    fetchGex();
    timerRef.current = setInterval(fetchGex, POLL_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, fetchGex]);

  // Clear strike data on symbol change; keep expirations until new fetch arrives
  useEffect(() => {
    setGexByStrike(null);
    setError(null);
  }, [symbol]);

  return { gexByStrike, expirationsAvailable, loading, error };
}
