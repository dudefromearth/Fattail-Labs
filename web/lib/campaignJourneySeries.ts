/**
 * Client-side Campaign Journey scrub — derive panel/radar from one in-memory series.
 *
 * Server loads events once (day + optional pnl + optional entry r2r). Scrub only
 * filters and recomputes stats in JS — no network, no DB.
 */

import type {
  JourneyShape,
  JourneyShapeAxis,
  PanelControl,
  PanelResponse,
} from "@/lib/practiceSpineApi";

export type SeriesAxisMeta = {
  bound_id: number;
  attribute: string;
  label?: string;
  role?: string;
  range_low?: number | null;
  range_high?: number | null;
  display_low?: number | null;
  display_high?: number | null;
  n_floor?: number | null;
  unit?: string | null;
};

export type SeriesEvent = {
  d: string;
  pnl?: number | null;
  r2r?: number | null;
};

export type JourneySeries = {
  campaign_id: number;
  kind?: string;
  t0?: string | null;
  present?: string | null;
  window_from?: string | null;
  window_to?: string | null;
  starting_capital?: number;
  axes_meta: SeriesAxisMeta[];
  events: SeriesEvent[];
  amendment_markers?: { at?: string | null; field?: string | null }[];
  event_count?: number;
};

/** Boundary band-alignment extension (Hotel / campaign_alignment.boundary_alignment). */
export function boundaryAlignment(
  value: number,
  rangeLow: number | null | undefined,
  rangeHigh: number | null | undefined,
): number {
  let lo = rangeLow ?? null;
  let hi = rangeHigh ?? null;
  if (lo == null && hi == null) return 1;
  if (lo != null && hi != null && lo > hi) {
    const t = lo;
    lo = hi;
    hi = t;
  }
  if (lo != null && hi != null) {
    if (lo <= value && value <= hi) return 1;
    if (value < lo) {
      const span = Math.abs(hi - lo) || Math.abs(lo) || 1;
      return Math.max(0, 1 - (lo - value) / span);
    }
    const span = Math.abs(hi - lo) || Math.abs(hi) || 1;
    return Math.max(0, 1 - (value - hi) / span);
  }
  if (lo != null && hi == null) {
    if (value >= lo) return 1;
    const span = Math.abs(lo) || 1;
    return Math.max(0, 1 - (lo - value) / span);
  }
  // hi only
  if (hi != null) {
    if (value <= hi) return 1;
    const span = Math.abs(hi) || 1;
    return Math.max(0, 1 - (value - hi) / span);
  }
  return 1;
}

/** Max drawdown as positive % of peak running capital (Trade Log law). */
export function maxDrawdownPctMagnitude(
  pnls: number[],
  startingCapital: number,
): number | null {
  if (!pnls.length) return null;
  let running = startingCapital > 0 ? startingCapital : 0;
  let peak = running;
  let maxDd = 0;
  for (const p of pnls) {
    running += p;
    peak = Math.max(peak, running);
    if (peak > 0) {
      maxDd = Math.min(maxDd, (running - peak) / peak);
    }
  }
  return Math.abs(maxDd) * 100;
}

export type DerivedStats = {
  win_rate: number | null;
  profit_factor: number | null;
  avg_win_loss: number | null;
  drawdown: number | null;
  risk_to_reward: number | null;
  sharpe: number | null;
  sample_n: number;
  r2r_n: number;
};

export function deriveStatsThrough(
  events: SeriesEvent[],
  asOf: string,
  startingCapital: number,
): DerivedStats {
  const day = asOf.slice(0, 10);
  const pnls: number[] = [];
  const r2rs: number[] = [];
  for (const e of events) {
    if ((e.d || "").slice(0, 10) > day) continue;
    if (e.pnl != null && Number.isFinite(e.pnl)) pnls.push(Number(e.pnl));
    if (e.r2r != null && Number.isFinite(e.r2r) && e.r2r > 0) {
      r2rs.push(Number(e.r2r));
    }
  }

  if (!pnls.length && !r2rs.length) {
    return {
      win_rate: null,
      profit_factor: null,
      avg_win_loss: null,
      drawdown: null,
      risk_to_reward: r2rs.length
        ? r2rs.reduce((a, b) => a + b, 0) / r2rs.length
        : null,
      sharpe: null,
      sample_n: 0,
      r2r_n: r2rs.length,
    };
  }

  const winners = pnls.filter((p) => p > 0);
  const losers = pnls.filter((p) => p < 0);
  const decided = winners.length + losers.length;
  const win_rate = decided ? (winners.length / decided) * 100 : null;
  const gp = winners.reduce((a, b) => a + b, 0);
  const gl = -losers.reduce((a, b) => a + b, 0);
  let pf: number | null;
  if (gl > 0) pf = gp / gl;
  else if (gp > 0) pf = null;
  else pf = 0;

  const avgW = winners.length ? gp / winners.length : 0;
  const avgL = losers.length ? gl / losers.length : 0;
  let awl: number | null;
  if (avgL > 0) awl = avgW / avgL;
  else if (avgW > 0) awl = null;
  else awl = 0;

  const drawdown = maxDrawdownPctMagnitude(
    pnls,
    startingCapital > 0 ? startingCapital : 50_000,
  );

  let sharpe: number | null = null;
  if (pnls.length > 1) {
    const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
    const var_ =
      pnls.reduce((a, p) => a + (p - mean) ** 2, 0) / (pnls.length - 1);
    const std = var_ > 0 ? Math.sqrt(var_) : 0;
    if (std > 0) sharpe = (mean / std) * Math.sqrt(pnls.length);
  }

  const r2r =
    r2rs.length > 0
      ? r2rs.reduce((a, b) => a + b, 0) / r2rs.length
      : null;

  return {
    win_rate,
    profit_factor: pf,
    avg_win_loss: awl,
    drawdown,
    risk_to_reward: r2r,
    sharpe,
    sample_n: pnls.length,
    r2r_n: r2rs.length,
  };
}

