/**
 * RiskGraph3DView — India implementation (v1.2 / India-B partial)
 *
 * Hotel scope preserved: §5.1 box, §5.2–5.3 axes, §5.4 zero P&L plane,
 *   §5.5 spot plane (Hotel-built, India tick-updated), §5.6 intersection line,
 *   §5.9.4 expiry marker.
 *
 * India-A (v1.0 + v1.1.1): §5.8 P&L surface + Phong mesh, §5.11 breakeven
 *   curve, §5.5 spot plane RT recolor, §5.13 live/static zone material,
 *   §5.14 adaptive resolution scaffolding + Spatial Priority Refresh Model,
 *   §4.2 ineligible overlays.
 *
 * India-B (v1.2 partial): §5.12 interrogation gesture (approach + contact +
 *   hold/pin stages), §5.12.6 slider fallback, §5.8.3/§10.2 dual color
 *   palettes, §10.4 keyboard accessibility, §12 instrumentation.
 *
 *   PARTIAL: Delta and Theta fields in the data card render as '--' because
 *   calculateStrategyGreeks is not yet exported from useRiskGraphCalculations.ts.
 *   Golf v1.4 must export it. See TODO(india-b-followup) comments.
 *
 * Pricing: buildPricingInputs + calculateTheoreticalPnL from useRiskGraphCalculations
 * (Golf extraction). Bit-identical to 2D Risk Graph at t_i=0 back face.
 *
 * Coordinate system (charlie.js):
 *   X = spot, Y = P&L, Z = DTE in scene space.
 *   nz(0) = -SCENE_Z (front/expiry), nz(maxDTE) = +SCENE_Z (back/today).
 *   Inverses: dx(x) = spot, dy(y) = pnl, dz(z) = DTE.
 */

import * as THREE from 'three'
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { createChart, CandlestickSeries, type IChartApi } from 'lightweight-charts'
import { usePriceTimeCandles } from '../../lib/usePriceTimeCandles'
import type { RegistryEntry } from '../../types/position-intent'
import type { ChainIVMap } from '../../lib/useChainIV'
import type { CanonicalStrikeMap } from '../../lib/snapToNearestStrike'
import { snapToNearestStrike } from '../../lib/snapToNearestStrike'
import type {
  MarketRegime,
  PricingModel,
  PricingInputs,
  Strategy,
} from '../../lib/useRiskGraphCalculations'
import {
  buildPricingInputs,
  calculateTheoreticalPnL,
  calculateStrategyTheoreticalValue,
} from '../../lib/useRiskGraphCalculations'
import { computePnlSurface, computePnlAtPrice, type RtLeg } from '../../lib/pricing/realtimeClient'
import {
  buildLegsAndCostBasis,
  buildMultiPositionSharedCurves,
  buildPerIntentLegsAndCostBasis,
  computeAutofitPriceRange,
  cardDebitsToCostBasisDollars,
  normalizePerShareDebit,
  chainStrikesForExpirations,
} from '../../lib/pricing/sharedRiskSurface'
import { pricingAsOfMs } from '../../lib/tradingSessions'
import { toRiskGraphStrategy } from '../../lib/intentAdapters'
import { initScene } from '../../../3d/alpha.js'
import { buildCoords } from '../../../3d/charlie.js'
import {
  buildReferenceBox,
  buildZeroPnLPlane,
  buildSpotPlane,
  syncExpiryMarker,
} from '../../../3d/echo.js'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import PnLChart from '../../ms-transplant/components/PnLChart'
import type { PnLPoint, BackdropRenderProps } from '../../ms-transplant/components/PnLChart'
import { PriceTimeChart } from './PriceTimeChart'

// ─── India-A constants ────────────────────────────────────────────────────────

/**
 * Soft DTE cap for the 3D mesh (front-leg horizon). Same residual pricing as 2D
 * works for any tenor; this only limits mesh density / empty-box cases.
 * Multi-expiry structures gate on **front** expiry, not the back leg.
 */
const MAX_DTE_DAYS               = 45
const SPOT_PAD_PCT               = 0.02
const LIVE_ZONE_DTE_HOURS        = 48
const RISK_FREE_RATE             = 0.05
const MIN_PRICING_DAYS           = 1 / 1440   // eslint-disable-line @typescript-eslint/no-unused-vars
/** Floor for the Z axis only — avoids divide-by-zero in nz(), not a display pad. */
const MIN_TIME_AXIS_DAYS         = 1 / 1440   // 1 minute
/**
 * Max empty Z on the today side of the box beyond the surface horizon (T_max).
 * Previously maxDTE was floored at 1 day, which left almost a full day of blank
 * in front of 0DTE / short-dated surfaces. Cap that leading blank at half a day.
 */
const MAX_LEADING_BLANK_DAYS     = 0.5

/** Intrinsic payoff at expiry (dollars, not per-share) for auto-fit break-even scan */
function intrinsicPayoff(legs: readonly RtLeg[], S: number): number {
  let total = 0
  for (const leg of legs) {
    const iv = leg.kind === 'C' ? Math.max(S - leg.strike, 0) : Math.max(leg.strike - S, 0)
    total += leg.qty * iv * 100
  }
  return total
}

const RESOLUTION_TIERS = [
  { name: 'Full',   nx: 120, nt: 80 },
  { name: 'High',   nx: 96,  nt: 64 },
  { name: 'Medium', nx: 72,  nt: 48 },
  { name: 'Low',    nx: 48,  nt: 32 },
] as const

type TierName = typeof RESOLUTION_TIERS[number]['name']   // eslint-disable-line @typescript-eslint/no-unused-vars

const PERIPHERY_SWEEP_COLUMNS_PER_TICK   = 8
const FOCUS_REGION_DOLLARS_HALFWIDTH_PCT = 0.005
const FOCUS_REGION_STRIKES_HALFWIDTH     = 3

// ─── India-B constants ────────────────────────────────────────────────────────

/** Screen-space distance (px) at which the approach stage guide line appears. */
const APPROACH_THRESHOLD = 30

/** Vertex sampling stride for approach-stage nearest-surface scan. */
const APPROACH_VERTEX_STEP = 8

/** Exponential lerp smoothing tau (ms) — governs approach/contact animation rate. */
const ANIM_TAU_GUIDE  = 50   // 150ms to reach ~95%
const ANIM_TAU_MARKER = 33   // 200ms spring-like feel

// ─── Color palettes (module-level — React memory safety rule 5) ──────────────

// Default palette
const COL_MAX_LOSS_DEF   = new THREE.Color(0x8B0000)  // deep red
const COL_ZERO_DEF       = new THREE.Color(0xFFFFFF)  // white
const COL_MAX_PROFIT_DEF = new THREE.Color(0x00FF00)  // bright green

// Color-blind alternative palette (§10.2)
// Purple/white/yellow — no conflict with curve identity colors (blue/magenta/golden).
const COL_MAX_LOSS_ALT   = new THREE.Color(0x6B21A8)  // deep purple
const COL_ZERO_ALT       = new THREE.Color(0xFFFFFF)  // white (same)
const COL_MAX_PROFIT_ALT = new THREE.Color(0xFACC15)  // bright yellow

// Curve identity colors — semantically constant across both palettes
const COL_BE_GREEN  = new THREE.Color(0.375, 0.75, 0.45) // breakeven — 25% darker
const COL_MAGENTA   = new THREE.Color(1.0, 0.08, 0.58) // magenta       — today payoff
const COL_CYAN      = new THREE.Color(0.0, 0.9, 1.0)   // cyan          — @expiry payoff

/** Scratch Color reused in hot paths — never allocate inline. */
const _colScratch  = new THREE.Color()
/** Scratch Vector3s for per-frame computations. */
const _v3S1        = new THREE.Vector3()
const _v3S2        = new THREE.Vector3()
/** Shared Raycaster — one per session, avoids per-frame allocations. */
const _raycaster   = new THREE.Raycaster()

// ─── Juliett-A: Camera layer constants (§6.1–6.8) ────────────────────────────

const DEG2RAD         = Math.PI / 180
const DEFAULT_CAM_R   = 8
const MIN_DIST        = 2.0
const MAX_DIST        = 25.0
const LOCK_RADIUS     = 1  * DEG2RAD           // within 1° = locked at detent
const CAM_FOV_PERSP   = 60                      // matches alpha.js CAMERA_FOV
const CAM_FOV_ORTHO   = 5                       // pseudo-orthographic endpoint
const SCROLL_DECAY    = 0.92                    // dolly momentum per frame
const BOUNCE_FACTOR   = -0.6                    // soft-bounce velocity reflection
const KB_JUMP_MS      = 400                     // keyboard detent jump duration
const REVERSAL_MS     = 600                     // Option+click reversal duration
const ORTHO_BLEND_MS  = 250                     // perspective↔ortho blend duration
const LOAD_ANIM_MS    = 400                     // first-render opacity reveal
// Gravity-well presets — { radius in radians, pull multiplier }
const WELL_PRESETS = {
  weak:   { radius: 10 * DEG2RAD, pull: 1.5 },
  normal: { radius: 14 * DEG2RAD, pull: 3.0 },
  strong: { radius: 18.75 * DEG2RAD, pull: 5.0 },
} as const
const ORBIT_SENS      = 0.006                   // radians per pixel (drag)

// ─── Chart / Risk mode thresholds (underbelly view) ──────────────────────────
// phi > UNDERBELLY_ENTER: camera crossed below the equator → Chart Mode.
// phi < UNDERBELLY_EXIT:  camera returned above the equator → Risk Mode.
// 0.05 rad (≈3°) hysteresis band prevents rapid toggling near phi = π/2.
const UNDERBELLY_ENTER = Math.PI / 2 + 0.05
const UNDERBELLY_EXIT  = Math.PI / 2 - 0.05

// ─── Juliett-A: Canonical detent definitions ─────────────────────────────────
//
// Spherical coordinate convention (theta measured from +Z axis):
//   x = R * sin(phi) * sin(theta)
//   y = R * cos(phi)
//   z = R * sin(phi) * cos(theta)
//
// This places:
//   theta=0,   phi=π/2  → camera at (0,0,R)    → looks in −Z → X-Y plane = RISK
//   theta=π/2, phi=π/2  → camera at (R,0,0)    → looks in −X → Y-Z plane = TIME
//   theta=π/2, phi=π/8  → camera near +Y (+X tilt) → top-down → X-Z plane = TOP
//   theta=π/4, phi=π/3  → ISO (home pose)
//
// TOP is at theta=π/2, phi=π/8 (≈22° from the north pole).
// Camera is nearly straight above. Looking down, time (Z) runs left-to-right
// (screen-right = −Z = expiry) and price (X) runs across the lower dimension.
// 67° from TIME — well outside the 18.75° gravity-well radius.

interface CamDetent {
  key:    'RISK' | 'TIME' | 'TOP' | 'ISO' | 'CHART'
  theta:  number
  phi:    number
  isWell: boolean   // false = home pose only, no attraction
}

// Module-level so React doesn't re-create each render
const DETENTS: CamDetent[] = [
  { key: 'RISK',  theta: 0,                        phi: Math.PI / 2,     isWell: true  },
  { key: 'TIME',  theta: 115 * Math.PI / 180,      phi: 90 * Math.PI / 180, isWell: true  },
  { key: 'TOP',   theta: Math.PI / 2,              phi: Math.PI / 8,     isWell: true  },  // near-top-down: 22° from north pole
  { key: 'ISO',   theta: Math.PI / 4,              phi: Math.PI / 3,     isWell: false },
  { key: 'RISK',  theta: Math.PI,                  phi: Math.PI / 2,     isWell: true  },  // RISK back — θ=π still in [0,π]
  // TIME mirror at θ=3π/2 is FORBIDDEN: time axis would run right-to-left.
  { key: 'CHART', theta: Math.PI / 2,              phi: 7 * Math.PI / 8, isWell: true  },  // below: mirrors TOP (22° from south pole)
]

// Convenience index for CHART detent (used by jump handler)
const CHART_DETENT_IDX = 5

// ─── Juliett-A: Module-level scratch objects (no hot-path allocations) ────────

const _camVec  = new THREE.Vector3()
const _camPan  = new THREE.Vector3()

// ─── Juliett-A: Camera math helpers ──────────────────────────────────────────

/**
 * Convert spherical (theta, phi, R) to a Cartesian Vector3, written into `out`.
 * Convention: x = R*sin(phi)*sin(theta), y = R*cos(phi), z = R*sin(phi)*cos(theta).
 */
function sphericalToVec3(theta: number, phi: number, R: number, out: THREE.Vector3): void {
  const sp = Math.sin(phi), cp = Math.cos(phi)
  const st = Math.sin(theta), ct = Math.cos(theta)
  out.set(R * sp * st, R * cp, R * sp * ct)
}

/** Angular distance (radians) between two unit-sphere points. */
function angularDist(t1: number, p1: number, t2: number, p2: number): number {
  const sp1 = Math.sin(p1), cp1 = Math.cos(p1)
  const sp2 = Math.sin(p2), cp2 = Math.cos(p2)
  const dot  = (sp1 * Math.sin(t1)) * (sp2 * Math.sin(t2))
             + cp1 * cp2
             + (sp1 * Math.cos(t1)) * (sp2 * Math.cos(t2))
  return Math.acos(Math.max(-1, Math.min(1, dot)))
}

