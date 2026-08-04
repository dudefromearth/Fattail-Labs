/**
 * RiskGraphBackdrop - Dealer Gravity visualization backdrop for Risk Graph
 *
 * LANDSCAPE ORIENTATION: Risk Graph has price on X-axis, P&L on Y-axis.
 * Volume Profile bars extend VERTICALLY from the bottom edge.
 * Structural lines are VERTICAL at specific price levels.
 *
 * Architectural Rules (Non-Negotiable):
 *   - Renders BEHIND all Risk Graph elements (z-index)
 *   - Shares EXACT same price scale as Risk Graph (X-axis)
 *   - Resizes and zooms in perfect sync
 *   - Never introduces independent axes or layout logic
 *   - Risk Graph remains visually dominant
 *
 * Dealer Gravity Lexicon:
 *   - Volume Node: Concentrated attention (yellow vertical lines)
 *   - Volume Well: Neglect (purple vertical lines)
 *   - Crevasse: Extended scarcity region (red vertical zones)
 *   - Market Memory: Persistent topology
 */

import { useMemo } from 'react';
import { useDealerGravity } from '../contexts/DealerGravityContext';
import type { DGStructures, DGProfile, DGArtifact } from '../types/dealerGravity';
import {
  massInsideSigma,
  massTailBeyondSigma,
  massBetweenSigmaShell,
  formatProbMassPct,
} from '../../lib/pricing/probRange';

/** GEX data by strike price */
export interface GexByStrike {
  [strike: number]: { calls: number; puts: number };
}

/** GEX display configuration (from indicator settings) */
export interface GexBackdropConfig {
  callColor: string;
  putColor: string;
  mode: 'combined' | 'net' | 'abs';
  heightPercent: number;          // Max bar height as % of chart (5-50)
  zgrDotMinRadius?: number;
  zgrDotMaxRadius?: number;
  zgrLineBaseAlpha?: number;
  zgrLineProximityBoost?: number;
  zgrDotBaseOpacity?: number;
  zgfzExponentMin?: number;
  zgfzExponentRange?: number;
  zgrMinAbsNet?: number;
}

/** VP display configuration (from indicator settings) */
export interface VPBackdropConfig {
  color: string;
  widthPercent: number;  // Controls VP bar max height (landscape orientation)
  mode?: 'raw' | 'tv';  // raw = spiky VWAP, tv = smoothed distribution
  rowsLayout: 'number_of_rows' | 'ticks_per_row';
  rowSize: number;
  transparency: number;
  cappingSigma?: number;  // Outlier capping threshold in sigma (1-5)
}

/** Default structural line colors */
const DEFAULT_STRUCTURE_COLORS = {
  node: '#ffff00',    // Bright yellow - volume edges/ledges
  well: '#9333ea',    // Purple - neglect
  crevasse: '#ef4444', // Red - structural void
};

export type StructureColors = typeof DEFAULT_STRUCTURE_COLORS;

interface RiskGraphBackdropProps {
  /** Chart container dimensions */
  width: number;
  height: number;

  /** Price range from Risk Graph X-axis (must match exactly) */
  priceMin: number;
  priceMax: number;

  /** Optional spot price for reference line */
  spotPrice?: number;

  /** Toggle controls */
  showVolumeProfile?: boolean;
  showGex?: boolean;
  showStructuralLines?: boolean;
  showMS?: boolean;
  /** Probability range band (lognormal expected move) — rearmost layer */
  showProb?: boolean;
  /** Primary fill band (selected nΣ) */
  probLo?: number;
  probHi?: number;
  /**
   * Multi-σ ladder rings (typically 1 / 1.5 / 2). Drawn as thin edge lines only
   * for a minimal chart. Primary fill still uses probLo/probHi.
   */
  probRings?: readonly { nSigma: number; lo: number; hi: number }[];
  /** Selected primary nΣ (for labeling the filled band edges when not on the fixed ladder). */
  probPrimaryNSigma?: number;

  /** Opacity (0-1) */
  opacity?: number;

  /** Height percentage for volume bars (from bottom) - DEPRECATED, use vpConfig */
  volumeHeightPercent?: number;

  /** GEX data for backdrop (from App.tsx) */
  gexByStrike?: GexByStrike;

  /** GEX display config (from indicator settings) */
  gexConfig?: GexBackdropConfig;

  /** VP display config (from indicator settings) */
  vpConfig?: VPBackdropConfig;

  /** Optional artifact override — falls back to DealerGravityContext if not provided */
  vpArtifact?: DGArtifact | null;

