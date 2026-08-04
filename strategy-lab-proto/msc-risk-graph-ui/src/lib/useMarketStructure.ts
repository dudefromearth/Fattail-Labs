import { useState, useEffect, useRef, useCallback } from 'react';
import { isExpired, markExpired } from './authSentinel';
import type { MarketStructureData } from '../components/risk-graph/chart-primitives/MarketStructurePrimitive';

/**
 * useMarketStructure — fetches dealer-gravity structural price zones.
 * Refreshes every 5 minutes.
 */

const REFRESH_INTERVAL_MS = 300_000;

interface DGStructuresResponse {
  success: boolean;
  data?: {
    volume_nodes?: Array<{ price: number; weight: number; color?: string }>;
    crevasses?: Array<[number, number]>;
    volume_wells?: Array<[number, number]>;
  };
}

const EMPTY: MarketStructureData = {
  volumeNodes: [],
  crevasses: [],
  volumeWells: [],
};

export function useMarketStructure(
  enabled: boolean,
): { data: MarketStructureData; loading: boolean } {
  const [data, setData] = useState<MarketStructureData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch_ = useCallback(async () => {
    if (isExpired()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/dealer-gravity/structures', { credentials: 'include' });
      if (res.status === 401) { markExpired(); return; }
      if (!res.ok) { setData(EMPTY); return; }
      const json: DGStructuresResponse = await res.json();
      const d = json.data ?? {};
      setData({
        volumeNodes: (d.volume_nodes ?? []).map(n => ({
          price: n.price,
          weight: n.weight ?? 1,
          color: n.color,
        })),
        crevasses: d.crevasses ?? [],
        volumeWells: d.volume_wells ?? [],
      });
    } catch {
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setData(EMPTY);
      return;
    }
    fetch_();
    timerRef.current = setInterval(fetch_, REFRESH_INTERVAL_MS);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [enabled, fetch_]);

  return { data, loading };
}
