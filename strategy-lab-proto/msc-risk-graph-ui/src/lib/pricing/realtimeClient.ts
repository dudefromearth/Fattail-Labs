/**
 * realtimeClient.ts — 1:1 port of src/pricing/realtime.py
 *
 * Produces the exact same P&L curves as the server.  No abstraction,
 * no cascade, no clamp.  Uses bsPrice from blackScholes.ts (already
 * updated with dividend yield q).
 *
 * Data sources (all client-side, no HTTP):
 *   - Per-leg IV:  chainIV.get(strike, type, expiration) from useChainIV
 *   - Per-leg mid: getContractMid(expiration, strike, type) from useChainIV
 *   - entry_price: intent.legs[].entry_price (falls back to mid)
 */

import { bsPrice } from '../blackScholes';
import type { ChainIVMap } from '../useChainIV';

// ---------- Types ----------

export interface RtLeg {
  strike: number;
  kind: 'C' | 'P';
  qty: number;       // signed: +long / -short
  T: number;         // year fraction to expiry
  iv: number;        // per-leg IV from chain
  mid: number;       // current live mid per-share
  entryPrice: number; // per-contract debit/credit at open
  /** YYYY-MM-DD — used for multi-expiry residual T when numeric T collapses. */
  expiration?: string;
}

export interface PnlCurveResult {
  priceGrid: number[];
  pnlCurve: number[];
  atExpirationPnl: number[];
  currentNetValue: number;
  costBasis: number;
}

export interface SurfaceResult {
  priceGrid: number[];     // NX
  timeGrid: number[];      // NT (elapsed days)
  pnlBuffer: Float32Array; // NT x NX, row-major
  atExpirationPnl: number[];
  minPnl: number;
  maxPnl: number;
  currentNetValue: number;
  costBasis: number;
  tMaxDays: number;
  NX: number;
  NT: number;
}

// ---------- Constants ----------

const MULTIPLIER = 100;
const ATM_FALLBACK_IV = 0.20;
const DEFAULT_R = 0.05;
const DEFAULT_Q = 0.013;
/** Floor for vendor deep-ITM IVs (~0) so BS stays in near-intrinsic regime. */
const DEEP_ITM_IV_FLOOR = 1e-4;

// ---------- Leg builder (mirrors _helpers.py build_legs) ----------

/** Normalize option type to call|put (accepts C/P/call/put). */
function normalizeOptionType(raw: string | undefined | null): 'call' | 'put' {
  const t = String(raw ?? 'call').toLowerCase().trim();
  if (t === 'p' || t === 'put') return 'put';
  return 'call';
}

/** Normalize expiration to YYYY-MM-DD. */
function normalizeExpiration(raw: string | undefined | null): string {
  return String(raw ?? '').split('T')[0];
}

/**
 * Solve BS IV from a market mid (bisection). Returns null if unsolvable.
 * Deep ITM mids near intrinsic → tiny IV (not ATM replacement).
 */
export function impliedVolFromMid(
  mid: number,
  S: number,
  K: number,
  T: number,
  isCall: boolean,
  r: number = DEFAULT_R,
  q: number = DEFAULT_Q,
): number | null {
  if (!(mid > 0) || !(S > 0) || !(K > 0) || !(T > 0)) return null;
  const intrinsic = isCall ? Math.max(S - K, 0) : Math.max(K - S, 0);
  // At or below intrinsic → no extrinsic → near-zero vol
  if (mid <= intrinsic + 1e-4) return DEEP_ITM_IV_FLOOR;
  // Above forward call bound etc. — clamp search
  let lo = DEEP_ITM_IV_FLOOR;
  let hi = 5.0;
  const pLo = bsPrice(S, K, T, r, lo, isCall, q);
  const pHi = bsPrice(S, K, T, r, hi, isCall, q);
  if (mid < pLo - 1e-6) return DEEP_ITM_IV_FLOOR;
  if (mid > pHi + 1e-3) return hi;
  for (let i = 0; i < 48; i++) {
    const m = 0.5 * (lo + hi);
    const p = bsPrice(S, K, T, r, m, isCall, q);
    if (p > mid) hi = m;
    else lo = m;
  }
  return 0.5 * (lo + hi);
}

