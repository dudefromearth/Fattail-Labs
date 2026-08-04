/**
 * Shared Risk Graph surface builder — **one real-time rendering engine for 2D + 3D**.
 *
 * 2D (PnLChart curves) and 3D (Risk detent mesh) are two *presentations* of this
 * path. They must both use:
 *   - buildLegsFromIntent (per-leg IV + mid)
 *   - cardDebits → cost basis dollars
 *   - autofit price range (ATM-centered, full structure visible, ~30% pad)
 *   - computePnlSurface / computePnlAtPrice (BS + vol match + volShift; no P&L mid-anchor)
 *   - today = surface row for elapsed time
 *   - expiry face = front-expiry residual BS − card cost (calendars/diagonals)
 *     or pure intrinsic − card cost (single-expiry)
 *
 * Private 3D BS/debit stacks are prohibited. See architecture:
 *   risk_graph_pnl_authority_v1.1.md §VII
 *   risk_graph_rendering_spec_v1.0.md §XI
 */

import {
  buildLegsFromIntent,
  computePnlAtPrice,
  computePnlSurface,
  positionValueAtNearestExpiry,
  type RtLeg,
  type SurfaceResult,
} from './realtimeClient';
import { atmCenteredXRange, AUTOFIT_PAD_FRAC } from './autofitView';
import type { ChainIVMap } from '../useChainIV';

// Re-export leg builder type deps
export type { RtLeg, SurfaceResult };

/**
 * Card debit is per-share dollars (e.g. 1.25). Values in (50, 10000) are almost
 * never valid SPX 0DTE fly debits — treat as mis-scaled (80 → 0.80).
 */
export function normalizePerShareDebit(raw: number): number {
  if (!Number.isFinite(raw) || raw === 0) return 0;
  const a = Math.abs(raw);
  if (a > 50 && a < 10000) return a / 100;
  return a;
}

/**
 * True when every listed expiration is past 4:00 PM ET close (same convention as
 * buildLegsFromIntent). simTimeOffsetHours advances the clock for Time Machine.
 */
export function isExpirationPast(
  expiration: string | undefined | null,
  nowMs: number = Date.now(),
  simTimeOffsetHours: number = 0,
): boolean {
  if (!expiration) return false;
  const expStr = String(expiration).split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expStr)) return false;
  const expClose = new Date(expStr + 'T16:00:00-04:00').getTime();
  const t = nowMs + simTimeOffsetHours * 3600 * 1000;
  return expClose <= t;
}

/** Strategy/intent is expired when all legs (or the strategy expiration) are past close. */
export function isPositionExpired(
  pos: {
    expiration?: string | null;
    legs?: readonly { expiration?: string | null }[] | null;
  },
  nowMs: number = Date.now(),
  simTimeOffsetHours: number = 0,
): boolean {
  const legs = pos.legs;
  if (legs && legs.length > 0) {
    const withExp = legs.filter(l => l.expiration);
    if (withExp.length === 0) {
      return isExpirationPast(pos.expiration, nowMs, simTimeOffsetHours);
    }
    return withExp.every(l => isExpirationPast(l.expiration, nowMs, simTimeOffsetHours));
  }
  return isExpirationPast(pos.expiration, nowMs, simTimeOffsetHours);
}

/**
 * Cost basis in total dollars from the same numbers the position cards show.
 * cb = Σ sign(cardDebit) × |cardDebit| × 100 × qty
 */
export function cardDebitsToCostBasisDollars(
  intents: readonly {
    intent_id?: string;
    quantity?: number;
    target_price?: number | null;
    price_side?: string;
  }[],
  cardDebits?: Record<string, number>,
): number {
  let cb = 0;
  for (const e of intents) {
    const qty = Math.max(1, e.quantity ?? 1);
    const id = e.intent_id;
    let raw: number | null = null;
    if (id != null && cardDebits != null && Object.prototype.hasOwnProperty.call(cardDebits, id)
        && cardDebits[id] != null && Number.isFinite(cardDebits[id])) {
      raw = cardDebits[id];
    } else if (e.target_price != null && Number.isFinite(e.target_price)) {
      raw = e.target_price;
    }
    if (raw == null || raw === 0) continue;
    const perShare = normalizePerShareDebit(raw);
    if (perShare === 0) continue;
    const isCredit = e.price_side === 'credit';
    cb += (isCredit ? -perShare : perShare) * 100 * qty;
  }
  return cb;
}

