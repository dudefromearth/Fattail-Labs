/**
 * useRealTimeRisk — server-authoritative P&L data from POST /api/risk/real-time.
 *
 * Auth: cookie-based (credentials: 'include').
 * Do NOT set X-Internal-Identity — that header is for server-to-server only.
 *
 * Two exports:
 *   useRealTimeRisk(intentId, spot, whatIf?)          — single intent
 *   useRealTimeRiskMap(intentIds, spot, whatIf?)       — multiple intents
 */
import { useEffect, useRef, useState } from 'react';
import { isExpired, markExpired } from './authSentinel';

export interface RealTimeRiskResult {
  currentNetValue: number | null;
  costBasis: number | null;
  pnlCurve: number[] | null;
  priceGrid: number[] | null;
  atExpirationPnl: number[] | null;
  profitableSegments: [number, number][] | null;
  isLoading: boolean;
  error: Error | null;
}

export interface WhatIf {
  tShiftDays: number;
  volShift: number;
}

const NULL_RESULT: RealTimeRiskResult = {
  currentNetValue: null,
  costBasis: null,
  pnlCurve: null,
  priceGrid: null,
  atExpirationPnl: null,
  profitableSegments: null,
  isLoading: false,
  error: null,
};

async function fetchOne(
  intentId: string,
  spot: number,
  whatIf: WhatIf | undefined,
  signal: AbortSignal,
): Promise<RealTimeRiskResult> {
  const body: Record<string, unknown> = { intent_id: intentId, spot };
  if (whatIf) {
    body.what_if = { t_shift_days: whatIf.tShiftDays, vol_shift: whatIf.volShift };
  }
  if (isExpired()) throw new Error('Session expired');
  const resp = await fetch('/api/risk/real-time', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    signal,
  });
  if (resp.status === 401) { markExpired(); throw new Error('Session expired'); }
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return {
    currentNetValue: data.current_net_value,
    costBasis: data.cost_basis,
    pnlCurve: data.pnl_curve,
    priceGrid: data.price_grid,
    atExpirationPnl: data.at_expiration_pnl,
    profitableSegments: data.profitable_segments,
    isLoading: false,
    error: null,
  };
}

/**
 * Single-intent hook.
 * - Debounce 100 ms on spot / whatIf changes.
 * - Immediate refetch on intentId change.
 * - Returns null fields while loading or when intentId / spot are absent.
 */
export function useRealTimeRisk(
  intentId: string | null,
  spot: number | null,
  whatIf?: WhatIf,
): RealTimeRiskResult {
  const [result, setResult] = useState<RealTimeRiskResult>(NULL_RESULT);
  const abortRef    = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIdRef   = useRef<string | null>(null);

  const tShift   = whatIf?.tShiftDays;
  const volShift = whatIf?.volShift;

  useEffect(() => {
    if (!intentId || spot === null) {
      setResult(NULL_RESULT);
      return;
    }

    const intentChanged = intentId !== prevIdRef.current;
    prevIdRef.current = intentId;

    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const wi = tShift !== undefined && volShift !== undefined
      ? { tShiftDays: tShift, volShift }
      : undefined;

    const run = async () => {
      setResult(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await fetchOne(intentId, spot, wi, ctrl.signal);
        setResult(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResult(prev => ({ ...prev, isLoading: false, error: err as Error }));
        }
      }
    };

    if (intentChanged) {
      run();
    } else {
      debounceRef.current = setTimeout(run, 5000);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      ctrl.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentId, spot, tShift, volShift]);

  return result;
}

/**
 * Multi-intent variant — for components that cannot call hooks in a loop.
 * Fetches all intents in parallel; returns a Record keyed by intentId.
 * - Debounce 100 ms on spot / whatIf changes.
 * - Immediate refetch when the set of intentIds changes.
 */
export function useRealTimeRiskMap(
  intentIds: string[],
  spot: number | null,
  whatIf?: WhatIf,
): Record<string, RealTimeRiskResult> {
  const [results, setResults] = useState<Record<string, RealTimeRiskResult>>({});
  const abortRef    = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIdsRef  = useRef('');
  const prevTShiftRef   = useRef<number | undefined>(undefined);
  const prevVolShiftRef = useRef<number | undefined>(undefined);

  const idsKey   = intentIds.join(',');
  const tShift   = whatIf?.tShiftDays;
  const volShift = whatIf?.volShift;

  useEffect(() => {
    if (intentIds.length === 0 || spot === null) {
      setResults({});
      return;
    }

    const idsChanged    = idsKey !== prevIdsRef.current;
    const whatIfChanged = tShift !== prevTShiftRef.current || volShift !== prevVolShiftRef.current;

    prevIdsRef.current    = idsKey;
    prevTShiftRef.current   = tShift;
    prevVolShiftRef.current = volShift;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // When TIME or VOL slider changes, immediately null-out the stale server results
    // so consumers fall back to client-side BSM right away (same render cycle).
    // Spot changes still debounce quietly — no immediate clear needed there.
    if (!idsChanged && whatIfChanged) {
      setResults(Object.fromEntries(intentIds.map(id => [id, { ...NULL_RESULT, isLoading: true }])));
    }

    const wi = tShift !== undefined && volShift !== undefined
      ? { tShiftDays: tShift, volShift }
      : undefined;

    const run = async () => {
      setResults(Object.fromEntries(intentIds.map(id => [id, { ...NULL_RESULT, isLoading: true }])));
      await Promise.all(intentIds.map(async id => {
        try {
          const data = await fetchOne(id, spot, wi, ctrl.signal);
          setResults(prev => ({ ...prev, [id]: data }));
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            setResults(prev => ({ ...prev, [id]: { ...NULL_RESULT, error: err as Error } }));
          }
        }
      }));
    };

    if (idsChanged) {
      run();
    } else {
      debounceRef.current = setTimeout(run, 5000);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      ctrl.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, spot, tShift, volShift]);

  return results;
}
