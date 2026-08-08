"use client";

import type { SeriesPoint } from "@/lib/reportsBook";

function formatAxisMoney(n: number): string {
  if (Math.abs(n) >= 1000) {
    return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  }
  return `$${n.toFixed(0)}`;
}

export default function EquityChart({
  series,
  height = 420,
  highlightTradeId,
  periodLabel,
}: {
  series: SeriesPoint[];
  /** Plot height — taller to fill the column next to the stats table. */
  height?: number;
  /** Deep-link from Journal: mark this fill on the path. */
  highlightTradeId?: number | null;
  /** Practice Context period (e.g. "August 2026") for empty-state copy. */
  periodLabel?: string;
}) {
  const w = 720;
  const h = height;
  const padL = 52;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  if (series.length < 2) {
    const period =
      periodLabel && periodLabel.trim() && periodLabel !== "All time"
        ? periodLabel.trim()
        : null;
    return (
      <div
        className="flex items-center justify-center px-4 text-center text-sm font-medium text-[var(--color-label-secondary)]"
        style={{ minHeight: h }}
        data-testid="reports-equity-empty"
      >
        {period ? `No Trades Yet in ${period}` : "No Trades Yet"}
      </div>
    );
  }

  const vals = series.map((p) => p.equity);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const span = maxV - minV || 1;
  // Pin lowest equity near the bottom of the plot (small pad only).
  // Top gets a little headroom; do not center the series in empty space.
  const padBottomFrac = 0.04;
  const padTopFrac = 0.08;
  const n = series.length;
  const xAt = (i: number) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => {
    const t = (v - minV) / span; // 0 at min equity, 1 at max
    const yBottom = padT + plotH * (1 - padBottomFrac);
    const yTop = padT + plotH * padTopFrac;
    return yBottom - t * (yBottom - yTop);
  };

  const line = series
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.equity).toFixed(1)}`,
    )
    .join(" ");

  // Horizontal grid from data min → max (not an inflated domain)
  const tickCount = 5;
  const grid: number[] = [];
  for (let i = 0; i <= tickCount; i++) {
    grid.push(minV + (span * i) / tickCount);
  }

  // X labels: trade index or date samples
  const xLabels: { i: number; label: string }[] = [];
  const step = Math.max(1, Math.floor((n - 1) / 8));
  for (let i = 0; i < n; i += step) {
    xLabels.push({
      i,
      label: String(series[i].tradeIndex || i + 1),
    });
  }
  if (xLabels[xLabels.length - 1]?.i !== n - 1) {
    xLabels.push({ i: n - 1, label: String(series[n - 1].tradeIndex || n) });
  }

  const hi =
    highlightTradeId != null
      ? series.findIndex((p) => p.tradeId === highlightTradeId)
      : -1;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-auto w-full"
      role="img"
      aria-label="Equity curve from starting capital"
      id="reports-equity-chart"
    >
      {grid.map((v) => (
        <g key={v}>
          <line
            x1={padL}
            x2={w - padR}
            y1={yAt(v)}
            y2={yAt(v)}
            stroke="var(--color-separator)"
            strokeWidth={1}
          />
          <text
            x={padL - 8}
            y={yAt(v) + 3}
            textAnchor="end"
            className="fill-[var(--color-label-tertiary)]"
            style={{ fontSize: 10 }}
          >
            {formatAxisMoney(v)}
          </text>
        </g>
      ))}
      <path
        d={line}
        fill="none"
        stroke="var(--color-tint)"
        strokeWidth={2.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {hi >= 0 && (
        <g>
          <line
            x1={xAt(hi)}
            x2={xAt(hi)}
            y1={padT}
            y2={padT + plotH}
            stroke="var(--color-label)"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.45}
          />
          <circle
            cx={xAt(hi)}
            cy={yAt(series[hi].equity)}
            r={6}
            fill="var(--color-tint)"
            stroke="var(--color-surface)"
            strokeWidth={2}
          />
          <text
            x={xAt(hi)}
            y={Math.max(padT + 12, yAt(series[hi].equity) - 12)}
            textAnchor="middle"
            className="fill-[var(--color-label)]"
            style={{ fontSize: 11, fontWeight: 600 }}
          >
            {formatAxisMoney(series[hi].equity)}
          </text>
        </g>
      )}
      {xLabels.map(({ i, label }) => (
        <text
          key={i}
          x={xAt(i)}
          y={h - 8}
          textAnchor="middle"
          className="fill-[var(--color-label-tertiary)]"
          style={{ fontSize: 9 }}
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
