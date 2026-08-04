import { useState, useEffect, useRef, useCallback } from 'react';
import { isExpired, markExpired } from './authSentinel';
import type { GexDataPoint } from '../components/risk-graph/chart-primitives/GexPrimitive';

/**
 * useGexData — fetches GEX per-strike data for Price-Time chart overlay.
 * Separate from useGex.ts (which serves the transplant panel).
 * Refreshes every 5 minutes.
 */

const REFRESH_INTERVAL_MS = 300_000;

interface GexApiResponse {
  strikes: Array<{
    strike: number;
    call_gex: number;
    put_gex: number;
    net_gex: number;
  }>;
}

export function useGexData(
  symbol: string,
  enabled: boolean,
): { gexData: GexDataPoint[]; loading: boolean } {
  const [gexData, setGexData] = useState<GexDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGexData = useCallback(async () => {
    if (isExpired()) return;
    let cancelled = false;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/models/gex/${encodeURIComponent(symbol)}`,
        { credentials: 'include' },
      );
      if (cancelled) return;
      if (res.status === 401) { markExpired(); return; }
      if (!res.ok) {
        setGexData([]);
        return;
      }
      const data: GexApiResponse = await res.json();
      if (cancelled) return;
      if (!data.strikes || data.strikes.length === 0) {
        setGexData([]);
        return;
      }
      const points: GexDataPoint[] = data.strikes.map((s) => ({
        strike: s.strike,
        calls: s.call_gex,
        puts: s.put_gex,
      }));
      setGexData(points);
    } catch {
      if (!cancelled) setGexData([]);
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setGexData([]);
      setLoading(false);
      return;
    }

    fetchGexData();
    timerRef.current = setInterval(fetchGexData, REFRESH_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, fetchGexData]);

  // Clear on symbol change
  useEffect(() => {
    setGexData([]);
  }, [symbol]);

  return { gexData, loading };
}
