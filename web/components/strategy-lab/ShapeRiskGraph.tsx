"use client";

/**
 * Expiration risk curve for Design Position Builder.
 * Drag handles to edit the same relative shape as Definition mode.
 */

import { useMemo, useRef, useState } from "react";
import type { StrategyConfig } from "@/lib/strategyPacks";
import { buildPayoffCurve } from "@/lib/options-lab/riskPayoff";
import type { ParsedTosTrade } from "@/lib/options-lab/tosParser";
import {
  SHAPE_ATM,
  STRIKE_PT,
  relativeShape,
  strikesToPts,
} from "@/lib/options-lab/designRelativeShape";
import { TEMPLATE_LABELS } from "@/lib/options-lab/strategyCatalog";

type Props = {
  config: StrategyConfig;
  setField: (name: string, value: unknown) => void;
};

const W = 640;
const H = 220;
const PAD = { l: 36, r: 12, t: 16, b: 28 };

export default function ShapeRiskGraph({ config, setField }: Props) {
  const shape = useMemo(() => relativeShape(config), [config]);
  const trade = useMemo<ParsedTosTrade>(
    () => ({
      action: config.trade_side === "sell" ? "SELL" : "BUY",
      structure: "custom",
      symbol: "REL",
      expiration: "2099-01-01",
      right: "call",
      limit: null,
      debit: shape.debit,
      isCredit: shape.debit < 0,
      legs: shape.legs,
      strikes: shape.legs.map((l) => l.strike),
      width: shape.wing,
      body: shape.center,
      raw: "",
    }),
    [config.trade_side, shape],
  );
  const curve = useMemo(
    () =>
      buildPayoffCurve(trade, {
        padPts: shape.wing * 3 + 20,
        steps: 160,
        spot: SHAPE_ATM,
      }),
    [trade, shape.wing],
  );

  const [drag, setDrag] = useState<{
    kind: string;
    origin: number;
    ear?: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const x0 = PAD.l;
  const x1 = W - PAD.r;
  const y0 = PAD.t;
  const y1 = H - PAD.b;
  const xScale = (x: number) =>
    x0 + ((x - curve.xMin) / Math.max(curve.xMax - curve.xMin, 1)) * (x1 - x0);
  const yScale = (y: number) =>
    y1 - ((y - curve.yMin) / Math.max(curve.yMax - curve.yMin, 1)) * (y1 - y0);
  const xInv = (px: number) =>
    curve.xMin + ((px - x0) / Math.max(x1 - x0, 1)) * (curve.xMax - curve.xMin);

  const path = curve.points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`)
    .join(" ");

  const zeroY = yScale(0);
  const spotX = xScale(SHAPE_ATM);

  function clientX(e: React.PointerEvent): number {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return 0;
    return ((e.clientX - box.left) / box.width) * W;
  }

  function onDown(kind: string, strike: number, ear?: number) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDrag({ kind, origin: strike, ear });
    };
  }

  function onMove(e: React.PointerEvent) {
    if (!drag) return;
    const px = xInv(clientX(e));
    if (drag.kind === "center") {
      if (shape.template === "batman") return;
      const off = px - SHAPE_ATM;
      if (Math.abs(off) < Math.max(shape.wing * 0.2, 4)) {
        setField("placement", "atm");
        setField("bias", "neutral");
      } else {
        setField("placement", "otm");
        setField("option_right", off > 0 ? "call" : "put");
        setField("bias", off > 0 ? "bullish" : "bearish");
        setField("direction", off > 0 ? "call" : "put");
      }
      return;
    }
    if (drag.kind === "wing") {
      const from = drag.ear ?? shape.center;
      const w = Math.max(1, Math.round(Math.abs(px - from) / STRIKE_PT));
      setField("wing_width", w);
      setField("width_points_min", strikesToPts(w));
      setField("width_points_max", strikesToPts(w));
      return;
    }
    if (drag.kind === "body") {
      const pts = Math.abs(px - shape.center) * 2;
      const g = Math.max(shape.template === "batman" ? 1 : 0, Math.round(pts / STRIKE_PT));
      setField("short_gap", g);
      setField("body_width", g > 0 ? strikesToPts(g) : 0);
      return;
    }
    if (drag.kind === "extra") {
      const from = drag.ear ?? shape.center;
      const outer = Math.max(1, Math.round(Math.abs(px - from) / STRIKE_PT));
      setField("batman_style", "broken");
      setField("outer_width", outer);
    }
  }

  function onUp() {
    setDrag(null);
  }

  const long = config.trade_side !== "sell";

  return (
    <div className="space-y-2" data-testid="design-risk-graph">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-[14rem] w-full touch-none select-none"
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="img"
        aria-label="Expiration risk curve"
      >
        <rect x="0" y="0" width={W} height={H} fill="var(--color-surface-secondary)" rx="10" />
        <line
          x1={x0}
          y1={zeroY}
          x2={x1}
          y2={zeroY}
          stroke="var(--color-separator)"
          strokeWidth="1"
        />
        <line
          x1={spotX}
          y1={y0}
          x2={spotX}
          y2={y1}
          stroke="var(--color-label-tertiary)"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
        <text
          x={spotX + 4}
          y={y0 + 10}
          fill="var(--color-label-tertiary)"
          fontSize="10"
          fontFamily="var(--font-ui)"
        >
          ATM
        </text>
        <path
          d={path}
          fill="none"
          stroke={long ? "#22c55e" : "#ef4444"}
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
        {shape.handles.map((h) => (
          <g key={h.id} onPointerDown={onDown(h.kind, h.strike, h.ear)} className="cursor-ew-resize">
            <line
              x1={xScale(h.strike)}
              y1={y0}
              x2={xScale(h.strike)}
              y2={y1}
              stroke="transparent"
              strokeWidth="12"
            />
            <circle
              cx={xScale(h.strike)}
              cy={zeroY}
              r={drag?.kind === h.kind ? 7 : 5.5}
              fill="var(--color-surface)"
              stroke="var(--color-label)"
              strokeWidth="1.5"
            />
          </g>
        ))}
      </svg>
      <p className="text-[12px] text-[var(--color-label-secondary)]">
        {shape.template === "batman"
          ? "Drag: shorts = ear spacing, inner/outer = fly widths (strikes)."
          : "Drag: center = ATM/OTM, wings = width in strikes"}
        {shape.template === "bwb" ? ", far wing = broken" : ""}.{" "}
        {long ? "Long" : "Short"} {TEMPLATE_LABELS[shape.template]}.
      </p>
    </div>
  );
}