/**
 * Structure mark for autofit BE scan.
 * Multi-expiry calendars must use front-expiry residual (not pure intrinsic —
 * same-strike cancel → no BE span → wrong zoom).
 */
function structureMarkDollars(legs: readonly RtLeg[], S: number): number {
  return positionValueAtNearestExpiry(legs, S);
}

export interface AutofitRangeOpts {
  /**
   * Strike ladder from the options chain (same source as heatmap / chain API).
   * When provided, the price grid is expanded to cover at least [min, max] of
   * these strikes so the full chain context is visible — not only the tight
   * breakeven zoom around the structure.
   */
  chainStrikes?: readonly number[];
  /** Optional vol for DTE-aware padding when chain strikes are sparse. */
  vix?: number;
  /** Calendar days to primary expiry — widens range for longer-dated books. */
  dteDays?: number;
}

/**
 * Price-grid range for Risk Graph curves (matches chart autofit doctrine):
 *  1) Center on ATM (spot).
 *  2) Keep full structure (strikes + residual BEs when useful) in frame.
 *  3) ~30% pad beyond content extent from ATM.
 *
 * No longer expands to the full chain ladder or BE-mid centering — those
 * pulled the view off ATM and crushed narrow tents.
 */
export function computeAutofitPriceRange(
  legs: readonly RtLeg[],
  spot: number,
  cbDollars: number,
  opts?: AutofitRangeOpts,
): { lo: number; hi: number } {
  if (legs.length === 0 || !(spot > 0)) {
    return { lo: spot * 0.9, hi: spot * 1.1 };
  }

  const allStrikes = legs.map(l => l.strike);
  const strikeMin = Math.min(...allStrikes);
  const strikeMax = Math.max(...allStrikes);
  const strikeSpan = Math.max(strikeMax - strikeMin, spot * 0.01);

  // Optional BE scan for content only (does not own the center)
  const probe = Math.max(strikeSpan * 3, spot * 0.5);
  const farLow = strikeMin - probe;
  const farHigh = strikeMax + probe;
  const pAtFarLow = structureMarkDollars(legs, farLow) - cbDollars;
  const pAtFarHigh = structureMarkDollars(legs, farHigh) - cbDollars;
  const pAtStrikeLo = structureMarkDollars(legs, strikeMin) - cbDollars;
  const pAtStrikeHi = structureMarkDollars(legs, strikeMax) - cbDollars;
  const unboundedDown = Math.abs(pAtFarLow) > Math.abs(pAtStrikeLo) * 2 + 100;
  const unboundedUp = Math.abs(pAtFarHigh) > Math.abs(pAtStrikeHi) * 2 + 100;

  const content: number[] = [strikeMin, strikeMax];
  if (!unboundedDown && !unboundedUp) {
    const scanLo = strikeMin - strikeSpan * 2 - spot * 0.1;
    const scanHi = strikeMax + strikeSpan * 2 + spot * 0.1;
    const scanSteps = 500;
    const scanStep = (scanHi - scanLo) / scanSteps;
    let prevPnl = structureMarkDollars(legs, scanLo) - cbDollars;
    for (let i = 1; i <= scanSteps; i++) {
      const price = scanLo + i * scanStep;
      const pnl = structureMarkDollars(legs, price) - cbDollars;
      if ((prevPnl < 0 && pnl >= 0) || (prevPnl >= 0 && pnl < 0)) {
        const cross = price - (scanStep * pnl) / (pnl - prevPnl);
        if (Number.isFinite(cross)) content.push(cross);
      }
      prevPnl = pnl;
    }
  }

  // Multi-expiry (calendar/diagonal) mild profile
  const exps = new Set(
    legs.map(l => (l.expiration || '').split('T')[0]).filter(Boolean),
  );
  const isTimeSpread = exps.size >= 2
    || (legs.length === 2
      && legs[0].strike === legs[1].strike
      && Math.sign(legs[0].qty) !== Math.sign(legs[1].qty));

  // 1σ band for autofit window (DTE-aware). Keep structure-only in `content` —
  // vol pad must not inflate contentHalf or it defeats the 1σ = 1/3 viewport rule.
  const dteDays = opts?.dteDays ?? Math.max(...legs.map(l => l.T * 365.25), 0);
  const vixPct = opts?.vix != null && opts.vix > 0 ? opts.vix : 18;
  const sigma = vixPct / 100;
  const tYears = Math.max(dteDays, 1) / 365.25;
  const oneSigmaBandWidth = spot > 0 && sigma > 0
    ? spot * (Math.exp(sigma * Math.sqrt(tYears)) - Math.exp(-sigma * Math.sqrt(tYears)))
    : undefined;

  const { xMin, xMax } = atmCenteredXRange({
    spot,
    contentPrices: content,
    padFrac: AUTOFIT_PAD_FRAC,
    profile: isTimeSpread ? 'time_spread' : 'default',
    oneSigmaBandWidth,
  });
  return { lo: xMin, hi: xMax };
}