/** Shortest signed angle delta from `current` to `target` on a circle (−π..π). */
function shortestDelta(current: number, target: number): number {
  return ((target - current + 3 * Math.PI) % (2 * Math.PI)) - Math.PI
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function lerpN(a: number, b: number, t: number): number { return a + (b - a) * t }

function remapClamped(v: number, lo: number, hi: number, outLo: number, outHi: number): number {
  return lerpN(outLo, outHi, Math.max(0, Math.min(1, (v - lo) / Math.max(hi - lo, 1e-9))))
}

// ─── Live/static zone shader (kept in file per spec §5.13) ───────────────────

const SURFACE_VERT = /* glsl */`
  attribute vec3 color;
  varying   vec3 vColor;
  varying   vec3 vNormal;
  varying   vec3 vViewPos;
  varying   float vLiveFactor;

  uniform float uLiveZoneZ;
  uniform float uRampZ;

  void main() {
    vColor    = color;
    vNormal   = normalize(normalMatrix * normal);
    vec4 mv   = modelViewMatrix * vec4(position, 1.0);
    vViewPos  = -mv.xyz;
    vLiveFactor = smoothstep(uLiveZoneZ - uRampZ, uLiveZoneZ + uRampZ, position.z);
    gl_Position = projectionMatrix * mv;
  }
`

const SURFACE_FRAG = /* glsl */`
  precision mediump float;
  varying vec3  vColor;
  varying vec3  vNormal;
  varying vec3  vViewPos;
  varying float vLiveFactor;

  uniform vec3  uLightDir;
  uniform float uSurfaceIntensity;  // 1.0 = full, 0.0 = dimmed by detent overlay

  void main() {

    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPos);
    vec3 L = uLightDir;

    float amb  = 0.50;
    float diff = max(dot(N, L), 0.0) * 0.70;

    float shin    = mix(16.0, 0.5, vLiveFactor);
    vec3  specCol = mix(vec3(1.0 / 17.0), vec3(0.0), vLiveFactor);
    vec3  R       = reflect(-L, N);
    float spec    = pow(max(dot(R, V), 0.0), shin);

    vec3 col   = mix(vColor, vColor * 0.85, vLiveFactor);
    vec3 final = col * (amb + diff) + specCol * spec;
    float alpha = mix(0.75, 0.55, vLiveFactor);

    gl_FragColor = vec4(final * uSurfaceIntensity, alpha);
  }
`

// ─── Types ────────────────────────────────────────────────────────────────────

interface IneligibleEntry {
  entry:  RegistryEntry
  reason: 'long_dte' | 'no_legs'
}

interface SurfaceData {
  pnlBuffer:    Float32Array   // flat [NT×NX], row-major, MUTABLE
  minPnL:       number
  maxPnL:       number
  sMin:         number
  sMax:         number
  T_max:        number
  spotSlices:   number[]
  timeSlices:   number[]
  NX:           number
  NT:           number
  spot:         number
  strategies:   Strategy[]
  pricingInputs: PricingInputs
  ineligible:   IneligibleEntry[]
  computeMs:    number
  marketRegime:        MarketRegime
  pricingModel:        PricingModel
  hestonVolOfVol:      number
  hestonMeanReversion: number
  hestonCorrelation:   number
  timeMachineEnabled:  boolean
  simVolatilityOffset: number
  simTimeOffsetHours:  number
  simSpotPct:          number
  /** Authority path inputs for live column recompute (same formula as 2D) */
  rtLegs:       RtLeg[]
  cbDollars:    number
  /** Pure intrinsic − cb (debit-pinned expiry face for cyan curve) */
  atExpirationPnl: number[]
}

interface DisposableObject {
  dispose: () => void
}

interface SurfaceMeshController extends DisposableObject {
  posArr:   Float32Array
  colorArr: Float32Array
  geo:      THREE.BufferGeometry
  mesh:     THREE.Mesh          // for raycasting
  setVisible(v: boolean): void  // hides mesh + edge wireframe together
}

// India-B handle types
interface GuideLineHandle extends DisposableObject {
  line: THREE.Line
  mat:  THREE.LineBasicMaterial
  updateEndpoints(contactPos: THREE.Vector3, y0: number): void
}

interface ContactMarkerHandle extends DisposableObject {
  mesh: THREE.Mesh
}

interface TimeCursorHandle extends DisposableObject {
  plane:    THREE.Mesh
  setTimeZ(z: number): void
}

// Data card state
// ─── Props ────────────────────────────────────────────────────────────────────

export type Rg3dDragMode = 'natural' | 'camera'
export type Rg3dScrollSensitivity = 'slow' | 'normal' | 'fast'
export type Rg3dWellStrength = 'weak' | 'normal' | 'strong'

const SCROLL_MULTIPLIERS: Record<Rg3dScrollSensitivity, number> = {
  slow:   0.01,
  normal: 0.025,
  fast:   0.07,
}

export interface RiskGraph3DViewProps {
  entries?:             RegistryEntry[]
  initialSpot?:         number
  vix?:                 number
  symbol?:              string
  chainIV?:             ChainIVMap | null
  chainIVError?:        string | null
  chainIVStale?:        boolean
  /** Per-position effective debit — single source of truth from the position
   *  card.  When provided, overrides intent.target_price as the cost basis
   *  for the surface compute, so locked edits, unlocks, and live-mid updates
   *  all redraw the surface in lockstep with the card. */
  cardDebits?:          Record<string, number>
  /** Per-leg mid price from chain — used for anchor offset computation. */
  getContractMid?:      (expiration: string, strike: number, type: 'call' | 'put') => number | null
  getSSEIV?:            (expiration: string, strike: number, type: 'call' | 'put') => number | null
  atmIvByDte?:          Record<string, number>
  canonicalStrikeMap?:  CanonicalStrikeMap
  /** Focus region mode. TODO:KILO wire from WorkspaceControls. */
  focusRegionMode?:     'strikes' | 'dollars'
  /**
   * Color-blind palette mode.
   * TODO:KILO wire from app preferences once a global color-blind mode setting
   * exists in MarketSwarm. No such preference exists yet (confirmed 2026-04-10).
   * Default false = standard red/green palette.
   */
  colorBlindMode?:      boolean
  marketRegime?:        MarketRegime
  pricingModel?:        PricingModel
  hestonVolOfVol?:      number
  hestonMeanReversion?: number
  hestonCorrelation?:   number
  timeMachineEnabled?:  boolean
  simVolatilityOffset?: number
  simTimeOffsetHours?:  number
  simSpotPct?:            number
  rg3dDragMode?:          Rg3dDragMode
  rg3dScrollSensitivity?: Rg3dScrollSensitivity
  rg3dWellStrength?:      Rg3dWellStrength
  // Volume Profile plane — back face, behind GEX
  vpEnabled?:             boolean
  // GEX overlay on the back face of the 3D box
  gexEnabled?:            boolean
  gexMode?:               'net' | 'combined' | 'abs'
  gexByStrike?:           Record<number, { calls: number; puts: number }> | null
  // Price chart floor — LWC candlestick on the bottom face, visible from below
  priceChartFloorEnabled?: boolean
  // Chart detent 2D overlay — mirrors the price-time surface wired at the CHART gravity well
  msEnabled?:         boolean
  chartTimeframe?:    import('./PriceTimeChart').ChartTimeframe
  chartSessionOnly?:  boolean
  chartSessionLines?: boolean
}

/**
 * JULIETT-A CONTRACT — consumed by Juliett-B each camera rAF frame.
 *
 * detentProximityRef.current is updated every frame by the Juliett-A camera rAF.
 *
 *   nearestDetent: which canonical pose the camera is closest to.
 *     'FREE' = outside all gravity-well radii AND not near ISO.
 *     'ISO'  = within 25° of the ISO home pose (ISO is not a well; no pull).
 *     'RISK'/'TIME'/'TOP' = within gravity-well radius OR locked.
 *
 *   strength: 0..1
 *     0 = camera is at or beyond WELL_RADIUS from the nearest detent.
 *     1 = camera is at or within LOCK_RADIUS (locked).
 *     For RISK/TIME/SIDE: strength = max(0, 1 - angularDist / WELL_RADIUS).
 *     For ISO: strength is always 0 (ISO is not a gravity well; it does not pull).
 *
 * Juliett-B uses strength to drive:
 *   - PnLChart DOM overlay opacity (at RISK detent)
 *   - 3D surface vertex color intensity dim (inverse of overlay opacity)
 */
export interface DetentProximity {
  nearestDetent: 'RISK' | 'TIME' | 'TOP' | 'ISO' | 'CHART' | 'FREE'
  strength:      number
}

// ─── ISO camera pose (§6.5.1) — Juliett replaces; keep for emergency fallback ─

function applyISOPose(camera: THREE.PerspectiveCamera): void {
  // Legacy: old formula. Juliett-A's camera rAF supersedes this.
  sphericalToVec3(Math.PI / 4, Math.PI / 3, DEFAULT_CAM_R, _camVec)
  camera.position.copy(_camVec)
  camera.lookAt(0, 0, 0)
}

// ─── Range derivation ─────────────────────────────────────────────────────────

interface ScaffoldRange {
  sMin: number; sMax: number
  pMin: number; pMax: number
  maxDTE: number
}

function deriveRange(
  entries:     RegistryEntry[],
  spot:        number,
  surfaceData: SurfaceData | null,
): ScaffoldRange {
  const sMin = surfaceData ? surfaceData.sMin : spot - spot * 0.35
  const sMax = surfaceData ? surfaceData.sMax : spot + spot * 0.35

  let pMin: number, pMax: number
  if (surfaceData && isFinite(surfaceData.minPnL) && isFinite(surfaceData.maxPnL)) {
    const lo = surfaceData.minPnL
    const hi = surfaceData.maxPnL
    const pad = Math.abs(hi - lo) * 0.1 || spot * 0.01
    pMin = lo - pad; pMax = hi + pad
  } else {
    pMin = -spot * 0.01; pMax = spot * 0.03
  }
  if (pMax <= pMin) { pMin = pMin - 1; pMax = pMin + 1 }

  // Time axis length: fit the surface horizon so the position fills the box.
  // Old code floored maxDTE at 1.0 day, which left up to ~1 day of empty Z on
  // the today side of short-dated / 0DTE surfaces (surface mapped with dte ≤ T_max
  // while the box ran to nz(1)). Leading blank must stay ≤ MAX_LEADING_BLANK_DAYS;
  // default is tight fit (blank = 0).
  let maxDTE: number
  if (surfaceData) {
    const t = Math.max(surfaceData.T_max, MIN_TIME_AXIS_DAYS)
    maxDTE = t  // tight fit — surface spans the full Z depth
  } else {
    maxDTE = 5
    const now = Date.now(), msDay = 86_400_000
    for (const e of entries) {
      for (const leg of e.intent.legs as any[]) {
        const exp = new Date(leg.expiration + 'T16:00:00').getTime()
        const dte = Math.max(0, (exp - now) / msDay)
        if (dte > maxDTE) maxDTE = dte
      }
    }
    maxDTE = Math.min(maxDTE, MAX_DTE_DAYS)
  }
  if (maxDTE < MIN_TIME_AXIS_DAYS) maxDTE = MIN_TIME_AXIS_DAYS
  return { sMin, sMax, pMin, pMax, maxDTE }
}

/**
 * Full chain strike ladder inside the visible price window.
 * Major axis labels are chosen from this ladder by even distribution in echo —
 * independent of any open/analysis position.
 */
function collectChainStrikesInWindow(
  sMin: number,
  sMax: number,
  strikeMap: CanonicalStrikeMap | null | undefined,
  preferExpirations?: readonly string[],
): number[] {
  const lo = Math.min(sMin, sMax)
  const hi = Math.max(sMin, sMax)
  const inRange = (s: number) =>
    Number.isFinite(s) && s >= lo - 1e-6 && s <= hi + 1e-6

  if (!strikeMap) return []

  // Prefer position expirations when present (denser / matching ladder),
  // otherwise union every expiration in the map — never depend on structure strikes.
  const preferred = preferExpirations && preferExpirations.length > 0
    ? chainStrikesForExpirations(strikeMap, preferExpirations).filter(inRange)
    : []
  if (preferred.length >= 2) return preferred

  const all = new Set<number>()
  for (const ladder of Object.values(strikeMap)) {
    if (!Array.isArray(ladder)) continue
    for (const s of ladder) {
      if (inRange(s)) all.add(s)
    }
  }
  return [...all].sort((a, b) => a - b)
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function getColorForPnL(
  pnl: number, minPnL: number, maxPnL: number, out: THREE.Color,
  altPalette = false,
): THREE.Color {
  const colLoss   = altPalette ? COL_MAX_LOSS_ALT   : COL_MAX_LOSS_DEF
  const colZero   = altPalette ? COL_ZERO_ALT        : COL_ZERO_DEF
  const colProfit = altPalette ? COL_MAX_PROFIT_ALT  : COL_MAX_PROFIT_DEF
  // Gradient: dark shade near $0 → bright at extremes
  if (pnl >= 0) {
    const t = maxPnL > 0 ? Math.min(1, pnl / maxPnL) : 0
    // dark green at $0 → bright green at max profit
    out.copy(colProfit).multiplyScalar(0.25 + 0.75 * Math.pow(t, 0.7))
  } else {
    const t = minPnL < 0 ? Math.min(1, pnl / minPnL) : 0
    // dark red at $0 → bright red at max loss
    out.copy(colLoss).multiplyScalar(0.25 + 0.75 * Math.pow(t, 0.7))
  }
  return out
}

/** Format P&L as "+$280" / "-$48.30". */
function formatPnL(pnl: number): string {
  const sign = pnl >= 0 ? '+' : '-'
  const abs  = Math.abs(pnl)
  return abs >= 1 ? `${sign}$${abs.toFixed(0)}` : `${sign}$${abs.toFixed(2)}`
}

/** Adaptive time-to-expiry label per §5.3.1. */
function formatTimeToExpiry(dteDays: number): string {
  if (dteDays <= 0)          return 'at expiry'
  if (dteDays < 1 / 1440)   return '< 1m to exp'
  if (dteDays < 1 / 24)     return `${Math.round(dteDays * 24 * 60)}m to exp`
  if (dteDays < 1)           return `${(dteDays * 24).toFixed(1)}h to exp`
  return `${dteDays.toFixed(2)}d to exp`
}

/**
 * Z-axis label formatter — produces human-readable weekday labels.
 * dte < 1  → 'Today'
 * dte >= 1 → weekday abbreviation of the target calendar date
 */
function formatZAxisLabel(dte: number, now: Date = new Date()): string {
  if (dte < 1) return 'Today'
  const target = new Date(now.getTime() + dte * 24 * 60 * 60 * 1000)
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return weekdays[target.getDay()]
}

// ─── Spatial Priority helpers ─────────────────────────────────────────────────

function findNearestCol(spotSlices: number[], price: number): number {
  let best = 0, bestDiff = Infinity
  for (let j = 0; j < spotSlices.length; j++) {
    const d = Math.abs(spotSlices[j] - price)
    if (d < bestDiff) { bestDiff = d; best = j }
  }
  return best
}

function recomputeColumnsInBuffer(
  data:        SurfaceData,
  coords:      any,
  colStart:    number,
  colEnd:      number,
  currentSpot: number,
  _freshInputs: PricingInputs,
  posArr:      Float32Array,
  colorArr:    Float32Array,
  altPalette = false,
): void {
  const { pnlBuffer, spotSlices, timeSlices, NX, NT, minPnL, maxPnL, rtLegs, cbDollars, simVolatilityOffset } = data
  const c = coords as any
  const volShift = (simVolatilityOffset ?? 0) / 100
  // Authority formula (same as 2D / computePnlSurface) — never calculateTheoreticalPnL.
  if (!rtLegs || rtLegs.length === 0) return
  for (let j = colStart; j < colEnd; j++) {
    if (j < 0 || j >= NX) continue
    const s_j = spotSlices[j]
    for (let i = 0; i < NT; i++) {
      const elapsedDays = timeSlices[i]
      const tShift = elapsedDays / 365
      const totalPnL = computePnlAtPrice(
        rtLegs, s_j, currentSpot, undefined, undefined, tShift, volShift, cbDollars,
      )
      const idx = i * NX + j
      pnlBuffer[idx] = totalPnL
      posArr[idx * 3 + 1] = c.ny(totalPnL)
      getColorForPnL(totalPnL, minPnL, maxPnL, _colScratch, altPalette)
      colorArr[idx * 3 + 0] = _colScratch.r
      colorArr[idx * 3 + 1] = _colScratch.g
      colorArr[idx * 3 + 2] = _colScratch.b
    }
  }
}

/**
 * Repaint all vertex colors from the existing pnlBuffer using the new palette.
 * Does NOT recompute P&L — only maps existing values through the new color ramp.
 * Called when the color-blind mode toggle fires (§10.2).
 */
function repaintPalette(
  data:       SurfaceData,
  meshCtrl:   SurfaceMeshController,
  altPalette: boolean,
): void {
  const { pnlBuffer, minPnL, maxPnL, NX, NT } = data
  const { colorArr, geo } = meshCtrl
  for (let idx = 0; idx < NT * NX; idx++) {
    getColorForPnL(pnlBuffer[idx], minPnL, maxPnL, _colScratch, altPalette)
    colorArr[idx * 3 + 0] = _colScratch.r
    colorArr[idx * 3 + 1] = _colScratch.g
    colorArr[idx * 3 + 2] = _colScratch.b
  }
  geo.attributes.color.needsUpdate = true
}

// ─── Surface mesh builder (§5.8.2 + §5.13) ───────────────────────────────────

function buildSurfaceMesh(
  data:      SurfaceData,
  coords:    ReturnType<typeof buildCoords>,
  scene:     THREE.Scene,
  altPalette = false,
): SurfaceMeshController {
  const { pnlBuffer, minPnL, maxPnL, spotSlices, timeSlices, NX, NT, T_max } = data
  const c = coords as any

  const nVerts    = NT * NX
  const positions = new Float32Array(nVerts * 3)
  const colors    = new Float32Array(nVerts * 3)
  const tmpColor  = new THREE.Color()

  for (let i = 0; i < NT; i++) {
    const dte = T_max - timeSlices[i]
    const z   = c.nz(dte)
    for (let j = 0; j < NX; j++) {
      const idx = i * NX + j
      positions[idx * 3 + 0] = c.nx(spotSlices[j])
      positions[idx * 3 + 1] = c.ny(pnlBuffer[idx])
      positions[idx * 3 + 2] = z
      getColorForPnL(pnlBuffer[idx], minPnL, maxPnL, tmpColor, altPalette)
      colors[idx * 3 + 0] = tmpColor.r
      colors[idx * 3 + 1] = tmpColor.g
      colors[idx * 3 + 2] = tmpColor.b
    }
  }

  const numQuads = (NT - 1) * (NX - 1)
  const indices  = new Uint32Array(numQuads * 6)
  let ii = 0
  for (let i = 0; i < NT - 1; i++) {
    for (let j = 0; j < NX - 1; j++) {
      const a  = i * NX + j,       b  = (i + 1) * NX + j
      const cc = i * NX + j + 1,   d  = (i + 1) * NX + j + 1
      indices[ii++] = a; indices[ii++] = b; indices[ii++] = cc
      indices[ii++] = b; indices[ii++] = d; indices[ii++] = cc
    }
  }

  const geo      = new THREE.BufferGeometry()
  const posAttr  = new THREE.BufferAttribute(positions, 3)
  const colAttr  = new THREE.BufferAttribute(colors, 3)
  geo.setAttribute('position', posAttr)
  geo.setAttribute('color',    colAttr)
  geo.setIndex(new THREE.BufferAttribute(indices, 1))
  geo.computeVertexNormals()

  const liveZoneDays = LIVE_ZONE_DTE_HOURS / 24
  const liveZoneZ    = c.nz(liveZoneDays) as number
  const rampDays     = 3 / 24
  const rampZ        = Math.abs((c.nz(liveZoneDays + rampDays) as number) - liveZoneZ)

  const mat = new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERT, fragmentShader: SURFACE_FRAG,
    transparent: true, side: THREE.DoubleSide, depthWrite: true,
    uniforms: {
      uLiveZoneZ:        { value: liveZoneZ },
      uRampZ:            { value: Math.max(rampZ, 0.01) },
      uLightDir:         { value: new THREE.Vector3(5, 8, 5).normalize() },
      uSurfaceIntensity: { value: 1.0 },
    },
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.renderOrder = 1
  mesh.castShadow = true
  // Custom depth material so the shadow map reads the same vertex positions
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
  })
  scene.add(mesh)

  const edgeGeo = new THREE.EdgesGeometry(geo, 15)
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.08 })
  const wireframe = new THREE.LineSegments(edgeGeo, edgeMat)
  wireframe.renderOrder = 1
  scene.add(wireframe)

  // Shadow-receiving floor plane at the bottom of the data range
  const xMin = c.nx(data.sMin) as number
  const xMax = c.nx(data.sMax) as number
  const zFront = c.nz(0) as number
  const zBack  = c.nz(data.T_max) as number
  const yFloor = c.ny(data.minPnL) as number - 0.05
  const floorW = xMax - xMin
  const floorD = Math.abs(zBack - zFront)
  const floorGeo = new THREE.PlaneGeometry(floorW * 1.2, floorD * 1.2)
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.35 })
  const floorMesh = new THREE.Mesh(floorGeo, floorMat)
  floorMesh.rotation.x = -Math.PI / 2
  floorMesh.position.set((xMin + xMax) / 2, yFloor, (zFront + zBack) / 2)
  floorMesh.receiveShadow = true
  floorMesh.renderOrder = 0
  scene.add(floorMesh)

  return {
    posArr: positions, colorArr: colors, geo, mesh,
    setVisible(v: boolean) { mesh.visible = v; wireframe.visible = v; floorMesh.visible = v },
    dispose() {
      scene.remove(mesh); scene.remove(wireframe); scene.remove(floorMesh)
      geo.dispose(); mat.dispose(); edgeGeo.dispose(); edgeMat.dispose()
      floorGeo.dispose(); floorMat.dispose()
    },
  }
}

// ─── Surface grid builder ─────────────────────────────────────────────────────

interface SurfaceGridController extends DisposableObject {
  setVisible(v: boolean): void
}

function buildSurfaceGrid(
  data:   SurfaceData,
  scene:  THREE.Scene,
  posArr: Float32Array,
): SurfaceGridController {
  const { timeSlices, NX, NT, T_max } = data
  const lines: THREE.Line[] = []

  function addLine(pts: THREE.Vector3[], color: number, opacity: number): void {
    if (pts.length < 2) return
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
    const ln  = new THREE.Line(geo, mat)
    ln.renderOrder = 2
    scene.add(ln)
    lines.push(ln)
  }

  function nearestRow(targetDTE: number): number {
    let best = 0, bestDist = Infinity
    for (let i = 0; i < NT; i++) {
      const dist = Math.abs((T_max - timeSlices[i]) - targetDTE)
      if (dist < bestDist) { best = i; bestDist = dist }
    }
    return best
  }

function dteLinePoints(i: number): THREE.Vector3[] {
    const pts: THREE.Vector3[] = []
    for (let j = 0; j < NX; j++) {
      const b = (i * NX + j) * 3
      pts.push(new THREE.Vector3(posArr[b], posArr[b + 1], posArr[b + 2]))
    }
    return pts
  }

  function strikeLinePoints(j: number): THREE.Vector3[] {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < NT; i++) {
      const b = (i * NX + j) * 3
      pts.push(new THREE.Vector3(posArr[b], posArr[b + 1], posArr[b + 2]))
    }
    return pts
  }

  // Major DTE lines — whole days
  const majorRows = new Set<number>()
  for (let d = 0; d <= Math.ceil(T_max); d++) {
    majorRows.add(nearestRow(d))
  }
  for (const row of majorRows) {
    addLine(dteLinePoints(row), 0xFFFFFF, 0.70)
  }

  // Minor DTE lines — hourly intervals, skip whole days
  const minorRows = new Set<number>()
  for (let h = 1; h <= Math.ceil(T_max * 24); h++) {
    if (h % 24 === 0) continue
    const row = nearestRow(h / 24)
    if (!majorRows.has(row)) minorRows.add(row)
  }
  for (const row of minorRows) {
    addLine(dteLinePoints(row), 0xFFFFFF, 0.25)
  }

  // Strike / price-direction lines — every other column (½ density).
  // Full NX spacing causes moiré against the dense surface mesh; halving
  // the line count reduces interference while keeping price structure readable.
  // Always include the last column so the far price edge stays outlined.
  const STRIKE_LINE_STEP = 2
  for (let j = 0; j < NX; j += STRIKE_LINE_STEP) {
    addLine(strikeLinePoints(j), 0xFFFFFF, 0.60)
  }
  if (NX > 1 && (NX - 1) % STRIKE_LINE_STEP !== 0) {
    addLine(strikeLinePoints(NX - 1), 0xFFFFFF, 0.60)
  }

  return {
    setVisible(v: boolean) { for (const ln of lines) ln.visible = v },
    dispose() {
      for (const ln of lines) {
        scene.remove(ln)
        ln.geometry.dispose();
        (ln.material as THREE.Material).dispose()
      }
      lines.length = 0
    },
  }
}

// ─── Volume Profile plane (back face, behind GEX) ────────────────────────────

interface VpProfile { min: number; step: number; bins: number[] }
interface VpPlaneController extends DisposableObject {}

function buildVpPlane(
  coords:  ReturnType<typeof buildCoords>,
  scene:   THREE.Scene,
  profile: VpProfile,
): VpPlaneController {
  const c = coords as any
  const { sMin, sMax, pMin, pMax } = c.range

  const zExpiry = c.nz(0) as number   // back wall = nz(0) = -SCENE_Z
  const xL = c.nx(sMin) as number
  const xR = c.nx(sMax) as number
  const yB = c.ny(pMin) as number
  const yT = c.ny(pMax) as number

  // 2D DataTexture: U = strike price, V = normalised height (0=bottom, 1=top).
  // Each column is colored up to vol height and transparent above it —
  // producing proper histogram bars that grow from the bottom of the back face.
  const TEX_W = 512
  const TEX_H = 256
  const texData = new Uint8Array(TEX_W * TEX_H * 4)  // RGBA

  const { min: vpMin, step: vpStep, bins } = profile

  // First pass: find max bin in visible range so tallest bar = full height
  let visibleMax = 1
  for (let i = 0; i < TEX_W; i++) {
    const u   = i / (TEX_W - 1)
    const idx = Math.floor((sMin + u * (sMax - sMin) - vpMin) / vpStep)
    if (idx >= 0 && idx < bins.length && bins[idx] > visibleMax) visibleMax = bins[idx]
  }

  for (let i = 0; i < TEX_W; i++) {
    const u     = i / (TEX_W - 1)
    const price = sMin + u * (sMax - sMin)
    const idx   = Math.floor((price - vpMin) / vpStep)
    const vol   = (idx >= 0 && idx < bins.length) ? bins[idx] / visibleMax : 0

    for (let j = 0; j < TEX_H; j++) {
      const v   = j / (TEX_H - 1)   // 0 = bottom row, 1 = top row
      const ptr = (j * TEX_W + i) * 4

      if (v > vol) {
        texData[ptr] = texData[ptr + 1] = texData[ptr + 2] = texData[ptr + 3] = 0
      } else {
        texData[ptr]     = 0x77   // R
        texData[ptr + 1] = 0x99   // G
        texData[ptr + 2] = 0xFF   // B
        texData[ptr + 3] = 180
      }
    }
  }

  const tex = new THREE.DataTexture(texData, TEX_W, TEX_H, THREE.RGBAFormat)
  tex.needsUpdate = true

  const geo  = new THREE.PlaneGeometry(Math.abs(xR - xL), Math.abs(yT - yB))
  const mat  = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geo, mat)
  // zExpiry + 0.06: in front of GEX bars (which sit at zExpiry + barDepth/2 = +0.04).
  // depthTest:false so surface depth writes don't occlude it.
  // renderOrder=4: in front of GEX (renderOrder=3).
  mesh.position.set((xL + xR) / 2, (yB + yT) / 2, zExpiry + 0.06)
  mesh.renderOrder = 4
  scene.add(mesh)

  return {
    dispose() {
      scene.remove(mesh)
      geo.dispose(); mat.dispose(); tex.dispose()
    },
  }
}

// ─── Price chart floor (bottom face of box, visible from below) ──────────────
//
// The floor plane lies in the XZ scene plane (Y = ny(pMin)), normal facing -Y
// (visible from below with FrontSide). The canvas texture is a 90° CW rotated
// version of the LWC chart so that:
//   U axis (scene X) = strike/price axis  (sMin → sMax)
//   V axis (scene Z) = time axis          (expiry → today)
// texture.flipY = false because after rotation the canvas top = expiry (V=0
// in UV space should map to the expiry face, not the today face).

interface PriceChartFloorController extends DisposableObject {
  markNeedsUpdate(): void
}

