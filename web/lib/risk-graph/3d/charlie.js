/**
 * Heritage: MSC Risk Graph 3D scene agent (presentation only).
 * Source: strategy-lab-proto/msc-risk-graph-ui/src/3d/charlie.js
 * AZ-VP-S4 / DL-302: scene + lighting + reference frame.
 * Pricing SoR is web/lib/risk-graph/surfaceModel.ts — do not call
 * charlie.computeSurface from product paths (flat-IV sheet).
 */
/**
 * charlie.js — DataAgent
 * Domain: Coordinate normalization (single source of truth), P&L grid computation,
 *         leg aggregation, zero-crossing detection
 *
 * DOCTRINE — CRITICAL:
 *   charlie.js is the SINGLE SOURCE for nx/ny/nz and their inverses.
 *   NO other agent (Alpha, Bravo, Delta, Echo, Foxtrot) may implement
 *   coordinate normalization inline. They import from here. Always.
 *   Violation = immediate doctrine flag for Grok review.
 *
 * Spec sources:
 *   REFERENCE FRAME BOX (coordinate mapping)
 *   BREAKEVEN CURVE (findZeroCrossings)
 *   MULTI-POSITION RENDERING (getActiveLegSet, computeSurface)
 *   MULTIPLE EXPIRIES (time-slice active leg filtering)
 *
 * Exports:
 *   buildCoords(dataRange, viewport?)     → CoordFns { nx, ny, nz, dx, dy, dz, range, extents }
 *   computeSurface(legs, opts)           → SurfaceResult
 *   computeAggregatedSurface(pos, opts)  → SurfaceResult (convenience: flattens positions first)
 *   evaluatePnLAtSpot(legs, spot, opts)  → number  (single-point, no grid allocation)
 *   getActiveLegSet(positions)           → Leg[]
 *   buildLegSet(legs, dteValue)          → Leg[]
 *   findZeroCrossings(arr, axis?)        → number[]
 *   getExpiryBoundaries(legs)            → { earliest, latest }
 *   calcDTE(expiration)                  → number  (YYYY-MM-DD → days from today)
 *   adaptIntentLeg(intentLeg, fallbackIV) → Leg    (IntentRegistry schema → Charlie Leg)
 *   adaptIntent(intent)                  → position object for main.js state
 *   FIXTURES                             → { ironCondor, callSpread, longCall }
 */

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────
/**
 * @typedef {{ sMin: number, sMax: number, pMin: number, pMax: number, maxDTE: number }} DataRange
 * @typedef {{ nx: Function, ny: Function, nz: Function, dx: Function, dy: Function, dz: Function, range: DataRange, extents: { x: number, y: number, z: number } }} CoordFns
 * @typedef {{ strike: number, expiry: number, type: 'call'|'put', qty: number, premium: number, intentId?: string }} Leg
 * @typedef {{ pnlGrid: number[][], spotAxis: number[], timeAxis: number[], minPnL: number, maxPnL: number, maxDTE: number, sMin: number, sMax: number, breakevens: { lower: number|null, upper: number|null } }} SurfaceResult
 */

// ─── Coordinate normalization ─────────────────────────────────────────────────
// Maps data-space values into Three.js scene space on each axis.
// Extents are derived from the viewport aspect ratio so the surface fills the
// canvas proportionally rather than being forced into a fixed [-5,5] cube.
// All agents import these. Nobody re-derives them.

/**
 * buildCoords(range: DataRange, viewport?: { width, height }) → CoordFns
 *
 * Call once after receiving data (and again on window resize).
 * Pass the returned fns to Delta, Echo, Foxtrot.
 *
 * viewport defaults to 16:9 when omitted. Pass renderer.domElement dimensions
 * from main.js so the surface always fills the canvas proportionally.
 *
 * Round-trip guarantee: dx(nx(x)) === x within floating-point precision,
 * regardless of viewport or extent values.
 */
