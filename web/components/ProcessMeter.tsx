"use client";

// Practice compass — Process Flow as multi-pillar alignment (spider / radar),
// not a report-card score. Each axis is a practice pillar; the shape shows
// directional balance. Optional temporal scrub (start → today). Not P&L.

import { useEffect, useState } from "react";

export type ProcessGrade = {
  id: string;
  label: string;
  blurb: string;
  color: string;
  percent?: number;
  band_low: number;
  band_high: number;
  establishing?: boolean;
};

export type ProcessMeterItem = {
  id: string;
  label: string;
  hint: string;
  percent: number;
  detail: string;
  empty?: boolean;
  soon?: boolean;
  grade?: ProcessGrade;
  /** RT7 cadence: d > H invitational nudge (never shame) */
  nudge?: boolean;
  days_since?: number;
  horizon_days?: number;
  clock?: string;
};

export type ProcessPayload = {
  framing: string;
  overall_percent: number;
  overall_raw_percent?: number;
  overall_label: string;
  grade?: ProcessGrade;
  grade_scale?: ProcessGrade[];
  as_of?: string;
  tenure?: {
    days: number;
    ramp_days: number;
    weight: number;
    establishing: boolean;
    note: string;
  };
  meters: ProcessMeterItem[];
  profile?: {
    id: string;
    label: string;
    horizon_label: string;
    focus: string;
    retro_horizon_days?: number | null;
    grade_ramp_days?: number;
  };
  window?: Record<string, number>;
};

/** Compact as-of samples from GET /api/me/journey/process-timeline */
export type ProcessTimelinePoint = {
  as_of: string;
  overall_percent: number;
  overall_label?: string;
  grade?: ProcessGrade;
  meters: ProcessMeterItem[];
  establishing?: boolean;
};

export type ProcessTimeline = {
  start_date: string;
  end_date: string;
  sample_count?: number;
  points: ProcessTimelinePoint[];
  note?: string;
  /** False until enough completed retros — hide scrub UI */
  slider_eligible?: boolean;
  completed_retrospectives?: number;
  min_retrospectives?: number;
};

function fmtTimelineDay(ymd: string): string {
  try {
    return new Date(ymd + "T12:00:00").toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return ymd;
  }
}