function buildPriceChartFloor(
  coords:       ReturnType<typeof buildCoords>,
  scene:        THREE.Scene,
  textureCanvas: HTMLCanvasElement,
): PriceChartFloorController {
  const c = coords as any
  const { sMin, sMax, pMin, maxDTE } = c.range

  const xL     = c.nx(sMin)    as number
  const xR     = c.nx(sMax)    as number
  const zExpiry = c.nz(0)      as number   // -SCENE_Z
  const zToday  = c.nz(maxDTE) as number   // +SCENE_Z
  const yFloor  = c.ny(pMin)   as number   // -SCENE_Y

  const width = Math.abs(xR - xL)
  const depth = Math.abs(zToday - zExpiry)

  const geo = new THREE.PlaneGeometry(width, depth)
  // rotateX(+π/2): normal becomes -Y → front face visible from below
  geo.rotateX(Math.PI / 2)

  const texture = new THREE.CanvasTexture(textureCanvas)
  // flipY=false: V=0 = canvas top row = expiry face; V=1 = canvas bottom = today
  texture.flipY = false

  const mat = new THREE.MeshBasicMaterial({
    map:         texture,
    side:        THREE.FrontSide,  // only visible from below (normal = -Y)
    transparent: true,
    opacity:     0.92,
    depthTest:   false,
    depthWrite:  false,
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(
    (xL + xR) / 2,
    yFloor - 0.02,           // just below box floor to avoid z-fighting
    (zExpiry + zToday) / 2,
  )
  mesh.renderOrder = 5       // always in front when viewed from below

  scene.add(mesh)

  return {
    markNeedsUpdate() { texture.needsUpdate = true },
    dispose() {
      scene.remove(mesh)
      geo.dispose()
      mat.dispose()
      texture.dispose()
    },
  }
}

// ─── Breakeven curve builder (§5.11) ─────────────────────────────────────────

interface BEController extends DisposableObject {
  readonly lowerAtCurrentTime: number
  readonly upperAtCurrentTime: number
}

/**
 * Zero-crossings of a single time-row (linear interpolate between grid cells).
 * Skips vanishingly small crossings (both samples near 0) — those are flat
 * near-zero wings / float noise, not real breakeven edges.
 */
function findRowZeroCrossings(
  pnlBuffer: Float32Array,
  row: number,
  NX: number,
  spotSlices: number[],
  minAbsSep = 1e-6,
): number[] {
  const crossings: number[] = []
  const base = row * NX
  for (let j = 0; j < NX - 1; j++) {
    const p0 = pnlBuffer[base + j]
    const p1 = pnlBuffer[base + j + 1]
    if (!isFinite(p0) || !isFinite(p1)) continue
    // True sign change only (p0 * p1 < 0). Exact zeros handled once.
    if (p0 === 0) {
      crossings.push(spotSlices[j])
      continue
    }
    if (p0 * p1 >= 0) continue
    // Reject noise: both samples essentially zero (flat wing floating around $0)
    if (Math.abs(p0) < minAbsSep && Math.abs(p1) < minAbsSep) continue
    const t = p0 / (p0 - p1)
    if (t < 0 || t > 1) continue
    crossings.push(spotSlices[j] + t * (spotSlices[j + 1] - spotSlices[j]))
  }
  return crossings
}

/**
 * Trace one breakeven branch (lower or upper) across time with continuity.
 *
 * Independent per-row mid-split + a single polyline was producing diagonal
 * "spur" segments: when a row missed a crossing or a spurious wing zero
 * appeared far from the structure, the next accepted point was still
 * connected — drawing a line that is not a real P&L=0 contour.
 *
 * Rules:
 *  1. Prefer the crossing nearest the previous accepted spot (temporal track).
 *  2. Fall back to mid-split (max below mid / min above mid) when starting.
 *  3. If the jump exceeds maxJump, start a new polyline segment (no spur).
 */
function traceBreakevenBranch(
  samples: { spot: number; z: number; row: number }[],
  maxJump: number,
  yAbove: number,
  nx: (s: number) => number,
): THREE.Vector3[][] {
  const segments: THREE.Vector3[][] = []
  let cur: THREE.Vector3[] = []
  let prevSpot = NaN

  for (const s of samples) {
    if (!isFinite(s.spot)) {
      if (cur.length >= 2) segments.push(cur)
      cur = []
      prevSpot = NaN
      continue
    }
    if (isFinite(prevSpot) && Math.abs(s.spot - prevSpot) > maxJump) {
      if (cur.length >= 2) segments.push(cur)
      cur = []
    }
    cur.push(new THREE.Vector3(nx(s.spot), yAbove, s.z))
    prevSpot = s.spot
  }
  if (cur.length >= 2) segments.push(cur)
  return segments
}

function buildBreakevenCurve(
  data: SurfaceData, coords: ReturnType<typeof buildCoords>, scene: THREE.Scene,
): BEController {
  const { pnlBuffer, spotSlices, timeSlices, NX, NT, T_max, spot, strategies } = data
  const c = coords as any

  // Offset above ny(0) so the line sits on top of the surface from above
  const yAbove = (c.ny(0) as number) + 0.06

  const allOptStrikes = strategies.flatMap((s: any) =>
    s.legs?.map((l: any) => l.strike).filter((v: any) => isFinite(v)) ?? []
  ) as number[]
  const strikeLo = allOptStrikes.length > 0 ? Math.min(...allOptStrikes) : spot
  const strikeHi = allOptStrikes.length > 0 ? Math.max(...allOptStrikes) : spot
  const beStrikeMid = (strikeLo + strikeHi) / 2
  // Max allowed Δspot between adjacent time rows for one continuous branch.
  // Wider than the structure → false wing zeros / missed rows cannot bridge
  // with a diagonal chord across the profit tent (the "triangle spur" artifact).
  const structureWidth = Math.max(strikeHi - strikeLo, 1)
  const priceSpan = Math.max(spotSlices[spotSlices.length - 1] - spotSlices[0], 1)
  const maxJump = Math.max(structureWidth * 0.85, priceSpan * 0.06, 25)

  // Noise floor: ~0.1% of a typical debit wing, in dollars of package PnL
  const minAbsSep = Math.max(1e-4, Math.abs(data.cbDollars ?? 0) * 1e-4)

  type Sample = { spot: number; z: number; row: number }
  const lowerSamples: Sample[] = []
  const upperSamples: Sample[] = []
  let lowerAtCurrent = NaN
  let upperAtCurrent = NaN
  let prevLower = NaN
  let prevUpper = NaN

  for (let i = 0; i < NT; i++) {
    const dte = T_max - timeSlices[i]
    const z   = c.nz(dte) as number
    const crossings = findRowZeroCrossings(pnlBuffer, i, NX, spotSlices, minAbsSep)

    // Seed / track each branch by nearest-neighbour continuity, then mid-split.
    let lBE = NaN
    let uBE = NaN

    if (crossings.length === 0) {
      // gap — continuity break handled by NaN samples
    } else if (crossings.length === 1) {
      // Single zero: assign to the nearer existing branch, else mid-split side
      const s0 = crossings[0]
      if (isFinite(prevLower) || isFinite(prevUpper)) {
        const dL = isFinite(prevLower) ? Math.abs(s0 - prevLower) : Infinity
        const dU = isFinite(prevUpper) ? Math.abs(s0 - prevUpper) : Infinity
        if (dL <= dU) lBE = s0
        else uBE = s0
      } else {
        if (s0 < beStrikeMid) lBE = s0
        else uBE = s0
      }
    } else {
      // ≥2 crossings: pick lower = max below mid, upper = min above mid,
      // then snap to nearest previous branch if that is closer (stability).
      const below = crossings.filter(s => s < beStrikeMid)
      const above = crossings.filter(s => s >= beStrikeMid)
      lBE = below.length > 0 ? Math.max(...below) : NaN
      uBE = above.length > 0 ? Math.min(...above) : NaN

      // If mid-split put both on one side, fall back to extremes of the set
      if (!isFinite(lBE) && !isFinite(uBE)) {
        lBE = Math.min(...crossings)
        uBE = Math.max(...crossings)
      } else if (!isFinite(lBE) && crossings.length >= 2) {
        // all above mid — still keep the leftmost as lower track candidate
        const sorted = [...crossings].sort((a, b) => a - b)
        lBE = sorted[0]
        uBE = sorted[sorted.length - 1] === sorted[0] ? NaN : sorted[sorted.length - 1]
        if (lBE === uBE) lBE = NaN
      } else if (!isFinite(uBE) && crossings.length >= 2) {
        const sorted = [...crossings].sort((a, b) => a - b)
        lBE = sorted[0]
        uBE = sorted[sorted.length - 1]
        if (lBE === uBE) uBE = NaN
      }

      // Temporal snap: if previous lower is much closer to a different crossing, use it
      if (isFinite(prevLower) && crossings.length > 0) {
        let best = lBE, bestD = isFinite(lBE) ? Math.abs(lBE - prevLower) : Infinity
        for (const s of crossings) {
          const d = Math.abs(s - prevLower)
          // do not steal the upper branch's natural candidate
          if (isFinite(uBE) && Math.abs(s - uBE) < Math.abs(s - prevLower) * 0.5) continue
          if (d < bestD) { bestD = d; best = s }
        }
        if (isFinite(best) && bestD <= maxJump) lBE = best
      }
      if (isFinite(prevUpper) && crossings.length > 0) {
        let best = uBE, bestD = isFinite(uBE) ? Math.abs(uBE - prevUpper) : Infinity
        for (const s of crossings) {
          const d = Math.abs(s - prevUpper)
          if (isFinite(lBE) && Math.abs(s - lBE) < 1e-9) continue
          if (d < bestD) { bestD = d; best = s }
        }
        if (isFinite(best) && bestD <= maxJump) uBE = best
      }

      // Enforce lower < upper when both present
      if (isFinite(lBE) && isFinite(uBE) && lBE > uBE) {
        const tmp = lBE; lBE = uBE; uBE = tmp
      }
    }

    lowerSamples.push({ spot: lBE, z, row: i })
    upperSamples.push({ spot: uBE, z, row: i })
    if (isFinite(lBE)) prevLower = lBE
    if (isFinite(uBE)) prevUpper = uBE

    // Labels: today face is time row 0 (elapsed = 0), not expiry (NT-1)
    if (i === 0) {
      lowerAtCurrent = lBE
      upperAtCurrent = uBE
    }
  }

  const lowerSegs = traceBreakevenBranch(lowerSamples, maxJump, yAbove, (s) => c.nx(s) as number)
  const upperSegs = traceBreakevenBranch(upperSamples, maxJump, yAbove, (s) => c.nx(s) as number)

  // §5.8.5 — LineMaterial for thick, platform-independent breakeven line width
  const beRes  = new THREE.Vector2(
    typeof window !== 'undefined' ? window.innerWidth  : 800,
    typeof window !== 'undefined' ? window.innerHeight : 600,
  )
  const beMat = new LineMaterial({
    color:     COL_BE_GREEN.getHex(),
    linewidth: 4,
    depthTest: true,
    resolution: beRes,
  })
  const lines: Line2[] = []
  function addLine(pts: THREE.Vector3[]) {
    if (pts.length < 2) return
    const flat: number[] = []
    for (const p of pts) flat.push(p.x, p.y, p.z)
    const geo = new LineGeometry()
    geo.setPositions(flat)
    const line = new Line2(geo, beMat)
    line.computeLineDistances()
    line.renderOrder = 3
    scene.add(line)
    lines.push(line)
  }
  for (const seg of lowerSegs) addLine(seg)
  for (const seg of upperSegs) addLine(seg)

  const sprites: THREE.Sprite[] = []
  const labelZ = c.nz(T_max) as number
  const labelY = (c.ny(0) as number) + 0.35

  function makeBeSprite(text: string, x: number) {
    const canvas = document.createElement('canvas')
    canvas.width = 320; canvas.height = 56
    const ctx = canvas.getContext('2d')!
    ctx.font = '18px "Courier New", monospace'
    ctx.fillStyle = 'rgba(0,255,56,1.0)'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(text, 160, 28)
    const tex  = new THREE.CanvasTexture(canvas)
    const smat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
    const spr  = new THREE.Sprite(smat)
    spr.scale.set(1.6, 0.35, 1)
    spr.position.set(x, labelY, labelZ)
    spr.renderOrder = 5; scene.add(spr); sprites.push(spr)
  }
  if (isFinite(lowerAtCurrent)) makeBeSprite(`Lower BE: $${lowerAtCurrent.toFixed(0)}`, c.nx(lowerAtCurrent))
  if (isFinite(upperAtCurrent)) makeBeSprite(`Upper BE: $${upperAtCurrent.toFixed(0)}`, c.nx(upperAtCurrent))

  return {
    lowerAtCurrentTime: lowerAtCurrent,
    upperAtCurrentTime: upperAtCurrent,
    dispose() {
      for (const l of lines) { scene.remove(l); (l.geometry as LineGeometry).dispose() }
      beMat.dispose()
      for (const s of sprites) {
        scene.remove(s)
        ;(s.material as THREE.SpriteMaterial).map?.dispose()
        s.material.dispose()
      }
    },
  }
}

// ─── Today payoff curve (magenta, §5.8.4 parity) ─────────────────────────────
// Mirrors the magenta T=0 curve visible in the 2D RISK view.  Drawn at
// timeSlices[0] = 0 elapsed (today face, z = nz(T_max) = +SCENE_Z).

// Controller returned by buildTodayPayoffCurve — exposes geo+line for slice updates.
interface TodayPayoffCtrl {
  geo:  LineGeometry
  line: Line2
  dispose(): void
}

function buildTodayPayoffCurve(
  data: SurfaceData, coords: ReturnType<typeof buildCoords>, scene: THREE.Scene,
): TodayPayoffCtrl {
  const { pnlBuffer, spotSlices, NX, T_max } = data
  const c = coords as any
  const z = c.nz(T_max) as number  // today face (initial position — updated by sliceIndex effect)

  const flat: number[] = []
  for (let j = 0; j < NX; j++) {
    const pnl = pnlBuffer[j] ?? 0  // row i=0 (today, 0 elapsed)
    flat.push(c.nx(spotSlices[j]), c.ny(pnl), z)
  }

  const res = new THREE.Vector2(
    typeof window !== 'undefined' ? window.innerWidth  : 800,
    typeof window !== 'undefined' ? window.innerHeight : 600,
  )
  const mat = new LineMaterial({
    color:     COL_MAGENTA.getHex(),
    linewidth: 3,
    depthTest: false,
    resolution: res,
  })
  const geo = new LineGeometry()
  if (flat.length >= 6) geo.setPositions(flat)
  const line = new Line2(geo, mat)
  line.computeLineDistances()
  line.renderOrder = 3
  scene.add(line)

  return {
    geo,
    line,
    dispose() {
      scene.remove(line)
      geo.dispose()
      mat.dispose()
    },
  }
}

// ─── @Expiry payoff curve (cyan) ─────────────────────────────────────────────
// Mirrors the cyan @expiration PnL line from the 2D RISK view.  Drawn at the
// expiry face: timeSlices[NT-1] = T_max elapsed → dte = 0 → z = nz(0) = -SCENE_Z.

function buildExpiryPayoffCurve(
  data: SurfaceData, coords: ReturnType<typeof buildCoords>, scene: THREE.Scene,
): DisposableObject {
  const { spotSlices, NX, NT, atExpirationPnl, pnlBuffer } = data
  if (NT === 0 || NX === 0) return { dispose() {} }
  const c   = coords as any
  const z   = c.nz(0) as number   // DTE = 0 → expiry face
  // Debit-pinned: pure intrinsic − card cost basis (not last time-row + anchor)
  const exp = atExpirationPnl && atExpirationPnl.length === NX
    ? atExpirationPnl
    : null
  const row = (NT - 1) * NX

  const flat: number[] = []
  for (let j = 0; j < NX; j++) {
    const pnl = exp ? (exp[j] ?? 0) : (pnlBuffer[row + j] ?? 0)
    flat.push(c.nx(spotSlices[j]), c.ny(pnl), z)
  }
  if (flat.length < 6) return { dispose() {} }

  const res = new THREE.Vector2(
    typeof window !== 'undefined' ? window.innerWidth  : 800,
    typeof window !== 'undefined' ? window.innerHeight : 600,
  )
  const mat = new LineMaterial({
    color:     COL_CYAN.getHex(),
    linewidth: 3,
    depthTest: false,
    resolution: res,
  })
  const geo = new LineGeometry()
  geo.setPositions(flat)
  const line = new Line2(geo, mat)
  line.computeLineDistances()
  line.renderOrder = 3
  scene.add(line)

  return {
    dispose() {
      scene.remove(line)
      geo.dispose()
      mat.dispose()
    },
  }
}

// ─── Juliett-B: Strike markers (§5.8.6) ──────────────────────────────────────

interface StrikeMarkersController extends DisposableObject {}

function buildStrikeMarkers(
  strikes:  number[],
  coords:   ReturnType<typeof buildCoords>,
  scene:    THREE.Scene,
  renderer: THREE.WebGLRenderer,
): StrikeMarkersController {
  if (strikes.length === 0) return { dispose() {} }

  const c   = coords as any
  const ex  = c.extents as { x: number; y: number; z: number }
  const y0  = c.ny(0)   as number
  const yLo = y0 - ex.y * 0.05
  const yHi = y0 + ex.y * 0.05
  const zFront = c.nz(0)        as number
  const zBack  = c.nz(c.range.maxDTE ?? 5) as number
  const size  = renderer.getSize(new THREE.Vector2())
  const mat   = new LineMaterial({
    color:     0xfbbf24,   // amber — matches PnLChart spec §5.8.4
    linewidth: 2,
    depthTest: false,
    transparent: true,
    opacity:   0.65,
    resolution: new THREE.Vector2(size.x || 800, size.y || 600),
  })

  const objects: THREE.Object3D[] = []
  const geos: LineGeometry[] = []
  const sprites: THREE.Sprite[] = []
  const labelY = y0 - ex.y * 0.08

  for (const strike of strikes) {
    const x = c.nx(strike) as number

    // Vertical tick running in Z at strike x, spanning y0 ± small height (front face)
    const geo = new LineGeometry()
    geo.setPositions([x, yLo, zFront, x, yHi, zFront])
    const line = new Line2(geo, mat)
    line.computeLineDistances()
    line.renderOrder = 4
    scene.add(line)
    objects.push(line)
    geos.push(geo)

    // Horizontal guide running Z from front to back at x, y0
    const geoH = new LineGeometry()
    geoH.setPositions([x, y0, zFront, x, y0, zBack])
    const lineH = new Line2(geoH, mat)
    lineH.computeLineDistances()
    lineH.renderOrder = 4
    scene.add(lineH)
    objects.push(lineH)
    geos.push(geoH)

    // Sprite label
    const canvas = document.createElement('canvas')
    canvas.width = 256; canvas.height = 48
    const ctx2d = canvas.getContext('2d')!
    ctx2d.font = '16px "Courier New", monospace'
    ctx2d.fillStyle = '#fbbf24'
    ctx2d.textAlign = 'center'; ctx2d.textBaseline = 'middle'
    ctx2d.fillText(String(strike), 128, 24)
    const tex  = new THREE.CanvasTexture(canvas)
    const smat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: 0.8 })
    const spr  = new THREE.Sprite(smat)
    spr.scale.set(1.2, 0.3, 1)
    spr.position.set(x, labelY, zFront)
    spr.renderOrder = 5
    scene.add(spr)
    sprites.push(spr)
  }

  return {
    dispose() {
      for (const obj of objects) scene.remove(obj)
      for (const geo of geos)    geo.dispose()
      mat.dispose()
      for (const spr of sprites) {
        scene.remove(spr)
        ;(spr.material as THREE.SpriteMaterial).map?.dispose()
        spr.material.dispose()
      }
    },
  }
}

// ─── Ineligible overlay (§4.2) ────────────────────────────────────────────────

function buildIneligibleOverlay(
  ineligible: IneligibleEntry[], eligible: number, container: HTMLElement,
): DisposableObject {
  // Topology is never a reason to refuse — calendars/diagonals use the same
  // residual front-expiry surface as 2D. Only long-DTE / empty books remain.
  if (ineligible.length === 0) return { dispose() {} }
  const hasLDT = ineligible.some(e => e.reason === 'long_dte')
  if (!hasLDT && eligible > 0) return { dispose() {} }
  container.style.position = 'relative'
  if (eligible === 0) {
    const el = document.createElement('div')
    Object.assign(el.style, {
      position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
      background:'rgba(0,0,0,0.75)',color:'#fff',padding:'16px 24px',
      borderRadius:'8px',fontSize:'14px',lineHeight:'1.6',
      pointerEvents:'none',zIndex:'10',textAlign:'center',
    })
    el.innerHTML = hasLDT
      ? `3D view supports front expirations up to ${MAX_DTE_DAYS} DTE.<br>Use the 2D Risk Graph for longer-dated positions.`
      : 'No eligible positions to render in 3D.'
    container.appendChild(el)
    return { dispose() { if (el.parentNode) el.parentNode.removeChild(el) } }
  }
  const el = document.createElement('div')
  Object.assign(el.style, {
    position:'absolute',top:'8px',left:'50%',transform:'translateX(-50%)',
    background:'rgba(0,0,0,0.65)',color:'rgba(255,255,255,0.75)',
    padding:'4px 12px',borderRadius:'4px',
    fontSize:'12px',pointerEvents:'none',zIndex:'10',
  })
  el.textContent = `${ineligible.length} position${ineligible.length > 1 ? 's' : ''} excluded (>${MAX_DTE_DAYS} DTE)`
  container.appendChild(el)
  return { dispose() { if (el.parentNode) el.parentNode.removeChild(el) } }
}

// ─── Intersection line (§5.6) ─────────────────────────────────────────────────

interface IntersectionLineController extends DisposableObject {
  update: (spotX: number) => void
}

function buildIntersectionLine(
  coords: any, scene: THREE.Scene, spotX: number,
): IntersectionLineController {
  const { nz, ny, range } = coords
  const y0 = ny(0), z0 = nz(0), zMax = nz(range.maxDTE)
  const pts = [new THREE.Vector3(spotX, y0, z0), new THREE.Vector3(spotX, y0, zMax)]
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.60, depthTest: false })
  const line = new THREE.Line(geo, mat)
  line.renderOrder = 4; scene.add(line)
  return {
    update(x: number) {
      const pos = line.geometry.attributes.position as THREE.BufferAttribute
      pos.setX(0, x); pos.setX(1, x); pos.needsUpdate = true
    },
    dispose() { scene.remove(line); geo.dispose(); mat.dispose() },
  }
}

// ─── India-B: Guide line (§5.12.2) ───────────────────────────────────────────

function buildGuideLine(scene: THREE.Scene): GuideLineHandle {
  const pts = [new THREE.Vector3(), new THREE.Vector3()]
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = new THREE.LineBasicMaterial({
    color: 0xFFFFFF, transparent: true, opacity: 0, depthTest: false,
  })
  const line = new THREE.Line(geo, mat)
  line.renderOrder = 6
  line.visible = false
  scene.add(line)
  return {
    line, mat,
    updateEndpoints(contactPos: THREE.Vector3, y0: number) {
      const attr = line.geometry.attributes.position as THREE.BufferAttribute
      attr.setXYZ(0, contactPos.x, contactPos.y, contactPos.z)
      attr.setXYZ(1, contactPos.x, y0, contactPos.z)
      attr.needsUpdate = true
    },
    dispose() { scene.remove(line); geo.dispose(); mat.dispose() },
  }
}