export function buildCoords(range, viewport = null) {
  const { sMin, sMax, pMin, pMax, maxDTE } = range

  const aspect  = viewport ? viewport.width / viewport.height : 16 / 9
  const SCENE_X = 6.0
  const SCENE_Y = SCENE_X / aspect   // shrinks Y relative to aspect ratio
  const SCENE_Z = SCENE_X * 0.75    // depth at 75% of width

  // Normalize: data → scene
  function nx(spot) { return ((spot - sMin) / (sMax - sMin)) * 2 * SCENE_X - SCENE_X }
  function ny(pnl)  { return ((pnl  - pMin) / (pMax - pMin)) * 2 * SCENE_Y - SCENE_Y }
  function nz(dte)  { return  (dte  / maxDTE)                * 2 * SCENE_Z - SCENE_Z }

  // Denormalize: scene → data
  function dx(x) { return ((x + SCENE_X) / (2 * SCENE_X)) * (sMax - sMin) + sMin }
  function dy(y) { return ((y + SCENE_Y) / (2 * SCENE_Y)) * (pMax - pMin) + pMin }
  function dz(z) { return ((z + SCENE_Z) / (2 * SCENE_Z)) * maxDTE }

  return { nx, ny, nz, dx, dy, dz, range, extents: { x: SCENE_X, y: SCENE_Y, z: SCENE_Z } }
}

// ─── P&L grid computation ─────────────────────────────────────────────────────

const DEFAULT_NX = 120   // per GAP 4 Option A recommendation
const DEFAULT_NT = 80
const DEFAULT_IV = 0.20  // 20% implied vol fallback

/**
 * computeSurface(legs, opts) → SurfaceResult
 *
 * Core pricing loop. Accepts any mix of legs from any number of positions.
 * Delta and Echo consume the returned SurfaceResult.
 * pnlGrid is indexed [time][spot]: outer index = time slice, inner = spot.
 *
 * @param {Leg[]} legs
 * @param {{ spot: number, iv?: number, r?: number, nx?: number, nt?: number }} opts
 * @returns {SurfaceResult}
 */
export function computeSurface(legs, opts = {}) {
  const {
    spot,
    iv  = DEFAULT_IV,
    r   = 0.04,
    nx  = DEFAULT_NX,
    nt  = DEFAULT_NT,
  } = opts

  if (!legs || legs.length === 0) {
    throw new Error('computeSurface: legs array is empty')
  }
  if (spot == null || !isFinite(spot)) {
    throw new Error('computeSurface: opts.spot is required and must be finite')
  }

  // Determine axis ranges
  const maxDTE = Math.max(...legs.map(l => l.expiry))
  const sRange = spot * 0.35   // ±35% around spot
  const sMin   = spot - sRange
  const sMax   = spot + sRange

  const spotAxis = Array.from({ length: nx }, (_, i) =>
    sMin + (i / (nx - 1)) * (sMax - sMin)
  )
  const timeAxis = Array.from({ length: nt }, (_, j) =>
    (j / (nt - 1)) * maxDTE
  )

  // Build P&L grid [time][spot]
  const pnlGrid = []
  let minPnL = Infinity
  let maxPnL = -Infinity

  for (let j = 0; j < nt; j++) {
    const dte = timeAxis[j]
    const row = []

    // Filter to legs active at this time slice
    const activeLegs = legs.filter(leg => leg.expiry >= dte)

    for (let i = 0; i < nx; i++) {
      const s = spotAxis[i]
      let pnl = 0

      for (const leg of activeLegs) {
        const price = bsPrice(s, leg.strike, dte / 365, r, iv, leg.type)
        pnl += leg.qty * (price - leg.premium) * 100  // per contract = 100 shares
      }

      row.push(pnl)
      if (pnl < minPnL) minPnL = pnl
      if (pnl > maxPnL) maxPnL = pnl
    }

    pnlGrid.push(row)
  }

  // Breakevens at t=0 (the current time slice = first row)
  const currentBEs = findZeroCrossings(pnlGrid[0], spotAxis)

  return {
    pnlGrid,
    spotAxis,
    timeAxis,
    minPnL,
    maxPnL,
    maxDTE,
    sMin,
    sMax,
    breakevens: {
      lower: currentBEs[0] ?? null,
      upper: currentBEs[1] ?? null,
    },
  }
}

// ─── Single-point P&L evaluation ─────────────────────────────────────────────