/** Build a ProcessPayload view for a timeline scrub point. */
export function processFromTimelinePoint(
  live: ProcessPayload,
  point: ProcessTimelinePoint,
): ProcessPayload {
  const grade =
    point.grade ??
    gradeFromPercent(point.overall_percent ?? 50);
  const meters = (point.meters || []).map((m) => ({
    id: m.id,
    label: m.label || m.id,
    hint: m.hint || "",
    percent: Number(m.percent) || 0,
    detail: m.detail || "",
    empty: !!m.empty,
    soon: !!m.soon,
    grade: m.grade,
  }));
  return {
    ...live,
    framing: live.framing || "practice_compass",
    as_of: point.as_of,
    overall_percent: point.overall_percent,
    overall_label:
      point.overall_label ||
      live.overall_label ||
      "Historical practice shape",
    grade,
    meters: meters.length ? meters : live.meters,
    tenure: point.establishing
      ? {
          days: live.tenure?.days ?? 0,
          ramp_days: live.tenure?.ramp_days ?? 42,
          weight: 0,
          establishing: true,
          note: "Historical — establishing window",
        }
      : live.tenure,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 3-pass EMA so sample stairs become a gentle curve (display + scrub). */
function smoothSeries(values: number[], passes = 2): number[] {
  if (values.length < 3) return values.slice();
  let out = values.map((v) => Math.min(100, Math.max(0, v)));
  for (let p = 0; p < passes; p++) {
    const next = out.slice();
    // Light end-preserving smooth: y'[i] = 0.25 y[i-1] + 0.5 y[i] + 0.25 y[i+1]
    for (let i = 1; i < out.length - 1; i++) {
      next[i] = 0.25 * out[i - 1] + 0.5 * out[i] + 0.25 * out[i + 1];
    }
    out = next;
  }
  return out;
}

/**
 * Continuous scrub between samples: interpolate overall % and each pillar %.
 * Empty/soon flags stay with the nearer sample.
 */
export function processFromTimelineScrub(
  live: ProcessPayload,
  points: ProcessTimelinePoint[],
  scrub: number,
): ProcessPayload {
  if (!points.length) return live;
  const max = points.length - 1;
  const s = Math.max(0, Math.min(max, scrub));
  const i0 = Math.floor(s);
  const i1 = Math.min(max, i0 + 1);
  const t = s - i0;
  if (t < 1e-6 || i0 === i1) {
    return processFromTimelinePoint(live, points[i0]);
  }
  const a = points[i0];
  const b = points[i1];
  const overall = Math.round(
    lerp(Number(a.overall_percent) || 0, Number(b.overall_percent) || 0, t),
  );
  const byId = new Map((b.meters || []).map((m) => [m.id, m]));
  const meters: ProcessMeterItem[] = (a.meters || []).map((ma) => {
    const mb = byId.get(ma.id);
    const pa = ma.empty || ma.soon ? 0 : Number(ma.percent) || 0;
    const pb =
      !mb || mb.empty || mb.soon ? 0 : Number(mb.percent) || 0;
    // Prefer non-empty side when one side is empty
    let pct: number;
    let empty = false;
    let soon = false;
    if ((ma.empty || ma.soon) && mb && !mb.empty && !mb.soon) {
      pct = Math.round(lerp(0, pb, t));
    } else if (mb && (mb.empty || mb.soon) && !ma.empty && !ma.soon) {
      pct = Math.round(lerp(pa, 0, t));
    } else if ((ma.empty || ma.soon) && (!mb || mb.empty || mb.soon)) {
      pct = 0;
      empty = true;
    } else {
      pct = Math.round(lerp(pa, pb, t));
    }
    const nearer = t < 0.5 ? ma : mb || ma;
    return {
      id: ma.id,
      label: ma.label || ma.id,
      hint: nearer.hint || "",
      percent: pct,
      detail: nearer.detail || "",
      empty,
      soon,
      grade: empty ? undefined : gradeFromPercent(pct),
    };
  });
  // as_of: snap label to nearer sample for honest dating
  const nearerPt = t < 0.5 ? a : b;
  return {
    ...live,
    framing: live.framing || "practice_compass",
    as_of: nearerPt.as_of,
    overall_percent: overall,
    overall_label:
      nearerPt.overall_label ||
      live.overall_label ||
      "Historical practice shape",
    grade: gradeFromPercent(overall),
    meters: meters.length ? meters : live.meters,
    tenure:
      (t < 0.5 ? a.establishing : b.establishing)
        ? {
            days: live.tenure?.days ?? 0,
            ramp_days: live.tenure?.ramp_days ?? 42,
            weight: 0,
            establishing: true,
            note: "Historical — establishing window",
          }
        : live.tenure,
  };
}

/** Catmull-Rom → cubic Bezier path through (x,y) points (smooth curve). */
function catmullRomPath(
  pts: { x: number; y: number }[],
  tension = 0.5,
): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + ((p2.x - p0.x) * tension) / 6;
    const c1y = p1.y + ((p2.y - p0.y) * tension) / 6;
    const c2x = p2.x - ((p3.x - p1.x) * tension) / 6;
    const c2y = p2.y - ((p3.y - p1.y) * tension) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Client fallback if API has no grade yet (pre-restart). */
function gradeFromPercent(pct: number): ProcessGrade {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  if (p <= 24)
    return {
      id: "poor",
      label: "Off course",
      blurb: "Off bearing — reorient to the routine",
      color: "#b91c1c",
      band_low: 0,
      band_high: 24,
      percent: p,
    };
  if (p <= 49)
    return {
      id: "fair",
      label: "Drifting",
      blurb: "Partial alignment — strengthen the weak pillars",
      color: "#ea580c",
      band_low: 25,
      band_high: 49,
      percent: p,
    };
  if (p <= 69)
    return {
      id: "good",
      label: "On course",
      blurb: "Directionally aligned — process is holding",
      color: "#ca8a04",
      band_low: 50,
      band_high: 69,
      percent: p,
    };
  if (p <= 84)
    return {
      id: "great",
      label: "Steady",
      blurb: "Steady shape — habits keeping you true",
      color: "#16a34a",
      band_low: 70,
      band_high: 84,
      percent: p,
    };
  return {
    id: "excellent",
    label: "True north",
    blurb: "True north — practice is the default heading",
    color: "#047857",
    band_low: 85,
    band_high: 100,
    percent: p,
  };
}

function compassLabel(grade: ProcessGrade): string {
  if (grade.establishing || grade.id === "establishing") return "Finding heading";
  switch (grade.id) {
    case "poor":
      return "Off course";
    case "fair":
      return "Drifting";
    case "good":
      return "On course";
    case "great":
      return "Steady";
    case "excellent":
      return "True north";
    default:
      return grade.label;
  }
}

function compassBlurb(grade: ProcessGrade): string {
  if (grade.establishing || grade.id === "establishing") {
    return "Finding your heading — shape fills in as you practice across pillars";
  }
  const scorey =
    /process integrity|process score|journal-style|Locked-in process|Solid process integrity|Off process — reinstall|Developing discipline|Disciplined process|Too early to grade|bring practice back under the needle/i.test(
      grade.blurb || "",
    );
  if (!scorey && grade.blurb) return grade.blurb;
  return gradeFromPercent(grade.percent ?? 50).blurb;
}

/** Short axis labels for the spider (full names stay in the list below). */
const AXIS_SHORT: Record<string, string> = {
  persistence: "Persist",
  routine: "Routine",
  learning: "Learn",
  live: "Live",
  adherence: "Adhere",
  retrospective: "Retro",
  mental_toughness: "Tough",
};

function axisLabel(m: ProcessMeterItem): string {
  return AXIS_SHORT[m.id] || m.label.split(/\s+/)[0] || m.id;
}

/** Value on spider: empty/soon → 0 (center); else 0–100. */
function axisValue(m: ProcessMeterItem): number {
  if (m.soon || m.empty) return 0;
  return Math.min(100, Math.max(0, Number(m.percent) || 0));
}

type SpiderPoint = { x: number; y: number; m: ProcessMeterItem; v: number };

function polar(
  cx: number,
  cy: number,
  r: number,
  angleRad: number,
): { x: number; y: number } {
  // 0 at top, clockwise
  return {
    x: cx + r * Math.sin(angleRad),
    y: cy - r * Math.cos(angleRad),
  };
}

function PracticeSpider({
  meters,
  gradeColor,
  isEstablishing,
  compact,
  hero = false,
}: {
  meters: ProcessMeterItem[];
  gradeColor: string;
  isEstablishing: boolean;
  compact: boolean;
  /** Large square stage for Journey hero layout */
  hero?: boolean;
}) {
  const n = meters.length;
  // Need at least 3 axes for a meaningful polygon
  if (n < 3) {
    return (
      <p className="text-center text-xs text-[var(--color-label-tertiary)]">
        Not enough pillars yet for a practice map.
      </p>
    );
  }

  // viewBox units — hero uses a larger canvas + padding for axis labels
  const size = hero ? 520 : compact ? 220 : 280;
  const pad = hero ? 56 : compact ? 28 : 36;
  const labelFs = hero ? 13 : compact ? 9 : 10;
  const strokeData = hero ? 2.75 : 2;
  const cx = size / 2;
  const cy = size / 2;
  const rMax = size / 2 - pad;
  const levels = [0.25, 0.5, 0.75, 1];

  const angleAt = (i: number) => (i / n) * Math.PI * 2;

  const dataPts: SpiderPoint[] = meters.map((m, i) => {
    const v = axisValue(m);
    const t = isEstablishing ? v * 0.35 : v; // soft while establishing
    const { x, y } = polar(cx, cy, (t / 100) * rMax, angleAt(i));
    return { x, y, m, v };
  });

  const poly = dataPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div
      className={
        hero
          ? "mx-auto flex h-full w-full max-w-[min(100%,36rem)] flex-col items-center justify-center"
          : "mx-auto w-full max-w-[320px]"
      }
      data-testid="process-spider-chart"
      data-hero={hero ? "1" : "0"}
      role="img"
      aria-label="Practice alignment spider chart across process pillars"
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        className={hero ? "max-h-[min(72vw,34rem)] max-w-full" : "overflow-visible"}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background face */}
        <circle
          cx={cx}
          cy={cy}
          r={rMax + 4}
          fill="var(--color-fill)"
          opacity={0.35}
        />

        {/* Grid rings */}
        {levels.map((lv) => (
          <polygon
            key={lv}
            points={meters
              .map((_, i) => {
                const p = polar(cx, cy, rMax * lv, angleAt(i));
                return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              })
              .join(" ")}
            fill="none"
            stroke="var(--color-separator)"
            strokeWidth={1}
            opacity={lv === 1 ? 0.9 : 0.45}
          />
        ))}

        {/* Axes */}
        {meters.map((m, i) => {
          const tip = polar(cx, cy, rMax, angleAt(i));
          return (
            <line
              key={m.id}
              x1={cx}
              y1={cy}
              x2={tip.x}
              y2={tip.y}
              stroke="var(--color-separator)"
              strokeWidth={1}
              opacity={0.7}
            />
          );
        })}

        {/* Data shape */}
        <polygon
          points={poly}
          fill={gradeColor}
          fillOpacity={isEstablishing ? 0.12 : 0.22}
          stroke={gradeColor}
          strokeWidth={strokeData}
          strokeLinejoin="round"
          opacity={isEstablishing ? 0.65 : 1}
        />

        {/* Vertex dots */}
        {dataPts.map((p) => (
          <circle
            key={p.m.id}
            cx={p.x}
            cy={p.y}
            r={p.v > 0 ? (hero ? 5 : 3.5) : hero ? 3 : 2}
            fill={p.v > 0 ? gradeColor : "var(--color-label-tertiary)"}
            stroke="var(--color-surface)"
            strokeWidth={hero ? 2 : 1.5}
            opacity={p.m.empty || p.m.soon ? 0.45 : 1}
          />
        ))}

        {/* Axis labels outside ring */}
        {meters.map((m, i) => {
          const tip = polar(
            cx,
            cy,
            rMax + (hero ? 28 : compact ? 14 : 18),
            angleAt(i),
          );
          const short = axisLabel(m);
          const empty = m.empty || m.soon;
          return (
            <text
              key={`lbl-${m.id}`}
              x={tip.x}
              y={tip.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-[var(--color-label-secondary)]"
              style={{
                fontSize: labelFs,
                fontWeight: 600,
                opacity: empty ? 0.45 : 0.95,
              }}
            >
              {short}
            </text>
          );
        })}

        {/* Center hub */}
        <circle
          cx={cx}
          cy={cy}
          r={hero ? 5 : 4}
          fill="var(--color-label)"
          opacity={0.35}
        />
      </svg>
      <p
        className={`mt-2 text-center text-[var(--color-label-tertiary)] ${hero ? "text-xs" : "text-[10px]"}`}
      >
        Outer ring = full alignment · empty pillars sit at the center
      </p>
    </div>
  );
}

/**
 * Time path — overall Process Flow shape % across as_of samples.
 * Values are lightly smoothed; path is drawn as a Catmull-Rom spline so the
 * curve and scrub feel continuous rather than stair-stepped.
 */
function ProcessPathTimelineChart({
  points,
  scrub,
  onSelectScrub,
}: {
  points: ProcessTimelinePoint[];
  /** Continuous index in [0, n-1] */
  scrub: number;
  onSelectScrub?: (s: number) => void;
}) {
  const n = points.length;
  if (n < 2) return null;

  const w = 720;
  const h = 200;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const raw = points.map((p) =>
    Math.min(100, Math.max(0, Number(p.overall_percent) || 0)),
  );
  const vals = smoothSeries(raw, 2);

  // Fixed 0–100 vertical scale so slope is honest across members
  const yAt = (v: number) => padT + plotH * (1 - v / 100);
  const xAt = (i: number) =>
    padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);

  const curvePts = vals.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const lineD = catmullRomPath(curvePts, 1);
  // Area: densify polyline under the curve for fill (sample the path via verts)
  const areaD =
    `${lineD} L${xAt(n - 1).toFixed(2)},${(padT + plotH).toFixed(2)}` +
    ` L${xAt(0).toFixed(2)},${(padT + plotH).toFixed(2)} Z`;

  const first = vals[0];
  const last = vals[n - 1];
  const delta = last - first;
  const slopeLabel =
    delta > 4
      ? "Sloping up — alignment improving"
      : delta < -4
        ? "Sloping down — alignment softening"
        : "Mostly flat — holding the heading";
  const slopeColor =
    delta > 4 ? "#16a34a" : delta < -4 ? "#ea580c" : "var(--color-label-secondary)";

  const s = Math.max(0, Math.min(n - 1, scrub));
  const i0 = Math.floor(s);
  const i1 = Math.min(n - 1, i0 + 1);
  const t = s - i0;
  const scrubV = lerp(vals[i0], vals[i1], t);
  const scrubX = lerp(xAt(i0), xAt(i1), t);
  const scrubY = yAt(scrubV);
  const scrubColor = gradeFromPercent(Math.round(scrubV)).color;

  return (
    <div className="w-full" data-testid="process-path-timeline">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
            Progress over time
          </p>
          <p className="text-sm font-medium text-[var(--color-label)]">
            Shape path
          </p>
        </div>
        <p className="text-xs font-medium" style={{ color: slopeColor }}>
          {slopeLabel}
          <span className="ml-1.5 tabular-nums text-[var(--color-label-tertiary)]">
            {delta > 0 ? "+" : ""}
            {Math.round(delta)} pts
          </span>
        </p>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full overflow-visible"
        role="img"
        aria-label={`Process Flow shape from ${points[0].as_of} to ${points[n - 1].as_of}`}
      >
        {[25, 50, 75].map((g) => (
          <g key={g}>
            <line
              x1={padL}
              y1={yAt(g)}
              x2={padL + plotW}
              y2={yAt(g)}
              stroke="var(--color-separator)"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.7}
            />
            <text
              x={padL - 6}
              y={yAt(g) + 3}
              textAnchor="end"
              className="fill-[var(--color-label-tertiary)]"
              style={{ fontSize: 10 }}
            >
              {g}
            </text>
          </g>
        ))}
        <line
          x1={padL}
          y1={padT + plotH}
          x2={padL + plotW}
          y2={padT + plotH}
          stroke="var(--color-separator)"
          strokeWidth={1}
        />
        <path d={areaD} fill={scrubColor} fillOpacity={0.12} />
        <path
          d={lineD}
          fill="none"
          stroke={scrubColor}
          strokeWidth={2.75}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Sample anchors (faint) — click snaps scrub */}
        {vals.map((v, i) => (
          <circle
            key={points[i].as_of + i}
            cx={xAt(i)}
            cy={yAt(v)}
            r={2.5}
            fill={points[i].grade?.color || gradeFromPercent(v).color}
            stroke="var(--color-surface)"
            strokeWidth={1}
            opacity={0.55}
            className={onSelectScrub ? "cursor-pointer" : undefined}
            onClick={() => onSelectScrub?.(i)}
          />
        ))}
        <line
          x1={scrubX}
          y1={padT}
          x2={scrubX}
          y2={padT + plotH}
          stroke="var(--color-label)"
          strokeWidth={1.25}
          strokeDasharray="3 3"
          opacity={0.4}
        />
        <circle
          cx={scrubX}
          cy={scrubY}
          r={6}
          fill="none"
          stroke={scrubColor}
          strokeWidth={2}
        />
        <circle cx={scrubX} cy={scrubY} r={3} fill={scrubColor} />
        <text
          x={padL}
          y={h - 6}
          className="fill-[var(--color-label-tertiary)]"
          style={{ fontSize: 10 }}
        >
          {fmtTimelineDay(points[0].as_of)}
        </text>
        <text
          x={padL + plotW}
          y={h - 6}
          textAnchor="end"
          className="fill-[var(--color-label-tertiary)]"
          style={{ fontSize: 10 }}
        >
          {fmtTimelineDay(points[n - 1].as_of)}
        </text>
      </svg>
      <p className="mt-1 text-center text-[11px] text-[var(--color-label-tertiary)]">
        Smoothed path of shape strength (0–100). Drag the slider for a continuous
        scrub — radar morphs between sample days.
      </p>
    </div>
  );
}

