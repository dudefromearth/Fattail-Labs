"use client";

import type { SeriesPoint } from "@/lib/reportsBook";

export default function DrawdownChart({ series }: { series: SeriesPoint[] }) {
  const w = 720;
  const h = 140;
  const padL = 52;
  const padR = 12;
  const padT = 8;
  const padB = 24;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  if (series.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--color-label-tertiary)]"
        style={{ minHeight: h }}
      >
        Drawdown % from peak balance.
      </div>
    );
  }

  const vals = series.map((p) => p.drawdownPct * 100); // percent
  const minV = Math.min(...vals, -1);
  const maxV = 0;
  const y0 = minV * 1.1;
  const y1 = maxV;
  const n = series.length;
  const xAt = (i: number) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => padT + plotH - ((v - y0) / (y1 - y0 || 1)) * plotH;

  const line = series
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.drawdownPct * 100).toFixed(1)}`,
    )
    .join(" ");
  const area =
    line +
    ` L${xAt(n - 1).toFixed(1)},${yAt(0).toFixed(1)} L${xAt(0).toFixed(1)},${yAt(0).toFixed(1)} Z`;

  const ticks = [0, -2, -4, -6, -8].filter((t) => t >= y0 - 0.5);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-auto w-full"
      role="img"
      aria-label="Drawdown percent"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={padL}
            x2={w - padR}
            y1={yAt(t)}
            y2={yAt(t)}
            stroke="var(--color-separator)"
            strokeWidth={1}
          />
          <text
            x={padL - 8}
            y={yAt(t) + 3}
            textAnchor="end"
            className="fill-[var(--color-label-tertiary)]"
            style={{ fontSize: 10 }}
          >
            {t.toFixed(2)}%
          </text>
        </g>
      ))}
      <path d={area} fill="var(--color-destructive-soft)" />
      <path
        d={line}
        fill="none"
        stroke="var(--color-destructive)"
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
    </svg>
  );
}