/** Collect sorted unique strikes for the given expirations from a chain map. */
export function chainStrikesForExpirations(
  strikeMap: { [expiration: string]: number[] } | null | undefined,
  expirations: readonly string[],
): number[] {
  if (!strikeMap || expirations.length === 0) return [];
  const out = new Set<number>();
  for (const exp of expirations) {
    const expStr = String(exp).split('T')[0];
    const ladder = strikeMap[expStr] ?? strikeMap[exp] ?? [];
    for (const s of ladder) {
      if (Number.isFinite(s)) out.add(s);
    }
  }
  return [...out].sort((a, b) => a - b);
}

export function nearestTimeRow(timeGrid: readonly number[], elapsedDays: number): number {
  if (timeGrid.length === 0) return 0;
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < timeGrid.length; i++) {
    const d = Math.abs(timeGrid[i] - elapsedDays);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  }
  return best;
}

export interface SharedCurveSlice {
  priceGrid: number[];
  /** Real-time / today (or time-machine row) P&L — residual value OK above −debit */
  theoreticalPnl: number[];
  /**
   * Expiry payoff for display: pure intrinsic − card cost basis.
   * Wings pin to −debit×100 (the calculated debit). Do NOT use last surface
   * time-row here — that still carries the mid-anchor and floats vs debit.
   */
  expirationPnl: number[];
  /** Alias of expirationPnl (intrinsic − cb) */
  intrinsicPnl: number[];
  /** Last surface time-row (time-scrub face); not debit-pinned */
  surfaceExpiryRowPnl: number[];
  currentNetValue: number;
  /** Total $ cost basis from cardDebits (authoritative) */
  costBasis: number;
  tMaxDays: number;
  theoreticalRowIdx: number;
  surface: SurfaceResult;
  legs: RtLeg[];
}

export interface BuildSharedSurfaceArgs {
  legs: readonly RtLeg[];
  spot: number;
  cbDollars: number;
  /** Parallel vol shift in absolute IV points (e.g. 0.05 = +5 vol pts). Same as realtimeClient. */
  volShift?: number;
  /** Elapsed days for the "today"/time-machine slice (0 = now). */
  elapsedDays?: number;
  gridN?: number;
  numTimeSlices?: number;
  rangeOverride?: { lo: number; hi: number };
  /** When true (e.g. chain stale / market closed quotes), disable mid-mark anchor. */
  skipMidAnchor?: boolean;
  /**
   * When true, skip package-mid parallel vol calibration.
   * Used by Theo mode (flat σ — honest model vs mark).
   */
  skipVolCalibrate?: boolean;
  /** Options chain strikes (heatmap / chain ladder) for price-grid extent. */
  chainStrikes?: readonly number[];
  vix?: number;
  dteDays?: number;
}

const ATM_FALLBACK_IV = 0.20;
const DEFAULT_R = 0.05;
const DEFAULT_Q = 0.013;

/**
 * Seed IV for Theo mode (before package match).
 * Priority: ATM-by-DTE → median of per-leg IVs → VIX/100 → 0.20
 */