  /** Custom colors for structural lines (nodes, wells, crevasses) */
  structureColors?: Partial<StructureColors>;
  zgfzIntensity?: number;
}

/**
 * Convert price to X coordinate (LANDSCAPE orientation)
 * Price axis is horizontal in Risk Graph
 */
function priceToX(
  price: number,
  priceMin: number,
  priceMax: number,
  width: number
): number {
  const range = priceMax - priceMin;
  if (range <= 0) return width / 2;
  return ((price - priceMin) / range) * width;
}

/** Compact nΣ edge label: 1 → "1σ", 1.5 → "1.5σ", 1.25 → "1.25σ". */
function formatProbSigmaLabel(nSigma: number): string {
  if (!Number.isFinite(nSigma) || nSigma <= 0) return '?σ';
  const s = Number.isInteger(nSigma)
    ? String(nSigma)
    : (Math.round(nSigma * 100) / 100).toString();
  return `${s}σ`;
}

/**
 * Probability-mass segments for the PROB ladder (log-space normal).
 * Not ToS price slices — fixed σ shells only: outside / between / core.
 * One-sided shells get half of the two-sided annulus mass (symmetric model).
 */
function buildProbMassRegions(
  rings: readonly { nSigma: number; lo: number; hi: number }[],
): {
  priceLo: number;
  priceHi: number;
  mass: number;
  kind: 'tail' | 'shell' | 'core';
}[] {
  if (rings.length === 0) return [];
  const sorted = [...rings].sort((a, b) => a.nSigma - b.nSigma);
  const out: {
    priceLo: number;
    priceHi: number;
    mass: number;
    kind: 'tail' | 'shell' | 'core';
  }[] = [];

  const core = sorted[0];
  out.push({
    priceLo: core.lo,
    priceHi: core.hi,
    mass: massInsideSigma(core.nSigma),
    kind: 'core',
  });

  for (let i = 0; i < sorted.length; i++) {
    const inner = sorted[i];
    const outer = sorted[i + 1];
    if (outer) {
      const halfShell = massBetweenSigmaShell(inner.nSigma, outer.nSigma) / 2;
      out.push({
        priceLo: outer.lo,
        priceHi: inner.lo,
        mass: halfShell,
        kind: 'shell',
      });
      out.push({
        priceLo: inner.hi,
        priceHi: outer.hi,
        mass: halfShell,
        kind: 'shell',
      });
    } else {
      const tail = massTailBeyondSigma(inner.nSigma);
      out.push({
        priceLo: Number.NEGATIVE_INFINITY,
        priceHi: inner.lo,
        mass: tail,
        kind: 'tail',
      });
      out.push({
        priceLo: inner.hi,
        priceHi: Number.POSITIVE_INFINITY,
        mass: tail,
        kind: 'tail',
      });
    }
  }
  return out;
}

/**
 * Volume Profile Backdrop (LANDSCAPE)
 * Renders VERTICAL bars from the BOTTOM edge showing volume distribution.
 * Price is on X-axis, bar height represents volume.
 *
 * Supports TradingView-style binning:
 * - number_of_rows: Fixed count of rows across visible range
 * - ticks_per_row: Fixed tick size per row
 *
 * IMPORTANT: Bars are rendered edge-to-edge with MAXIMAL thickness.
 * No gaps between adjacent bars - each bar fills its entire allocated space.
 */