function PillarList({
  meters,
  compact,
}: {
  meters: ProcessMeterItem[];
  compact: boolean;
}) {
  return (
    <ul className={compact ? "space-y-2.5" : "space-y-3"}>
      {meters.map((m) => {
        const g =
          m.soon || m.empty ? null : m.grade ?? gradeFromPercent(m.percent);
        const color = g?.color ?? "var(--color-label-tertiary)";
        const isCadence = m.id === "retrospective";
        return (
          <li
            key={m.id}
            data-testid={isCadence ? "process-meter-retrospective" : undefined}
            data-cadence-empty={isCadence && m.empty ? "1" : undefined}
            data-cadence-nudge={isCadence && m.nudge ? "1" : undefined}
          >
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span
                className="font-medium text-[var(--color-label)]"
                title={m.hint}
              >
                {m.label}
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                {g && (
                  <span
                    className="rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
                    style={{
                      color: g.color,
                      borderColor: g.color,
                      background: `color-mix(in srgb, ${g.color} 10%, transparent)`,
                    }}
                    data-testid={
                      isCadence ? "process-meter-retro-grade" : undefined
                    }
                  >
                    {compassLabel(g)}
                  </span>
                )}
                <span className="tabular-nums text-[var(--color-label-tertiary)]">
                  {m.soon ? m.detail : m.empty ? "—" : `${m.percent}%`}
                </span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-fill)]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${m.soon || m.empty ? 0 : m.percent}%`,
                  background: color,
                  opacity: m.soon || m.empty ? 0.35 : 1,
                }}
              />
            </div>
            {!compact && (
              <p className="mt-0.5 text-[11px] text-[var(--color-label-tertiary)]">
                {m.detail}
                {!m.soon && !m.empty
                  ? ` · ${m.hint}`
                  : m.empty || m.soon
                    ? ` · ${m.hint}`
                    : ""}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function ProcessMeter({
  process: liveProcess,
  compact = false,
  /** Full-width hero radar for Journey — big square stage */
  hero = false,
  /** Temporal samples (practice start → today) for scrub slider */
  timeline = null,
}: {
  process: ProcessPayload;
  compact?: boolean;
  hero?: boolean;
  timeline?: ProcessTimeline | null;
}) {
  // Slider only after enough completed retros (API: slider_eligible + points)
  const sliderOn =
    !!timeline &&
    timeline.slider_eligible !== false &&
    (timeline.points?.length ?? 0) > 1;
  const points = sliderOn ? timeline!.points : null;
  const lastIdx = points ? points.length - 1 : 0;
  /** Continuous scrub in [0, lastIdx] for smooth radar + path playhead */
  const [scrub, setScrub] = useState(lastIdx);

  // Keep scrub pinned to "today" when a new timeline arrives
  useEffect(() => {
    if (points) setScrub(points.length - 1);
  }, [points, timeline?.end_date, sliderOn]);

  const process =
    hero && points && points.length
      ? processFromTimelineScrub(liveProcess, points, scrub)
      : liveProcess;

  const atPresent = !points || scrub >= lastIdx - 0.02;
  const scrubLabelIdx = Math.round(
    Math.max(0, Math.min(lastIdx, scrub)),
  );
  const prof = process.profile;
  const grade = process.grade ?? gradeFromPercent(process.overall_percent);
  const isEstablishing = !!(
    grade.establishing ||
    grade.id === "establishing" ||
    process.tenure?.establishing
  );
  const weightPct = process.tenure
    ? Math.round(process.tenure.weight * 100)
    : null;
  const displayName = compassLabel(grade);
  const displayBlurb = compassBlurb(grade);

  // Prefer active meters for spider; still show empty so shape shows gaps
  const spiderMeters = process.meters.filter(
    (m) => !m.soon || m.id === "retrospective",
  );
  const chartMeters =
    spiderMeters.length >= 3 ? spiderMeters : process.meters;

  const bearingBlock = (
    <div className={hero || compact ? "text-center" : "min-w-0"}>
      <div
        className={`flex flex-wrap items-baseline gap-2 ${hero || compact ? "justify-center" : ""}`}
      >
        <span
          className="rounded-full border px-3 py-1 text-sm font-semibold tracking-wide"
          style={{
            color: grade.color,
            borderColor: grade.color,
            background: `color-mix(in srgb, ${grade.color} 12%, transparent)`,
          }}
          data-testid="process-compass-bearing"
        >
          {displayName}
        </span>
        {!isEstablishing && (
          <span
            className="text-sm tabular-nums text-[var(--color-label-tertiary)]"
            title="Overall shape strength — not a grade on you"
          >
            Shape {process.overall_percent}
            <span className="text-[11px]">%</span>
          </span>
        )}
      </div>
      <p
        className={`mt-1.5 text-sm text-[var(--color-label-secondary)] ${hero || compact ? "text-center" : ""}`}
      >
        {displayBlurb}
      </p>
      <p
        className={`mt-0.5 text-xs text-[var(--color-label-tertiary)] ${hero || compact ? "text-center" : ""}`}
      >
        {process.overall_label
          ?.replace(/grades open/gi, "bearing firms")
          .replace(/process score/gi, "practice heading")
          .replace(/Strong process/gi, "Strong alignment")
          .replace(/Early process signal/gi, "Early heading signal") ||
          "Read the shape — weak axes are where to act next."}
      </p>
      {process.tenure &&
        !isEstablishing &&
        weightPct != null &&
        weightPct < 100 && (
          <p
            className={`mt-1 text-[11px] text-[var(--color-label-tertiary)] ${hero || compact ? "text-center" : ""}`}
          >
            Heading confidence {weightPct}% · day{" "}
            {Math.floor(process.tenure.days) + 1} of {process.tenure.ramp_days}
          </p>
        )}
    </div>
  );

  if (hero) {
    return (
      <div className="space-y-5" data-layout="radar-hero">
        {prof && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-[var(--color-tint)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-tint)]">
              {prof.label}
            </span>
            <span className="text-[11px] text-[var(--color-label-tertiary)]">
              {prof.horizon_label}
            </span>
          </div>
        )}

        {/* Prominent square stage for the radar */}
        <div
          className="relative mx-auto aspect-square w-full max-w-[min(100%,36rem)] rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-fill)]/25 p-4 sm:p-6"
          data-testid="process-radar-stage"
        >
          <div className="flex h-full w-full items-center justify-center">
            <PracticeSpider
              meters={chartMeters}
              gradeColor={grade.color}
              isEstablishing={isEstablishing}
              compact={false}
              hero
            />
          </div>
        </div>

        {/* Temporal: line chart (slope) + scrub — same timeline samples */}
        {points && points.length > 1 && (
          <div
            className="mx-auto w-full max-w-[min(100%,40rem)] space-y-5"
            data-testid="process-temporal-block"
          >
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 sm:p-5">
              <ProcessPathTimelineChart
                points={points}
                scrub={scrub}
                onSelectScrub={setScrub}
              />
            </div>

            <div
              className="space-y-2"
              data-testid="process-timeline-scrub"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  Time path
                </p>
                <p className="text-sm font-medium text-[var(--color-label)]">
                  {fmtTimelineDay(points[scrubLabelIdx].as_of)}
                  {atPresent ? (
                    <span className="ml-2 text-xs font-normal text-[var(--color-tint)]">
                      Present
                    </span>
                  ) : (
                    <span className="ml-2 text-xs font-normal text-[var(--color-label-tertiary)]">
                      Historical
                    </span>
                  )}
                </p>
              </div>
              <input
                type="range"
                min={0}
                max={lastIdx}
                step={0.01}
                value={scrub}
                onChange={(e) => setScrub(Number(e.target.value))}
                className="w-full accent-[var(--color-tint)]"
                aria-label="Scrub practice alignment from start to present"
                aria-valuetext={fmtTimelineDay(points[scrubLabelIdx].as_of)}
              />
              <div className="flex justify-between text-[11px] text-[var(--color-label-tertiary)]">
                <span>Start · {fmtTimelineDay(timeline!.start_date)}</span>
                <span>Today · {fmtTimelineDay(timeline!.end_date)}</span>
              </div>
              <p className="text-center text-[11px] leading-snug text-[var(--color-label-tertiary)]">
                Continuous scrub with a smoothed path — radar morphs between
                sample days.
              </p>
            </div>
          </div>
        )}

        {bearingBlock}

        <p className="text-center text-[11px] leading-snug text-[var(--color-label-tertiary)]">
          {isEstablishing
            ? "You start without a fixed shape — extremes are earned over time as you practice, not handed out on day one."
            : prof?.focus ||
              "A balanced shape beats one long spike. Act on the short axes. Never P&L. Never talent."}
        </p>

        <div>
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
            Pillars on the map
          </p>
          <div className="mx-auto max-w-2xl">
            <PillarList meters={process.meters} compact={false} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div>
        {prof && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-tint)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-tint)]">
              {prof.label}
            </span>
            <span className="text-[11px] text-[var(--color-label-tertiary)]">
              {prof.horizon_label}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              Practice compass
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-[var(--color-label-secondary)]">
              Not a scorecard — a{" "}
              <strong className="font-medium text-[var(--color-label)]">
                spider map of practice pillars
              </strong>{" "}
              that keeps you directionally aligned. Look for balance, not a
              single number.
            </p>
          </div>
        </div>

        <div
          className={`mt-3 ${compact ? "space-y-3" : "sm:grid sm:grid-cols-[1fr_minmax(11rem,14rem)] sm:items-center sm:gap-4"}`}
        >
          <PracticeSpider
            meters={chartMeters}
            gradeColor={grade.color}
            isEstablishing={isEstablishing}
            compact={compact}
          />
          {bearingBlock}
        </div>

        <p className="mt-2 text-[11px] leading-snug text-[var(--color-label-tertiary)]">
          {isEstablishing
            ? "You start without a fixed shape — extremes are earned over time as you practice, not handed out on day one."
            : prof?.focus ||
              "A balanced shape beats one long spike. Act on the short axes. Never P&L. Never talent."}
        </p>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
          Pillars on the map
        </p>
        <PillarList meters={process.meters} compact={compact} />
      </div>
    </div>
  );
}