export function resolveTheoIvSeed(args: {
  legs: readonly RtLeg[];
  atmIvByDte?: Record<string, number> | null;
  dteDays: number;
  vix?: number;
}): number {
  const { legs, atmIvByDte, dteDays, vix } = args;
  const dteKey = String(Math.max(0, Math.round(dteDays)));
  const atm =
    atmIvByDte?.[dteKey] ??
    atmIvByDte?.[String(Math.max(0, Math.round(dteDays) + 1))] ??
    atmIvByDte?.[String(Math.max(0, Math.round(dteDays) - 1))];
  if (atm != null && atm > 0.01 && atm <= 5.0) return atm;

  const valid = legs.map(l => l.iv).filter(iv => iv > 0.01 && iv <= 5.0).sort((a, b) => a - b);
  if (valid.length > 0) {
    const mid = Math.floor(valid.length / 2);
    return valid.length % 2 === 1 ? valid[mid] : 0.5 * (valid[mid - 1] + valid[mid]);
  }

  if (vix != null && vix > 0 && vix < 500) {
    const fromVix = vix / 100;
    if (fromVix > 0.01 && fromVix <= 5.0) return fromVix;
  }
  return ATM_FALLBACK_IV;
}

/** @deprecated Use resolveTheoIvSeed + resolveFlatIvToPackage */
export function resolveTheoIv(args: {
  legs: readonly RtLeg[];
  atmIvByDte?: Record<string, number> | null;
  dteDays: number;
  vix?: number;
}): number {
  return resolveTheoIvSeed(args);
}

/** Clone legs with a flat IV on every leg (Theo surface). */
export function applyFlatIv(legs: readonly RtLeg[], sigma: number): RtLeg[] {
  const s = Math.max(1e-4, Math.min(sigma, 5.0));
  return legs.map(l => ({ ...l, iv: s }));
}

/**
 * Solve a single flat σ so positionTheo(spot; σ) ≈ targetDollars.
 *
 * This is the package-implied flat IV: for an ATM debit structure priced at mid,
 * model(spot) = debit → T+0 P&L ≈ 0 at the body (peak meets the zero line).
 * Shape stays symmetric (one vol); differs from Mkt which keeps per-leg skew.
 *
 * Long premium flies are typically short vega: higher σ → lower package value.
 * Search does not assume monotonicity globally — samples then refines.
 */
export function resolveFlatIvToPackage(args: {
  legs: readonly RtLeg[];
  spot: number;
  /** Package mid or |cost basis| in total dollars (×100 already). */
  targetDollars: number;
  /** Seed σ for search center (ATM/median). */
  seedIv?: number;
  r?: number;
  q?: number;
}): number {
  const {
    legs,
    spot,
    targetDollars,
    seedIv = ATM_FALLBACK_IV,
    r = DEFAULT_R,
    q = DEFAULT_Q,
  } = args;
  if (!(spot > 0) || legs.length === 0 || !(targetDollars > 0)) {
    return Math.max(1e-4, Math.min(seedIv, 5.0));
  }

  // Pure package theo (dollars) at spot for a flat-σ book
  const valueAt = (sigma: number): number => {
    const flat = applyFlatIv(legs, sigma);
    return computePnlAtPrice(flat, spot, spot, r, q, 0, 0, 0, { skipVolCalibrate: true });
  };

  const LO = 0.02;
  const HI = 2.0;
  const STEPS = 48;
  let bestSig = Math.max(LO, Math.min(seedIv, HI));
  let bestErr = Math.abs(valueAt(bestSig) - targetDollars);

  for (let i = 0; i <= STEPS; i++) {
    const sig = LO + (HI - LO) * (i / STEPS);
    const err = Math.abs(valueAt(sig) - targetDollars);
    if (err < bestErr) {
      bestErr = err;
      bestSig = sig;
    }
  }

  // Local refine
  let lo = Math.max(LO, bestSig - (HI - LO) / STEPS);
  let hi = Math.min(HI, bestSig + (HI - LO) / STEPS);
  for (let i = 0; i < 32; i++) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (Math.abs(valueAt(m1) - targetDollars) < Math.abs(valueAt(m2) - targetDollars)) {
      hi = m2;
    } else {
      lo = m1;
    }
  }
  return Math.max(LO, Math.min(0.5 * (lo + hi), HI));
}

/**
 * Build the shared surface and extract 2D curves identical to 3D Risk detent.
 */