function VolumeProfileLayer({
  profile,
  width,
  height,
  priceMin,
  priceMax,
  spotPrice,
  opacity = 0.3,
  color = '#3b82f6',
  heightPercent = 25,
  cappingSigma = 2.75,
  mode = 'tv',
  rowSize = 1000,
}: {
  profile: DGProfile;
  width: number;
  height: number;
  priceMin: number;
  priceMax: number;
  spotPrice?: number;
  opacity?: number;
  color?: string;
  heightPercent?: number;
  cappingSigma?: number;
  mode?: 'raw' | 'tv';
  rowSize?: number;
}) {
  const areaPath = useMemo(() => {
    if (!profile?.bins?.length) return '';

    const priceRange = priceMax - priceMin;
    if (priceRange <= 0) return '';

    // Max height for volume bars (percentage of chart height, from bottom)
    const maxBarHeight = (height * heightPercent) / 100;

    // Determine bin range: rowSize bins centered on spot, clamped to visible chart range
    const chartStartIdx = Math.max(0, Math.floor((priceMin - profile.min) / profile.step));
    const chartEndIdx = Math.min(profile.bins.length - 1, Math.ceil((priceMax - profile.min) / profile.step));

    let startIdx: number, endIdx: number;
    if (spotPrice != null && rowSize < profile.bins.length) {
      // Spot-centered: show rowSize bins around spot
      const spotIdx = Math.round((spotPrice - profile.min) / profile.step);
      const halfRows = Math.floor(rowSize / 2);
      startIdx = Math.max(chartStartIdx, spotIdx - halfRows);
      endIdx = Math.min(chartEndIdx, spotIdx + halfRows);
    } else {
      // Fallback: show all bins in visible chart range
      startIdx = chartStartIdx;
      endIdx = chartEndIdx;
    }

    // Find max volume for normalization
    let maxVol = 0;
    for (let i = startIdx; i <= endIdx; i++) {
      if (profile.bins[i] > maxVol) maxVol = profile.bins[i];
    }
    if (maxVol === 0) return '';

    // Apply sigma-based outlier capping
    let normMax = maxVol;
    if (cappingSigma > 0) {
      let sum = 0, count = 0;
      for (let i = startIdx; i <= endIdx; i++) {
        if (profile.bins[i] > 0) { sum += profile.bins[i]; count++; }
      }
      if (count > 1) {
        const mean = sum / count;
        let sumSqDiff = 0;
        for (let i = startIdx; i <= endIdx; i++) {
          if (profile.bins[i] > 0) { sumSqDiff += (profile.bins[i] - mean) ** 2; }
        }
        const stddev = Math.sqrt(sumSqDiff / (count - 1));
        if (stddev > 0) {
          normMax = Math.min(maxVol, mean + cappingSigma * stddev);
        }
      }
    }

    // Collect raw bin volumes for the selected range
    const binCount = endIdx - startIdx + 1;
    const rawVolumes: number[] = new Array(binCount);
    for (let i = 0; i < binCount; i++) {
      rawVolumes[i] = profile.bins[startIdx + i];
    }

    // TV mode: smooth with 3-bin moving average
    let renderVolumes = rawVolumes;
    if (mode === 'tv' && binCount > 5) {
      renderVolumes = new Array(binCount).fill(0);
      for (let i = 0; i < binCount; i++) {
        const lo = Math.max(0, i - 1);
        const hi = Math.min(binCount - 1, i + 1);
        let s = 0, cnt = 0;
        for (let j = lo; j <= hi; j++) { s += rawVolumes[j]; cnt++; }
        renderVolumes[i] = s / cnt;
      }
    }

    // Build polygon from selected bins
    const points: string[] = [];
    const firstPrice = profile.min + startIdx * profile.step;
    const firstX = ((firstPrice - priceMin) / priceRange) * width;
    points.push(`${firstX},${height}`);

    for (let i = 0; i < binCount; i++) {
      const price = profile.min + (startIdx + i) * profile.step;
      const x = ((price - priceMin) / priceRange) * width;
      const barH = (Math.min(renderVolumes[i], normMax) / normMax) * maxBarHeight;
      points.push(`${x},${height - barH}`);
    }

    const lastPrice = profile.min + endIdx * profile.step;
    const lastX = ((lastPrice - priceMin) / priceRange) * width;
    points.push(`${lastX},${height}`);

    return points.join(' ');
  }, [profile, width, height, priceMin, priceMax, spotPrice, heightPercent, cappingSigma, mode, rowSize]);

  if (!areaPath) return null;

  return (
    <g className="volume-profile-layer" opacity={opacity}>
      <polygon
        points={areaPath}
        fill={color}
      />
    </g>
  );
}

/**
 * Find zero-gamma crossings: prices where net GEX interpolates through zero
 * between adjacent strikes. Returns the interpolated price for each crossing.
 */
function findZeroGammaCrossings(gexByStrike: GexByStrike): number[] {
  const entries = Object.entries(gexByStrike)
    .map(([s, v]) => ({ strike: parseFloat(s), net: v.calls + v.puts }))
    .sort((a, b) => a.strike - b.strike);

  if (entries.length < 2) return [];

  const crossings: number[] = [];
  for (let i = 0; i < entries.length - 1; i++) {
    const a = entries[i];
    const b = entries[i + 1];
    // Sign change means zero crossing between these two strikes
    if ((a.net > 0 && b.net < 0) || (a.net < 0 && b.net > 0)) {
      // Linear interpolation to find zero crossing price
      const t = Math.abs(a.net) / (Math.abs(a.net) + Math.abs(b.net));
      crossings.push(a.strike + t * (b.strike - a.strike));
    } else if (a.net === 0) {
      crossings.push(a.strike);
    }
  }
  // Check last entry
  const last = entries[entries.length - 1];
  if (last.net === 0) crossings.push(last.strike);

  return crossings;
}