function readingFor(
  attr: string,
  stats: DerivedStats,
  rangeHigh: number | null | undefined,
): number | null {
  const raw = (stats as Record<string, number | null>)[attr];
  if (attr === "profit_factor" && raw == null && stats.sample_n > 0) {
    // unbounded PF (all winners) — pin high for display
    return rangeHigh != null ? rangeHigh : 10;
  }
  return raw ?? null;
}

export function deriveAxesAt(
  series: JourneySeries,
  asOf: string,
): JourneyShapeAxis[] {
  const stats = deriveStatsThrough(
    series.events || [],
    asOf,
    series.starting_capital ?? 50_000,
  );
  return (series.axes_meta || []).map((m) => {
    const reading = readingFor(m.attribute, stats, m.range_high);
    const n = m.attribute === "risk_to_reward" ? stats.r2r_n : stats.sample_n;
    const nFloor = m.n_floor ?? 10;
    const gathering = reading == null || n < nFloor;
    let extension: number | null = null;
    let state = "gathering";
    if (!gathering && reading != null) {
      extension =
        Math.round(
          boundaryAlignment(reading, m.range_low, m.range_high) * 10000,
        ) / 10000;
      state = extension >= 0.999 ? "in_range" : "out_of_range";
    }
    return {
      bound_id: m.bound_id,
      role: m.role || "boundary",
      attribute: m.attribute,
      label: m.label,
      range_low: m.range_low,
      range_high: m.range_high,
      reading,
      extension,
      state,
      n_floor: nFloor,
      n,
    };
  });
}

export function deriveShapeAt(
  series: JourneySeries,
  asOf: string,
): JourneyShape {
  const axes = deriveAxesAt(series, asOf);
  const stats = deriveStatsThrough(
    series.events || [],
    asOf,
    series.starting_capital ?? 50_000,
  );
  return {
    campaign_id: series.campaign_id,
    kind: "shape",
    t0: series.t0,
    present: series.present,
    as_of: asOf.slice(0, 10),
    axes,
    amendment_markers: series.amendment_markers,
    sample_n: stats.sample_n,
    message: null,
  };
}

export function derivePanelAt(
  series: JourneySeries,
  asOf: string,
  opts?: { can_edit?: boolean },
): PanelResponse {
  const stats = deriveStatsThrough(
    series.events || [],
    asOf,
    series.starting_capital ?? 50_000,
  );
  const controls: PanelControl[] = (series.axes_meta || []).map((m) => {
    const reading = readingFor(m.attribute, stats, m.range_high);
    const n = m.attribute === "risk_to_reward" ? stats.r2r_n : stats.sample_n;
    const nFloor = m.n_floor ?? 10;
    const gathering = reading == null || n < nFloor;
    let extension: number | null = null;
    let state = "gathering";
    if (!gathering && reading != null) {
      extension =
        Math.round(
          boundaryAlignment(reading, m.range_low, m.range_high) * 10000,
        ) / 10000;
      state = extension >= 0.999 ? "in_range" : "out_of_range";
    }
    return {
      bound_id: m.bound_id,
      attribute: m.attribute,
      label: m.label || m.attribute,
      role: "boundary",
      range_low: m.range_low ?? null,
      range_high: m.range_high ?? null,
      display_low: m.display_low ?? 0,
      display_high: m.display_high ?? 100,
      n_floor: nFloor,
      n,
      reading,
      extension,
      state,
      unit: m.unit,
    };
  });
  const day = asOf.slice(0, 10);
  return {
    campaign_id: series.campaign_id,
    as_of: day,
    window_from: series.window_from,
    window_to: day < (series.window_to || day) ? day : series.window_to,
    sample_n: stats.sample_n,
    can_edit: !!opts?.can_edit,
    controls,
  };
}
