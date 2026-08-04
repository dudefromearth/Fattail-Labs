/**
 * useChainIV — Polls chain snapshot every 15s and builds a strike→IV lookup map.
 *
 * Provides exact match, nearest-strike, and closest-DTE fallback lookups
 * for per-leg implied volatility from the exchange chain snapshot.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { isExpired, markExpired } from './authSentinel';

export interface ChainIVMap {
  /** Exact match: strike + type + expiration */
  get(strike: number, type: 'call' | 'put', expiration: string): number | null;
  /** Nearest available strike for same type/expiration */
  getNearest(strike: number, type: 'call' | 'put', expiration: string): number | null;
  /** Nearest DTE when exact expiration missing */
  getClosestDTE(strike: number, type: 'call' | 'put', targetExpiration: string): number | null;
}

interface ChainContract {
  expiration: string;
  strike: number;
  type: 'call' | 'put';
  iv: number | null;
  bid: number | null;
  ask: number | null;
  mid: number | null;
}

interface ChainResponse {
  symbol: string;
  ts: number | null;
  expirations: string[];
  contracts: ChainContract[];
}

const POLL_INTERVAL_MS = 15_000;
const STALE_THRESHOLD_MS = 45_000;

/**
 * Binary search for nearest value in a sorted array.
 */
function findNearest(sorted: number[], target: number): number | null {
  if (sorted.length === 0) return null;
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  if (lo >= sorted.length) return sorted[sorted.length - 1];
  if (lo === 0) return sorted[0];
  const above = sorted[lo];
  const below = sorted[lo - 1];
  return Math.abs(target - below) <= Math.abs(target - above) ? below : above;
}

/** Batched state for chain IV — single setState instead of 6 separate calls */
interface ChainIVState {
  ivStore: Map<string, number> | null;
  midStore: Map<string, number> | null;
  expirations: string[];
  connected: boolean;
  error: string | null;
  stale: boolean;
  strikeIndex: Map<string, number[]>;
  expirationsByTypeStrike: Map<string, string[]>;
}

const INITIAL_STATE: ChainIVState = {
  ivStore: null,
  midStore: null,
  expirations: [],
  connected: false,
  error: null,
  stale: false,
  strikeIndex: new Map(),
  expirationsByTypeStrike: new Map(),
};