export function buildSharedRiskCurves(args: BuildSharedSurfaceArgs): SharedCurveSlice | null {
  const {
    legs,
    spot,
    cbDollars,
    volShift = 0,
    elapsedDays = 0,
    gridN = 121,
    numTimeSlices = 30,
    rangeOverride,
    skipMidAnchor = false,
    skipVolCalibrate = false,
    chainStrikes,
    vix,
    dteDays,
  } = args;

  if (!legs.length || !(spot > 0)) return null;

  const range = rangeOverride ?? computeAutofitPriceRange(legs, spot, cbDollars, {
    chainStrikes,
    vix,
    dteDays,
  });
  // Wider range needs more grid points so the tent stays sharp
  const span = range.hi - range.lo;
  const adaptiveGridN = Math.min(401, Math.max(gridN, Math.ceil(span / 2.5)));
  const surface = computePnlSurface(
    legs,
    spot,
    undefined,
    undefined,
    undefined,
    adaptiveGridN,
    numTimeSlices,
    volShift,
    cbDollars,
    range,
    { skipMidAnchor, skipVolCalibrate },
  );

  const { priceGrid, timeGrid, pnlBuffer, atExpirationPnl, NX, NT, tMaxDays } = surface;
  const theoRow = nearestTimeRow(timeGrid, elapsedDays);
  const expRow = NT - 1;

  const theoreticalPnl = new Array(NX);
  const surfaceExpiryRowPnl = new Array(NX);
  for (let j = 0; j < NX; j++) {
    theoreticalPnl[j] = pnlBuffer[theoRow * NX + j];
    surfaceExpiryRowPnl[j] = pnlBuffer[expRow * NX + j];
  }

  // Front-expiry curve from surface (calendars: residual BS on back legs).
  // Rebase to card cbDollars if surface.costBasis drifted.
  const intrinsicPnl = atExpirationPnl.map((pnl) => {
    const markOnly = pnl + surface.costBasis;
    return markOnly - cbDollars;
  });

  return {
    priceGrid: [...priceGrid],
    theoreticalPnl,
    expirationPnl: intrinsicPnl,
    intrinsicPnl,
    surfaceExpiryRowPnl,
    currentNetValue: surface.currentNetValue,
    costBasis: cbDollars,
    tMaxDays,
    theoreticalRowIdx: theoRow,
    surface,
    legs: [...legs],
  };
}

/** Intent-shaped legs for buildLegsFromIntent */
export type IntentLegLike = {
  strike: number;
  option_type: string;
  quantity: number;
  expiration: string;
  entry_price?: number | null;
};

/** Stamp short→front / long→back when a 2-leg time spread lost dual expirations. */
function repairIntentLegsForPricing(
  legs: readonly IntentLegLike[],
): IntentLegLike[] {
  if (legs.length !== 2) return [...legs];
  const [a, b] = legs;
  const sameStrike = a.strike === b.strike;
  const sameType =
    String(a.option_type).toLowerCase().startsWith('c')
    === String(b.option_type).toLowerCase().startsWith('c');
  const opposite =
    Math.sign(a.quantity) !== 0
    && Math.sign(b.quantity) !== 0
    && Math.sign(a.quantity) !== Math.sign(b.quantity);
  if (!sameStrike || !sameType || !opposite) return [...legs];

  const expKeys = legs.map(l => (l.expiration || '').split('T')[0]).filter(Boolean);
  if (new Set(expKeys).size >= 2) return [...legs];

  const front = expKeys[0] || (legs[0]?.expiration || '').split('T')[0];
  if (!front) return [...legs];
  // +7 calendar days (match intentBuilder.defaultBackExpiration)
  const d = new Date(front + 'T12:00:00');
  d.setDate(d.getDate() + 7);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  const back = d.toISOString().slice(0, 10);

  return legs.map(leg => ({
    ...leg,
    expiration: leg.quantity < 0 ? front : back,
  }));
}

export type IntentPricingInput = {
  legs: readonly IntentLegLike[];
  quantity?: number;
  intent_id?: string;
  target_price?: number | null;
  price_side?: string;
  topology?: string;
};

