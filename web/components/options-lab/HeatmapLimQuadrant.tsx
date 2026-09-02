"use client";

/**
 * LIM quadrant plane — Spec v0.4.4 §7.3 / §7.6. No LIM math here; LimResult is the source.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { LimResult } from "@/lib/options-lab/templates/lim";
import type { LimTrailGhost } from "@/lib/options-lab/templates/limTrail";
import type { GexProfilePoint } from "@/lib/options-lab/templates/gex";
import {
  gexAnnotationMarks,
  gexProfileScale,
  gexSpotGlowCss,
  gexSpotLineTopPct,
} from "@/lib/options-lab/templates/gex";
import {
  LIM_AXIS_X_EDGE,
  LIM_AXIS_Y_BOTTOM,
  LIM_AXIS_Y_TOP,
  LIM_CELL_LL,
  LIM_CELL_LR,
  LIM_CELL_UL,
  LIM_CELL_UR,
  LIM_DISC_R_PT,
  LIM_DOT_OPACITY,
  limChromeLine3,
  limDotXY,
  limGhostXY,
  limPlanePoint,
  limProximityDisplay,
  limSurfaceFlags,
} from "@/lib/options-lab/templates/limChrome";

export type HeatmapLimQuadrantProps = {
  result: LimResult | null;
  errorMessage: string | null;
  ghosts: readonly LimTrailGhost[];
  gexPoints?: readonly GexProfilePoint[] | null;
  spot?: number | null;
  showAnnotations?: boolean;
};

const PLANE_MIN = 160;

export default function HeatmapLimQuadrant({
  result,
  errorMessage,
  ghosts,
  gexPoints = null,
  spot = null,
  showAnnotations = false,
}: HeatmapLimQuadrantProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);
  const [rootW, setRootW] = useState(640);
  const [plot, setPlot] = useState({ w: 320, h: 280 });

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        if (e.target === rootRef.current) {
          setRootW(cr.width);
        }
        if (e.target === plotRef.current) {
          setPlot({
            w: Math.max(PLANE_MIN, cr.width),
            h: Math.max(PLANE_MIN, cr.height),
          });
        }
      }
    });
    if (rootRef.current) ro.observe(rootRef.current);
    if (plotRef.current) ro.observe(plotRef.current);
    return () => ro.disconnect();
  }, []);

  const flags = limSurfaceFlags(rootW);
  const pt = limPlanePoint(result);
  const proximity = result?.crossingProximity ?? 1;
  const dot = limDotXY(pt.x, pt.y, plot.w, plot.h);

  if (errorMessage) {
    return (
      <div
        className="flex min-h-[16rem] flex-col justify-center px-4 py-8 text-sm text-white/80"
        data-testid="heatmap-lim-unavailable"
        data-lim-plane
      >
        <p>LIM unavailable. {errorMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="flex h-full min-h-0 flex-col text-[13px] text-white/80"
      data-testid="heatmap-lim-quadrant"
      data-lim-plane
      data-lim-width={String(Math.round(rootW))}
      style={
        {
          "--lim-identity": "#0a84ff",
          "--lim-identity-glow": "rgba(10, 132, 255, 0.55)",
          "--lim-crosshair": "rgba(255, 255, 255, 0.62)",
          "--lim-cell-border": "rgba(255, 255, 255, 0.38)",
          "--lim-cell-a": "rgba(255, 255, 255, 0.035)",
          "--lim-cell-b": "rgba(255, 255, 255, 0.07)",
        } as CSSProperties
      }
    >
      <div className="flex min-h-0 flex-1 flex-row gap-2 px-2 pt-1">
        <div className="flex min-h-0 min-w-0 flex-[3] flex-col">
          <div className="flex min-h-0 flex-1">
            <div className="flex w-[5.5rem] shrink-0 flex-col justify-between py-1 pr-1 text-[9px] leading-snug text-white/70">
              <span data-testid="lim-axis-y-top">{LIM_AXIS_Y_TOP}</span>
              <span data-testid="lim-axis-y-bottom">{LIM_AXIS_Y_BOTTOM}</span>
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div
                ref={plotRef}
                className="relative min-h-0 w-full flex-1 overflow-hidden"
                data-testid="lim-plane"
              >
                <div
                  className="absolute inset-0 grid grid-cols-2 grid-rows-2 border"
                  style={{ borderColor: "var(--lim-cell-border)" }}
                  data-testid="lim-cells"
                >
                  <Cell label={LIM_CELL_UL} fill="a" testid="lim-cell-ul" />
                  <Cell label={LIM_CELL_UR} fill="b" testid="lim-cell-ur" />
                  <Cell label={LIM_CELL_LL} fill="b" testid="lim-cell-ll" />
                  <Cell label={LIM_CELL_LR} fill="a" testid="lim-cell-lr" />
                </div>
                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  viewBox={`0 0 ${plot.w} ${plot.h}`}
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <line
                    x1={plot.w / 2}
                    y1={0}
                    x2={plot.w / 2}
                    y2={plot.h}
                    stroke="var(--lim-crosshair)"
                    strokeWidth="1.25"
                    data-testid="lim-crosshair-x"
                  />
                  <line
                    x1={0}
                    y1={plot.h / 2}
                    x2={plot.w}
                    y2={plot.h / 2}
                    stroke="var(--lim-crosshair)"
                    strokeWidth="1.25"
                    data-testid="lim-crosshair-y"
                  />
                </svg>

                {flags.trail
                  ? ghosts.map((g, i) => {
                      const p = limGhostXY(g.xUnclamped, g.y, plot.w, plot.h);
                      return (
                        <span
                          key={`${g.t}-${i}`}
                          data-testid="lim-ghost"
                          className="pointer-events-none absolute z-[5] rounded-full"
                          style={{
                            left: p.left,
                            top: p.top,
                            width: 6,
                            height: 6,
                            marginLeft: -3,
                            marginTop: -3,
                            background: "var(--lim-identity)",
                            opacity: g.opacity,
                          }}
                        />
                      );
                    })
                  : null}

                <span
                  data-testid="lim-dot"
                  data-lim-dot-opacity={String(LIM_DOT_OPACITY)}
                  className="pointer-events-none absolute z-[10] rounded-full"
                  style={{
                    left: dot.left,
                    top: dot.top,
                    width: LIM_DISC_R_PT * 2,
                    height: LIM_DISC_R_PT * 2,
                    marginLeft: -LIM_DISC_R_PT,
                    marginTop: -LIM_DISC_R_PT,
                    background: "var(--lim-identity)",
                    boxShadow: "0 0 12px var(--lim-identity-glow)",
                    opacity: LIM_DOT_OPACITY,
                  }}
                />

                <span
                  data-testid="lim-chip-proximity"
                  className="absolute right-2 top-2 z-[11] rounded px-1.5 py-0.5 text-[11px] tabular-nums bg-black/55 text-white/90"
                >
                  {limProximityDisplay(proximity)}
                </span>
              </div>
              <div className="flex shrink-0 items-center justify-between px-1 pt-1 text-[11px] tabular-nums text-white/80">
                <span data-testid="lim-tick-x-lo">−100</span>
                <span data-testid="lim-tick-x-0">0</span>
                <span data-testid="lim-tick-x-hi">+100</span>
              </div>
              <p
                className="shrink-0 px-1 pb-1 text-center text-[10px] leading-snug text-white/70"
                data-testid="lim-axis-x-edge"
              >
                {LIM_AXIS_X_EDGE}
              </p>
            </div>
            <div className="flex w-7 shrink-0 flex-col justify-between py-1 pl-1 text-right text-[11px] tabular-nums text-white/80">
              <span data-testid="lim-tick-y-hi">100</span>
              <span data-testid="lim-tick-y-mid">50</span>
              <span data-testid="lim-tick-y-lo">0</span>
            </div>
          </div>
        </div>

        {gexPoints && gexPoints.length > 0 ? (
          <LimCompanionGex
            points={gexPoints}
            spot={spot}
            result={result}
            showAnnotations={flags.trail && showAnnotations}
          />
        ) : null}
      </div>

      <p
        className="shrink-0 px-3 py-1.5 text-[11px] leading-snug text-white/70"
        data-testid="lim-chrome-line-3"
      >
        {limChromeLine3(result?.oiAsOf ?? null)}
      </p>
    </div>
  );
}

function Cell({
  label,
  fill,
  testid,
}: {
  label: string;
  fill: "a" | "b";
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
      className="flex items-center justify-center border-[var(--lim-cell-border)] px-1 text-center text-[12px] font-medium leading-tight text-white/32 sm:text-[13px]"
      style={{
        background: fill === "a" ? "var(--lim-cell-a)" : "var(--lim-cell-b)",
        borderRightWidth: testid.endsWith("ul") || testid.endsWith("ll") ? 1 : 0,
        borderBottomWidth: testid.endsWith("ul") || testid.endsWith("ur") ? 1 : 0,
      }}
    >
      {label}
    </div>
  );
}

function LimCompanionGex({
  points,
  spot,
  result,
  showAnnotations,
}: {
  points: readonly GexProfilePoint[];
  spot: number | null;
  result: LimResult | null;
  showAnnotations: boolean;
}) {
  const scale = gexProfileScale(points as GexProfilePoint[], "gex_net") || 1;
  const strikes = points.map((p) => p.strike);
  const glow = gexSpotGlowCss({ spotGlow: true });
  const spotTop = gexSpotLineTopPct(spot, strikes);
  const ann = gexAnnotationMarks({
    showAnnotations,
    spotPrice: spot,
    centrePts: result?.centrePts,
    crossings: result?.crossings,
  });
  const cogTop = gexSpotLineTopPct(ann.cog, strikes);

  return (
    <div
      className="relative flex min-h-0 min-w-[10rem] flex-1 flex-col overflow-hidden"
      data-testid="lim-companion-gex"
      data-lim-spot-line={glow ? "1" : undefined}
    >
      {points.map((pt) => {
        const mag = pt.value != null ? Math.abs(pt.value) : 0;
        const pct = `${((mag / scale) * 50).toFixed(2)}%`;
        const neg = (pt.value ?? 0) < 0;
        return (
          <div
            key={pt.strike}
            className="flex min-h-0 flex-1 items-center px-1"
            data-lim-bar=""
          >
            <span className="w-10 shrink-0 text-right text-[9px] tabular-nums text-white/50">
              {pt.label}
            </span>
            <div className="relative mx-1 h-[70%] min-h-[2px] flex-1 bg-white/[0.04]">
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
              {mag > 0 ? (
                <div
                  className="absolute top-0 bottom-0 bg-white/35"
                  style={
                    neg
                      ? { right: "50%", width: pct }
                      : { left: "50%", width: pct }
                  }
                />
              ) : null}
            </div>
          </div>
        );
      })}
      {spotTop != null && glow ? (
        <div
          data-testid="lim-spot-line"
          className="pointer-events-none absolute left-10 right-1 h-px"
          style={{
            top: `${spotTop}%`,
            background: glow.color,
            boxShadow: glow.boxShadow,
          }}
        />
      ) : null}
      {ann.cog != null && cogTop != null ? (
        <div
          data-testid="lim-cog-hairline"
          className="pointer-events-none absolute left-10 right-1 h-px bg-white/35"
          style={{ top: `${cogTop}%` }}
        />
      ) : null}
      {ann.ticks.map((k) => {
        const top = gexSpotLineTopPct(k, strikes);
        if (top == null) return null;
        return (
          <div
            key={`tick-${k}`}
            data-testid="lim-crossing-tick"
            data-lo-hi={String(k)}
            className="pointer-events-none absolute left-10 right-1 h-px bg-white/20"
            style={{ top: `${top}%` }}
          />
        );
      })}
    </div>
  );
}