// ─── India-B: Contact marker sphere (§5.12.2) ────────────────────────────────

function buildContactMarker(scene: THREE.Scene): ContactMarkerHandle {
  const geo  = new THREE.SphereGeometry(0.08, 8, 6)
  const mat  = new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.scale.setScalar(0)
  mesh.visible = false
  mesh.renderOrder = 7
  scene.add(mesh)
  return {
    mesh,
    dispose() { scene.remove(mesh); geo.dispose(); mat.dispose() },
  }
}

// ─── India-B: Time cursor plane (§5.12.6) ────────────────────────────────────

function buildTimeCursorPlane(scene: THREE.Scene, coords: any): TimeCursorHandle {
  const ex  = coords.extents as { x: number; y: number; z: number }
  // PlaneGeometry lies in XY plane (Z-normal) by default.
  // Setting plane.position.z moves it along Z while spanning X and Y. Perfect.
  const geo = new THREE.PlaneGeometry((ex.x + 1) * 2, (ex.y + 1) * 2)
  const mat = new THREE.MeshBasicMaterial({
    color: 0x6496FF, transparent: true, opacity: 0.2, side: THREE.DoubleSide,
  })
  const plane = new THREE.Mesh(geo, mat)
  plane.position.z = coords.nz(0)
  plane.renderOrder = 2
  plane.visible = false
  scene.add(plane)
  return {
    plane,
    setTimeZ(z: number) { plane.position.z = z },
    dispose() { scene.remove(plane); geo.dispose(); mat.dispose() },
  }
}

// ─── India-B: Pure helpers ────────────────────────────────────────────────────

/** Convert Three.js faceIndex to surface grid (i,j) using the quad layout from buildSurfaceMesh. */
function faceIndexToGrid(faceIndex: number, NX: number): { gridI: number; gridJ: number } {
  const quadIndex = Math.floor(faceIndex / 2)
  return {
    gridI: Math.floor(quadIndex / (NX - 1)),
    gridJ: quadIndex % (NX - 1),
  }
}

/**
 * Find the nearest surface vertex in screen space and return its distance (px)
 * and world position. Samples every APPROACH_VERTEX_STEP vertices to stay cheap.
 */