export function useChainIV(symbol: string): {
  chainIV: ChainIVMap | null;
  getContractMid: (expiration: string, strike: number, type: 'call' | 'put') => number | null;
  connected: boolean;
  error: string | null;
  stale: boolean;
} {
  const [state, setState] = useState<ChainIVState>(INITIAL_STATE);
  const lastSuccessRef = useRef<number>(0);
  const staleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchChain = useCallback(async () => {
    if (isExpired()) return;
    try {
      const res = await fetch(`/api/market/chain?symbol=${symbol}`, { credentials: 'include' });
      if (res.status === 401) { markExpired(); return; }
      if (!res.ok) {
        setState(prev => ({ ...prev, error: `Chain API returned ${res.status}` }));
        return;
      }
      const json: ChainResponse = await res.json();
      if (!json.contracts || json.contracts.length === 0) {
        setState(prev => ({ ...prev, error: 'No contracts in chain response' }));
        return;
      }

      const newMap = new Map<string, number>();
      const newMidMap = new Map<string, number>();
      const newStrikeIndex = new Map<string, Set<number>>();
      const newExpByTypeStrike = new Map<string, Set<string>>();

      for (const c of json.contracts) {
        const exp = String(c.expiration ?? '').split('T')[0];
        const s = Math.round(Number(c.strike));
        const rawType = String(c.type ?? 'call').toLowerCase();
        const t: 'call' | 'put' = rawType === 'put' || rawType === 'p' ? 'put' : 'call';
        if (!exp || !Number.isFinite(s)) continue;
        const key = `${s}:${t}:${exp}`;

        // Mid price: prefer server-computed, fall back to (bid+ask)/2.
        // Stored alongside IV so unlocked position cards can read fresh
        // spread mids on every 15s poll without an extra HTTP request.
        const mid = c.mid ?? (
          c.bid != null && c.ask != null ? (c.bid + c.ask) / 2 : null
        );
        if (mid != null && mid >= 0) {
          newMidMap.set(key, mid);
        }

        // Store all non-negative finite IVs including deep-ITM near-zeros.
        // buildLegsFromIntent decides whether to keep (near-intrinsic) or cascade.
        // Previously iv>0.01 dropped deep ITM entirely → ATM replacement → bad OTM flies.
        if (c.iv != null && Number.isFinite(c.iv) && c.iv >= 0 && c.iv < 5.0) {
          newMap.set(key, c.iv);

          const siKey = `${t}:${exp}`;
          if (!newStrikeIndex.has(siKey)) newStrikeIndex.set(siKey, new Set());
          newStrikeIndex.get(siKey)!.add(s);

          // Reverse index: type:strike → expirations
          const etsKey = `${t}:${s}`;
          if (!newExpByTypeStrike.has(etsKey)) newExpByTypeStrike.set(etsKey, new Set());
          newExpByTypeStrike.get(etsKey)!.add(exp);
        }
      }

      // Convert strike sets to sorted arrays
      const sortedIndex = new Map<string, number[]>();
      for (const [k, set] of newStrikeIndex) {
        sortedIndex.set(k, [...set].sort((a, b) => a - b));
      }
      // Convert expiration sets to sorted arrays
      const sortedExpByTypeStrike = new Map<string, string[]>();
      for (const [k, set] of newExpByTypeStrike) {
        sortedExpByTypeStrike.set(k, [...set].sort());
      }

      // Single batched setState — prevents 6 separate renders per poll
      setState({
        ivStore: newMap,
        midStore: newMidMap,
        strikeIndex: sortedIndex,
        expirationsByTypeStrike: sortedExpByTypeStrike,
        expirations: json.expirations || [],
        connected: true,
        error: null,
        stale: false,
      });
      lastSuccessRef.current = Date.now();
    } catch (e) {
      setState(prev => ({
        ...prev,
        error: e instanceof Error ? e.message : 'Chain fetch failed',
        connected: false,
      }));
    }
  }, [symbol]);

  // Poll on interval
  useEffect(() => {
    fetchChain();
    const interval = setInterval(fetchChain, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchChain]);

  // Stale detection
  useEffect(() => {
    staleTimerRef.current = setInterval(() => {
      if (lastSuccessRef.current > 0 && Date.now() - lastSuccessRef.current > STALE_THRESHOLD_MS) {
        setState(prev => prev.stale ? prev : { ...prev, stale: true });
      }
    }, 5000);
    return () => {
      if (staleTimerRef.current) clearInterval(staleTimerRef.current);
    };
  }, []);

  // Build the ChainIVMap interface — depends on single batched state object
  const { ivStore, midStore, strikeIndex, expirations, expirationsByTypeStrike } = state;

  // Per-leg mid lookup. Refreshed on the same 15s poll as ivStore.
  // Returns null when contract not in chain (caller decides fallback).
  /** Normalize lookup key parts — matches heatmap/builder contract keys. */
  const contractKey = (strike: number, type: string, expiration: string): string => {
    const exp = String(expiration ?? '').split('T')[0];
    const s = Math.round(Number(strike));
    const t = type === 'put' || type === 'p' || type === 'P' ? 'put' : 'call';
    return `${s}:${t}:${exp}`;
  };

  const getContractMid = useCallback(
    (expiration: string, strike: number, type: 'call' | 'put'): number | null => {
      if (!midStore) return null;
      const key = contractKey(strike, type, expiration);
      const exp = String(expiration ?? '').split('T')[0];
      const s = Math.round(Number(strike));
      const t = type === 'put' ? 'put' : 'call';
      return midStore.get(key) ?? midStore.get(`${s}.0:${t}:${exp}`) ?? null;
    },
    [midStore],
  );
  const chainIV = useMemo<ChainIVMap | null>(() => {
    if (!ivStore || ivStore.size === 0) return null;

    const lookup = (strike: number, type: string, expiration: string): number | null => {
      const exp = String(expiration ?? '').split('T')[0];
      const s = Math.round(Number(strike));
      const t = type === 'put' || type === 'p' || type === 'P' ? 'put' : 'call';
      return (
        ivStore.get(`${s}:${t}:${exp}`) ??
        ivStore.get(`${s}.0:${t}:${exp}`) ??
        null
      );
    };

    return {
      get(strike: number, type: 'call' | 'put', expiration: string): number | null {
        return lookup(strike, type, expiration);
      },

      getNearest(strike: number, type: 'call' | 'put', expiration: string): number | null {
        const exp = String(expiration ?? '').split('T')[0];
        const t = type === 'put' ? 'put' : 'call';
        const siKey = `${t}:${exp}`;
        const strikes = strikeIndex.get(siKey) ?? strikeIndex.get(`${t}:${expiration}`);
        if (!strikes || strikes.length === 0) return null;
        const nearest = findNearest(strikes, strike);
        if (nearest === null) return null;
        return lookup(nearest, t, exp);
      },

      getClosestDTE(strike: number, type: 'call' | 'put', targetExpiration: string): number | null {
        const t = type === 'put' ? 'put' : 'call';
        const s = Math.round(Number(strike));
        // First, check if this exact strike+type has data in any expiration
        const etsKey = `${t}:${s}`;
        const availableExps = expirationsByTypeStrike.get(etsKey)
          ?? expirationsByTypeStrike.get(`${t}:${strike}`);
        const targetMs = new Date(String(targetExpiration).split('T')[0] + 'T16:00:00').getTime();

        if (availableExps && availableExps.length > 0) {
          // Prefer exact expiration, else nearest by calendar distance
          let closestExp: string | null = null;
          let closestDiff = Infinity;
          for (const exp of availableExps) {
            const expMs = new Date(String(exp).split('T')[0] + 'T16:00:00').getTime();
            const diff = Math.abs(expMs - targetMs);
            if (diff < closestDiff) {
              closestDiff = diff;
              closestExp = exp;
            }
          }
          if (closestExp) {
            const iv = lookup(s, t, closestExp);
            if (iv != null) return iv;
          }
        }

        // Fallback: search all expirations for the nearest available strike
        if (expirations.length === 0) return null;
        let closestExp: string | null = null;
        let closestDiff = Infinity;
        for (const exp of expirations) {
          const expMs = new Date(String(exp).split('T')[0] + 'T16:00:00').getTime();
          const diff = Math.abs(expMs - targetMs);
          if (diff < closestDiff) {
            closestDiff = diff;
            closestExp = exp;
          }
        }
        if (!closestExp) return null;

        // Try nearest strike in closest expiration
        const expNorm = String(closestExp).split('T')[0];
        const siKey = `${t}:${expNorm}`;
        const strikes = strikeIndex.get(siKey) ?? strikeIndex.get(`${t}:${closestExp}`);
        if (!strikes || strikes.length === 0) return null;
        const nearest = findNearest(strikes, strike);
        if (nearest === null) return null;
        return lookup(nearest, t, expNorm);
      },
    };
  }, [ivStore, strikeIndex, expirations, expirationsByTypeStrike]);

  return { chainIV, getContractMid, connected: state.connected, error: state.error, stale: state.stale };
}
