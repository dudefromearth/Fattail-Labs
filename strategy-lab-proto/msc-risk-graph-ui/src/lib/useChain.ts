import { useState, useEffect, useMemo, useCallback } from 'react';

export interface ChainContract {
  expiration: string;
  strike: number;
  type: 'call' | 'put';
  bid: number | null;
  ask: number | null;
  mid: number | null;
  last: number | null;
  iv: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  oi: number | null;
  volume: number | null;
}

interface ChainResponse {
  symbol: string;
  ts: number | null;
  expirations: string[];
  contracts: ChainContract[];
}

/**
 * Fetches the option chain snapshot once for a given symbol.
 * Provides indexed lookups by expiration, strike, type.
 */
export function useChain(symbol: string = 'SPX') {
  const [data, setData] = useState<ChainResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/market/chain?symbol=${symbol}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (json) setData(json as ChainResponse);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol]);

  const expirations = data?.expirations ?? [];

  // Index: expiration → strike[] (sorted, deduplicated)
  const strikesByExpiration = useMemo(() => {
    if (!data) return {};
    const map: Record<string, number[]> = {};
    for (const c of data.contracts) {
      if (!map[c.expiration]) map[c.expiration] = [];
      if (!map[c.expiration].includes(c.strike)) {
        map[c.expiration].push(c.strike);
      }
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a - b);
    }
    return map;
  }, [data]);

  // Index: "exp|strike|type" → contract
  const contractIndex = useMemo(() => {
    if (!data) return new Map<string, ChainContract>();
    const idx = new Map<string, ChainContract>();
    for (const c of data.contracts) {
      idx.set(`${c.expiration}|${c.strike}|${c.type}`, c);
    }
    return idx;
  }, [data]);

  const getContract = useCallback(
    (expiration: string, strike: number, type: 'call' | 'put'): ChainContract | undefined => {
      return contractIndex.get(`${expiration}|${strike}|${type}`);
    },
    [contractIndex],
  );

  const getStrikes = useCallback(
    (expiration: string): number[] => {
      return strikesByExpiration[expiration] ?? [];
    },
    [strikesByExpiration],
  );

  // Find nearest available strike to a target value
  const nearestStrike = useCallback(
    (expiration: string, target: number): number => {
      const strikes = getStrikes(expiration);
      if (strikes.length === 0) return target;
      let best = strikes[0];
      let bestDist = Math.abs(target - best);
      for (const s of strikes) {
        const dist = Math.abs(target - s);
        if (dist < bestDist) {
          best = s;
          bestDist = dist;
        }
      }
      return best;
    },
    [getStrikes],
  );

  return {
    expirations,
    getStrikes,
    getContract,
    nearestStrike,
    loading,
    ts: data?.ts ?? null,
  };
}