const ZERO_GAMMA_COLOR = '#ffffff'; // Indicator color

function GexLayer({
  gexByStrike,
  width,
  height,
  priceMin,
  priceMax,
  spotPrice,
  opacity = 0.4,
  callColor = '#22c55e',
  putColor = '#ef4444',
  mode = 'combined',
  heightPercent = 40,
  showZgfz = false,
  zgfzIntensity = 50,
  zgrDotMinRadius = 3,
  zgrDotMaxRadius = 12,
  zgrLineBaseAlpha = 0.15,
  zgrLineProximityBoost = 0.35,
  zgrDotBaseOpacity = 0.3,
  zgfzExponentMin = 0.15,
  zgfzExponentRange = 7.85,
  zgrMinAbsNet = 0,
}: {
  gexByStrike: GexByStrike;
  width: number;
  height: number;
  priceMin: number;
  priceMax: number;
  spotPrice?: number;
  opacity?: number;
  callColor?: string;
  putColor?: string;
  mode?: 'combined' | 'net' | 'abs';
  heightPercent?: number;
  showZgfz?: boolean;
  zgfzIntensity?: number;
  zgrDotMinRadius?: number;
  zgrDotMaxRadius?: number;
  zgrLineBaseAlpha?: number;
  zgrLineProximityBoost?: number;
  zgrDotBaseOpacity?: number;
  zgfzExponentMin?: number;
  zgfzExponentRange?: number;
  zgrMinAbsNet?: number;
}) {
  const bars = useMemo(() => {
    const entries = Object.entries(gexByStrike);
    if (entries.length === 0) return [];

    const priceRange = priceMax - priceMin;
    if (priceRange <= 0) return [];

    // Find max GEX for normalization — net/abs use net values, combined uses individual
    let maxGex = 0;
    if (mode === 'net') {
      for (const [, { calls, puts }] of entries) {
        maxGex = Math.max(maxGex, Math.abs(calls + puts));
      }
    } else if (mode === 'abs') {
      for (const [, { calls, puts }] of entries) {
        maxGex = Math.max(maxGex, Math.abs(calls) + Math.abs(puts));
      }
    } else {
      for (const [, { calls, puts }] of entries) {
        maxGex = Math.max(maxGex, Math.abs(calls), Math.abs(puts));
      }
    }
    if (maxGex === 0) return [];

    const maxBarHeight = height * (heightPercent / 100); // Max % of height each direction

    // Calculate bar width based on strike density
    const strikes = entries.map(([s]) => parseFloat(s)).sort((a, b) => a - b);
    const strikeSpacing = strikes.length > 1
      ? Math.min(...strikes.slice(1).map((s, i) => s - strikes[i]))
      : 5;
    const barWidth = Math.max(1, (strikeSpacing / priceRange) * width * 0.8);

    const result: {
      x: number;
      callHeight: number;
      putHeight: number;
      barWidth: number;
    }[] = [];

    for (const [strikeStr, { calls, puts }] of entries) {
      const strike = parseFloat(strikeStr);
      if (strike < priceMin || strike > priceMax) continue;
      if (zgrMinAbsNet > 0 && Math.abs(calls + puts) < zgrMinAbsNet) continue;

      const x = priceToX(strike, priceMin, priceMax, width) - barWidth / 2;

      if (mode === 'net') {
        // Net mode: single bar showing net GEX (puts already negative from API)
        const net = calls + puts;
        result.push({
          x,
          callHeight: net > 0 ? (net / maxGex) * maxBarHeight : 0,
          putHeight: net < 0 ? (Math.abs(net) / maxGex) * maxBarHeight : 0,
          barWidth,
        });
      } else if (mode === 'abs') {
        // Abs mode: |calls| + |puts|, always positive, single upward bar
        const absVal = Math.abs(calls) + Math.abs(puts);
        result.push({
          x,
          callHeight: (absVal / maxGex) * maxBarHeight,
          putHeight: 0,
          barWidth,
        });
      } else {
        // Combined mode: separate call and put bars
        result.push({
          x,
          callHeight: (Math.abs(calls) / maxGex) * maxBarHeight,
          putHeight: (Math.abs(puts) / maxGex) * maxBarHeight,
          barWidth,
        });
      }
    }

    return result;
  }, [gexByStrike, width, height, priceMin, priceMax, mode, heightPercent, zgrMinAbsNet]);

  // Zero-gamma crossings — always visible, proximity scales dot size/brightness
  const zeroCrossings = useMemo(() => {
    const crossings = findZeroGammaCrossings(gexByStrike);
    if (crossings.length === 0) return [];

    // Use visible price range as the proximity reference
    const visibleRange = priceMax - priceMin;

    return crossings
      .filter(price => price >= priceMin && price <= priceMax)
      .map(price => {
        const x = priceToX(price, priceMin, priceMax, width);
        // Proximity: 1.0 at the crossing, 0.0 at the edge of the visible range
        let proximity = 0;
        if (spotPrice != null) {
          const dist = Math.abs(spotPrice - price);
          proximity = Math.max(0, 1 - dist / (visibleRange * 0.5));
        }
        const r = zgrDotMinRadius + proximity * (zgrDotMaxRadius - zgrDotMinRadius);
        // Line opacity: baseline + proximity boost
        const lineOpacity = zgrLineBaseAlpha + proximity * zgrLineProximityBoost;
        // Dot opacity: always visible at base, ramps to 1.0 as spot nears
        const dotOpacity = zgrDotBaseOpacity + proximity * (1 - zgrDotBaseOpacity);
        return { x, r, lineOpacity, dotOpacity, price };
      });
  }, [gexByStrike, spotPrice, priceMin, priceMax, width, zgrDotMinRadius, zgrDotMaxRadius, zgrLineBaseAlpha, zgrLineProximityBoost, zgrDotBaseOpacity]);

  // ZGFZ gradient — continuous heatmap: green (positive gamma) → yellow (zero) → red (negative)
  const zgfzGradientId = useMemo(() => `zgfz-grad-${Math.random().toString(36).slice(2, 8)}`, []);
  const zgfzStops = useMemo(() => {
    const sorted = Object.entries(gexByStrike)
      .map(([s, v]) => ({ strike: parseFloat(s), net: v.calls + v.puts }))
      .filter(e => e.strike >= priceMin && e.strike <= priceMax)
      .sort((a, b) => a.strike - b.strike);
    if (sorted.length < 2) return [];

    // Find max absolute net for normalization
    let maxNet = 0;
    for (const e of sorted) maxNet = Math.max(maxNet, Math.abs(e.net));
    if (maxNet === 0) return [];

    // Map each strike to a gradient stop: green → yellow → red
    // zgfzIntensity controls color separation via power curve:
    // 0=all yellow (exponent 8, compresses everything to center)
    // 100=full saturated red/green (exponent 0.15, expands differences)
    const scale = zgfzIntensity / 100;
    const exponent = zgfzExponentMin + (1 - scale) * zgfzExponentRange;

    return sorted.map(e => {
      const pct = ((e.strike - priceMin) / (priceMax - priceMin)) * 100;
      const rawT = e.net / maxNet; // -1 to +1
      const sign = rawT >= 0 ? 1 : -1;
      const t = sign * Math.pow(Math.abs(rawT), exponent);
      // t=+1 → green, t=0 → yellow, t=-1 → red
      let r: number, g: number, b: number;
      if (t >= 0) {
        // yellow(234,179,8) → green(34,197,94)
        r = Math.round(234 + (34 - 234) * t);
        g = Math.round(179 + (197 - 179) * t);
        b = Math.round(8 + (94 - 8) * t);
      } else {
        // yellow(234,179,8) → red(239,68,68)
        const nt = Math.abs(t);
        r = Math.round(234 + (239 - 234) * nt);
        g = Math.round(179 + (68 - 179) * nt);
        b = Math.round(8 + (68 - 8) * nt);
      }
      return { offset: `${pct}%`, color: `rgb(${r},${g},${b})` };
    });
  }, [gexByStrike, priceMin, priceMax, zgfzIntensity, zgfzExponentMin, zgfzExponentRange]);

  const centerY = height / 2;

  return (
    <g className="gex-layer" opacity={opacity}>
      {/* ZGFZ continuous gradient behind GEX bars */}
      {showZgfz && zgfzStops.length > 0 && (
        <>
          <defs>
            <linearGradient id={zgfzGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {zgfzStops.map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={`url(#${zgfzGradientId})`}
            opacity={0.7}
          />
        </>
      )}

      {bars.map((bar, i) => (
        <g key={i}>
          {/* Call bar - extends UP from center (blue in abs mode) */}
          {bar.callHeight > 0 && (
            <rect
              x={bar.x}
              y={centerY - bar.callHeight}
              width={bar.barWidth}
              height={bar.callHeight}
              fill={mode === 'abs' ? '#3b82f6' : callColor}
            />
          )}
          {/* Put bar - extends DOWN from center (hidden in abs mode) */}
          {bar.putHeight > 0 && (
            <rect
              x={bar.x}
              y={centerY}
              width={bar.barWidth}
              height={bar.putHeight}
              fill={putColor}
            />
          )}
        </g>
      ))}

      {/* Zero-gamma crossings — vertical line always visible, dot grows with proximity */}
      {zeroCrossings.map((zc, i) => (
        <g key={`zg-${i}`}>
          {/* Vertical reference line — always present */}
          <line
            x1={zc.x}
            y1={0}
            x2={zc.x}
            y2={height}
            stroke={ZERO_GAMMA_COLOR}
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={zc.lineOpacity}
          />
          {/* Dot on the zero axis — grows as spot approaches */}
          <circle
            cx={zc.x}
            cy={centerY}
            r={zc.r}
            fill={ZERO_GAMMA_COLOR}
            opacity={zc.dotOpacity}
          />
        </g>
      ))}
    </g>
  );
}

/**
 * Structural Lines Layer (LANDSCAPE)
 * Renders VERTICAL lines for Volume Nodes, Volume Wells, and Crevasses.
 * Price is on X-axis, so structural levels are vertical lines.
 */
function StructuralLinesLayer({
  structures,
  width,
  height,
  priceMin,
  priceMax,
  opacity = 0.6,
  colors: customColors,
}: {
  structures: DGStructures;
  width: number;
  height: number;
  priceMin: number;
  priceMax: number;
  opacity?: number;
  colors?: Partial<StructureColors>;
}) {
  // Merge custom colors with defaults (for wells and crevasses)
  const colors = { ...DEFAULT_STRUCTURE_COLORS, ...customColors };

  return (
    <g className="structural-lines-layer" opacity={opacity}>
      {/* Volume Wells (shaded ranges) */}
      {structures.volumeWells.map(([start, end], i) => {
        if (end < priceMin || start > priceMax) return null;
        const clampedStart = Math.max(start, priceMin);
        const clampedEnd = Math.min(end, priceMax);
        const x1 = priceToX(clampedStart, priceMin, priceMax, width);
        const x2 = priceToX(clampedEnd, priceMin, priceMax, width);
        return (
          <rect
            key={`well-${i}`}
            x={Math.min(x1, x2)}
            y={0}
            width={Math.abs(x2 - x1)}
            height={height}
            fill={colors.well}
            opacity={0.2}
          />
        );
      })}

      {/* Crevasses (red zones - extended scarcity) */}
      {structures.crevasses.map(([start, end], i) => {
        if (end < priceMin || start > priceMax) return null;
        const clampedStart = Math.max(start, priceMin);
        const clampedEnd = Math.min(end, priceMax);
        const x1 = priceToX(clampedStart, priceMin, priceMax, width);
        const x2 = priceToX(clampedEnd, priceMin, priceMax, width);
        return (
          <rect
            key={`crevasse-${i}`}
            x={Math.min(x1, x2)}
            y={0}
            width={Math.abs(x2 - x1)}
            height={height}
            fill={colors.crevasse}
            opacity={0.15}
          />
        );
      })}

      {/* Volume Nodes (lines with individual color and weight) */}
      {structures.volumeNodes.map((node, i) => {
        if (node.price < priceMin || node.price > priceMax) return null;
        const x = priceToX(node.price, priceMin, priceMax, width);
        return (
          <line
            key={`node-${i}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke={node.color}
            strokeWidth={node.weight}
          />
        );
      })}
    </g>
  );
}

/**
 * Main RiskGraphBackdrop Component (LANDSCAPE)
 *
 * Renders as an SVG layer that sits behind the Risk Graph chart.
 * Must be positioned absolutely within the chart container.
 *
 * ORIENTATION: Price on X-axis (horizontal), P&L on Y-axis (vertical)
 * - Volume Profile: Vertical bars from bottom edge
 * - Structural Lines: Vertical lines at price levels
 * - Crevasses: Vertical bands spanning full height
 */
export default function RiskGraphBackdrop({
  width,
  height,
  priceMin,
  priceMax,
  spotPrice,
  showVolumeProfile = true,
  showGex = false,
  showStructuralLines = true,
  showMS = false,
  showProb = false,
  probLo,
  probHi,
  probRings,
  probPrimaryNSigma,
  opacity = 0.5,
  volumeHeightPercent = 25,
  gexByStrike,
  gexConfig,
  vpConfig,
  vpArtifact,
  structureColors,
  zgfzIntensity = 50,
}: RiskGraphBackdropProps) {
  const { artifact: contextArtifact, config } = useDealerGravity();
  const artifact = vpArtifact || contextArtifact;

  // Early return if nothing to show
  const hasVPData = artifact?.profile;
  const hasGexData = gexByStrike && Object.keys(gexByStrike).length > 0;
  const hasStructures = artifact?.structures;
  const hasPrimaryFill =
    showProb &&
    probLo != null &&
    probHi != null &&
    Number.isFinite(probLo) &&
    Number.isFinite(probHi) &&
    probHi > probLo;
  const hasRings = showProb && (probRings?.length ?? 0) > 0;
  const hasProb = hasPrimaryFill || hasRings;

  if (!hasVPData && !hasGexData && !hasStructures && !hasProb) return null;
  if (!showVolumeProfile && !showGex && !showStructuralLines && !showMS && !hasProb) return null;

  const { profile, structures } = artifact || {};

  // Use vpConfig if provided, otherwise fall back to context config
  const effectiveVPConfig = vpConfig || config;
  const effectiveOpacity = opacity * (effectiveVPConfig?.transparency ?? 50) / 100;

  // VP heightPercent: in landscape, VP bars extend vertically from bottom
  // widthPercent setting controls how high the bars extend (as % of chart height)
  const vpHeightPercent = vpConfig?.widthPercent ?? volumeHeightPercent;

  const gexHeightPercent = gexConfig?.heightPercent ?? 40;

  // Map price → x (same formula as other landscape layers)
  const priceRange = priceMax - priceMin;
  const priceToX = (p: number) =>
    priceRange > 0 ? ((p - priceMin) / priceRange) * width : 0;

  return (
    <svg
      className="risk-graph-backdrop"
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 0, // Behind chart elements
      }}
    >
      {/* PROB — rearmost: multi-σ ladder + region mass % (not ToS price slices) */}
      {hasProb && (
        <g className="prob-range-layer" opacity={Math.min(1, opacity + 0.12)}>
          {/* Soft fill for the selected nΣ (under edges/labels) */}
          {hasPrimaryFill && (() => {
            const lo = Math.max(probLo!, priceMin);
            const hi = Math.min(probHi!, priceMax);
            if (!(hi > lo)) return null;
            const x0 = priceToX(lo);
            const x1 = priceToX(hi);
            return (
              <rect
                key="prob-primary-fill"
                x={x0}
                y={0}
                width={Math.max(0, x1 - x0)}
                height={height}
                fill="rgba(120, 150, 200, 0.12)"
              />
            );
          })()}

          {/* Ladder edges + nΣ edge labels */}
          {hasRings &&
            [...(probRings ?? [])]
              .slice()
              .sort((a, b) => b.nSigma - a.nSigma)
              .map(ring => {
                const lo = Math.max(ring.lo, priceMin);
                const hi = Math.min(ring.hi, priceMax);
                if (!(hi > lo)) return null;
                const x0 = priceToX(lo);
                const x1 = priceToX(hi);
                const a = ring.nSigma >= 2 ? 0.22 : ring.nSigma >= 1.5 ? 0.30 : 0.40;
                const label = formatProbSigmaLabel(ring.nSigma);
                const stroke = `rgba(160, 180, 220, ${a})`;
                const dash = ring.nSigma >= 2 ? '3 3' : undefined;
                // Edge labels near bottom so region % can sit at top
                const edgeY = height - 8;
                const fill = `rgba(200, 215, 240, ${Math.min(0.95, a + 0.5)})`;
                return (
                  <g key={`ring-${ring.nSigma}`}>
                    <line
                      x1={x0} y1={0} x2={x0} y2={height}
                      stroke={stroke} strokeWidth={1} strokeDasharray={dash}
                    />
                    <line
                      x1={x1} y1={0} x2={x1} y2={height}
                      stroke={stroke} strokeWidth={1} strokeDasharray={dash}
                    />
                    <text
                      x={x0 + 3} y={edgeY}
                      fill={fill} fontSize={9} fontWeight={600}
                      fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
                      style={{ userSelect: 'none' }}
                    >
                      {label}
                    </text>
                    <text
                      x={x1 - 3} y={edgeY} textAnchor="end"
                      fill={fill} fontSize={9} fontWeight={600}
                      fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
                      style={{ userSelect: 'none' }}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

          {/*
            Region mass % — ToS-inspired usefulness without price slices:
            each σ-shell (and outer tails) gets approximate P(spot ends here)
            under the same lognormal model as the ladder.
          */}
          {hasRings &&
            buildProbMassRegions(probRings ?? []).map((region, idx) => {
              const lo = Math.max(
                Number.isFinite(region.priceLo) ? region.priceLo : priceMin,
                priceMin,
              );
              const hi = Math.min(
                Number.isFinite(region.priceHi) ? region.priceHi : priceMax,
                priceMax,
              );
              if (!(hi > lo)) return null;
              const x0 = priceToX(lo);
              const x1 = priceToX(hi);
              const midX = (x0 + x1) / 2;
              // Skip labels in razor-thin regions (clutter)
              if (x1 - x0 < 28) return null;
              const pct = formatProbMassPct(region.mass);
              const fill =
                region.kind === 'core'
                  ? 'rgba(220, 235, 255, 0.92)'
                  : region.kind === 'tail'
                    ? 'rgba(180, 195, 220, 0.72)'
                    : 'rgba(200, 215, 240, 0.82)';
              return (
                <text
                  key={`mass-${idx}-${region.kind}`}
                  x={midX}
                  y={14}
                  textAnchor="middle"
                  fill={fill}
                  fontSize={region.kind === 'core' ? 11 : 10}
                  fontWeight={region.kind === 'core' ? 700 : 600}
                  fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
                  style={{ userSelect: 'none' }}
                >
                  {pct}
                </text>
              );
            })}

          {/* Primary selection badge (selected nΣ + mass inside) when off-ladder */}
          {hasPrimaryFill && probPrimaryNSigma != null && Number.isFinite(probPrimaryNSigma) && (() => {
            const ladderNs = new Set((probRings ?? []).map(r => r.nSigma));
            if (ladderNs.has(probPrimaryNSigma!)) return null;
            const lo = Math.max(probLo!, priceMin);
            const hi = Math.min(probHi!, priceMax);
            if (!(hi > lo)) return null;
            const midX = (priceToX(lo) + priceToX(hi)) / 2;
            const label = `${formatProbSigmaLabel(probPrimaryNSigma!)} · ${formatProbMassPct(massInsideSigma(probPrimaryNSigma!))}`;
            return (
              <text
                key="primary-mass-badge"
                x={midX}
                y={height - 8}
                textAnchor="middle"
                fill="rgba(180, 200, 230, 0.95)"
                fontSize={10}
                fontWeight={600}
                fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
                style={{ userSelect: 'none' }}
              >
                {label}
              </text>
            );
          })()}
        </g>
      )}

      {/* Volume Profile Layer - vertical bars from bottom */}
      {showVolumeProfile && profile?.bins && (() => {
        return (
          <VolumeProfileLayer
            profile={profile}
            width={width}
            height={height}
            priceMin={priceMin}
            priceMax={priceMax}
            spotPrice={spotPrice}
            opacity={effectiveOpacity}
            color={vpConfig?.color ?? config?.color ?? '#3b82f6'}
            heightPercent={vpHeightPercent}
            cappingSigma={vpConfig?.cappingSigma ?? 2.75}
            mode={vpConfig?.mode ?? 'tv'}
            rowSize={vpConfig?.rowSize ?? 1000}
          />
        );
      })()}

      {/* GEX Layer - vertical bars at strike prices + zero-gamma dots */}
      {showGex && hasGexData && (
        <GexLayer
          gexByStrike={gexByStrike!}
          width={width}
          height={height}
          priceMin={priceMin}
          priceMax={priceMax}
          spotPrice={spotPrice}
          opacity={opacity}
          callColor={gexConfig?.callColor ?? '#22c55e'}
          putColor={gexConfig?.putColor ?? '#ef4444'}
          mode={gexConfig?.mode ?? 'combined'}
          heightPercent={gexHeightPercent}
          showZgfz={showStructuralLines}
          zgfzIntensity={zgfzIntensity}
          zgrDotMinRadius={gexConfig?.zgrDotMinRadius}
          zgrDotMaxRadius={gexConfig?.zgrDotMaxRadius}
          zgrLineBaseAlpha={gexConfig?.zgrLineBaseAlpha}
          zgrLineProximityBoost={gexConfig?.zgrLineProximityBoost}
          zgrDotBaseOpacity={gexConfig?.zgrDotBaseOpacity}
          zgfzExponentMin={gexConfig?.zgfzExponentMin}
          zgfzExponentRange={gexConfig?.zgfzExponentRange}
          zgrMinAbsNet={gexConfig?.zgrMinAbsNet}
        />
      )}

      {/* Structural Lines Layer - vertical lines at price levels */}
      {showMS && structures && (
        <StructuralLinesLayer
          structures={structures}
          width={width}
          height={height}
          priceMin={priceMin}
          priceMax={priceMax}
          opacity={opacity}
          colors={structureColors}
        />
      )}
    </svg>
  );
}