export function buildLegsFromIntent(
  intentLegs: readonly { strike: number; option_type: string; quantity: number; expiration: string; entry_price?: number | null }[],
  chainIV: ChainIVMap | null | undefined,
  getContractMid: ((exp: string, strike: number, type: 'call' | 'put') => number | null) | undefined,
  /** Direct IV lookup from SSE — preferred over chainIV cascade when available. */
  getSSEIV?: ((exp: string, strike: number, type: 'call' | 'put') => number | null),
  /** Position-level quantity multiplier (number of spreads). Defaults to 1. */
  positionQuantity: number = 1,
  /** Optional ATM IV by DTE (string keys "0","1",…) for fallback before flat 0.20. */
  atmIvByDte?: Record<string, number> | null,
  /** Live spot — enables mid-implied IV when chain IV is missing/pathological. */
  spot?: number | null,
  /**
   * Pricing clock (ms). When market is closed / marks are Friday prints, pass
   * last RTH close so T matches the vintage of frozen mids/IVs — not weekend
   * wall-clock (which invents phantom theta overnight).
   */
  asOfMs?: number | null,
): RtLeg[] {
  const now = asOfMs != null && Number.isFinite(asOfMs) ? asOfMs : Date.now();
  return intentLegs.map(raw => {
    const type = normalizeOptionType(raw.option_type);
    const kind: 'C' | 'P' = type === 'call' ? 'C' : 'P';
    const expStr = normalizeExpiration(raw.expiration);
    const strike = Math.round(Number(raw.strike));

    // T: year fraction to 4pm ET expiry from pricing clock (not always wall now)
    const expMs = expStr ? new Date(expStr + 'T16:00:00-04:00').getTime() : NaN;
    const T = Number.isFinite(expMs)
      ? Math.max(0, (expMs - now) / (365.25 * 24 * 3600 * 1000))
      : 0;

    // Mid first — needed for IV-from-mid recovery on deep ITM / missing IV
    const mid = getContractMid?.(expStr, strike, type) ?? 0;

    // IV cascade: SSE → chain exact/nearest/DTE → mid-implied → ATM-by-DTE → flat
    let iv: number | null = getSSEIV?.(expStr, strike, type) ?? null;
    if (iv == null) iv = chainIV?.get(strike, type, expStr) ?? null;
    if (iv == null) iv = chainIV?.getNearest(strike, type, expStr) ?? null;
    if (iv == null) iv = chainIV?.getClosestDTE(strike, type, expStr) ?? null;

    // Vendor deep-ITM IVs often print ~0–0.001. That is *correct* (extrinsic≈0).
    // Replacing them with ATM IV (~0.10–0.20) invents wing premium and destroys
    // OTM/ITM butterfly theo — while expiry (intrinsic) and card mid stay fine.
    if (iv != null && iv > 0 && iv <= 0.01) {
      iv = Math.max(iv, DEEP_ITM_IV_FLOOR);
    } else if (iv != null && (iv <= 0 || iv > 5.0)) {
      iv = null;
    }

    // No usable chain IV: imply from mid at live spot (best recovery for far strikes)
    if (iv == null && mid > 0 && spot != null && spot > 0 && T > 0) {
      iv = impliedVolFromMid(mid, spot, strike, T, kind === 'C');
    }

    if (iv == null && atmIvByDte) {
      const dte = Math.max(0, Math.round(T * 365.25));
      const atm = atmIvByDte[String(dte)] ?? atmIvByDte[String(dte + 1)] ?? atmIvByDte[String(Math.max(0, dte - 1))];
      if (atm != null && atm > 0.01 && atm <= 5.0) iv = atm;
    }
    if (iv == null || iv <= 0 || iv > 5.0) iv = ATM_FALLBACK_IV;

    // Entry price: from intent, fall back to current mid (mirrors server)
    let entryPrice = raw.entry_price ?? 0;
    if (entryPrice === 0) entryPrice = mid;

    return {
      strike, kind, qty: raw.quantity * positionQuantity, T, iv, mid, entryPrice,
      expiration: expStr || undefined,
    };
  });
}

// ---------- Core pricing (mirrors realtime.py exactly) ----------

/** Server: _position_theo — NO clamp */
function positionTheo(
  legs: readonly RtLeg[], S: number, r: number, q: number,
  tShift: number = 0, volShift: number = 0,
): number {
  let total = 0;
  for (const leg of legs) {
    const Teff = Math.max(leg.T - tShift, 0);
    const sigma = Math.max(leg.iv + volShift, 1e-6);
    total += leg.qty * bsPrice(S, leg.strike, Teff, r, sigma, leg.kind === 'C', q) * MULTIPLIER;
  }
  return total;
}

