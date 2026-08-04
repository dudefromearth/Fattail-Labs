/**
 * envelope.worker.ts — Full envelope computation off the main thread.
 *
 * Sends TWO messages per request to minimise perceived latency:
 *   phase: 'smooth'  — 40 uniformly-spaced slices  (~54k BSM calls, fast)
 *   phase: 'bars'    — candle-aligned + future bars (~3.5M BSM calls, slow)
 *
 * The main thread renders the smooth outline immediately on the first message,
 * then fills in bar-resolution data when the second message arrives.
 *
 * Pure computation only: no React, no DOM, no component imports.
 */

import { blackScholesEngine, RISK_FREE_RATE, type PricingEngine } from '../blackScholes';
import { pickIv } from '../useAtmIv';

// ─── Constants ────────────────────────────────────────────────────────────────

const SMOOTH_SECTIONS  = 40;
const ENVELOPE_SCAN_STEPS = 300;
const SECS_PER_YEAR    = 365.25 * 24 * 3600;
const BAR_STEP         = 300; // 5-minute bars in seconds
const MULTIPLIER       = 100;

// ─── Shared types ─────────────────────────────────────────────────────────────

interface EnvelopeCrossSection {
  t: number;
  segments: [number, number][];
}

interface SliceLeg {
  strike: number;
  option_type: 'call' | 'put';
  quantity: number;
  expiration: string;
  iv: number;
}

// ─── Message interfaces ───────────────────────────────────────────────────────

export interface EnvelopeWorkerRequest {
  requestId: number;
  entries: Array<{
    intentId: string;
    resolvedLegs: SliceLeg[];
    netDebit: number;
    entryTime: number;       // unix seconds
    expirationTime: number;  // unix seconds
    dte: number;
    currentAtmIv: number;    // pickIv(dte, atmIv) — pre-computed
  }>;
  atmIv: Record<number, number>;
  candleTimes: number[];     // unix seconds — may be empty
}

export interface EnvelopeWorkerResponse {
  requestId: number;
  phase: 'smooth' | 'bars';
  results: Array<{
    intentId: string;
    slices: EnvelopeCrossSection[];
  }>;
}

// ─── Pure functions ───────────────────────────────────────────────────────────

function expiry4pmUtc(yyyyMmDd: string): number {
  if (!yyyyMmDd || !/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return NaN;
  const noon = new Date(yyyyMmDd + 'T12:00:00Z');
  const etHour = parseInt(
    noon.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      hour12: false,
    }),
    10,
  );
  const offsetHours = ((noon.getUTCHours() - etHour) + 24) % 24;
  const [yr, mo, dy] = yyyyMmDd.split('-').map(Number);
  return Date.UTC(yr, mo - 1, dy, 16 + offsetHours, 0, 0) / 1000;
}

function segmentsAtSliceTime(
  legs: SliceLeg[],
  netDebit: number,
  sliceTime: number,
  engine: PricingEngine,
): [number, number][] {
  if (legs.length === 0) return [];

  const strikes = legs.map(l => l.strike);
  const lo = Math.min(...strikes) * 0.88;
  const hi = Math.max(...strikes) * 1.12;
  const step = (hi - lo) / ENVELOPE_SCAN_STEPS;

  const computePnL = (price: number): number => {
    const legValues = legs.reduce((sum, leg) => {
      const isCall = leg.option_type === 'call';
      const legExpiryTime = expiry4pmUtc(leg.expiration);
      const T = isFinite(legExpiryTime)
        ? Math.max(0, (legExpiryTime - sliceTime) / SECS_PER_YEAR)
        : 0;

      if (T <= 0) {
        const intrinsic = isCall
          ? Math.max(0, price - leg.strike)
          : Math.max(0, leg.strike - price);
        return sum + leg.quantity * intrinsic;
      }

      return sum + leg.quantity * engine.price(price, leg.strike, T, RISK_FREE_RATE, leg.iv, isCall);
    }, 0);
    return (legValues - netDebit) * MULTIPLIER;
  };

  const refine = (pA: number, pnlA: number, pB: number, pnlB: number): number => {
    let a = pA, fa = pnlA, b = pB, fb = pnlB;
    for (let i = 0; i < 12; i++) {
      const mid = (a + b) / 2;
      const fm = computePnL(mid);
      if ((fa > 0) === (fm > 0)) { a = mid; fa = fm; }
      else { b = mid; fb = fm; }
    }
    void fb;
    return (a + b) / 2;
  };

  const segments: [number, number][] = [];
  let segStart: number | null = null;
  let prev = computePnL(lo);
  if (prev > 0) segStart = lo;

  for (let i = 1; i <= ENVELOPE_SCAN_STEPS; i++) {
    const price = lo + i * step;
    const pnl = computePnL(price);

    if (prev <= 0 && pnl > 0) {
      segStart = refine(price - step, prev, price, pnl);
    } else if (prev > 0 && pnl <= 0 && segStart !== null) {
      segments.push([segStart, refine(price - step, prev, price, pnl)]);
      segStart = null;
    }

    prev = pnl;
  }

  if (segStart !== null) segments.push([segStart, hi]);
  return segments;
}