export function buildLegsAndCostBasis(args: {
  intents: readonly IntentPricingInput[];
  cardDebits?: Record<string, number>;
  chainIV: ChainIVMap | null | undefined;
  getContractMid?: (exp: string, strike: number, type: 'call' | 'put') => number | null;
  getSSEIV?: (exp: string, strike: number, type: 'call' | 'put') => number | null;
  /** ATM IV by DTE from heatmap — used when per-leg IV lookup fails. */
  atmIvByDte?: Record<string, number> | null;
  /** Live spot for mid-implied IV recovery on far OTM/ITM wings. */
  spot?: number | null;
  /** Pricing clock (last print / RTH close when market closed). */
  asOfMs?: number | null;
}): { legs: RtLeg[]; cbDollars: number } {
  const { intents, cardDebits, chainIV, getContractMid, getSSEIV, atmIvByDte, spot, asOfMs } = args;
  const legs = intents.flatMap(e => {
    const topo = (e.topology || '').toLowerCase();
    const needRepair =
      topo === 'calendar'
      || topo === 'diagonal'
      || e.legs.length === 2;
    const fixedLegs = needRepair ? repairIntentLegsForPricing(e.legs) : e.legs;
    return buildLegsFromIntent(
      fixedLegs,
      chainIV,
      getContractMid,
      getSSEIV,
      e.quantity ?? 1,
      atmIvByDte,
      spot,
      asOfMs,
    );
  });
  // Cost basis ALWAYS from card debits (normalized) — same as status line / cards
  const cbDollars = cardDebitsToCostBasisDollars(intents, cardDebits);
  return { legs, cbDollars };
}

/**
 * Per-intent legs + cost basis (one entry per visible position).
 * Used for multi-position portfolio curves: calibrate / price each structure
 * independently, then sum P&L — never vol-calibrate all packages as one blob
 * (that flattens distant butterflies into a near-zero T+0 line).
 */
export function buildPerIntentLegsAndCostBasis(args: {
  intents: readonly IntentPricingInput[];
  cardDebits?: Record<string, number>;
  chainIV: ChainIVMap | null | undefined;
  getContractMid?: (exp: string, strike: number, type: 'call' | 'put') => number | null;
  getSSEIV?: (exp: string, strike: number, type: 'call' | 'put') => number | null;
  atmIvByDte?: Record<string, number> | null;
  spot?: number | null;
  asOfMs?: number | null;
}): Array<{ intent_id?: string; legs: RtLeg[]; cbDollars: number }> {
  const { intents, cardDebits, chainIV, getContractMid, getSSEIV, atmIvByDte, spot, asOfMs } = args;
  const out: Array<{ intent_id?: string; legs: RtLeg[]; cbDollars: number }> = [];
  for (const e of intents) {
    const single = buildLegsAndCostBasis({
      intents: [e],
      cardDebits,
      chainIV,
      getContractMid,
      getSSEIV,
      atmIvByDte,
      spot,
      asOfMs,
    });
    if (single.legs.length === 0) continue;
    out.push({
      intent_id: e.intent_id,
      legs: single.legs,
      cbDollars: single.cbDollars,
    });
  }
  return out;
}

/**
 * Portfolio curves = sum of per-position curves on a shared price grid.
 *
 * Each position keeps its own package-mid vol calibration and cost basis.
 * Merging legs first and calibrating once across packages destroys tent shape
 * when structures sit far apart (multi-fly books).
 */