/** Server: _intrinsic — all legs pure exercise value (single-expiry only). */
function intrinsic(legs: readonly RtLeg[], S: number): number {
  let total = 0;
  for (const leg of legs) {
    const iv = leg.kind === 'C' ? Math.max(S - leg.strike, 0) : Math.max(leg.strike - S, 0);
    total += leg.qty * iv * MULTIPLIER;
  }
  return total;
}

/** ~1 minute in years — below this, treat as expired for front-expiry curves. */
const MIN_RESIDUAL_T = 1 / (365.25 * 24 * 60);

/**
 * Synthetic residual for collapsed calendars (same strike/type/exp, opposite
 * signs). One week of time keeps a visible ToS-style hump when the registry
 * lost per-leg back expiration.
 */
export const COLLAPSED_CALENDAR_RESIDUAL_YEARS = 7 / 365.25;

/** Parse YYYY-MM-DD to ms at 16:00 ET (same convention as buildLegsFromIntent). */
function expirationToMs(exp: string | undefined): number {
  if (!exp) return NaN;
  const expStr = normalizeExpiration(exp);
  const ms = new Date(expStr + 'T16:00:00-04:00').getTime();
  return Number.isFinite(ms) ? ms : NaN;
}

/**
 * Two-leg same-strike same-type opposite-qty structure (calendar/diagonal body).
 * When residual is zero this is a broken time-spread, not a real flat book.
 */
export function isCollapsedTimeSpread(legs: readonly RtLeg[]): boolean {
  if (legs.length !== 2) return false;
  const [a, b] = legs;
  if (a.strike !== b.strike || a.kind !== b.kind) return false;
  if (Math.sign(a.qty) === 0 || Math.sign(b.qty) === 0) return false;
  return Math.sign(a.qty) !== Math.sign(b.qty);
}

/**
 * Residual years after the nearest expiry for each leg.
 *
 * When legs have **distinct expiration dates** (calendars/diagonals), always
 * use calendar-date residual — more reliable than T differences (asOf pinning
 * can collapse Ts). Otherwise use numeric T − min(T).
 *
 * Collapsed calendars (same exp + same T on opposite same-strike legs) get a
 * synthetic residual on long legs so at-expiry is not a flat −debit line.
 */
export function residualYearsAfterFront(legs: readonly RtLeg[]): number[] {
  if (legs.length === 0) return [];

  const expMs = legs.map(l => expirationToMs(l.expiration));
  const validExps = [...new Set(expMs.filter(Number.isFinite))];
  let residuals: number[];
  if (validExps.length >= 2) {
    const frontMs = Math.min(...validExps);
    residuals = expMs.map(ms =>
      Number.isFinite(ms)
        ? Math.max(0, (ms - frontMs) / (365.25 * 24 * 3600 * 1000))
        : 0,
    );
  } else {
    const tResid = legs.map(l => Math.max(0, l.T));
    const frontT = Math.min(...tResid);
    residuals = tResid.map(t => Math.max(0, t - frontT));
  }

  // Registry / builder collapse: both legs share one date → residual all 0 →
  // pure intrinsic nets to 0 on same-strike calendars. Keep long residual.
  if (
    residuals.every(r => r <= MIN_RESIDUAL_T)
    && isCollapsedTimeSpread(legs)
  ) {
    return legs.map(l => (l.qty > 0 ? COLLAPSED_CALENDAR_RESIDUAL_YEARS : 0));
  }

  return residuals;
}

/**
 * Position mark at the **nearest** leg expiry (ToS risk profile for calendars).
 *
 * - Legs that expire at/near the front: pure intrinsic.
 * - Longer-dated legs: residual BS with T_remaining after front expiry.
 *
 * Pure all-intrinsic is wrong for calendars: same-strike long/short cancel to 0
 * and the "at expiry" curve collapses to a flat −debit line.
 */
export function positionValueAtNearestExpiry(
  legs: readonly RtLeg[],
  S: number,
  r: number = DEFAULT_R,
  q: number = DEFAULT_Q,
  volShift: number = 0,
): number {
  if (legs.length === 0) return 0;
  const residuals = residualYearsAfterFront(legs);
  let total = 0;
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const remaining = residuals[i] ?? 0;
    if (remaining <= MIN_RESIDUAL_T) {
      const iv = leg.kind === 'C' ? Math.max(S - leg.strike, 0) : Math.max(leg.strike - S, 0);
      total += leg.qty * iv * MULTIPLIER;
    } else {
      const sigma = Math.max(leg.iv + volShift, 1e-6);
      total += leg.qty * bsPrice(S, leg.strike, remaining, r, sigma, leg.kind === 'C', q) * MULTIPLIER;
    }
  }
  return total;
}

