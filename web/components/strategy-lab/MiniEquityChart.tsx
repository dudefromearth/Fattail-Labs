"use client";

/**
 * Pure SVG sparkline for equity path — shared Curate/Deploy dashboard primitive.
 */

export type EquityPoint = {
  t?: string | null;
  equity: number;
  cash?: number | null;
};

type Props = {
  series: EquityPoint[];
  width?: number;
  height?: number;
  className?: string;
  /** baseline (allocation) for color / zero line */
  baseline?: number;
};

export default function MiniEquityChart({
  series,
  width = 160,
  height = 48,
  className = "",
  baseline,
}: Props) {
  const pts = series.filter((p) => typeof p.equity === "number");
  if (pts.length < 2) {
    return (
      <div
        className={`flex items-center justify-center text-[10px] text-[var(--color-label-secondary)] ${className}`}
        style={{ width, height }}
      >
        No equity path yet
      </div>
    );
  }

  const vals = pts.map((p) => p.equity);
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

  const line = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area =
    line +
    ` L${xy[xy.length - 1][0].toFixed(1)},${(pad + h).toFixed(1)}` +
    ` L${xy[0][0].toFixed(1)},${(pad + h).toFixed(1)} Z`;

  const last = vals[vals.length - 1];
  const up = last >= base;
  const stroke = up ? "#059669" : "#e11d48";
  const fill = up ? "rgba(5,150,105,0.12)" : "rgba(225,29,72,0.12)";

  const baseY =
    pad + (1 - (base - min) / (max - min)) * h;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={`Equity path, last ${last.toFixed(0)}`}
    >
      <line
        x1={pad}
        x2={width - pad}
        y1={baseY}
        y2={baseY}
        stroke="var(--color-separator)"
        strokeWidth={1}
        strokeDasharray="2 2"
      />
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={1.5} />
      <circle
        cx={xy[xy.length - 1][0]}
        cy={xy[xy.length - 1][1]}
        r={2.5}
        fill={stroke}
      />
    </svg>
  );
}