function getNearestSurfaceInfo(
  posArr:    Float32Array,
  nVerts:    number,
  camera:    THREE.Camera,
  canvasW:   number,
  canvasH:   number,
  mouseX:    number,
  mouseY:    number,
): { dist: number; worldX: number; worldY: number; worldZ: number } {
  let minDist  = Infinity
  let bestX = 0, bestY = 0, bestZ = 0
  for (let idx = 0; idx < nVerts; idx += APPROACH_VERTEX_STEP) {
    _v3S1.set(posArr[idx * 3], posArr[idx * 3 + 1], posArr[idx * 3 + 2])
    _v3S1.project(camera)
    const sx = (_v3S1.x + 1) * canvasW * 0.5
    const sy = (-_v3S1.y + 1) * canvasH * 0.5
    const d  = Math.hypot(sx - mouseX, sy - mouseY)
    if (d < minDist) {
      minDist = d
      bestX = posArr[idx * 3]; bestY = posArr[idx * 3 + 1]; bestZ = posArr[idx * 3 + 2]
    }
  }
  return { dist: minDist, worldX: bestX, worldY: bestY, worldZ: bestZ }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RiskGraph3DView({
  entries              = [],
  initialSpot,
  vix,
  chainIV,
  cardDebits,
  getContractMid,
  getSSEIV,
  atmIvByDte,
  canonicalStrikeMap,
  focusRegionMode      = 'strikes',
  colorBlindMode       = false,
  marketRegime         = 'normal',
  pricingModel         = 'black-scholes',
  hestonVolOfVol       = 0.4,
  hestonMeanReversion  = 2.0,
  hestonCorrelation    = -0.7,
  timeMachineEnabled   = false,
  simVolatilityOffset  = 0,
  simTimeOffsetHours   = 0,
  simSpotPct              = 0,
  rg3dDragMode            = 'natural',
  rg3dScrollSensitivity   = 'normal' as Rg3dScrollSensitivity,
  rg3dWellStrength        = 'normal' as Rg3dWellStrength,
  vpEnabled               = false,
  gexEnabled              = false,
  gexMode                 = 'net' as 'net' | 'combined' | 'abs',
  gexByStrike,
  priceChartFloorEnabled  = false,
  msEnabled               = false,
  chartTimeframe          = '5m' as import('./PriceTimeChart').ChartTimeframe,
  chartSessionOnly        = true,
  chartSessionLines       = false,
  symbol,
  chainIVError:   _chainIVError,
  chainIVStale,
}: RiskGraph3DViewProps) {

  const containerRef = useRef<HTMLDivElement>(null)
  const sceneCtxRef  = useRef<ReturnType<typeof initScene> | null>(null)
  const coordsRef    = useRef<any>(null)

  // Spot ref — always current, prevents initialSpot from becoming a useMemo dep
  const spotRef = useRef<number>(initialSpot && initialSpot > 0 ? initialSpot : 5900)
  spotRef.current = initialSpot && initialSpot > 0 ? initialSpot : 5900

  // Alt palette ref — always current, read in per-tick effect
  const altPaletteRef = useRef(colorBlindMode)
  altPaletteRef.current = colorBlindMode

  // Drag mode ref — always current, read in camera drag handler
  const rg3dDragModeRef = useRef(rg3dDragMode)
  rg3dDragModeRef.current = rg3dDragMode

  // Scroll sensitivity ref — always current, read in wheel handler
  const rg3dScrollSensitivityRef = useRef(rg3dScrollSensitivity)
  rg3dScrollSensitivityRef.current = rg3dScrollSensitivity

  // Well strength ref — always current, read in rAF loop
  const wellPresetRef = useRef(WELL_PRESETS[rg3dWellStrength])
  wellPresetRef.current = WELL_PRESETS[rg3dWellStrength]

  // ── Hotel scene objects ───────────────────────────────────────────────────
  const referenceBoxRef = useRef<any>(null)
  const zeroPnLRef      = useRef<any>(null)
  const spotPlaneRef    = useRef<any>(null)
  const intersectionRef = useRef<IntersectionLineController | null>(null)
  const expiryMarkerRef = useRef<any>(null)

  // ── India-A scene objects ─────────────────────────────────────────────────
  const [vpArtifactProfile, setVpArtifactProfile] = useState<VpProfile | null>(null)
  const vpPlaneRef        = useRef<VpPlaneController | null>(null)
  const surfaceMeshRef    = useRef<SurfaceMeshController | null>(null)
  const surfaceGridRef    = useRef<SurfaceGridController | null>(null)
  const beLineRef         = useRef<BEController | null>(null)
  const todayPayoffRef    = useRef<TodayPayoffCtrl | null>(null)
  const expiryPayoffRef   = useRef<DisposableObject | null>(null)
  const overlayRef        = useRef<DisposableObject | null>(null)

  // ── Juliett-B scene objects ───────────────────────────────────────────────
  const strikeMarkersRef  = useRef<StrikeMarkersController | null>(null)

  // ── GEX overlay (back face) ───────────────────────────────────────────────
  const gexBarsRef        = useRef<THREE.Group | null>(null)

  // ── Price chart floor (bottom face, visible from below) ───────────────────
  const lwcFloorContainerRef   = useRef<HTMLDivElement | null>(null)
  const floorLwcChartRef       = useRef<IChartApi | null>(null)
  const floorSeriesRef         = useRef<any>(null)
  const priceChartFloorRef     = useRef<PriceChartFloorController | null>(null)
  // Offscreen canvas used as Three.js texture source (90° CW rotated LWC canvas)
  const floorTextureCanvasRef  = useRef<HTMLCanvasElement | null>(null)
  // Lazy-create the texture canvas once (no DOM lifecycle needed)
  if (!floorTextureCanvasRef.current) {
    const c = document.createElement('canvas')
    c.width  = 512   // LWC height → rotated width
    c.height = 1024  // LWC width  → rotated height
    floorTextureCanvasRef.current = c
  }

  // ── Juliett-B: DOM overlay container refs (direct style mutation avoids rAF re-renders)
  const riskOverlayRef    = useRef<HTMLDivElement>(null)
  const chartOverlayRef   = useRef<HTMLDivElement>(null)
  const camInfoRef        = useRef<HTMLDivElement>(null)
  // Chart/Risk mode — underbelly detection
  const isUnderbellyRef   = useRef(false)
  const viewModeLabelRef  = useRef<HTMLDivElement | null>(null)

  // ── India-B scene objects ─────────────────────────────────────────────────
  const guideLineRef      = useRef<GuideLineHandle | null>(null)
  const contactMarkerRef  = useRef<ContactMarkerHandle | null>(null)
  const timeCursorRef     = useRef<TimeCursorHandle | null>(null)

  // ── Price chart floor — candle data (4h, 90 days covers any realistic DTE) ──
  const { candles: floorCandles } = usePriceTimeCandles(symbol ?? 'SPX', 90, '4h')

  // ── Adaptive resolution ───────────────────────────────────────────────────
  const [tierIndex, setTierIndex] = useState(0)
  const adaptRef    = useRef({ slowStreak: 0, fastStreak: 0 })
  const frameTimeRef = useRef(0)
  const surfaceDataRef = useRef<SurfaceData | null>(null)

  // ── Spatial priority refresh ──────────────────────────────────────────────
  // Latest freshInputs from the per-tick spatial priority effect — used by the
  // interrogation rAF loop and pin handlers to compute Greeks at the contact point.
  const freshPricingInputsRef = useRef<PricingInputs | null>(null)

  const sweepPtrRef           = useRef<number>(0)
  const lastFocusCenterColRef = useRef<number>(-1)
  const prevFocusModeRef      = useRef<'strikes' | 'dollars'>(focusRegionMode)
  const focusDwellIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── India-B: interrogation animation state (hot-path, no re-render) ───────
  const mouseNDCRef    = useRef({ x: 0, y: 0 })
  const mouseScreenRef = useRef({ x: 0, y: 0 })
  const interrogRef    = useRef({
    stage:      'none' as 'none' | 'approach' | 'contact',
    guideOp:    0,     // current guide line opacity
    markerSc:   0,     // current marker sphere scale
    lastGridI:  -1,
    lastGridJ:  -1,
    isDragging: false,
    greekPlaceholderLoggedRef: false,
    _lastNow:   0,     // timestamp of previous interrogFrame call (for dt calculation)
  })

  // ── Sanity check: once only ───────────────────────────────────────────────
  const sanityDoneRef = useRef(false)

  // ── Carousel pan (strike view offset) ────────────────────────────────────
  // Shifts the coord system X axis so the box can be scrolled through the full
  // historical dataset ($3481–$6989 SPX). Ctrl+drag horizontal or horizontal
  // trackpad scroll drives this. Double-click resets to 0.
  const [strikeViewOffset, setStrikeViewOffset] = useState(0)
  const strikeViewOffsetRef = useRef(0)

  // ── Juliett-A: Camera state refs ──────────────────────────────────────────
  // camRef: live (theta, phi, R). All camera interaction mutates only this.
  const camRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, R: DEFAULT_CAM_R })
  // Pan offset (world-space shift of the lookAt target)
  const panOffsetRef = useRef(new THREE.Vector3(0, 0, 0))

  // Keyboard-jump animation (§6.5.3)
  const kbAnimRef = useRef<{
    active:     boolean
    startTheta: number; deltaTh: number
    startPhi:   number; deltaPh: number
    startT:     number; durMs:   number
  } | null>(null)

  // Option+click reversal animation (§6.7)
  const reversalAnimRef = useRef<{
    active:      boolean
    startTheta:  number
    deltaTheta:  number
    startT:      number
  } | null>(null)

  // Camera drag (orbit / pan / carousel)
  const camDragRef = useRef<{
    active:      boolean
    isPan:       boolean
    isCarousel:  boolean
    startX:      number; startY:     number
    startTheta:  number; startPhi:   number
    panStartX:   number; panStartY:  number
  } | null>(null)

  // Touch state for two-finger gestures
  const touchRef = useRef<{
    count:       number
    prevDist:    number   // for pinch
    prevMidX:    number; prevMidY: number
    lastTap:     number   // for double-tap detection
  }>({ count: 0, prevDist: 0, prevMidX: 0, prevMidY: 0, lastTap: 0 })

  // Dolly scroll momentum
  const scrollVelRef = useRef(0)

  // Perspective↔ortho blend (0=perspective, 1=pseudo-ortho), animated
  const orthoBlendRef = useRef(0)

  // Detent proximity — Juliett-B reads this ref (see DetentProximity JsDoc above)
  const detentProximityRef = useRef<DetentProximity>({ nearestDetent: 'FREE', strength: 0 })

  // Camera projection mode — auto-driven by RISK detent lock, overrideable
  // via the upper-right toggle button.  prevWantOrthoRef gates the auto
  // logic so it only fires on lock-state transitions, not every frame.
  const [cameraMode, setCameraMode] = useState<'perspective' | 'orthographic'>('perspective')
  const prevWantOrthoRef = useRef<boolean>(false)

  // First-render load animation state
  const loadAnimRef = useRef({ opacity: 0, done: false })

  // Reduce Motion preference (updated by matchMedia listener below)
  const reduceMotionRef = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  // Detent indicator React state (drives the DOM overlay in JSX)
  const [indicatorDetent, setIndicatorDetent] =
    useState<'RISK' | 'TIME' | 'TOP' | 'ISO' | 'CHART' | 'FREE'>('FREE')
  // Tracks previous indicator value inside rAF to rate-limit setIndicatorDetent
  const indicatorDetentRef = useRef<'RISK' | 'TIME' | 'TOP' | 'ISO' | 'CHART' | 'FREE'>('FREE')

  // Axis label sprite buckets (populated after each scene rebuild; used for label fading)
  const axisSpritesRef = useRef<{ x: THREE.Sprite[]; y: THREE.Sprite[]; z: THREE.Sprite[] }>(
    { x: [], y: [], z: [] },
  )

  // ── Frame-time measurement ─────────────────────────────────────────────────
  useEffect(() => {
    let rafId: number, last = 0
    function tick(now: number) {
      if (last > 0) frameTimeRef.current = now - last
      last  = now
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // ── Juliett-A: Reduce Motion subscription ─────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceMotionRef.current = mq.matches
    function onChange(e: MediaQueryListEvent) { reduceMotionRef.current = e.matches }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // ── Juliett-A: Camera rAF loop ─────────────────────────────────────────────
  // Runs every frame. Updates spherical camera state, applies gravity-well
  // attraction, manages animations, drives perspective↔ortho blend, load anim,
  // label fading, plane opacity, and exports detentProximity for Juliett-B.
  useEffect(() => {
    let rafId: number
    let lastNow = 0

    function camFrame(now: number): void {
      rafId = requestAnimationFrame(camFrame)

      const ctx = sceneCtxRef.current
      if (!ctx) { lastNow = now; return }

      const dt = Math.min(now - (lastNow || now - 16), 32) / 1000  // seconds, clamped
      lastNow  = now
      const reduceMotion = reduceMotionRef.current
      const cam = camRef.current

      // ── 1. Load animation (first render, opacity 0→1, §7.1 v1.1.2) ────────
      const canvas = ctx.renderer.domElement
      if (!loadAnimRef.current.done) {
        const la = loadAnimRef.current as any
        if (!la._startTime) la._startTime = now
        const elapsed = now - la._startTime
        if (reduceMotion) {
          canvas.style.opacity = '1'
          loadAnimRef.current.done = true
        } else {
          const t = Math.min(elapsed / LOAD_ANIM_MS, 1)
          canvas.style.opacity = String(easeOutCubic(t))
          if (t >= 1) loadAnimRef.current.done = true
        }
      }

      // ── 2. Keyboard-jump animation ─────────────────────────────────────────
      const kbAnim = kbAnimRef.current
      let inAnimation = false
      if (kbAnim?.active) {
        inAnimation = true
        const elapsed = now - kbAnim.startT
        const raw = Math.min(elapsed / kbAnim.durMs, 1)
        const t   = reduceMotion ? 1 : easeInOutCubic(raw)
        cam.theta = kbAnim.startTheta + kbAnim.deltaTh * t
        cam.phi   = kbAnim.startPhi   + kbAnim.deltaPh * t
        if (raw >= 1) { kbAnim.active = false; inAnimation = false }
      }

      // ── 3. Option+click reversal animation ────────────────────────────────
      const revAnim = reversalAnimRef.current
      if (revAnim?.active) {
        inAnimation = true
        const elapsed = now - revAnim.startT
        const raw = Math.min(elapsed / REVERSAL_MS, 1)
        const t   = reduceMotion ? 1 : easeInOutCubic(raw)
        // Clamp to [−π/3, π]: allows ISO-Left (−π/4) while blocking TIME-mirror (−π/2)
        cam.theta = Math.max(-Math.PI / 3, Math.min(Math.PI, revAnim.startTheta + revAnim.deltaTheta * t))
        if (raw >= 1) { revAnim.active = false; inAnimation = false }
      }

      // ── 4. Dolly momentum ─────────────────────────────────────────────────
      // Suppressed during keyboard/reversal animations; user drag suppresses too.
      const camDrag = camDragRef.current
      const isDragging = camDrag?.active ?? false
      if (!isDragging && !inAnimation && Math.abs(scrollVelRef.current) > 0.001) {
        if (reduceMotion) {
          scrollVelRef.current = 0
        } else {
          cam.R += scrollVelRef.current
          scrollVelRef.current *= SCROLL_DECAY
          // Soft bounce
          if (cam.R < MIN_DIST) {
            scrollVelRef.current *= BOUNCE_FACTOR
            cam.R = MIN_DIST
          } else if (cam.R > MAX_DIST) {
            scrollVelRef.current *= BOUNCE_FACTOR
            cam.R = MAX_DIST
          }
        }
      }

      // ── 5. Gravity-well attraction (§6.4.1, v1.1.2) ──────────────────────
      // Suspended while user is actively dragging or animating.
      if (!isDragging && !inAnimation) {
        let nearestWell: CamDetent | null = null
        let nearestDist = Infinity
        for (const d of DETENTS) {
          if (!d.isWell) continue
          const dist = angularDist(cam.theta, cam.phi, d.theta, d.phi)
          if (dist < nearestDist) { nearestDist = dist; nearestWell = d }
        }
        const wp = wellPresetRef.current
        if (nearestWell !== null && nearestDist < wp.radius) {
          if (nearestDist < LOCK_RADIUS || reduceMotion) {
            // Locked (or instant-snap for Reduce Motion)
            cam.theta = nearestWell.theta
            cam.phi   = nearestWell.phi
          } else {
            // Smooth attraction with quadratic falloff
            const strength   = (1 - nearestDist / wp.radius) ** 2
            const pullFactor = Math.min(strength * wp.pull * dt, 0.5)
            cam.theta += shortestDelta(cam.theta, nearestWell.theta) * pullFactor
            cam.phi   += (nearestWell.phi - cam.phi) * pullFactor
          }
        }
      }

      // Clamp phi away from poles to avoid gimbal lock during drag
      cam.phi = Math.max(0.01, Math.min(Math.PI - 0.01, cam.phi))

      // ── 6. Compute detent proximity (exported for Juliett-B) ──────────────
      const wp2 = wellPresetRef.current
      let nearestKey:  'RISK' | 'TIME' | 'TOP' | 'ISO' | 'CHART' | 'FREE' = 'FREE'
      let nearestDist2 = Infinity
      let bestStrength = 0

      for (const d of DETENTS) {
        const dist = angularDist(cam.theta, cam.phi, d.theta, d.phi)
        if (dist < nearestDist2) {
          nearestDist2 = dist
          nearestKey   = d.key
          bestStrength = d.isWell
            ? Math.max(0, 1 - dist / wp2.radius)
            : 0
        }
      }
      // Highlight ISO in indicator if within well-radius even though it has no pull
      if (nearestKey === 'ISO' && nearestDist2 > wp2.radius) nearestKey = 'FREE'

      detentProximityRef.current = { nearestDetent: nearestKey, strength: bestStrength }

      // Update detent indicator (rate-limited: only on change)
      const prevIndicator = indicatorDetentRef.current
      if (prevIndicator !== nearestKey) {
        indicatorDetentRef.current = nearestKey
        setIndicatorDetent(nearestKey)
      }

      // ── 7. Perspective↔ortho blend (§6.4.2) ──────────────────────────────
      // Blend toward strength for RISK/TIME/SIDE wells; 0 otherwise.
      const targetBlend = (nearestKey !== 'FREE' && nearestKey !== 'ISO') ? bestStrength : 0
      if (reduceMotion) {
        orthoBlendRef.current = targetBlend
      } else {
        orthoBlendRef.current += (targetBlend - orthoBlendRef.current)
          * (1 - Math.exp(-dt * 1000 / ORTHO_BLEND_MS))
      }

      // ── 8. Compute visual R (scales with FOV for pseudo-ortho) ────────────
      const blend        = orthoBlendRef.current
      const fov          = lerpN(CAM_FOV_PERSP, CAM_FOV_ORTHO, blend)
      const tanHalfBase  = Math.tan(CAM_FOV_PERSP * DEG2RAD / 2)
      const tanHalfCurr  = Math.tan(fov * DEG2RAD / 2)
      const rVisual      = cam.R * (tanHalfBase / tanHalfCurr)

      // ── 9. Apply to Three.js camera ───────────────────────────────────────
      const camera = ctx.camera as THREE.PerspectiveCamera
      camera.fov  = fov
      camera.far  = Math.max(100, rVisual + 50)
      camera.updateProjectionMatrix()
      sphericalToVec3(cam.theta, cam.phi, rVisual, _camVec)
      _camVec.add(panOffsetRef.current)
      camera.position.copy(_camVec)
      camera.lookAt(panOffsetRef.current)

      // ── 10. Label fading (§6.4.3) ─────────────────────────────────────────
      const sprites = axisSpritesRef.current
      const detentKey = nearestKey
      const locked = bestStrength >= (LOCK_RADIUS / wp2.radius)
      const fadedOp = remapClamped(bestStrength, 0.4, 1.0, 1.0, 0.3)

      function setAxisOpacity(arr: THREE.Sprite[], op: number) {
        for (const sp of arr) {
          (sp.material as THREE.SpriteMaterial).opacity = op
        }
      }
      const xOp = (locked && detentKey === 'TIME') ? fadedOp : 1
      const yOp = (locked && detentKey === 'TOP') ? fadedOp : 1
      const zOp = (locked && detentKey === 'RISK') ? fadedOp : 1
      if (sprites.x.length > 0) setAxisOpacity(sprites.x, xOp)
      if (sprites.y.length > 0) setAxisOpacity(sprites.y, yOp)
      if (sprites.z.length > 0) setAxisOpacity(sprites.z, zOp)

      // ── 11. Plane opacity fade (§5.7) ─────────────────────────────────────
      // As camera drifts away from RISK detent, zero P&L plane fades slightly.
      const distFromRisk = angularDist(cam.theta, cam.phi, DETENTS[0].theta, DETENTS[0].phi)
      const planeOp = remapClamped(distFromRisk, 0, wp2.radius * 2, 1.0, 0.7)
      const zeroPnL = zeroPnLRef.current as any
      if (zeroPnL?.mesh?.material) {
        zeroPnL.mesh.material.opacity = 0.18 * planeOp
      }

      // ── 12. Juliett-B: DOM overlay opacity + surface intensity dimming ─────
      // RISK detent NO LONGER swaps to the 2D PnLChart overlay — the 3D Surface
      // stays visible at all camera angles, including the RISK detent.
      const dpNow = detentProximityRef.current
      const riskStrength = 0
      const chartStrength = dpNow.nearestDetent === 'CHART' ? dpNow.strength : 0
      if (riskOverlayRef.current)  riskOverlayRef.current.style.opacity  = String(riskStrength)
      if (chartOverlayRef.current) chartOverlayRef.current.style.opacity = String(chartStrength)

      // ── Camera projection swap ───────────────────────────────────────────
      // Auto-switch fires ONLY on lock-state transitions so the manual toggle
      // button can override between detent moves.  Locking onto RISK → ortho;
      // unlocking from RISK or moving to another detent → perspective.
      const wantOrtho = (detentKey === 'RISK') && locked
      if (wantOrtho !== prevWantOrthoRef.current) {
        prevWantOrthoRef.current = wantOrtho
        const ctxNow = sceneCtxRef.current
        if (ctxNow && (ctxNow as any).setCameraMode) {
          const mode = wantOrtho ? 'orthographic' : 'perspective';
          (ctxNow as any).setCameraMode(mode)
          setCameraMode(mode)
        }
      }

      // Camera info panel — direct DOM write, zero React overhead
      if (camInfoRef.current) {
        const tDeg = ((cam.theta * 180) / Math.PI).toFixed(1)
        const pDeg = ((cam.phi   * 180) / Math.PI).toFixed(1)
        const r    = cam.R.toFixed(2)
        camInfoRef.current.textContent = `θ ${tDeg}°  φ ${pDeg}°  R ${r}`
      }

      // ── 13. Chart / Risk mode — flip surface P&L axis when below equator ──
      // Entering underbelly view (phi > π/2) switches to Chart Mode:
      // surface mesh Y scale inverts so profit peaks hang down as stalactites
      // toward the below-camera viewer. Hysteresis band (±0.05 rad) prevents
      // toggling near phi = π/2.
      {
        const wasUnderbelly = isUnderbellyRef.current
        const nowUnderbelly = wasUnderbelly
          ? cam.phi > UNDERBELLY_EXIT    // stay Chart Mode until well above equator
          : cam.phi > UNDERBELLY_ENTER   // enter Chart Mode when phi dips below equator
        if (nowUnderbelly !== wasUnderbelly) {
          isUnderbellyRef.current = nowUnderbelly
          const smCtrl = surfaceMeshRef.current
          if (smCtrl) {
            smCtrl.mesh.scale.y = nowUnderbelly ? -1 : 1
            // FrontSide + scale.y controls which hemisphere sees the surface.
            // Grid lines have no back-face culling — hide explicitly when the
            // surface is on the opposite side of the camera.
            smCtrl.setVisible(true)   // mesh always visible; FrontSide handles culling
          }
          surfaceGridRef.current?.setVisible(!nowUnderbelly)   // grid only in Risk Mode
          if (viewModeLabelRef.current) {
            viewModeLabelRef.current.textContent = nowUnderbelly ? 'CHART' : 'RISK'
            viewModeLabelRef.current.style.color = nowUnderbelly
              ? 'rgba(255,200,100,0.65)'   // amber tint in Chart Mode
              : 'rgba(255,255,255,0.35)'   // subtle in Risk Mode
          }
        }
      }

      const surfaceIntensity = 1 - riskStrength
      const smCtrl = surfaceMeshRef.current
      if (smCtrl) {
        const mat = smCtrl.mesh.material as THREE.ShaderMaterial
        mat.uniforms.uSurfaceIntensity.value = surfaceIntensity
      }
    }

    // Initialise canvas opacity to 0 so load animation starts from invisible
    const canvas = sceneCtxRef.current?.renderer.domElement
    if (canvas) canvas.style.opacity = '0'

    rafId = requestAnimationFrame(camFrame)
    return () => cancelAnimationFrame(rafId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Surface compute (structural deps only) ─────────────────────────────────
  // When serverSurface is available, we use the server's PnL buffer directly —
  // same pricing engine as the 2D chart.  Falls back to client-side BSM only
  // Pure client-side surface computation — same BSM + chain IV + dividend yield +
  // anchor offset as the 2D chart.  No server round-trip.  Computed synchronously
  // in the useMemo so the surface is available the instant the component renders.

  const surfaceData = useMemo((): SurfaceData | null => {
    const spot = spotRef.current
    if (!spot || spot <= 0) return null

    const now = Date.now(), msDay = 86_400_000
    const analysisEntries = entries.filter(e => e.status === 'ANALYSIS' && e.visible)
    const eligible: RegistryEntry[] = []
    const ineligible: IneligibleEntry[] = []

    // Admit ALL topologies (including calendar/diagonal). Pricing uses the same
    // buildLegsAndCostBasis + computePnlSurface residual path as 2D — multi-exp
    // horizon is front expiry with residual BS on longer legs.
    for (const entry of analysisEntries) {
      const legs = entry.intent.legs as readonly { expiration?: string }[] | undefined
      if (!legs || legs.length === 0) {
        ineligible.push({ entry, reason: 'no_legs' }); continue
      }
      // Front DTE = earliest leg expiry (not the back leg of a calendar)
      let primaryDTE = Infinity
      for (const leg of legs) {
        if (!leg.expiration) continue
        const exp = new Date(String(leg.expiration).split('T')[0] + 'T16:00:00-04:00').getTime()
        if (!Number.isFinite(exp)) continue
        const dte = (exp - now) / msDay
        if (dte < primaryDTE) primaryDTE = dte
      }
      if (!Number.isFinite(primaryDTE)) primaryDTE = 0
      if (primaryDTE > MAX_DTE_DAYS) {
        ineligible.push({ entry, reason: 'long_dte' }); continue
      }
      eligible.push(entry)
    }

    if (eligible.length === 0) {
      return {
        pnlBuffer: new Float32Array(0),
        minPnL: 0, maxPnL: 0,
        sMin: spot - spot * 0.02, sMax: spot + spot * 0.02,
        T_max: 1, spotSlices: [], timeSlices: [], NX: 0, NT: 0, spot,
        strategies: [] as Strategy[],
        pricingInputs: buildPricingInputs({
          strategies: [], vix: 18, marketRegime, chainIV: chainIV ?? null,
          atmIvByDte, pricingModel,
          hestonVolOfVol, hestonMeanReversion, hestonCorrelation,
          timeMachineEnabled, simVolatilityOffset, simTimeOffsetHours: 0,
        }),
        ineligible, computeMs: 0,
        marketRegime, pricingModel,
        hestonVolOfVol, hestonMeanReversion, hestonCorrelation,
        timeMachineEnabled, simVolatilityOffset, simTimeOffsetHours: 0, simSpotPct,
        rtLegs: [],
        cbDollars: 0,
        atExpirationPnl: [],
      }
    }

    // Build strategies with cardDebits override (normalized per-share)
    const strategies = eligible.map(e => {
      const strategy = toRiskGraphStrategy(e) as unknown as Strategy
      const raw = cardDebits?.[e.intent.intent_id]
      if (raw != null && raw > 0) {
        const cd = normalizePerShareDebit(raw);
        (strategy as any).debit = cd;
        (strategy as any).costBasis = cd;
      }
      return strategy
    })

    // Per-position legs + cost — same multi-fly rule as 2D (do not merge packages
    // before vol-calibrate; that flattens distant butterflies).
    const asOfMs = pricingAsOfMs()
    const positions = buildPerIntentLegsAndCostBasis({
      intents: eligible.map(e => ({
        legs: e.intent.legs,
        quantity: (e.intent as any).quantity ?? 1,
        intent_id: e.intent.intent_id,
        target_price: (e.intent as any).target_price,
        price_side: (e.intent as any).price_side,
        topology: (e.intent as any).topology,
      })),
      cardDebits,
      chainIV,
      getContractMid,
      getSSEIV,
      atmIvByDte,
      spot: initialSpot,
      asOfMs,
    })

    if (positions.length === 0) return null
    const allLegs = positions.flatMap(p => p.legs)
    const cbDollars = positions.reduce((s, p) => s + p.cbDollars, 0)

    // Chain strike ladder for position expirations (heatmap / chain API parity)
    const expSet = new Set<string>()
    for (const e of eligible) {
      for (const leg of e.intent.legs) {
        if (leg.expiration) expSet.add(String(leg.expiration).split('T')[0])
      }
    }
    const chainStrikes = chainStrikesForExpirations(canonicalStrikeMap, [...expSet])
    const dteDays = Math.max(...allLegs.map(l => l.T * 365.25), 0)
    const tier = RESOLUTION_TIERS[Math.min(tierIndex, RESOLUTION_TIERS.length - 1)]
    const volShift = (simVolatilityOffset ?? 0) / 100
    // Portfolio surface = sum of per-position surfaces (shared price grid)
    const portfolio = buildMultiPositionSharedCurves({
      positions,
      spot,
      volShift,
      elapsedDays: 0,
      gridN: Math.min(240, Math.max(tier.nx, 121)),
      numTimeSlices: tier.nt,
      chainStrikes,
      vix: vix && vix > 0 ? vix : 18,
      dteDays,
    })
    if (!portfolio) return null
    const surface = portfolio.surface
    const atExpirationPnl = portfolio.expirationPnl

    // Minimal pricingInputs for downstream (breakeven markers, etc.)
    const pricingInputs = buildPricingInputs({
      strategies, vix: 18, marketRegime, chainIV: chainIV ?? null,
      atmIvByDte, pricingModel,
      hestonVolOfVol, hestonMeanReversion, hestonCorrelation,
      timeMachineEnabled, simVolatilityOffset, simTimeOffsetHours: 0,
    })

    return {
      pnlBuffer: surface.pnlBuffer,
      minPnL: surface.minPnl,
      maxPnL: surface.maxPnl,
      sMin: surface.priceGrid[0],
      sMax: surface.priceGrid[surface.priceGrid.length - 1],
      T_max: surface.tMaxDays,
      spotSlices: surface.priceGrid,
      timeSlices: surface.timeGrid,
      NX: surface.NX,
      NT: surface.NT,
      spot,
      strategies,
      pricingInputs,
      ineligible,
      computeMs: 0,
      marketRegime, pricingModel,
      hestonVolOfVol, hestonMeanReversion, hestonCorrelation,
      timeMachineEnabled, simVolatilityOffset, simTimeOffsetHours: 0, simSpotPct,
      rtLegs: allLegs,
      cbDollars,
      atExpirationPnl,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    entries, cardDebits, chainIV, getContractMid, getSSEIV, chainIVStale,
    marketRegime, pricingModel, hestonVolOfVol, hestonMeanReversion, hestonCorrelation,
    timeMachineEnabled, simVolatilityOffset, tierIndex,
  ])


  // ── Time pane slice index — derived from simTimeOffsetHours (Time Machine panel) ──
  // Maps the Time Machine's hours offset to the nearest pre-computed surface row.
  // sliceIndex=0 → today face; sliceIndex=NT-1 → expiry face.
  const sliceIndex = useMemo(() => {
    if (!surfaceData || surfaceData.NT <= 1) return 0
    const elapsedDays = simTimeOffsetHours / 24
    return Math.round(Math.min(elapsedDays / surfaceData.T_max, 1) * (surfaceData.NT - 1))
  }, [simTimeOffsetHours, surfaceData])

  // ── Juliett-B: PnLChart overlay data (derived from surfaceData, no extra compute) ──
  // timeSlices[0] = 0 elapsed = current time (theoreticalData / magenta curve)
  // timeSlices[NT-1] = T_max elapsed = at expiration (expirationData / cyan curve)
  // When timeMachineEnabled, the magenta curve scrubs to the row corresponding
  // to simTimeOffsetHours — the same pre-computed buffer slice the 3D surface uses.
  const pnlChartData = useMemo(() => {
    if (!surfaceData || surfaceData.NX === 0 || surfaceData.NT === 0) return null
    const { pnlBuffer, spotSlices, NX, NT, T_max } = surfaceData

    // Map sim time offset → row index (clamps to [0, NT-1])
    const theoreticalRowIdx = timeMachineEnabled
      ? Math.round(Math.min((simTimeOffsetHours / 24) / T_max, 1) * (NT - 1))
      : 0

    function crossingsFromPnl(pnl: number[]): number[] {
      const crossings: number[] = []
      for (let j = 0; j < NX - 1; j++) {
        const p0 = pnl[j]
        const p1 = pnl[j + 1]
        if (isFinite(p0) && isFinite(p1) && p0 * p1 < 0) {
          const t = p0 / (p0 - p1)
          crossings.push(spotSlices[j] + t * (spotSlices[j + 1] - spotSlices[j]))
        }
      }
      return crossings
    }

    const theoreticalPnl = spotSlices.map((_, j) => pnlBuffer[theoreticalRowIdx * NX + j])
    // Debit-pinned expiry (intrinsic − card cost basis), not last time-row
    const expArr = surfaceData.atExpirationPnl
    const expirationPnl = spotSlices.map((_, j) =>
      expArr && expArr.length === NX
        ? (expArr[j] ?? 0)
        : pnlBuffer[(NT - 1) * NX + j],
    )
    const theoreticalData: PnLPoint[] = spotSlices.map((price, j) => ({
      price, pnl: theoreticalPnl[j],
    }))
    const expirationData: PnLPoint[] = spotSlices.map((price, j) => ({
      price, pnl: expirationPnl[j],
    }))

    const strikes = Array.from(new Set(
      surfaceData.strategies.flatMap((s: any) => s.legs?.map((l: any) => l.strike) ?? [s.strike])
    )).filter((s): s is number => typeof s === 'number' && isFinite(s))
     .sort((a: number, b: number) => a - b)

    return {
      theoreticalData,
      expirationData,
      theoreticalBreakevens: crossingsFromPnl(theoreticalPnl),
      expirationBreakevens:  crossingsFromPnl(expirationPnl),
      strikes,
    }
  }, [surfaceData, timeMachineEnabled, simTimeOffsetHours])

  // ── Juliett-B: GEX backdrop for the 2D PnLChart overlay ────────────────────
  // Renders SVG bars behind the PnL curves, aligned to the chart price axis.
  // Same mode semantics and color schema as the 3D GEX bars.
  const renderGexBackdrop = useCallback((props: BackdropRenderProps): React.ReactNode => {
    if (!gexByStrike) return null
    const { width, height, priceMin, priceMax } = props
    const priceRange = priceMax - priceMin
    if (priceRange <= 0) return null

    const strikes = Object.keys(gexByStrike)
      .map(Number)
      .filter(s => isFinite(s) && s >= priceMin && s <= priceMax)
    if (strikes.length === 0) return null

    // Normalise per mode (mirrors 3D bar logic exactly)
    let maxVal = 0
    for (const s of strikes) {
      const { calls, puts } = gexByStrike[s]
      if (gexMode === 'combined') maxVal = Math.max(maxVal, Math.abs(calls), Math.abs(puts))
      else if (gexMode === 'abs')  maxVal = Math.max(maxVal, Math.abs(calls) + Math.abs(puts))
      else                         maxVal = Math.max(maxVal, Math.abs(calls + puts))
    }
    if (maxVal === 0) return null

    const yZero = height / 2   // zero line at vertical center
    const halfH = height / 2   // tallest bar fills one half-space

    // Bar width from strike spacing, clamped to a minimum of 2px
    const sorted = [...strikes].sort((a, b) => a - b)
    const strikeStep = sorted.length > 1
      ? (sorted[sorted.length - 1] - sorted[0]) / (sorted.length - 1)
      : 5
    const barW = Math.max(2, (strikeStep / priceRange) * width * 0.72)

    const toX = (s: number) => (s - priceMin) / priceRange * width

    const els: React.ReactNode[] = []

    // Zero reference line
    els.push(<line key="zero" x1={0} y1={yZero} x2={width} y2={yZero}
      stroke="rgba(255,255,255,0.18)" strokeWidth={1} />)

    for (const s of strikes) {
      const x = toX(s)
      const { calls, puts } = gexByStrike[s]

      if (gexMode === 'combined') {
        const callH = (Math.abs(calls) / maxVal) * halfH
        const putH  = (Math.abs(puts)  / maxVal) * halfH
        if (callH > 0.5) els.push(
          <rect key={`c${s}`} x={x - barW / 2} y={yZero - callH} width={barW} height={callH}
            fill="rgba(34,204,102,0.55)" />
        )
        if (putH > 0.5) els.push(
          <rect key={`p${s}`} x={x - barW / 2} y={yZero} width={barW} height={putH}
            fill="rgba(204,51,68,0.55)" />
        )
      } else if (gexMode === 'abs') {
        const val = Math.abs(calls) + Math.abs(puts)
        const h   = (val / maxVal) * halfH
        if (h > 0.5) els.push(
          <rect key={`a${s}`} x={x - barW / 2} y={yZero - h} width={barW} height={h}
            fill="rgba(119,153,255,0.60)" />
        )
      } else {
        // Net: positive green above zero, negative red below zero
        const net = calls + puts
        const h   = (Math.abs(net) / maxVal) * halfH
        if (h > 0.5) els.push(
          <rect key={`n${s}`} x={x - barW / 2} y={net >= 0 ? yZero - h : yZero} width={barW} height={h}
            fill={net >= 0 ? 'rgba(34,204,102,0.55)' : 'rgba(204,51,68,0.55)'} />
        )
      }
    }

    return (
      <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
        {els}
      </svg>
    )
  }, [gexByStrike, gexMode])

  // ── Adaptive resolution ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!surfaceData) return
    const { computeMs } = surfaceData
    const ft = frameTimeRef.current, adapt = adaptRef.current
    if (computeMs > 100 || (ft > 33 && ft < 10_000)) {
      adapt.slowStreak++; adapt.fastStreak = 0
      if (adapt.slowStreak >= 3 && tierIndex < RESOLUTION_TIERS.length - 1) {
        setTierIndex(t => t + 1); adapt.slowStreak = 0
      }
    } else if (computeMs < 50 && (ft < 20 || ft >= 10_000)) {
      adapt.fastStreak++; adapt.slowStreak = 0
      if (adapt.fastStreak >= 5 && tierIndex > 0) {
        setTierIndex(t => t - 1); adapt.fastStreak = 0
      }
    } else {
      adapt.slowStreak = 0; adapt.fastStreak = 0
    }
  }, [surfaceData, tierIndex])

  // ── Price chart floor — texture redraw helper ────────────────────────────
  // Reads the LWC chart's canvas, rotates it 90° CW onto floorTextureCanvas,
  // and signals the Three.js CanvasTexture to re-upload.
  // 90° CW: LWC (0, H) bottom-left = (oldest, low) → texture top-left (0, 0).
  //         Time axis maps to V (top=expiry, bottom=today with flipY=false).
  //         Price axis maps to U (left=sMin, right=sMax).
  const redrawFloorTexture = useCallback(() => {
    const container = lwcFloorContainerRef.current
    const texCanvas  = floorTextureCanvasRef.current
    const floor      = priceChartFloorRef.current
    if (!container || !texCanvas || !floor) return

    const lwcCanvas = container.querySelector('canvas') as HTMLCanvasElement | null
    if (!lwcCanvas || lwcCanvas.width === 0 || lwcCanvas.height === 0) return

    const srcW = lwcCanvas.width
    const srcH = lwcCanvas.height

    // Resize texture canvas if LWC canvas dimensions changed
    const needsResize = texCanvas.width !== srcH || texCanvas.height !== srcW
    if (needsResize) {
      texCanvas.width  = srcH
      texCanvas.height = srcW
    }

    const ctx = texCanvas.getContext('2d')
    if (!ctx) return

    // Clear + draw 90° CW: translate(srcH, 0) rotate(π/2) drawImage(src, 0, 0)
    ctx.clearRect(0, 0, texCanvas.width, texCanvas.height)
    ctx.save()
    ctx.translate(srcH, 0)
    ctx.rotate(Math.PI / 2)
    ctx.drawImage(lwcCanvas, 0, 0, srcW, srcH)
    ctx.restore()

    floor.markNeedsUpdate()
  }, [])

  // ── Mount: init Three.js scene ─────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ctx = initScene(container)
    sceneCtxRef.current = ctx
    // Juliett-A: initialise camera at ISO pose using the new spherical formula.
    // Extend far plane to support pseudo-ortho rVisual scaling (up to ~15× default R).
    ctx.camera.far = 500
    ctx.camera.updateProjectionMatrix()
    camRef.current = { theta: Math.PI / 4, phi: Math.PI / 3, R: DEFAULT_CAM_R }
    panOffsetRef.current.set(0, 0, 0)
    sphericalToVec3(Math.PI / 4, Math.PI / 3, DEFAULT_CAM_R, _camVec)
    ctx.camera.position.copy(_camVec)
    ctx.camera.lookAt(0, 0, 0)
    // Canvas starts invisible; camera rAF drives the load-animation fade-in
    ctx.renderer.domElement.style.opacity = '0'
    loadAnimRef.current = { opacity: 0, done: false }
    ctx.startLoop()
    return () => { disposeSceneObjects(); ctx.dispose(); sceneCtxRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Main rebuild ────────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = sceneCtxRef.current
    if (!ctx) return

    surfaceDataRef.current = surfaceData
    sweepPtrRef.current           = 0
    lastFocusCenterColRef.current = -1

    const spot   = surfaceData?.spot ?? spotRef.current
    const active = entries.filter(e => e.status === 'ANALYSIS' && e.visible)
    const range  = deriveRange(active, spot, surfaceData)

    // Apply carousel offset — shifts the entire X (strike) axis so the box
    // can be scrolled through the full historical dataset.
    const off = strikeViewOffsetRef.current
    const shiftedRange = off !== 0
      ? { ...range, sMin: range.sMin + off, sMax: range.sMax + off }
      : range

    const el     = ctx.renderer.domElement
    const coords = (buildCoords as any)(
      shiftedRange,
      { width: el.clientWidth || 800, height: el.clientHeight || 600 },
    )
    coordsRef.current = coords
    // Centre the lookAt on the "today" face (z = +SCENE_Z) so the current spot
    // appears centred when entering 3D from the 2D risk view.
    panOffsetRef.current.set(0, 0, (coords as any).extents.z)
    disposeSceneObjects()

    const { scene, renderer } = ctx
    // echo.js calls zLabelFn(val) where val = 0..maxDTE (DTE).
    // DTE=0 is at -SCENE_Z (expiry, screen-right from +X camera).
    // DTE=maxDTE is at +SCENE_Z (today, screen-left from +X camera).
    // Invert so 'Today' lands on the today (+Z) end, expiry weekday on the expiry (-Z) end.
    const maxDTE = coords.range.maxDTE

    // Major X ticks: even across the axis, snapped to real chain strikes.
    // Independent of positions. Structure legs → secondary amber marks only.
    const expSet = new Set<string>()
    for (const e of active) {
      for (const leg of e.intent.legs) {
        if (leg.expiration) expSet.add(String(leg.expiration).split('T')[0])
      }
    }
    const chainLadder = collectChainStrikesInWindow(
      shiftedRange.sMin,
      shiftedRange.sMax,
      canonicalStrikeMap,
      [...expSet],
    )
    const structureStrikes = Array.from(new Set(
      active.flatMap(e => e.intent.legs.map(l => l.strike))
        .filter((s): s is number => typeof s === 'number' && isFinite(s)),
    )).sort((a, b) => a - b)

    referenceBoxRef.current  = buildReferenceBox(coords, scene, renderer, {
      zLabelFn: (dte: number) => formatZAxisLabel(maxDTE - dte),
      xTicks: chainLadder.length > 0 ? chainLadder : null,
      xStructureMarks: structureStrikes,
    })
    zeroPnLRef.current       = buildZeroPnLPlane(coords, scene)
    spotPlaneRef.current     = buildSpotPlane(coords, scene)

    // Juliett-A: classify axis sprites for label fading (§6.4.3)
    // Echo.js axisGroup children: [0]=STRIKE name, [1]=P&L name, [2]=TIME name,
    // then Strike ticks (Line+Sprite interleaved), P&L ticks, TIME ticks.
    // Classify by x-position: x > xMax+0.5 → TIME(z), x < xMin−0.5 → P&L(y), else STRIKE(x).
    const boxObj = referenceBoxRef.current as any
    if (boxObj?.axisGroup) {
      const xBuckets: THREE.Sprite[] = []
      const yBuckets: THREE.Sprite[] = []
      const zBuckets: THREE.Sprite[] = []
      const xMin = coords.nx(coords.range.sMin) as number
      const xMax = coords.nx(coords.range.sMax) as number
      boxObj.axisGroup.traverse((child: THREE.Object3D) => {
        if ((child as any).isSprite) {
          const sp = child as THREE.Sprite
          if (sp.position.x > xMax + 0.5)      zBuckets.push(sp)
          else if (sp.position.x < xMin - 0.5) yBuckets.push(sp)
          else                                   xBuckets.push(sp)
        }
      })
      axisSpritesRef.current = { x: xBuckets, y: yBuckets, z: zBuckets }
    }
    intersectionRef.current  = buildIntersectionLine(coords, scene, coords.nx(spot))

    const legStubs = active.flatMap(e => {
      const now = Date.now(), msDay = 86_400_000
      return e.intent.legs.map((l: any) => ({
        strike:  l.strike  ?? 0,  type:    l.right    ?? 'call',
        qty:     l.quantity ?? 1, premium: l.entry_price ?? 0,
        expiry:  Math.max(0, Math.round((new Date(l.expiration + 'T16:00:00').getTime() - now) / msDay)),
      }))
    })
    expiryMarkerRef.current = legStubs.length > 0
      ? syncExpiryMarker(coords, scene, legStubs, null)
      : null

    if (surfaceData && surfaceData.pnlBuffer.length > 0 && surfaceData.NX > 0) {
      surfaceMeshRef.current  = buildSurfaceMesh(surfaceData, coords, scene, altPaletteRef.current)
      surfaceGridRef.current  = buildSurfaceGrid(surfaceData, scene, surfaceMeshRef.current.posArr)
      beLineRef.current       = buildBreakevenCurve(surfaceData, coords, scene)
      todayPayoffRef.current  = buildTodayPayoffCurve(surfaceData, coords, scene)
      expiryPayoffRef.current = buildExpiryPayoffCurve(surfaceData, coords, scene)
      // Juliett-B: surface strike markers at structure legs (not major axis labels)
      const allStrikes = structureStrikes.length > 0
        ? structureStrikes
        : Array.from(new Set(
            surfaceData.strategies.flatMap((s: any) => s.legs?.map((l: any) => l.strike) ?? [s.strike])
          )).filter((s): s is number => typeof s === 'number' && isFinite(s)).sort((a, b) => a - b)
      strikeMarkersRef.current = buildStrikeMarkers(allStrikes, coords, scene, renderer)
    }

    if (surfaceData && surfaceData.ineligible.length > 0 && containerRef.current) {
      overlayRef.current = buildIneligibleOverlay(
        surfaceData.ineligible, surfaceData.strategies.length, containerRef.current,
      )
    }

    // India-B: guide line + contact marker always present (opacity/scale=0 until needed)
    guideLineRef.current   = buildGuideLine(scene)
    contactMarkerRef.current = buildContactMarker(scene)

    // India-B: time cursor plane (only if surface exists)
    if (surfaceData && surfaceData.NX > 0) {
      timeCursorRef.current = buildTimeCursorPlane(scene, coords)
    }

    // Initial spot plane color
    const ctrl = spotPlaneRef.current as any
    if (ctrl?.update) {
      ctrl.update(spot, computeRTPnL(surfaceData, spot))
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surfaceData, strikeViewOffset, canonicalStrikeMap, entries])

  // ── Spot plane tick (§5.5) ─────────────────────────────────────────────────
  // simSpotPct shifts only the visual spot plane — the surface stays fixed.
  useEffect(() => {
    const ctrl = spotPlaneRef.current as any
    const data = surfaceDataRef.current
    if (!ctrl?.update || !coordsRef.current) return
    const spot = initialSpot && initialSpot > 0 ? initialSpot : 5900
    const visSpot = simSpotPct !== 0 ? spot * (1 + simSpotPct / 100) : spot
    ctrl.update(visSpot, computeRTPnL(data, visSpot))
    const intLine = intersectionRef.current
    if (intLine) intLine.update(coordsRef.current.nx(visSpot))
  }, [initialSpot, simSpotPct])

  // ── Per-tick Spatial Priority Refresh (§5.14.5–5.14.6) ────────────────────
  useEffect(() => {
    const data     = surfaceDataRef.current
    const meshCtrl = surfaceMeshRef.current
    const coords   = coordsRef.current
    if (!data || !meshCtrl || !coords || data.NX === 0 || data.strategies.length === 0) return

    const currentSpot   = initialSpot && initialSpot > 0 ? initialSpot : (data.spot ?? 5900)
    // Spot slider is visual-only — surface always priced at real spot.
    // Focus region follows real spot so the camera stays anchored to the surface center.
    const effectiveSpot = currentSpot
    const safeVix       = vix && vix > 0 ? vix : 18

    if (prevFocusModeRef.current !== focusRegionMode) {
      /* eslint-disable no-console */
      console.log(`[3DRG-instrument] mode-change | ${prevFocusModeRef.current} → ${focusRegionMode}`)
      /* eslint-enable no-console */
      prevFocusModeRef.current = focusRegionMode
    }

    const freshInputs = buildPricingInputs({
      strategies: data.strategies, vix: safeVix, marketRegime: data.marketRegime,
      chainIV: chainIV ?? null, atmIvByDte, pricingModel: data.pricingModel,
      hestonVolOfVol: data.hestonVolOfVol, hestonMeanReversion: data.hestonMeanReversion,
      hestonCorrelation: data.hestonCorrelation, timeMachineEnabled: data.timeMachineEnabled,
      simVolatilityOffset: data.simVolatilityOffset, simTimeOffsetHours: 0,
    })
    // Expose freshInputs for the interrogation rAF loop (Greek computation at contact point).
    freshPricingInputsRef.current = freshInputs

    let fLeft = 0, fRight = 0
    if (focusRegionMode === 'strikes' && canonicalStrikeMap && data.strategies.length > 0) {
      const primaryExpiry = (data.strategies[0].legs?.[0] as any)?.expiration ?? ''
      const strikeArr     = canonicalStrikeMap[primaryExpiry] ?? []
      if (strikeArr.length > 0) {
        const nearest    = snapToNearestStrike(effectiveSpot, strikeArr)
        const nearestIdx = strikeArr.findIndex(s => s === nearest)
        const lS  = strikeArr[Math.max(0, nearestIdx - FOCUS_REGION_STRIKES_HALFWIDTH)]
        const rS  = strikeArr[Math.min(strikeArr.length - 1, nearestIdx + FOCUS_REGION_STRIKES_HALFWIDTH)]
        fLeft  = findNearestCol(data.spotSlices, lS)
        fRight = Math.min(data.NX, findNearestCol(data.spotSlices, rS) + 1)
      } else {
        const hw = effectiveSpot * FOCUS_REGION_DOLLARS_HALFWIDTH_PCT
        fLeft = findNearestCol(data.spotSlices, effectiveSpot - hw)
        fRight = Math.min(data.NX, findNearestCol(data.spotSlices, effectiveSpot + hw) + 1)
      }
    } else {
      const hw = effectiveSpot * FOCUS_REGION_DOLLARS_HALFWIDTH_PCT
      fLeft = findNearestCol(data.spotSlices, effectiveSpot - hw)
      fRight = Math.min(data.NX, findNearestCol(data.spotSlices, effectiveSpot + hw) + 1)
    }
    if (fRight <= fLeft) fRight = Math.min(fLeft + 1, data.NX)

    const focusCenterCol = Math.floor((fLeft + fRight) / 2)
    if (lastFocusCenterColRef.current >= 0 &&
        Math.abs(focusCenterCol - lastFocusCenterColRef.current) >= 2) {
      /* eslint-disable no-console */
      console.log(`[3DRG-instrument] focus-recenter | col ${lastFocusCenterColRef.current} → ${focusCenterCol} | spot=${effectiveSpot.toFixed(2)}`)
      /* eslint-enable no-console */
    }
    lastFocusCenterColRef.current = focusCenterCol

    recomputeColumnsInBuffer(data, coords, fLeft, fRight, effectiveSpot, freshInputs,
      meshCtrl.posArr, meshCtrl.colorArr, altPaletteRef.current)

    let ptr = sweepPtrRef.current, swept = 0
    for (let iter = 0; iter < data.NX && swept < PERIPHERY_SWEEP_COLUMNS_PER_TICK; iter++) {
      const col = ptr % data.NX
      if (col < fLeft || col >= fRight) {
        recomputeColumnsInBuffer(data, coords, col, col + 1, effectiveSpot, freshInputs,
          meshCtrl.posArr, meshCtrl.colorArr, altPaletteRef.current)
        swept++
      }
      ptr = (ptr + 1) % data.NX
    }
    sweepPtrRef.current = ptr

    if (meshCtrl.geo.attributes.position) meshCtrl.geo.attributes.position.needsUpdate = true
    if (meshCtrl.geo.attributes.color)    meshCtrl.geo.attributes.color.needsUpdate = true
    meshCtrl.geo.computeVertexNormals()

    // NOTE: magenta curve is NOT repainted here intentionally.
    // Spatial priority only updates a subset of columns per tick (focus region + 8 sweep
    // columns), so reading the entire pnlBuffer mid-sweep would produce a jagged curve
    // where live and stale prices mix.  The sliceIndex effect handles curve updates from
    // clean, fully-computed pnlBuffer on every surface rebuild (every ~15s) and on every
    // time-machine slider change.


  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSpot, vix, chainIV, atmIvByDte, focusRegionMode, canonicalStrikeMap])

  // ── Instrumentation: focus mode dwell-time (60s interval) ─────────────────
  useEffect(() => {
    const handle = setInterval(() => {
      /* eslint-disable no-console */
      console.log(`[3DRG-instrument] mode-dwell-time | mode=${prevFocusModeRef.current} | tier=${RESOLUTION_TIERS[tierIndex].name}`)
      /* eslint-enable no-console */
    }, 60_000)
    focusDwellIntervalRef.current = handle
    return () => clearInterval(handle)
  }, [tierIndex])

  // ── India-B: Interrogation rAF loop ────────────────────────────────────────
  // Raycasts every frame against the surface mesh; animates guide line opacity
  // and contact marker scale; updates card React state only on grid-cell change.

  useEffect(() => {
    let rafId: number

    function interrogFrame(now: number): void {
      rafId = requestAnimationFrame(interrogFrame)

      const ctx      = sceneCtxRef.current
      const meshCtrl = surfaceMeshRef.current
      const coords   = coordsRef.current
      const data     = surfaceDataRef.current
      if (!ctx || !meshCtrl || !coords || !data || data.NX === 0) return

      const camera    = ctx.camera
      const container = containerRef.current
      if (!container) return

      const canvasW = container.clientWidth  || 800
      const canvasH = container.clientHeight || 600

      // ── Raycast ──────────────────────────────────────────────────────────
      _raycaster.setFromCamera(mouseNDCRef.current as any, camera)
      const intersects = _raycaster.intersectObject(meshCtrl.mesh, false)

      const ig = interrogRef.current
      let targetGuideOp = 0
      let targetMarkerSc = 0
      let newStage: 'none' | 'approach' | 'contact' = 'none'
      let newGridI = -1, newGridJ = -1

      if (intersects.length > 0) {
        // ── CONTACT stage ─────────────────────────────────────────────────
        newStage      = 'contact'
        targetGuideOp  = 0.8
        targetMarkerSc = 1.0

        const hit = intersects[0]
        if (hit.faceIndex != null) {
          const { gridI, gridJ } = faceIndexToGrid(hit.faceIndex, data.NX)
          newGridI = Math.min(gridI, data.NT - 2)
          newGridJ = Math.min(gridJ, data.NX - 2)
        }

        const hp = hit.point
        const y0 = coords.ny(0) as number
        guideLineRef.current?.updateEndpoints(hp, y0)
        if (contactMarkerRef.current) contactMarkerRef.current.mesh.position.copy(hp)

      } else {
        // ── Approach check ────────────────────────────────────────────────
        const nVerts = data.NX * data.NT
        const info   = getNearestSurfaceInfo(
          meshCtrl.posArr, nVerts, camera, canvasW, canvasH,
          mouseScreenRef.current.x, mouseScreenRef.current.y,
        )
        if (info.dist < APPROACH_THRESHOLD) {
          newStage      = 'approach'
          targetGuideOp  = 0.3
          _v3S2.set(info.worldX, info.worldY, info.worldZ)
          const y0 = coords.ny(0) as number
          guideLineRef.current?.updateEndpoints(_v3S2, y0)
        }
      }

      // ── Animate guide line opacity (ANIM_TAU_GUIDE ≈ 150ms ease-in) ──
      // IMPORTANT: clamp dt to 32ms maximum.
      // On the first rAF frame, _lastNow is 0 (initialized in the
      // interrogRef object literal), so dt = now - 0 = (large timestamp),
      // which would propagate through animation integration and produce
      // a one-frame glitch. The Math.min clamp caps dt at 32ms (~30fps
      // minimum), which gives sensible animation timing on the first
      // frame and also handles the case where the browser tab was
      // backgrounded for a long time and rAF frames resume with a huge
      // gap. The || 16 fallback is a belt-and-suspenders for any
      // pathological dt = 0 case.
      const dt         = Math.min(now - ig._lastNow || 16, 32)
      ig._lastNow = now
      const guideLerp  = 1 - Math.exp(-dt / ANIM_TAU_GUIDE)
      const markerLerp = 1 - Math.exp(-dt / ANIM_TAU_MARKER)

      ig.guideOp  += (targetGuideOp  - ig.guideOp)  * guideLerp
      ig.markerSc += (targetMarkerSc - ig.markerSc) * markerLerp

      if (guideLineRef.current) {
        const gl = guideLineRef.current
        gl.mat.opacity = ig.guideOp
        gl.line.visible = ig.guideOp > 0.01
      }
      if (contactMarkerRef.current) {
        const cm = contactMarkerRef.current
        cm.mesh.scale.setScalar(ig.markerSc)
        cm.mesh.visible = ig.markerSc > 0.01
      }

      // ── Stage transitions (instrumentation) ───────────────────────────
      if (newStage !== ig.stage) {
        const prev = ig.stage
        ig.stage = newStage
        /* eslint-disable no-console */
        if (newStage === 'approach') console.log('[3DRG-instrument] approach stage entered')
        else if (newStage === 'contact') console.log('[3DRG-instrument] contact stage entered')
        else if (prev  === 'approach') console.log('[3DRG-instrument] approach stage exited')
        else if (prev  === 'contact') console.log('[3DRG-instrument] contact stage exited')
        /* eslint-enable no-console */
      }

      // ── Track grid position (rate-limited: only on grid-cell change) ──
      if (newStage === 'contact' && (newGridI !== ig.lastGridI || newGridJ !== ig.lastGridJ)) {
        ig.lastGridI = newGridI
        ig.lastGridJ = newGridJ
      }
    }

    rafId = requestAnimationFrame(interrogFrame)
    return () => cancelAnimationFrame(rafId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── India-B: Pointer event listener ────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function onPointerMove(e: PointerEvent) {
      const rect = container!.getBoundingClientRect()
      const rx   = e.clientX - rect.left
      const ry   = e.clientY - rect.top
      mouseNDCRef.current    = { x: (rx / rect.width) * 2 - 1, y: -((ry / rect.height) * 2 - 1) }
      mouseScreenRef.current = { x: rx, y: ry }
    }

    function onPointerLeave() {
      mouseNDCRef.current = { x: -9999, y: -9999 }
    }

    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerleave', onPointerLeave)
    return () => {
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  // ── India-B: Click / tap → pin (§5.12.2 stage 3) ─────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // JULIETT: camera orbit handler hooks here when no surface hit
  }, [])

  // ── Juliett-A: Camera gesture handlers (§6.2, §6.3, §6.7) ────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Helper: returns true if the cursor is currently over the surface mesh
    function isOverSurface(clientX: number, clientY: number): boolean {
      const ctx = sceneCtxRef.current
      const meshCtrl = surfaceMeshRef.current
      if (!ctx || !meshCtrl) return false
      const rect = container!.getBoundingClientRect()
      const ndcX = ((clientX - rect.left) / rect.width)  * 2 - 1
      const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1)
      _raycaster.setFromCamera({ x: ndcX, y: ndcY } as any, ctx.camera)
      const hits = _raycaster.intersectObject(meshCtrl.mesh, false)
      return hits.length > 0
    }

    // ── Mouse / pointer handlers ──────────────────────────────────────────
    function onMouseDown(e: MouseEvent) {
      // Option+click reversal (always, regardless of surface hit)
      if (e.altKey) {
        e.preventDefault()
        e.stopPropagation()
        const anim = reversalAnimRef.current ?? {} as any
        anim.active     = true
        anim.startTheta = camRef.current.theta
        anim.deltaTheta = reduceMotionRef.current ? Math.PI : Math.PI
        anim.startT     = performance.now()
        reversalAnimRef.current = anim
        // Keep any active kb animation suspended
        if (kbAnimRef.current) kbAnimRef.current.active = false
        return
      }
      // Ignore while animating (keyboard jump or reversal)
      if (kbAnimRef.current?.active || reversalAnimRef.current?.active) return
      // Arbitration: if over surface → India-B owns this drag
      if (isOverSurface(e.clientX, e.clientY)) return
      e.preventDefault()
      const isPan      = e.shiftKey && !e.ctrlKey && !e.metaKey
      const isCarousel = e.ctrlKey || e.metaKey
      interrogRef.current.isDragging = true
      camDragRef.current = {
        active:      true,
        isPan,
        isCarousel,
        startX:      e.clientX,
        startY:      e.clientY,
        startTheta:  camRef.current.theta,
        startPhi:    camRef.current.phi,
        panStartX:   e.clientX,
        panStartY:   e.clientY,
      }
    }

    function onMouseMove(e: MouseEvent) {
      const drag = camDragRef.current
      if (!drag?.active) return
      const cam = camRef.current
      const dx  = e.clientX - drag.startX
      const dy  = e.clientY - drag.startY
      if (drag.isCarousel) {
        // Carousel: shift strike view offset — horizontal drag only
        const coords = coordsRef.current as any
        const strikeRange = coords ? (coords.range.sMax - coords.range.sMin) : 1000
        const canvasW = (sceneCtxRef.current?.renderer.domElement.clientWidth) || 800
        const carouselScale = strikeRange / canvasW
        const newOffset = strikeViewOffsetRef.current - dx * carouselScale
        strikeViewOffsetRef.current = newOffset
        setStrikeViewOffset(newOffset)
        drag.startX = e.clientX
        drag.startY = e.clientY
      } else if (drag.isPan) {
        // Pan: shift lookAt target in camera-right and camera-up
        const ctx = sceneCtxRef.current
        if (ctx) {
          const right = new THREE.Vector3()
          const up    = new THREE.Vector3(0, 1, 0)
          ctx.camera.getWorldDirection(right)
          right.cross(up).normalize()
          const panScale = cam.R * 0.002
          panOffsetRef.current.addScaledVector(right, -dx * panScale)
          panOffsetRef.current.y += dy * panScale
        }
        drag.panStartX = e.clientX
        drag.panStartY = e.clientY
        drag.startX    = e.clientX
        drag.startY    = e.clientY
      } else {
        const pitchSign = rg3dDragModeRef.current === 'natural' ? -1 : 1
        // Clamp theta to [−π/3, π]: allows ISO-Left (−π/4) while blocking TIME-mirror (−π/2)
        cam.theta = Math.max(-Math.PI / 3, Math.min(Math.PI, drag.startTheta - dx * ORBIT_SENS))
        cam.phi   = Math.max(0.01, Math.min(Math.PI - 0.01,
          drag.startPhi + pitchSign * dy * ORBIT_SENS,
        ))
      }
    }

    function onMouseUp() {
      if (!camDragRef.current?.active) return
      camDragRef.current.active = false
      interrogRef.current.isDragging = false
    }

    // ── Wheel / scroll → dolly (§6.3) or carousel pan (horizontal) ──────────
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      // Horizontal scroll (trackpad) → carousel strike pan
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const coords = coordsRef.current as any
        const strikeRange = coords ? (coords.range.sMax - coords.range.sMin) : 1000
        const canvasW = (sceneCtxRef.current?.renderer.domElement.clientWidth) || 800
        const carouselScale = strikeRange / canvasW
        const newOffset = strikeViewOffsetRef.current + e.deltaX * carouselScale * 0.5
        strikeViewOffsetRef.current = newOffset
        setStrikeViewOffset(newOffset)
        return
      }
      // Ignore during keyboard jump or reversal animations
      if (kbAnimRef.current?.active || reversalAnimRef.current?.active) return
      const scrollStep = SCROLL_MULTIPLIERS[rg3dScrollSensitivityRef.current]
      if (reduceMotionRef.current) {
        // No momentum: fixed step per scroll event
        camRef.current.R = Math.max(MIN_DIST, Math.min(MAX_DIST,
          camRef.current.R + (e.deltaY > 0 ? scrollStep : -scrollStep),
        ))
      } else {
        const delta = e.deltaY > 0 ? scrollStep : -scrollStep
        scrollVelRef.current -= delta
      }
    }

    // ── Touch handlers (§6.2) ─────────────────────────────────────────────
    function onTouchStart(e: TouchEvent) {
      const t = touchRef.current
      t.count = e.touches.length
      if (e.touches.length === 1) {
        // Single finger: same arbitration as mouse
        const touch = e.touches[0]
        if (isOverSurface(touch.clientX, touch.clientY)) return
        e.preventDefault()
        interrogRef.current.isDragging = true
        camDragRef.current = {
          active:      true, isPan: false, isCarousel: false,
          startX:      touch.clientX, startY:    touch.clientY,
          startTheta:  camRef.current.theta, startPhi: camRef.current.phi,
          panStartX:   touch.clientX, panStartY: touch.clientY,
        }
      } else if (e.touches.length === 2) {
        e.preventDefault()
        // End any single-finger drag
        if (camDragRef.current) { camDragRef.current.active = false }
        const t0 = e.touches[0], t1 = e.touches[1]
        t.prevDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
        t.prevMidX = (t0.clientX + t1.clientX) / 2
        t.prevMidY = (t0.clientY + t1.clientY) / 2
        // Double-tap detection for reversal
        const now = Date.now()
        if (now - t.lastTap < 300) {
          // Two-finger double-tap → reversal
          const anim = reversalAnimRef.current ?? {} as any
          anim.active = true; anim.startTheta = camRef.current.theta
          anim.deltaTheta = Math.PI; anim.startT = performance.now()
          reversalAnimRef.current = anim
        }
        t.lastTap = now
      }
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      const t = touchRef.current
      if (e.touches.length === 1 && camDragRef.current?.active) {
        const touch = e.touches[0]
        const dx = touch.clientX - camDragRef.current.startX
        const dy = touch.clientY - camDragRef.current.startY
        const pitchSign = rg3dDragModeRef.current === 'natural' ? -1 : 1
        camRef.current.theta = Math.max(-Math.PI / 3, Math.min(Math.PI,
          camDragRef.current.startTheta - dx * ORBIT_SENS,
        ))
        camRef.current.phi   = Math.max(0.01, Math.min(Math.PI - 0.01,
          camDragRef.current.startPhi + pitchSign * dy * ORBIT_SENS,
        ))
      } else if (e.touches.length === 2) {
        const t0 = e.touches[0], t1 = e.touches[1]
        const dist   = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
        const midX   = (t0.clientX + t1.clientX) / 2
        const midY   = (t0.clientY + t1.clientY) / 2
        // Pinch → dolly
        const pinchDelta = t.prevDist - dist
        if (!reduceMotionRef.current) {
          scrollVelRef.current += pinchDelta * 0.05
        } else {
          camRef.current.R = Math.max(MIN_DIST, Math.min(MAX_DIST,
            camRef.current.R + pinchDelta * 0.05,
          ))
        }
        // Two-finger drag → pan
        const ctx = sceneCtxRef.current
        if (ctx) {
          const dxPan = midX - t.prevMidX
          const dyPan = midY - t.prevMidY
          const right = new THREE.Vector3()
          ctx.camera.getWorldDirection(right)
          right.cross(new THREE.Vector3(0, 1, 0)).normalize()
          const panScale = camRef.current.R * 0.003
          panOffsetRef.current.addScaledVector(right, -dxPan * panScale)
          panOffsetRef.current.y += dyPan * panScale
        }
        t.prevDist = dist; t.prevMidX = midX; t.prevMidY = midY
      }
    }

    function onTouchEnd() {
      if (camDragRef.current?.active) {
        camDragRef.current.active = false
        interrogRef.current.isDragging = false
      }
      touchRef.current.count = 0
    }

    // Double-click anywhere on the canvas → reset carousel offset to center
    function onDblClick(e: MouseEvent) {
      if (isOverSurface(e.clientX, e.clientY)) return
      if (strikeViewOffsetRef.current !== 0) {
        strikeViewOffsetRef.current = 0
        setStrikeViewOffset(0)
      }
    }

    container.addEventListener('mousedown',  onMouseDown)
    container.addEventListener('dblclick',   onDblClick)
    window.addEventListener('mousemove',     onMouseMove)
    window.addEventListener('mouseup',       onMouseUp)
    container.addEventListener('wheel',      onWheel, { passive: false })
    container.addEventListener('touchstart', onTouchStart, { passive: false })
    container.addEventListener('touchmove',  onTouchMove,  { passive: false })
    container.addEventListener('touchend',   onTouchEnd)
    return () => {
      container.removeEventListener('mousedown',  onMouseDown)
      container.removeEventListener('dblclick',   onDblClick)
      window.removeEventListener('mousemove',     onMouseMove)
      window.removeEventListener('mouseup',       onMouseUp)
      container.removeEventListener('wheel',      onWheel)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove',  onTouchMove)
      container.removeEventListener('touchend',   onTouchEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── India-B: Color-blind palette toggle (§10.2) ────────────────────────────
  useEffect(() => {
    const data     = surfaceDataRef.current
    const meshCtrl = surfaceMeshRef.current
    if (!data || !meshCtrl || data.NX === 0) return
    repaintPalette(data, meshCtrl, colorBlindMode)
    /* eslint-disable no-console */
    console.log(`[3DRG-instrument] alt palette toggled | colorBlindMode=${colorBlindMode}`)
    /* eslint-enable no-console */
  }, [colorBlindMode])

  // ── Time pane cursor — driven by sliceIndex (from Time Machine panel) ─────
  // Cursor plane is visible whenever sliceIndex > 0 (user has moved off "today").
  useEffect(() => {
    const data   = surfaceDataRef.current
    const cursor = timeCursorRef.current
    const coords = coordsRef.current
    if (!data || !cursor || !coords || data.NT === 0) return
    const safeIdx = Math.min(sliceIndex, data.NT - 1)
    const dte     = data.T_max - data.timeSlices[safeIdx]
    cursor.setTimeZ(coords.nz(dte))
    cursor.plane.visible = sliceIndex > 0
  }, [sliceIndex, surfaceData])

  // ── Magenta curve follows time pane ─────────────────────────────────────────
  // Repositions the today payoff curve to the selected time slice so it moves
  // through the surface as the user scrubs the Time Machine slider.
  useEffect(() => {
    const data   = surfaceDataRef.current
    const ctrl   = todayPayoffRef.current
    const coords = coordsRef.current
    if (!data || !ctrl || !coords || data.NT === 0 || data.NX === 0) return
    const safeIdx = Math.min(sliceIndex, data.NT - 1)
    const elapsed = data.timeSlices[safeIdx]
    const dte     = data.T_max - elapsed
    const z       = coords.nz(dte) as number
    const { pnlBuffer, spotSlices, NX } = data
    const flat: number[] = []
    const row = safeIdx * NX
    for (let j = 0; j < NX; j++) {
      flat.push(
        coords.nx(spotSlices[j]) as number,
        coords.ny(pnlBuffer[row + j] ?? 0) as number,
        z,
      )
    }
    if (flat.length >= 6) {
      ctrl.geo.setPositions(flat)
      ctrl.line.computeLineDistances()
    }
  }, [sliceIndex, surfaceData])

  // ── Sanity check (deliverable 8, India-A) ──────────────────────────────────
  useEffect(() => {
    if (sanityDoneRef.current) return
    if (!surfaceData || surfaceData.strategies.length === 0 || surfaceData.NX === 0) return
    sanityDoneRef.current = true

    const { pnlBuffer, spotSlices, timeSlices, NX, NT, spot, strategies, pricingInputs, T_max, simSpotPct: surfaceSimSpotPct } = surfaceData
    // Reproduce the effectiveSpot formula used during the surface compute so the
    // direct call is bit-identical to what was stored in pnlBuffer.
    const sanityEffectiveSpot = surfaceData.timeMachineEnabled && surfaceSimSpotPct !== 0
      ? spot * (1 + surfaceSimSpotPct / 100)
      : spot
    const targetElapsed = 0.1
    let ci = 0, minDiff = Infinity
    for (let i = 0; i < NT; i++) {
      const d = Math.abs(timeSlices[i] - targetElapsed)
      if (d < minDiff) { minDiff = d; ci = i }
    }
    let cj = 0, minSDiff = Infinity
    for (let j = 0; j < NX; j++) {
      const d = Math.abs(spotSlices[j] - sanityEffectiveSpot)
      if (d < minSDiff) { minSDiff = d; cj = j }
    }
    const surfacePnL = pnlBuffer[ci * NX + cj]
    let directPnL = 0
    for (const strat of strategies) {
      const realDays  = pricingInputs.realTimeDaysMap.get(strat.id) ?? 0
      const remaining = Math.max(0, realDays - timeSlices[ci])
      directPnL += calculateTheoreticalPnL(
        strat, spotSlices[cj], pricingInputs.stratVolMap.get(strat.id)!, RISK_FREE_RATE,
        remaining / 365, sanityEffectiveSpot, pricingInputs.pricingParams, pricingInputs.legVolMap.get(strat.id),
      )
    }
    const diff = Math.abs(surfacePnL - directPnL)
    /* eslint-disable no-console */
    console.log(
      `[India] Sanity | surface=${surfacePnL.toFixed(9)} | direct=${directPnL.toFixed(9)} | ` +
      `diff=${diff.toExponential(3)} | ${diff < 1e-9 ? 'PASS ✓' : diff < 1e-6 ? 'WARN' : 'FAIL ✗'}`,
    )
    console.log(`[India] Tier=${RESOLUTION_TIERS[tierIndex].name} | computeMs=${surfaceData.computeMs}ms | T_max=${T_max.toFixed(3)}d`)
    /* eslint-enable no-console */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surfaceData])

  // ── Dispose helpers ────────────────────────────────────────────────────────
  function disposeSceneObjects(): void {
    referenceBoxRef.current?.dispose()
    zeroPnLRef.current?.dispose()
    spotPlaneRef.current?.dispose()
    intersectionRef.current?.dispose()
    expiryMarkerRef.current?.dispose()
    vpPlaneRef.current?.dispose()
    surfaceMeshRef.current?.dispose()
    surfaceGridRef.current?.dispose()
    beLineRef.current?.dispose()
    todayPayoffRef.current?.dispose()
    expiryPayoffRef.current?.dispose()
    overlayRef.current?.dispose()
    guideLineRef.current?.dispose()
    contactMarkerRef.current?.dispose()
    timeCursorRef.current?.dispose()
    strikeMarkersRef.current?.dispose()
    referenceBoxRef.current = null; zeroPnLRef.current       = null
    spotPlaneRef.current    = null; intersectionRef.current  = null
    expiryMarkerRef.current = null; surfaceMeshRef.current   = null
    beLineRef.current       = null; todayPayoffRef.current   = null
    expiryPayoffRef.current = null; overlayRef.current       = null
    guideLineRef.current    = null
    contactMarkerRef.current = null; timeCursorRef.current   = null
    strikeMarkersRef.current = null; surfaceGridRef.current  = null
    vpPlaneRef.current       = null
    // Price chart floor
    priceChartFloorRef.current?.dispose()
    priceChartFloorRef.current = null
    // GEX bars
    if (gexBarsRef.current) {
      sceneCtxRef.current?.scene.remove(gexBarsRef.current)
      gexBarsRef.current.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (mesh.isMesh) {
          mesh.geometry.dispose()
          if (Array.isArray(mesh.material)) mesh.material.forEach((m: THREE.Material) => m.dispose())
          else (mesh.material as THREE.Material).dispose()
        }
      })
      gexBarsRef.current = null
    }
  }

  // ── VP artifact fetch (once on mount) ────────────────────────────────────
  useEffect(() => {
    let alive = true
    fetch('/api/dealer-gravity/artifact', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then((res: { data?: { profile?: VpProfile } } | null) => {
        const profile = res?.data?.profile
        if (alive && profile?.bins?.length) setVpArtifactProfile(profile)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  // ── VP plane — back face ──────────────────────────────────────────────────
  useEffect(() => {
    const ctx    = sceneCtxRef.current
    const coords = coordsRef.current
    vpPlaneRef.current?.dispose()
    vpPlaneRef.current = null
    if (!ctx || !coords || !vpEnabled || !vpArtifactProfile) return
    vpPlaneRef.current = buildVpPlane(coords, ctx.scene, vpArtifactProfile)
  // coordsRef is a ref, not reactive — but strikeViewOffset triggers the main
  // rebuild (which updates coordsRef) before this effect runs. Safe.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vpEnabled, vpArtifactProfile, strikeViewOffset])

  // ── GEX bars — back face overlay ─────────────────────────────────────────
  useEffect(() => {
    const ctx    = sceneCtxRef.current
    const coords = coordsRef.current
    if (!ctx || !coords) return

    // Remove existing bars
    if (gexBarsRef.current) {
      ctx.scene.remove(gexBarsRef.current)
      gexBarsRef.current.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (mesh.isMesh) {
          mesh.geometry.dispose()
          if (Array.isArray(mesh.material)) mesh.material.forEach((m: THREE.Material) => m.dispose())
          else (mesh.material as THREE.Material).dispose()
        }
      })
      gexBarsRef.current = null
    }

    if (!gexEnabled || !gexByStrike || Object.keys(gexByStrike).length === 0) return

    const { range } = coords as any
    const { sMin, sMax, pMin, pMax } = range
    const yBottom  = (coords as any).ny(pMin) as number
    const yTop     = (coords as any).ny(pMax) as number
    // Zero line sits at the vertical center of the box.
    // halfH = maximum bar height in either direction (fills one half-space).
    const yZero    = (yBottom + yTop) / 2
    const halfH    = Math.abs(yTop - yBottom) / 2
    // nz(0) = -SCENE_Z = expiry face = far wall from RISK detent camera.
    // The @expiry cyan PnL curve lives at nz(0).
    // GEX bars sit just in front of the expiry face (toward +Z / camera),
    // visually stacked between the cyan curve and the interior of the box.
    const zExpiry  = (coords as any).nz(0) as number
    const barDepth = 0.08

    // Only include strikes within the visible range
    const strikes = Object.keys(gexByStrike)
      .map(Number)
      .filter(s => isFinite(s) && s >= sMin && s <= sMax)

    console.log('[GEX3D] effect running — gexEnabled:', gexEnabled, 'strikes in range:', strikes.length, 'sMin:', sMin, 'sMax:', sMax, 'zExpiry:', zExpiry)

    if (strikes.length === 0) return

    // ── Normalization — find the largest value that will fill a full half-space ──
    // C/P: normalise against max individual |call| or |put|
    // Net: normalise against max |calls + puts|
    // ABS: normalise against max (|calls| + |puts|)
    let maxAbsGex = 0
    for (const s of strikes) {
      const { calls, puts } = gexByStrike[s]
      if (gexMode === 'combined') {
        maxAbsGex = Math.max(maxAbsGex, Math.abs(calls), Math.abs(puts))
      } else if (gexMode === 'abs') {
        maxAbsGex = Math.max(maxAbsGex, Math.abs(calls) + Math.abs(puts))
      } else {
        maxAbsGex = Math.max(maxAbsGex, Math.abs(calls + puts))
      }
    }
    if (maxAbsGex === 0) return

    // Bar width derived from typical strike spacing
    const sorted = [...strikes].sort((a, b) => a - b)
    const strikeStep = sorted.length > 1
      ? (sorted[sorted.length - 1] - sorted[0]) / (sorted.length - 1)
      : 5
    const barW = Math.abs(
      ((coords as any).nx(sMin + strikeStep) as number) - ((coords as any).nx(sMin) as number)
    ) * 0.72

    const matPos  = new THREE.MeshBasicMaterial({ color: 0x22cc66, transparent: true, opacity: 0.72 })
    const matNeg  = new THREE.MeshBasicMaterial({ color: 0xcc3344, transparent: true, opacity: 0.72 })
    const matCall = matPos   // calls = green, same as net positive
    const matPut  = matNeg   // puts  = red,   same as net negative
    const matAbs  = new THREE.MeshBasicMaterial({ color: 0x7799ff, transparent: true, opacity: 0.70 })

    const group = new THREE.Group()

    // Zero reference line — thin horizontal plane spanning strike range
    const zLineXMin = (coords as any).nx(sMin) as number
    const zLineXMax = (coords as any).nx(sMax) as number
    const zLineW    = Math.abs(zLineXMax - zLineXMin) + barW
    const zLineGeo  = new THREE.BoxGeometry(zLineW, 0.004, barDepth * 0.5)
    const zLineMesh = new THREE.Mesh(zLineGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }))
    zLineMesh.position.set((zLineXMin + zLineXMax) / 2, yZero, zExpiry + barDepth * 0.25)
    group.add(zLineMesh)

    for (const s of strikes) {
      const x = (coords as any).nx(s) as number
      const { calls, puts } = gexByStrike[s]

      if (gexMode === 'combined') {
        // Calls: positive → above zero line (green/blue)
        // Puts:  negative → below zero line (orange/red)
        // Both share the same X (same strike, stacked from zero in opposite directions)
        const callH = (Math.abs(calls) / maxAbsGex) * halfH
        const putH  = (Math.abs(puts)  / maxAbsGex) * halfH
        if (callH > 0.002) {
          const geo  = new THREE.BoxGeometry(barW, callH, barDepth)
          const mesh = new THREE.Mesh(geo, matCall)
          mesh.position.set(x, yZero + callH / 2, zExpiry + barDepth / 2)
          group.add(mesh)
        }
        if (putH > 0.002) {
          const geo  = new THREE.BoxGeometry(barW, putH, barDepth)
          const mesh = new THREE.Mesh(geo, matPut)
          mesh.position.set(x, yZero - putH / 2, zExpiry + barDepth / 2)
          group.add(mesh)
        }
      } else if (gexMode === 'abs') {
        // ABS: |calls| + |puts|, always above zero, blue
        const val = Math.abs(calls) + Math.abs(puts)
        const h   = (val / maxAbsGex) * halfH
        if (h < 0.002) continue
        const geo  = new THREE.BoxGeometry(barW, h, barDepth)
        const mesh = new THREE.Mesh(geo, matAbs)
        mesh.position.set(x, yZero + h / 2, zExpiry + barDepth / 2)
        group.add(mesh)
      } else {
        // Net: calls + puts — positive green above zero, negative red below
        const net = calls + puts
        const h   = (Math.abs(net) / maxAbsGex) * halfH
        if (h < 0.002) continue
        const geo  = new THREE.BoxGeometry(barW, h, barDepth)
        const mesh = new THREE.Mesh(geo, net >= 0 ? matPos : matNeg)
        mesh.position.set(x, net >= 0 ? yZero + h / 2 : yZero - h / 2, zExpiry + barDepth / 2)
        group.add(mesh)
      }
    }

    // renderOrder=3: in front of VP plane (renderOrder=2) when both are enabled
    group.traverse(child => { child.renderOrder = 3 })
    ctx.scene.add(group)
    gexBarsRef.current = group
  // coordsRef is a ref (not reactive) — we re-run on gexByStrike/gexEnabled/gexMode/carousel changes.
  // The scene-build effect sets coordsRef before this runs (effects run in declaration order).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gexEnabled, gexByStrike, gexMode, strikeViewOffset])

  // ── Price chart floor — LWC chart lifecycle ──────────────────────────────
  useEffect(() => {
    const container = lwcFloorContainerRef.current
    if (!container) return

    if (!priceChartFloorEnabled) {
      // Tear down chart when disabled
      floorLwcChartRef.current?.remove()
      floorLwcChartRef.current = null
      floorSeriesRef.current   = null
      return
    }

    // Only create chart once
    if (floorLwcChartRef.current) return

    const chart = createChart(container, {
      width:  container.clientWidth  || 1024,
      height: container.clientHeight || 512,
      layout: {
        background: { type: 'solid' as any, color: 'rgba(0,0,0,0.88)' },
        textColor:  'rgba(255,255,255,0.35)',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.07)' },
        horzLines: { color: 'rgba(255,255,255,0.07)' },
      },
      rightPriceScale: { borderVisible: false, textColor: 'rgba(255,255,255,0.35)' },
      timeScale:  { borderVisible: false, visible: false },
      crosshair:  { vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale:  false,
    })
    floorLwcChartRef.current = chart

    return () => {
      chart.remove()
      floorLwcChartRef.current = null
      floorSeriesRef.current   = null
    }
  }, [priceChartFloorEnabled])

  // ── Price chart floor — feed candle data to LWC ───────────────────────────
  useEffect(() => {
    const chart = floorLwcChartRef.current
    if (!chart || !floorCandles || floorCandles.length === 0) return

    if (!floorSeriesRef.current) {
      floorSeriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor:         'rgba(34, 204, 102, 0.85)',
        downColor:       'rgba(204, 51,  68, 0.85)',
        borderUpColor:   'rgba(34, 204, 102, 1)',
        borderDownColor: 'rgba(204, 51,  68, 1)',
        wickUpColor:     'rgba(34, 204, 102, 0.55)',
        wickDownColor:   'rgba(204, 51,  68, 0.55)',
      })
    }

    floorSeriesRef.current.setData(floorCandles)
    chart.timeScale().fitContent()

    // Allow LWC one rAF to paint before reading its canvas
    requestAnimationFrame(() => { redrawFloorTexture() })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorCandles, priceChartFloorEnabled])

  // ── Price chart floor — Three.js floor plane ──────────────────────────────
  useEffect(() => {
    const ctx    = sceneCtxRef.current
    const coords = coordsRef.current
    const tex    = floorTextureCanvasRef.current

    priceChartFloorRef.current?.dispose()
    priceChartFloorRef.current = null

    if (!ctx || !coords || !tex || !priceChartFloorEnabled) return

    priceChartFloorRef.current = buildPriceChartFloor(coords, ctx.scene, tex)

    // If LWC has already painted, capture it now
    requestAnimationFrame(() => { redrawFloorTexture() })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceChartFloorEnabled, strikeViewOffset, surfaceData])

  // ── Keyboard accessibility (§10.4) ────────────────────────────────────────
  // ── Juliett-A: Detent keyboard jump helper ─────────────────────────────────
  function jumpToDetent(targetTheta: number, targetPhi: number, resetR?: boolean, targetR?: number) {
    // Ignore if an animation is already running
    if (kbAnimRef.current?.active || reversalAnimRef.current?.active) return
    const cam = camRef.current
    const dur = reduceMotionRef.current ? 0 : KB_JUMP_MS
    kbAnimRef.current = {
      active:     true,
      startTheta: cam.theta,
      startPhi:   cam.phi,
      deltaTh:    shortestDelta(cam.theta, targetTheta),
      deltaPh:    targetPhi - cam.phi,
      startT:     performance.now(),
      durMs:      dur,
    }
    if (targetR != null) cam.R = targetR
    else if (resetR) cam.R = DEFAULT_CAM_R
    scrollVelRef.current = 0
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const data   = surfaceDataRef.current
    const coords = coordsRef.current
    if (!data || data.NX === 0 || !coords) return

    const ig = interrogRef.current

    // ── Juliett-A: Detent shortcut keys (§6.5) ──────────────────────────────
    // Q12 keyboard collision check completed 2026-04-10: no conflicts found in
    // Working surface keyboard handlers for keys 1/2/3/4/R/T/S/I/Home.
    const k = e.key
    if (k === '1' || k === 'r' || k === 'R') {
      e.preventDefault()
      jumpToDetent(DETENTS[0].theta, DETENTS[0].phi)  // RISK
      return
    }
    if (k === '2' || k === 't' || k === 'T') {
      e.preventDefault()
      jumpToDetent(DETENTS[1].theta, DETENTS[1].phi, false, 16)  // TIME
      return
    }
    if (k === '3' || k === 's' || k === 'S') {
      e.preventDefault()
      jumpToDetent(DETENTS[2].theta, DETENTS[2].phi)  // TOP
      return
    }
    // Shift+Home → ISO + R reset (must come before plain Home check)
    if (k === 'Home' && e.shiftKey) {
      e.preventDefault()
      jumpToDetent(DETENTS[3].theta, DETENTS[3].phi, true)
      return
    }
    if (k === '4' || k === 'i' || k === 'I' || k === 'Home') {
      e.preventDefault()
      jumpToDetent(DETENTS[3].theta, DETENTS[3].phi)  // ISO
      return
    }
    // Shift+1/2/3 → mirrors (US keyboard: Shift+1='!', Shift+2='@', Shift+3='#')
    if (e.shiftKey && k === '!') {
      e.preventDefault()
      jumpToDetent(DETENTS[4].theta, DETENTS[4].phi)  // RISK mirror
      return
    }
    // Shift+@ (TIME mirror) removed: −X hemisphere is forbidden (time would run right-to-left)
    if (e.shiftKey && k === '#') {
      e.preventDefault()
      jumpToDetent(DETENTS[2].theta, DETENTS[2].phi)  // TOP mirror = SIDE (phi=0 collapses)
      return
    }

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault()
      // If no active keyboard marker, start at surface center
      let i = ig.lastGridI >= 0 ? ig.lastGridI : Math.floor(data.NT / 2)
      let j = ig.lastGridJ >= 0 ? ig.lastGridJ : Math.floor(data.NX / 2)

      if (e.key === 'ArrowLeft')  j = Math.max(0, j - 1)
      if (e.key === 'ArrowRight') j = Math.min(data.NX - 1, j + 1)
      if (e.key === 'ArrowUp')    i = Math.max(0, i - 1)   // up = less elapsed = farther from expiry
      if (e.key === 'ArrowDown')  i = Math.min(data.NT - 1, i + 1)

      ig.lastGridI = i; ig.lastGridJ = j

      // Update contact marker position
      const pnl    = data.pnlBuffer[i * data.NX + j] ?? 0
      const worldX = coords.nx(data.spotSlices[j])
      const worldY = coords.ny(pnl)
      const worldZ = coords.nz(data.T_max - data.timeSlices[i])
      if (contactMarkerRef.current) {
        contactMarkerRef.current.mesh.position.set(worldX, worldY, worldZ)
        contactMarkerRef.current.mesh.scale.setScalar(1)
        contactMarkerRef.current.mesh.visible = true
      }
      ig.markerSc = 1

      // Update guide line from marker to y=0
      if (guideLineRef.current) {
        _v3S1.set(worldX, worldY, worldZ)
        guideLineRef.current.updateEndpoints(_v3S1, coords.ny(0))
        guideLineRef.current.mat.opacity = 0.8
        guideLineRef.current.line.visible = true
        ig.guideOp = 0.8
      }
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '600px', position: 'relative', outline: 'none' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="3D Risk Graph — interactive surface. Arrow keys move contact marker."
    >
      {/* Three.js canvas is injected here by initScene */}

      {/* ── Juliett-B: RISK detent overlay — PnLChart (§5.8.4.1) ─────────── */}
      {/* Always mounted; opacity driven imperatively by camera rAF. pointer-events: none per §5.8.4.4 */}
      <div
        ref={riskOverlayRef}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0, pointerEvents: 'none', zIndex: 5,
          background: 'var(--bg-canvas, #000)',
        }}
      >
        {/* Render whenever we have position data OR GEX to show.
            When positions are hidden, pnlChartData is null but GEX must
            remain visible — PnLChart auto-fits to the GEX strike range. */}
        {(pnlChartData || (gexEnabled && gexByStrike && Object.keys(gexByStrike).length > 0)) && (
          <PnLChart
            expirationData={pnlChartData?.expirationData ?? []}
            theoreticalData={pnlChartData?.theoreticalData ?? []}
            spotPrice={initialSpot ?? spotRef.current}
            expirationBreakevens={pnlChartData?.expirationBreakevens ?? []}
            theoreticalBreakevens={pnlChartData?.theoreticalBreakevens ?? []}
            strikes={pnlChartData?.strikes ?? []}
            gexByStrike={gexEnabled ? gexByStrike ?? undefined : undefined}
            renderBackdrop={gexEnabled && gexByStrike && Object.keys(gexByStrike).length > 0
              ? renderGexBackdrop
              : undefined}
          />
        )}
      </div>

      {/* ── CHART detent overlay — 2D price chart, mirrors RISK detent overlay ── */}
      {/* opacity driven imperatively by camera rAF. pointer-events: none */}
      <div
        ref={chartOverlayRef}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0, pointerEvents: 'none', zIndex: 6,
          background: 'var(--bg-canvas, #000)',
        }}
      >
        <PriceTimeChart
          symbol={symbol ?? 'SPX'}
          mode="live"
          visible={true}
          timeframe={chartTimeframe}
          sessionOnly={chartSessionOnly}
          showSessionLines={chartSessionLines}
          entries={entries}
          spot={initialSpot ?? spotRef.current}
          chainIV={chainIV}
          gexEnabled={gexEnabled}
          vpEnabled={vpEnabled}
          msEnabled={msEnabled}
          canonicalStrikeMap={canonicalStrikeMap}
        />
      </div>

      {/* ── Price chart floor: hidden LWC container (off-screen, 1024×512) ── */}
      {/* LWC needs to be in the DOM with explicit dimensions to render its canvas. */}
      {/* We read the canvas texture via querySelector('canvas') after each paint.  */}
      <div
        ref={lwcFloorContainerRef}
        style={{
          position:      'fixed',
          left:          '-9999px',
          top:           '0',
          width:         '1024px',
          height:        '512px',
          visibility:    'hidden',
          pointerEvents: 'none',
        }}
      />

      {/* ── Chart / Risk mode label — direct DOM write by camera rAF ─── */}
      <div
        ref={viewModeLabelRef}
        style={{
          position:      'absolute',
          bottom:        '52px',
          left:          '50%',
          transform:     'translateX(-50%)',
          color:         'rgba(255,255,255,0.35)',
          fontSize:      '10px',
          letterSpacing: '0.14em',
          fontFamily:    'monospace',
          pointerEvents: 'none',
          userSelect:    'none',
        }}
      >
        RISK
      </div>

      {/* ── Juliett-A: Detent indicator + camera info panel (§6.4.3) ───── */}
      <DetentIndicator
        active={indicatorDetent}
        camInfoRef={camInfoRef}
        getCam={() => ({ ...camRef.current })}
        onJump={(key, mirror) => {
          if (key === 'RISK')  jumpToDetent(mirror ? DETENTS[4].theta : DETENTS[0].theta, DETENTS[0].phi)
          if (key === 'CHART') jumpToDetent(DETENTS[CHART_DETENT_IDX].theta, DETENTS[CHART_DETENT_IDX].phi)
        }}
        onJumpToCam={(theta, phi, R) => jumpToDetent(theta, phi, false, R)}
        onAutoFit={() => {
          panOffsetRef.current.set(0, 0, 0)
          setStrikeViewOffset(0)
          strikeViewOffsetRef.current = 0
          camRef.current.R = DEFAULT_CAM_R
        }}
      />

      {/* ── Camera projection toggle (upper-right) ─────────────────────── */}
      {/* Manual override of the auto perspective↔ortho swap.  Auto-switching
          fires only on RISK detent lock-state transitions, so this toggle
          stays sticky between detent moves. */}
      <button
        onClick={() => {
          const next = cameraMode === 'orthographic' ? 'perspective' : 'orthographic'
          setCameraMode(next)
          const ctxNow = sceneCtxRef.current
          if (ctxNow && (ctxNow as any).setCameraMode) {
            (ctxNow as any).setCameraMode(next)
          }
        }}
        style={{
          position: 'absolute', top: 12, right: 12, zIndex: 15,
          padding: '6px 12px', height: 28,
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 8,
          color: 'rgba(255,255,255,0.85)',
          fontFamily: '"Courier New", monospace',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          cursor: 'pointer',
          transition: 'background 150ms, border 150ms, color 150ms',
        }}
        aria-label={`Camera projection: ${cameraMode}. Click to toggle.`}
        aria-pressed={cameraMode === 'orthographic'}
        title={cameraMode === 'orthographic' ? 'Orthographic — click for perspective' : 'Perspective — click for orthographic'}
      >
        {cameraMode === 'orthographic' ? 'ORTHO' : 'PERSP'}
      </button>

    </div>
  )
}

// ─── Juliett-A: DetentIndicator (§6.4.3) ─────────────────────────────────────

// ─── Programmable slot system (6 slots, localStorage persistence) ─────────────

const SLOT_COUNT = 6
const SLOT_LS_KEY = (i: number) => `rg3d_slot_${i}`

interface SlotDefault {
  theta: number
  phi:   number
  R:     number
  label: string
}

const SLOT_DEFAULTS: SlotDefault[] = [
  { theta: Math.PI / 2,        phi: Math.PI / 8,        R: DEFAULT_CAM_R,       label: 'TOP'  },
  { theta: Math.PI / 4,        phi: Math.PI / 3,        R: DEFAULT_CAM_R,       label: 'ISO'  },
  { theta: 0,                  phi: Math.PI / 2,        R: DEFAULT_CAM_R,       label: 'RISK' },
  { theta: 130 * DEG2RAD,      phi: 85 * DEG2RAD,       R: DEFAULT_CAM_R + 2,   label: 'TIME' },
  { theta: Math.PI / 2,        phi: Math.PI / 2,        R: DEFAULT_CAM_R,       label: 'SIDE' },
  { theta: Math.PI / 4,        phi: Math.PI / 4,        R: DEFAULT_CAM_R * 1.5, label: 'WIDE' },
]

function loadSlot(i: number): SlotDefault {
  try {
    const raw = localStorage.getItem(SLOT_LS_KEY(i))
    if (raw) {
      const p = JSON.parse(raw)
      if (typeof p.theta === 'number' && typeof p.phi === 'number' && typeof p.R === 'number') {
        return { ...SLOT_DEFAULTS[i], theta: p.theta, phi: p.phi, R: p.R }
      }
    }
  } catch {}
  return SLOT_DEFAULTS[i]
}

function saveSlot(i: number, cam: { theta: number; phi: number; R: number }): void {
  localStorage.setItem(SLOT_LS_KEY(i), JSON.stringify(cam))
}

function resetSlot(i: number): void {
  localStorage.removeItem(SLOT_LS_KEY(i))
}

function isSlotCustomized(i: number): boolean {
  return localStorage.getItem(SLOT_LS_KEY(i)) !== null
}

const menuItemStyle: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left',
  padding: '7px 14px',
  background: 'transparent', border: 'none',
  color: 'rgba(255,255,255,0.85)',
  fontFamily: '"Courier New", monospace', fontSize: 11,
  letterSpacing: '0.04em',
  cursor: 'pointer',
}

interface DetentIndicatorProps {
  active:      'RISK' | 'TIME' | 'TOP' | 'ISO' | 'CHART' | 'FREE'
  onJump:      (key: 'RISK' | 'CHART', mirror?: boolean) => void
  onJumpToCam: (theta: number, phi: number, R: number) => void
  onAutoFit:   () => void
  camInfoRef:  React.RefObject<HTMLDivElement | null>
  getCam:      () => { theta: number; phi: number; R: number }
}

function DetentIndicator({ active, onJump, onJumpToCam, onAutoFit, camInfoRef, getCam }: DetentIndicatorProps) {
  // Track which slots have been customized (reads localStorage on mount)
  const [customized, setCustomized] = useState<boolean[]>(() =>
    Array.from({ length: SLOT_COUNT }, (_, i) => isSlotCustomized(i))
  )
  // Context menu: which slot index is open, and screen position
  const [menuSlot, setMenuSlot] = useState<number | null>(null)
  const [menuPos,  setMenuPos]  = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close context menu on outside click
  useEffect(() => {
    if (menuSlot === null) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuSlot(null); setMenuPos(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuSlot])

  return (
    <div
      style={{
        position: 'absolute', bottom: 12, left: 12,
        display: 'flex', flexDirection: 'column', gap: 6,
        zIndex: 15, pointerEvents: 'auto',
      }}
      aria-label="Camera detent indicator"
    >
      {/* ── 6 programmable slots (3 rows × 2 columns) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {Array.from({ length: SLOT_COUNT }, (_, i) => {
          const slot = loadSlot(i)
          const isCustom = customized[i]
          return (
            <button
              key={i}
              onClick={() => onJumpToCam(slot.theta, slot.phi, slot.R)}
              onContextMenu={e => {
                e.preventDefault()
                setMenuSlot(i)
                setMenuPos({ x: e.clientX, y: e.clientY })
              }}
              style={{
                position:   'relative',
                width:      72, height: 56,
                background: 'rgba(0,0,0,0.55)',
                border:     '1px solid rgba(255,255,255,0.14)',
                borderRadius: 8,
                color:      'rgba(255,255,255,0.45)',
                fontFamily: '"Courier New", monospace',
                fontSize:   12,
                cursor:     'pointer',
                letterSpacing: '0.06em',
                transition: 'background 150ms, border 150ms, color 150ms',
              }}
              aria-label={`Jump to slot ${i + 1}: ${slot.label}`}
            >
              {slot.label}
              {isCustom && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'rgba(255,200,80,0.9)',
                  pointerEvents: 'none',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Fixed mode detents — RISK | CHART ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {(['RISK', 'CHART'] as const).map(key => {
          const isActive = active === key
          const isChart  = key === 'CHART'
          return (
            <button
              key={key}
              onClick={() => onJump(key)}
              style={{
                height:     36,
                background: isActive
                  ? isChart ? 'rgba(255,200,100,0.18)' : 'rgba(255,255,255,0.18)'
                  : 'rgba(0,0,0,0.55)',
                border: isActive
                  ? isChart
                    ? '1px solid rgba(255,200,100,0.65)'
                    : '1px solid rgba(255,255,255,0.55)'
                  : '1px solid rgba(255,255,255,0.14)',
                borderRadius: 8,
                color: isActive
                  ? isChart ? 'rgba(255,200,100,1)' : '#fff'
                  : 'rgba(255,255,255,0.45)',
                fontFamily: '"Courier New", monospace',
                fontSize:   12,
                fontWeight: isActive ? 700 : 400,
                cursor:     'pointer',
                letterSpacing: '0.06em',
                transition: 'background 150ms, border 150ms, color 150ms',
              }}
              aria-label={`Jump to ${key} detent`}
              aria-pressed={isActive}
            >
              {key}
            </button>
          )
        })}
      </div>

      {/* ── Auto-fit button ── */}
      <button
        onClick={onAutoFit}
        style={{
          height: 36,
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 8,
          color: 'rgba(255,255,255,0.45)',
          fontFamily: '"Courier New", monospace',
          fontSize: 12,
          cursor: 'pointer',
          letterSpacing: '0.06em',
          transition: 'background 150ms, border 150ms, color 150ms',
        }}
        aria-label="Auto-fit view to positions"
      >
        FIT
      </button>

      {/* ── Camera info pill ── */}
      <div
        ref={camInfoRef}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center',
          fontSize: 11,
          fontFamily: 'IBM Plex Mono, monospace',
          color: 'rgba(255,255,255,0.55)',
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '5px 10px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        θ –  φ –  R –
      </div>

      {/* ── Slot context menu ── */}
      {menuSlot !== null && menuPos && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed', top: menuPos.y, left: menuPos.x,
            background: 'rgba(20,20,20,0.96)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '4px 0',
            zIndex: 9999,
            minWidth: 160,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <button
            style={menuItemStyle}
            onClick={() => {
              const cam = getCam()
              saveSlot(menuSlot, cam)
              setCustomized(prev => {
                const next = [...prev]; next[menuSlot] = true; return next
              })
              setMenuSlot(null); setMenuPos(null)
            }}
          >
            Save current view
          </button>
          <button
            style={{
              ...menuItemStyle,
              opacity: customized[menuSlot] ? 1 : 0.35,
              cursor:  customized[menuSlot] ? 'pointer' : 'default',
            }}
            disabled={!customized[menuSlot]}
            onClick={() => {
              if (!customized[menuSlot]) return
              resetSlot(menuSlot)
              setCustomized(prev => {
                const next = [...prev]; next[menuSlot] = false; return next
              })
              setMenuSlot(null); setMenuPos(null)
            }}
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  )
}

// ─── RT P&L helper ────────────────────────────────────────────────────────────

function computeRTPnL(data: SurfaceData | null, spot: number): number {
  if (!data || data.pnlBuffer.length === 0 || data.NX === 0) return 0
  const { pnlBuffer, spotSlices, NX } = data
  const j = spotSlices.findIndex(s => s >= spot)
  if (j < 0)   return pnlBuffer[NX - 1] ?? 0
  if (j === 0) return pnlBuffer[0] ?? 0
  const t = (spot - spotSlices[j - 1]) / (spotSlices[j] - spotSlices[j - 1])
  return (pnlBuffer[j - 1] ?? 0) + t * ((pnlBuffer[j] ?? 0) - (pnlBuffer[j - 1] ?? 0))
}