/** Server: net_value_from_mids */
function netValueFromMids(legs: readonly RtLeg[]): number {
  return legs.reduce((s, l) => s + l.qty * l.mid * MULTIPLIER, 0);
}

/** Server: cost_basis */
function costBasisFromLegs(legs: readonly RtLeg[]): number {
  return legs.reduce((s, l) => s + l.qty * l.entryPrice * MULTIPLIER, 0);
}

/**
 * Curve pricing — ToS-style Risk Profile:
 *   P&L(S) = model(S; σ*) − cost_basis
 *
 * cost_basis = card debit × 100 (locked entry or live mid).
 * σ* = per-leg chain IVs + parallel vol shift calibrated so
 *   model(spot; σ*) ≈ package mid  (when mids exist).
 *
 * This is NOT a P&L vertical shift. Wings still go to −cost as model→0
 * (ToS debit line). A constant mid−theo *P&L* anchor was wrong: it moved
 * the asymptote off the debit line.
 */
export interface AnchorOptions {
  /** @deprecated Kept for API compat; mid-anchor is not applied. */
  skipMidAnchor?: boolean;
  /** @deprecated */
  anchorFadePct?: number;
  /** Skip vol calibration to package mid (use raw chain IVs + volShift only). */
  skipVolCalibrate?: boolean;
}

/**
 * Parallel IV shift so positionTheo(spot) matches target package value (dollars).
 *
 * OTM/ITM butterflies often have **non-monotonic** value vs vol (vega flips
 * across the band). Binary search on a single vega sign then drives to ±floor
 * and paints a near-expiry tent or a flat line — while ATM stays fine.
 *
 * Strategy: coarse scan the vol-shift band for the best spot match, then
 * refine locally. Reject any result that does not improve on the unshifted model.
 */
export function calibrateParallelVolShift(
  legs: readonly RtLeg[],
  spot: number,
  r: number,
  q: number,
  /**
   * Signed package dollars to match at spot (model ≈ this).
   * Debit packages > 0; credit packages < 0. Absolute magnitude used for tol.
   */
  targetPackageDollars: number,
  baseVolShift: number = 0,
): number {
  const targetAbs = Math.abs(targetPackageDollars);
  if (!(spot > 0) || legs.length === 0 || !(targetAbs > 1e-9) || !Number.isFinite(targetPackageDollars)) {
    return baseVolShift;
  }
  const valueAt = (extra: number): number =>
    positionTheo(legs, spot, r, q, 0, baseVolShift + extra);

  const v0 = valueAt(0);
  const tol = Math.max(0.5, targetAbs * 0.01); // $0.50 or 1% of |package|
  if (Math.abs(v0 - targetPackageDollars) < tol) return baseVolShift;

  // Coarse scan — handles vega sign flips (OTM flies, weekend marks, etc.)
  const LO = -0.50; // do not crush to pure intrinsic (−0.9 was the 7500c failure mode)
  const HI = 1.50;
  const STEPS = 40;
  let bestExtra = 0;
  let bestErr = Math.abs(v0 - targetPackageDollars);
  for (let i = 0; i <= STEPS; i++) {
    const extra = LO + (HI - LO) * (i / STEPS);
    const err = Math.abs(valueAt(extra) - targetPackageDollars);
    if (err < bestErr) {
      bestErr = err;
      bestExtra = extra;
    }
  }

  // Local refine around best coarse point
  let lo = Math.max(LO, bestExtra - (HI - LO) / STEPS);
  let hi = Math.min(HI, bestExtra + (HI - LO) / STEPS);
  for (let i = 0; i < 24; i++) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (Math.abs(valueAt(m1) - targetPackageDollars) < Math.abs(valueAt(m2) - targetPackageDollars)) {
      hi = m2;
    } else {
      lo = m1;
    }
  }
  const extra = 0.5 * (lo + hi);
  const vCal = valueAt(extra);

  // Guard: never accept a worse spot match than the unshifted model
  if (Math.abs(vCal - targetPackageDollars) > Math.abs(v0 - targetPackageDollars) + 1e-6) {
    return baseVolShift;
  }
  // Guard: reject if still wildly off and unshifted was closer to a "reasonable" residual
  // (prefer honest chain-IV shape over a forced but distorted match)
  if (Math.abs(vCal - targetPackageDollars) > Math.max(tol * 5, 25) && bestErr > Math.abs(v0 - targetPackageDollars) * 0.5) {
    return baseVolShift;
  }
  return baseVolShift + extra;
}