function sliceAt(
  t: number,
  resolvedLegs: SliceLeg[],
  netDebit: number,
  expirationTime: number,
  currentAtmIv: number,
  dte: number,
  atmIv: Record<number, number>,
  engine: PricingEngine,
): EnvelopeCrossSection {
  const dteAtT = Math.max(0, (expirationTime - t) / 86400);
  const atmIvAtT = pickIv(dteAtT, atmIv);

  const scaledLegs: SliceLeg[] = currentAtmIv > 0
    ? resolvedLegs.map(leg => ({
        strike:      leg.strike,
        option_type: leg.option_type,
        quantity:    leg.quantity,
        expiration:  leg.expiration,
        iv:          leg.iv * (atmIvAtT / currentAtmIv),
      }))
    : resolvedLegs.map(leg => ({ ...leg }));

  return {
    t,
    segments: segmentsAtSliceTime(scaledLegs, netDebit, t, engine),
  };
}

// ─── Worker message handler ───────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<EnvelopeWorkerRequest>) => {
  const { requestId, entries, atmIv, candleTimes } = event.data;
  const engine = blackScholesEngine;
  const now = Date.now() / 1000;

  // ── Phase 1: Smooth (40 uniformly-spaced slices) — send immediately ──────────
  const smoothResults: EnvelopeWorkerResponse['results'] = [];

  for (const entry of entries) {
    const { intentId, resolvedLegs, netDebit, entryTime, expirationTime, dte, currentAtmIv } = entry;

    if (resolvedLegs.length === 0) {
      smoothResults.push({ intentId, slices: [] });
      continue;
    }

    const slice = (t: number) =>
      sliceAt(t, resolvedLegs, netDebit, expirationTime, currentAtmIv, dte, atmIv, engine);

    const smooth: EnvelopeCrossSection[] = [];
    for (let i = 0; i <= SMOOTH_SECTIONS; i++) {
      const t = entryTime + (i / SMOOTH_SECTIONS) * (expirationTime - entryTime);
      smooth.push(slice(t));
    }

    smoothResults.push({ intentId, slices: smooth });
  }

  self.postMessage({ requestId, phase: 'smooth', results: smoothResults } satisfies EnvelopeWorkerResponse);

  // ── Phase 2: Bars (candle-aligned + future) — send after smooth ──────────────
  const barsResults: EnvelopeWorkerResponse['results'] = [];

  for (const entry of entries) {
    const { intentId, resolvedLegs, netDebit, entryTime, expirationTime, dte, currentAtmIv } = entry;

    if (resolvedLegs.length === 0) {
      barsResults.push({ intentId, slices: [] });
      continue;
    }

    const slice = (t: number) =>
      sliceAt(t, resolvedLegs, netDebit, expirationTime, currentAtmIv, dte, atmIv, engine);

    const bars: EnvelopeCrossSection[] = [];

    const historicalTimes = candleTimes
      .filter(t => t >= entryTime && t <= expirationTime)
      .sort((a, b) => a - b);

    for (const t of historicalTimes) {
      bars.push(slice(t));
    }

    const futureStart = historicalTimes.length > 0
      ? historicalTimes[historicalTimes.length - 1] + BAR_STEP
      : now;

    for (let t = futureStart; t <= expirationTime; t += BAR_STEP) {
      bars.push(slice(t));
    }

    bars.push(slice(expirationTime));

    barsResults.push({ intentId, slices: bars });
  }

  self.postMessage({ requestId, phase: 'bars', results: barsResults } satisfies EnvelopeWorkerResponse);
};
