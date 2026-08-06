"use client";

/**
 * Pure SVG sparkline — memoized for large bot boards.
 * Accepts compact series ({ equity } only) to minimize memory.
 */

import { memo, useMemo } from "react";

export type EquityPoint = {
  t?: string | null;
  equity: number;
  cash?: number | null;
};

type Props = {
  series: EquityPoint[] | number[];
  width?: number;
  height?: number;
  className?: string;
  /** baseline (allocation) for color / zero line */
  baseline?: number;
};

function seriesFingerprint(
  series: EquityPoint[] | number[],
  baseline?: number,
): string {
  if (!series.length) return `0|${baseline ?? ""}`;
  const last = series[series.length - 1];
  const lastEq =
    typeof last === "number" ? last : (last as EquityPoint).equity;
  const first = series[0];
  const firstEq =
    typeof first === "number" ? first : (first as EquityPoint).equity;
  return `${series.length}|${firstEq}|${lastEq}|${baseline ?? ""}`;
}

function toVals(series: EquityPoint[] | number[]): number[] {
  const out: number[] = [];
  for (const p of series) {
    if (typeof p === "number" && !Number.isNaN(p)) out.push(p);
    else if (
      p &&
      typeof p === "object" &&
      typeof (p as EquityPoint).equity === "number"
    ) {
      out.push((p as EquityPoint).equity);
    }
  }
  return out;
}

function MiniEquityChartInner({
  series,
  width = 160,
  height = 48,
  className = "",
  baseline,
}: Props) {
  const path = useMemo(() => {
    const vals = toVals(series);
    if (vals.length < 2) return null;

    const base = baseline ?? vals[0];
    let min = Math.min(...vals, base);
    let max = Math.max(...vals, base);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const pad = 2;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const n = vals.length;

    const xy = vals.map((v, i) => {
      const x = pad + (i / (n - 1)) * w;
      const y = pad + (1 - (v - min) / (max - min)) * h;
      return [x, y] as const;
    });

    const line = xy
      .map(
        ([x, y], i) =>
          `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`,
      )
      .join(" ");
    const area =
      line +
      ` L${xy[xy.length - 1][0].toFixed(1)},${(pad + h).toFixed(1)}` +
      ` L${xy[0][0].toFixed(1)},${(pad + h).toFixed(1)} Z`;

    const last = vals[vals.length - 1];
    const up = last >= base;
    const baseY = pad + (1 - (base - min) / (max - min)) * h;

    return {
      line,
      area,
      stroke: up ? "#059669" : "#e11d48",
      fill: up ? "rgba(5,150,105,0.12)" : "rgba(225,29,72,0.12)",
      baseY,
    };
  }, [series, width, height, baseline]);

  if (!path) {
    return (
      <div
        className={`flex items-center justify-center text-[10px] text-[var(--color-label-secondary)] ${className}`}
        style={{ width, height }}
      >
        No equity path yet
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Equity path"
    >
      <path d={path.area} fill={path.fill} stroke="none" />
      <line
        x1={2}
        x2={width - 2}
        y1={path.baseY}
        y2={path.baseY}
        stroke="currentColor"
        strokeOpacity={0.2}
        strokeWidth={1}
        strokeDasharray="2 2"
      />
      <path
        d={path.line}
        fill="none"
        stroke={path.stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

const MiniEquityChart = memo(MiniEquityChartInner, (prev, next) => {
  return (
    prev.width === next.width &&
    prev.height === next.height &&
    prev.className === next.className &&
    prev.baseline === next.baseline &&
    seriesFingerprint(prev.series, prev.baseline) ===
      seriesFingerprint(next.series, next.baseline)
  );
});

MiniEquityChart.displayName = "MiniEquityChart";

export default MiniEquityChart;