/**
 * Resolve mid quality + signed calibration target.
 * Exported for unit tests.
 *
 * hasMids: enough legs have positive mids (NOT currentNet > 0 — that excluded credits).
 * targetSigned: package mid$ when hasMids, else signed cost basis (credits negative).
 */
export function resolveVolCalTarget(
  legs: readonly RtLeg[],
  cbDollars?: number,
): { currentNet: number; hasMids: boolean; targetSigned: number } {
  const currentNet = netValueFromMids(legs);
  const legsWithMid = legs.filter(l => l.mid > 0 && Number.isFinite(l.mid)).length;
  // Require majority of legs (or all if ≤2) to have mids
  const need = legs.length <= 2 ? legs.length : Math.ceil(legs.length * 0.75);
  const hasMids = legsWithMid >= need && Math.abs(currentNet) > 1e-6;
  const cb =
    cbDollars != null && Number.isFinite(cbDollars) ? cbDollars : 0;
  const targetSigned = hasMids ? currentNet : cb;
  return { currentNet, hasMids, targetSigned };
}

function effectiveVolShift(
  legs: readonly RtLeg[],
  spot: number,
  r: number,
  q: number,
  volShift: number,
  opts?: AnchorOptions,
  /** Signed card cost basis in dollars — used when mids missing (credits negative). */
  cbDollars?: number,
): { currentNet: number; vol: number } {
  const { currentNet, hasMids, targetSigned } = resolveVolCalTarget(legs, cbDollars);
  if (opts?.skipVolCalibrate) return { currentNet, vol: volShift };

  // Don't calibrate when essentially expired (intrinsic regime)
  const maxT = legs.length > 0 ? Math.max(...legs.map(l => l.T)) : 0;
  if (maxT <= 2 / (365.25 * 24 * 60)) return { currentNet, vol: volShift };

  if (!(Math.abs(targetSigned) > 1e-9)) return { currentNet, vol: volShift };

  const vol = calibrateParallelVolShift(legs, spot, r, q, targetSigned, volShift);
  return { currentNet: hasMids ? currentNet : targetSigned, vol };
}

/**
 * Single-point P&L using the same formula as computePnlCurve / computePnlSurface.
 * Used by 3D live column recompute so mesh stays on the authority path.
 */
export function computePnlAtPrice(
  legs: readonly RtLeg[],
  S: number,
  spotForCalibrate: number,
  r: number = DEFAULT_R,
  q: number = DEFAULT_Q,
  tShift: number = 0,
  volShift: number = 0,
  cbOverride?: number,
  opts?: AnchorOptions,
): number {
  const cb = cbOverride ?? costBasisFromLegs(legs);
  const { vol } = effectiveVolShift(legs, spotForCalibrate, r, q, volShift, opts, cb);
  return positionTheo(legs, S, r, q, tShift, vol) - cb;
}

// ---------- Public: 1D curve ----------

export function computePnlCurve(
  legs: readonly RtLeg[],
  spot: number,
  r: number = DEFAULT_R,
  q: number = DEFAULT_Q,
  gridPct: number = 0.10,
  gridN: number = 121,
  tShift: number = 0,
  volShift: number = 0,
  /** Override cost basis in dollars. cardDebits × 100. */
  cbOverride?: number,
  opts?: AnchorOptions,
): PnlCurveResult {
  const cb = cbOverride ?? costBasisFromLegs(legs);
  const { currentNet, vol } = effectiveVolShift(legs, spot, r, q, volShift, opts, cb);

  const lo = spot * (1 - gridPct);
  const hi = spot * (1 + gridPct);
  const step = (hi - lo) / Math.max(gridN - 1, 1);
  const priceGrid: number[] = [];
  for (let i = 0; i < gridN; i++) priceGrid.push(lo + i * step);

  // model(S; σ*) − cost. Wings → −cost. No P&L-level mid anchor.
  const pnlCurve = priceGrid.map(S =>
    positionTheo(legs, S, r, q, tShift, vol) - cb
  );
  // Front-expiry residual BS: use **raw** volShift (What-If only), NOT the
  // T+0 parallel calibration. Calibrating calendars to a small debit drives
  // σ → floor and collapses residual extrinsic → flat −debit (same bug as
  // pure all-intrinsic). Chain IVs are the right surface for remaining tenor.
  const atExpirationPnl = priceGrid.map(S =>
    positionValueAtNearestExpiry(legs, S, r, q, volShift) - cb
  );

  return { priceGrid, pnlCurve, atExpirationPnl, currentNetValue: currentNet, costBasis: cb };
}