/**
 * evaluatePnLAtSpot(legs, spot, opts?) → number
 *
 * Evaluates aggregate P&L for a leg set at a single (spot, dte) point.
 * O(legs) — no grid allocation, no nested loops.
 * Intended for market-tick callbacks where only a scalar value is needed.
 *
 * @param {Leg[]} legs
 * @param {number} spot   — underlying price
 * @param {{ dte?: number, iv?: number, r?: number }} [opts]
 * @returns {number}      — dollar P&L (per-contract basis, 100 multiplier)
 */
export function evaluatePnLAtSpot(legs, spot, opts = {}) {
  const { dte = 0, iv = DEFAULT_IV, r = 0.04 } = opts
  const T = dte / 365
  let pnl = 0
  for (const leg of legs) {
    const price = bsPrice(spot, leg.strike, T, r, iv, leg.type)
    pnl += leg.qty * (price - leg.premium) * 100
  }
  return pnl
}

// ─── Aggregated surface convenience ──────────────────────────────────────────

/**
 * computeAggregatedSurface(positions, opts) → SurfaceResult
 *
 * Convenience wrapper: flattens positions via getActiveLegSet, then calls
 * computeSurface. Use this when callers have position objects rather than
 * a pre-flattened leg array.
 *
 * @param {Array<{ id: string, legs: Leg[] }>} positions
 * @param {{ spot: number, iv?: number, r?: number, nx?: number, nt?: number }} opts
 * @returns {SurfaceResult}
 */
export function computeAggregatedSurface(positions, opts) {
  const allLegs = getActiveLegSet(positions)
  return computeSurface(allLegs, opts)
}

// ─── Leg aggregation ──────────────────────────────────────────────────────────

/**
 * getActiveLegSet(positions) → Leg[]
 *
 * Flattens multiple positions into a single leg array.
 * Preserves intentId on each leg for analytics.
 * Per MULTI-POSITION RENDERING doctrine: N positions = 1 leg set = 1 surface.
 *
 * @param {Array<{ id: string, legs: Leg[] }>} positions
 * @returns {Leg[]}
 */
export function getActiveLegSet(positions) {
  const allLegs = []
  for (const pos of positions) {
    for (const leg of pos.legs) {
      allLegs.push({ ...leg, intentId: pos.id })
    }
  }
  return allLegs
}

/**
 * buildLegSet(legs, dteValue) → Leg[]
 *
 * Filters to legs that haven't expired yet relative to dteValue.
 * Used by Delta when building ghosted vs solid geometry regions.
 *
 * @param {Leg[]} legs
 * @param {number} dteValue  — current DTE value (days)
 * @returns {Leg[]}
 */
export function buildLegSet(legs, dteValue) {
  return legs.filter(leg => leg.expiry >= dteValue)
}

// ─── Zero-crossing detection ──────────────────────────────────────────────────

/**
 * findZeroCrossings(pnlArray, spotAxis?) → number[]
 *
 * Returns the spot prices where P&L crosses zero.
 * Uses linear interpolation between adjacent sign-change points for precision.
 * Typically returns [lowerBE, upperBE] for standard spread structures.
 *
 * Per BREAKEVEN CURVE spec § 3 Computation.
 *
 * @param {number[]} pnlArray   — P&L values at each spot in the grid
 * @param {number[]} [spotAxis] — corresponding spot prices (omit → returns fractional indices)
 * @returns {number[]}
 */
export function findZeroCrossings(pnlArray, spotAxis = null) {
  const crossings = []

  for (let i = 0; i < pnlArray.length - 1; i++) {
    const a = pnlArray[i]
    const b = pnlArray[i + 1]

    // Skip if same sign or a is exactly zero (crossing is registered at next sign change)
    if (Math.sign(a) === Math.sign(b) || a === 0) continue

    // Linear interpolation for the exact zero crossing
    const t = Math.abs(a) / (Math.abs(a) + Math.abs(b))

    if (spotAxis) {
      const s1 = spotAxis[i]
      const s2 = spotAxis[i + 1]
      crossings.push(s1 + t * (s2 - s1))
    } else {
      crossings.push(i + t)
    }
  }

  return crossings
}

// ─── Expiry metadata helpers ──────────────────────────────────────────────────

/**
 * getExpiryBoundaries(legs) → { earliest: number, latest: number }
 *
 * Used by Delta to determine the solid/ghosted geometry split point on the Z axis.
 *
 * @param {Leg[]} legs
 * @returns {{ earliest: number, latest: number }}
 */
