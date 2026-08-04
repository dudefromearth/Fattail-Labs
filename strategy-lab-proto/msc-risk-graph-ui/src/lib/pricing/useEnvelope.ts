/**
 * useEnvelope — term-structure IV projection and time-varying envelope.
 *
 * Spec: Unified-Pricing-Computation-Spec-v1.1 §5
 *
 * All computation (smooth + bars) runs in a Web Worker off the main thread.
 * The worker sends TWO messages per request:
 *
 *   phase: 'smooth'  (40 slices, fast)  — renders the theoretical outline
 *   phase: 'bars'    (N slices, slow)   — fills in bar-resolution data
 *
 * Both start as [] on first render and fill in as the worker responds.
 * Stale responses are discarded via requestId.
 * The worker is created on mount and terminated on unmount.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import type { EnvelopeCrossSection } from '../extractBreakevens';
import type { AtmIvMap } from '../useAtmIv';
import { pickIv } from '../useAtmIv';
import { blackScholesEngine, type PricingEngine } from '../blackScholes';
import type { ResolvedLeg } from './positionPricingModel';
import type { EnvelopeWorkerRequest, EnvelopeWorkerResponse } from './envelope.worker';

// ─── Envelope entry inputs ────────────────────────────────────────────────────

export interface EnvelopeEntryInputs {
  resolvedLegs: ResolvedLeg[];
  netDebit: number;
  entryTime: number;        // unix seconds — start of the Time Graph box
  expirationTime: number;   // unix seconds — latest leg's 4pm ET expiry
  dte: number;              // DTE at entry (for currentAtmIv lookup)
}

// ─── Hook result ──────────────────────────────────────────────────────────────

export interface EnvelopeResult {
  smooth: EnvelopeCrossSection[];   // 40 uniformly-spaced slices
  bars: EnvelopeCrossSection[];     // candle-aligned + future extension
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Compute smooth + bar envelopes for all visible positions — fully off-thread.
 *
 * Returns Map<intentId, EnvelopeResult>. Both smooth and bars start as [] and
 * populate as the worker responds. smooth arrives first (fast phase), bars
 * arrive second (slow phase).
 *
 * @param entryInputs   Map<intentId, EnvelopeEntryInputs> from the coordinator
 * @param atmIv         ATM IV by DTE from useAtmIv
 * @param candleTimes   Candle timestamps (unix seconds) from the price-time chart
 * @param engine        Pricing engine — defaults to Black-Scholes
 */
export function useEnvelope(
  entryInputs: Map<string, EnvelopeEntryInputs>,
  atmIv: AtmIvMap,
  candleTimes?: number[],
  engine?: PricingEngine,
): Map<string, EnvelopeResult> {
  // ── Per-phase state ──────────────────────────────────────────────────────────
  const [smoothMap, setSmoothMap] = useState<Map<string, EnvelopeCrossSection[]>>(
    () => new Map(),
  );
  const [barsMap, setBarsMap] = useState<Map<string, EnvelopeCrossSection[]>>(
    () => new Map(),
  );

  const workerRef    = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  // Create worker on mount, terminate on unmount
  useEffect(() => {
    const worker = new Worker(
      new URL('./envelope.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<EnvelopeWorkerResponse>) => {
      const { requestId, phase, results } = event.data;
      if (requestId !== requestIdRef.current) return; // discard stale

      const next = new Map<string, EnvelopeCrossSection[]>();
      for (const { intentId, slices } of results) {
        next.set(intentId, slices);
      }

      if (phase === 'smooth') {
        setSmoothMap(next);
      } else {
        setBarsMap(next);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Post to worker whenever inputs change
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker || entryInputs.size === 0) return;

    const requestId = ++requestIdRef.current;
    void (engine ?? blackScholesEngine); // engine selection is fixed to BS in worker

    const entries: EnvelopeWorkerRequest['entries'] = [];
    for (const [intentId, input] of entryInputs) {
      const { resolvedLegs, netDebit, entryTime, expirationTime, dte } = input;
      if (resolvedLegs.length === 0) continue;
      const currentAtmIv = pickIv(dte, atmIv);
      entries.push({
        intentId,
        resolvedLegs: resolvedLegs.map(leg => ({
          strike:      leg.strike,
          option_type: leg.option_type,
          quantity:    leg.quantity,
          expiration:  leg.expiration,
          iv:          leg.iv,
        })),
        netDebit,
        entryTime,
        expirationTime,
        dte,
        currentAtmIv,
      });
    }

    const request: EnvelopeWorkerRequest = {
      requestId,
      entries,
      atmIv,
      candleTimes: candleTimes ?? [],
    };

    worker.postMessage(request);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryInputs, atmIv, candleTimes]);

  // ── Assemble final result ────────────────────────────────────────────────────
  return useMemo(() => {
    const result = new Map<string, EnvelopeResult>();
    for (const [intentId] of entryInputs) {
      result.set(intentId, {
        smooth: smoothMap.get(intentId) ?? [],
        bars:   barsMap.get(intentId)   ?? [],
      });
    }
    return result;
  }, [entryInputs, smoothMap, barsMap]);
}