export function buildMultiPositionSharedCurves(args: {
  positions: ReadonlyArray<{ legs: readonly RtLeg[]; cbDollars: number }>;
  spot: number;
  volShift?: number;
  elapsedDays?: number;
  gridN?: number;
  numTimeSlices?: number;
  skipMidAnchor?: boolean;
  skipVolCalibrate?: boolean;
  /** Optional transform applied per position before surface (e.g. Theo flat IV). */
  mapLegs?: (legs: readonly RtLeg[], cbDollars: number) => readonly RtLeg[];
  chainStrikes?: readonly number[];
  vix?: number;
  dteDays?: number;
}): SharedCurveSlice | null {
  const {
    positions,
    spot,
    volShift = 0,
    elapsedDays = 0,
    gridN = 161,
    numTimeSlices = 30,
    skipMidAnchor = false,
    skipVolCalibrate = false,
    mapLegs,
    chainStrikes,
    vix,
    dteDays,
  } = args;

  const usable = positions.filter(p => p.legs.length > 0);
  if (usable.length === 0 || !(spot > 0)) return null;

  // Single position — same path as before
  if (usable.length === 1) {
    const p = usable[0];
    const legs = mapLegs ? mapLegs(p.legs, p.cbDollars) : p.legs;
    return buildSharedRiskCurves({
      legs,
      spot,
      cbDollars: p.cbDollars,
      volShift,
      elapsedDays,
      gridN,
      numTimeSlices,
      skipMidAnchor,
      skipVolCalibrate,
      chainStrikes,
      vix,
      dteDays,
    });
  }

  const allLegs = usable.flatMap(p => [...p.legs]);
  const totalCb = usable.reduce((s, p) => s + p.cbDollars, 0);
  const range = computeAutofitPriceRange(allLegs, spot, totalCb, {
    chainStrikes,
    vix,
    dteDays,
  });
  const span = range.hi - range.lo;
  const adaptiveGridN = Math.min(401, Math.max(gridN, Math.ceil(span / 2.5)));

  const slices: SharedCurveSlice[] = [];
  for (const p of usable) {
    const legs = mapLegs ? mapLegs(p.legs, p.cbDollars) : p.legs;
    const slice = buildSharedRiskCurves({
      legs,
      spot,
      cbDollars: p.cbDollars,
      volShift,
      elapsedDays,
      gridN: adaptiveGridN,
      numTimeSlices,
      rangeOverride: range,
      skipMidAnchor,
      skipVolCalibrate,
      chainStrikes,
      vix,
      dteDays,
    });
    if (slice) slices.push(slice);
  }
  if (slices.length === 0) return null;
  if (slices.length === 1) return slices[0];

  // All slices share rangeOverride → same NX; re-sample if lengths ever differ
  const priceGrid = slices[0].priceGrid;
  const NX = priceGrid.length;
  const theoreticalPnl = new Array(NX).fill(0);
  const expirationPnl = new Array(NX).fill(0);
  const surfaceExpiryRowPnl = new Array(NX).fill(0);
  let currentNetValue = 0;
  let costBasis = 0;
  let tMaxDays = 0;

  for (const sl of slices) {
    currentNetValue += sl.currentNetValue;
    costBasis += sl.costBasis;
    tMaxDays = Math.max(tMaxDays, sl.tMaxDays);
    for (let j = 0; j < NX; j++) {
      // Same grid when rangeOverride is shared
      theoreticalPnl[j] += sl.theoreticalPnl[j] ?? 0;
      expirationPnl[j] += sl.expirationPnl[j] ?? 0;
      surfaceExpiryRowPnl[j] += sl.surfaceExpiryRowPnl[j] ?? 0;
    }
  }

  // Sum surface buffers when shapes match (3D portfolio mesh)
  const baseSurf = slices[0].surface;
  let surface = baseSurf;
  if (slices.every(s => s.surface.NX === baseSurf.NX && s.surface.NT === baseSurf.NT)) {
    const NT = baseSurf.NT;
    const pnlBuffer = new Float32Array(NT * NX);
    let minPnl = Infinity;
    let maxPnl = -Infinity;
    for (const sl of slices) {
      for (let i = 0; i < NT * NX; i++) {
        pnlBuffer[i] += sl.surface.pnlBuffer[i];
      }
    }
    for (let i = 0; i < NT * NX; i++) {
      const v = pnlBuffer[i];
      if (v < minPnl) minPnl = v;
      if (v > maxPnl) maxPnl = v;
    }
    const atExpirationPnl = expirationPnl.slice();
    surface = {
      ...baseSurf,
      pnlBuffer,
      atExpirationPnl,
      minPnl: Number.isFinite(minPnl) ? minPnl : 0,
      maxPnl: Number.isFinite(maxPnl) ? maxPnl : 0,
      currentNetValue,
      costBasis,
      tMaxDays,
    };
  }

  return {
    priceGrid: [...priceGrid],
    theoreticalPnl,
    expirationPnl,
    intrinsicPnl: expirationPnl,
    surfaceExpiryRowPnl,
    currentNetValue,
    costBasis,
    tMaxDays,
    theoreticalRowIdx: slices[0].theoreticalRowIdx,
    surface,
    legs: allLegs,
  };
}