export function getExpiryBoundaries(legs) {
  const expiries = legs.map(l => l.expiry)
  return {
    earliest: Math.min(...expiries),
    latest:   Math.max(...expiries),
  }
}

// ─── Black-Scholes pricer (internal) ─────────────────────────────────────────
// Abramowitz & Stegun normCdf approximation — error < 7.5e-8.
// Not exported: pricing is an implementation detail of computeSurface.

function bsPrice(S, K, T, r, sigma, type) {
  if (T <= 0) {
    // At expiry: intrinsic value only
    return type === 'call'
      ? Math.max(0, S - K)
      : Math.max(0, K - S)
  }

  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT

  if (type === 'call') {
    return S * normCdf(d1) - K * Math.exp(-r * T) * normCdf(d2)
  } else {
    return K * Math.exp(-r * T) * normCdf(-d2) - S * normCdf(-d1)
  }
}

function normCdf(x) {
  // Abramowitz & Stegun §26.2.17 polynomial approximation
  const a = [0, 0.319381530, -0.356563782, 1.781477937, -1.821255978, 1.330274429]
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const poly = t * (a[1] + t * (a[2] + t * (a[3] + t * (a[4] + t * a[5]))))
  const pdf  = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
  const cdf  = 1 - pdf * poly
  return x >= 0 ? cdf : 1 - cdf
}

// ─── Schema adapters (IntentRegistry → Charlie) ───────────────────────────────

/**
 * calcDTE(expiration: string) → number
 * Converts YYYY-MM-DD expiration to days from today.
 * Returns 0 if expiry is today or in the past.
 */
export function calcDTE(expiration) {
  const now   = new Date()
  const exp   = new Date(expiration + 'T16:00:00') // 4pm ET expiry
  const msDay = 1000 * 60 * 60 * 24
  return Math.max(0, Math.round((exp - now) / msDay))
}

/**
 * adaptIntentLeg(leg, fallbackIV?) → Leg
 * Converts a PositionLeg (toRiskGraphStrategy schema) to Charlie's internal Leg format.
 * Uses leg-level IV if present, falls back to supplied default.
 */
export function adaptIntentLeg(leg, fallbackIV = 0.20) {
  return {
    strike:  leg.strike,
    type:    leg.right,                         // PositionLeg uses 'right', not 'option_type'
    expiry:  calcDTE(leg.expiration),
    qty:     leg.quantity,
    premium: leg.entry_price ?? 0,
    iv:      leg.implied_volatility ?? fallbackIV,
  }
}

/**
 * adaptIntent(intent) → position object for main.js state
 */
export function adaptIntent(intent) {
  return {
    id:   intent.id,
    name: intent.name ?? intent.id,
    legs: (intent.legs ?? []).map(l => adaptIntentLeg(l)),
  }
}

// ─── Fixture data ─────────────────────────────────────────────────────────────

/**
 * FIXTURES — import in Delta, Echo, Foxtrot for dev/test before live data wires in.
 */
export const FIXTURES = {
  // SPX iron condor: sell 6620/6665 put spread + sell 6765/6810 call spread
  ironCondor: {
    id: 'fixture-ic-001',
    legs: [
      { strike: 6665, expiry: 45, type: 'put',  qty: -1, premium: 8.50 },
      { strike: 6620, expiry: 45, type: 'put',  qty:  1, premium: 4.20 },
      { strike: 6765, expiry: 45, type: 'call', qty: -1, premium: 9.10 },
      { strike: 6810, expiry: 45, type: 'call', qty:  1, premium: 4.80 },
    ],
  },

  // SPX call spread (staggered expiry test)
  callSpread: {
    id: 'fixture-cs-001',
    legs: [
      { strike: 6850, expiry: 30, type: 'call', qty: -1, premium: 12.00 },
      { strike: 6900, expiry: 30, type: 'call', qty:  1, premium:  6.50 },
    ],
  },

  // Single long call (animation test)
  longCall: {
    id: 'fixture-lc-001',
    legs: [
      { strike: 6750, expiry: 21, type: 'call', qty: 1, premium: 18.50 },
    ],
  },
}