// ---------- Public: 2D surface ----------

export function computePnlSurface(
  legs: readonly RtLeg[],
  spot: number,
  r: number = DEFAULT_R,
  q: number = DEFAULT_Q,
  gridPct: number = 0.10,
  gridN: number = 81,
  numTimeSlices: number = 30,
  volShift: number = 0,
  cbOverride?: number,
  rangeOverride?: { lo: number; hi: number },
  opts?: AnchorOptions,
): SurfaceResult {
  const cb = cbOverride ?? costBasisFromLegs(legs);
  const { currentNet, vol } = effectiveVolShift(legs, spot, r, q, volShift, opts, cb);

  // Price grid
  const lo = rangeOverride ? rangeOverride.lo : spot * (1 - gridPct);
  const hi = rangeOverride ? rangeOverride.hi : spot * (1 + gridPct);
  const step = (hi - lo) / Math.max(gridN - 1, 1);
  const priceGrid: number[] = [];
  for (let j = 0; j < gridN; j++) priceGrid.push(lo + j * step);

  // Time horizon:
  //   Single-expiry  → max(leg.T)  (final exercise)
  //   Multi-expiry   → min(leg.T)  (front expiry / ToS risk profile)
  //
  // Why front for calendars: with tShift = front T, positionTheo already does
  //   front → intrinsic, back → residual BS  (Teff = max(T − tShift, 0)).
  // If we ran to back T, the last mesh row is pure all-intrinsic and same-strike
  // calendars collapse to a flat −debit face — the classic multi-exp bug.
  const residuals = residualYearsAfterFront(legs);
  const isMultiExpiry = residuals.some(r => r > MIN_RESIDUAL_T);
  const tMaxYears = legs.length === 0
    ? 0.001
    : isMultiExpiry
      ? Math.max(Math.min(...legs.map(l => Math.max(0, l.T))), MIN_RESIDUAL_T)
      : Math.max(...legs.map(l => l.T), 0.001);
  const tMaxDays = tMaxYears * 365;
  const NT = Math.max(numTimeSlices, 2);
  const NX = gridN;
  const timeGrid: number[] = [];
  for (let i = 0; i < NT; i++) {
    const u = i / (NT - 1);
    timeGrid.push(tMaxDays * u * (2 - u));
  }

  const pnlBuffer = new Float32Array(NT * NX);
  let minPnl = Infinity;
  let maxPnl = -Infinity;

  for (let i = 0; i < NT; i++) {
    const tShift = timeGrid[i] / 365;
    const isLastRow = i === NT - 1;
    for (let j = 0; j < NX; j++) {
      const S = priceGrid[j];
      // Last row of multi-exp surfaces: explicit residual (handles synthetic
      // residual when dates collapsed; matches cyan "At Expiry" exactly).
      const pnl = (isMultiExpiry && isLastRow)
        ? positionValueAtNearestExpiry(legs, S, r, q, volShift) - cb
        : positionTheo(legs, S, r, q, tShift, vol) - cb;
      pnlBuffer[i * NX + j] = pnl;
      if (pnl < minPnl) minPnl = pnl;
      if (pnl > maxPnl) maxPnl = pnl;
    }
  }

  // Front-expiry face: residual BS on longer legs (not pure all-intrinsic).
  // Use raw volShift only — see computePnlCurve (do not apply T+0 vol cal).
  // Always recompute (do not alias last buffer row) so 1D/2D curves match 3D face.
  const atExpirationPnl = priceGrid.map(S =>
    positionValueAtNearestExpiry(legs, S, r, q, volShift) - cb
  );

  return {
    priceGrid, timeGrid, pnlBuffer, atExpirationPnl,
    minPnl: isFinite(minPnl) ? minPnl : 0,
    maxPnl: isFinite(maxPnl) ? maxPnl : 0,
    currentNetValue: currentNet, costBasis: cb, tMaxDays, NX, NT,
  };
}
