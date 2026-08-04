import { useState, useEffect, useRef, useCallback } from 'react';
import { isExpired, markExpired } from './authSentinel';
import type { VolumeProfileDataPoint } from '../components/risk-graph/chart-primitives/VolumeProfilePrimitive';

/**
 * useVolumeProfile — fetches VP artifact from dealer-gravity API and derives
 * poc/vah/val for the Price-Time chart overlay. Refreshes every 5 minutes.
 */

const REFRESH_INTERVAL_MS = 300_000;
const VALUE_AREA_PCT = 0.70;

interface VolumeProfileState {
  buckets: VolumeProfileDataPoint[];
  poc: number;
  vah: number;
  val: number;
  loading: boolean;
}

const EMPTY_STATE: VolumeProfileState = {
  buckets: [],
  poc: 0,
  vah: 0,
  val: 0,
  loading: false,
};

function deriveFromArtifact(profile: { min: number; step: number; bins: number[] }): {
  buckets: VolumeProfileDataPoint[];
  poc: number;
  vah: number;
  val: number;
} {
  const { min, step, bins } = profile;

  const buckets: VolumeProfileDataPoint[] = bins.map((volume, i) => ({
    price: min + i * step,
    volume,
  }));

  if (buckets.length === 0) return { buckets, poc: 0, vah: 0, val: 0 };

  // POC = price at max volume
  const pocBucket = buckets.reduce((a, b) => (b.volume > a.volume ? b : a));
  const poc = pocBucket.price;

  // Value area: 70% of total volume centred on POC
  const totalVolume = bins.reduce((s, v) => s + v, 0);
  const target = totalVolume * VALUE_AREA_PCT;
  const pocIdx = bins.indexOf(pocBucket.volume);

  let lo = pocIdx;
  let hi = pocIdx;
  let accumulated = bins[pocIdx];

  while (accumulated < target && (lo > 0 || hi < bins.length - 1)) {
    const addLo = lo > 0 ? bins[lo - 1] : 0;
    const addHi = hi < bins.length - 1 ? bins[hi + 1] : 0;
    if (addLo >= addHi && lo > 0) {
      lo--;
      accumulated += bins[lo];
    } else if (hi < bins.length - 1) {
      hi++;
      accumulated += bins[hi];
    } else {
      break;
    }
  }

  const val = min + lo * step;
  const vah = min + hi * step;

  return { buckets, poc, vah, val };
}

export function useVolumeProfile(
  symbol: string,
  _days = 30,
  enabled = true,
): VolumeProfileState {
  const [state, setState] = useState<VolumeProfileState>(EMPTY_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchVolumeProfile = useCallback(async () => {
    if (isExpired()) return;
    let cancelled = false;

    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/dealer-gravity/artifact', { credentials: 'include' });
      if (cancelled) return;
      if (res.status === 401) { markExpired(); return; }
      if (!res.ok) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }
      const json = await res.json();
      if (cancelled) return;
      const profile = json?.data?.profile;
      if (!profile?.bins?.length) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }
      const derived = deriveFromArtifact(profile);
      setState({ ...derived, loading: false });
    } catch {
      if (!cancelled) setState((prev) => ({ ...prev, loading: false }));
    }

    return () => { cancelled = true; };
  }, [symbol]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setState(EMPTY_STATE);
      return;
    }

    fetchVolumeProfile();
    timerRef.current = setInterval(fetchVolumeProfile, REFRESH_INTERVAL_MS);

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [enabled, fetchVolumeProfile]);

  useEffect(() => { setState(EMPTY_STATE); }, [symbol]);

  return state;
}
