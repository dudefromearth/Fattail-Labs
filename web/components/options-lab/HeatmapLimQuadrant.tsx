"use client";

/**
 * LIM quadrant plane — Spec v0.4.7 LIM9. No LIM math here; LimResult is the source.
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
  LIM_AXIS_GREEN,
  LIM_AXIS_RED,
  LIM_DISC_SPHERE,
  LIM_DOT_OPACITY,
  LIM_LABEL_COMPRESSION,
  LIM_LABEL_EXPANSION,
  LIM_LABEL_WEIGHT_ABOVE,
  LIM_LABEL_WEIGHT_BELOW,
  limChromeLine3,
  limDiscRadiusPx,
  limDotXY,
  limGhostOpacity,
  limGhostXY,
  limPlanePoint,
  limRefusalMessage,
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

const vLabel: CSSProperties = {
  writingMode: "vertical-rl",
  transform: "rotate(180deg)",
  fontSize: "1.375rem",
  fontWeight: 700,
  letterSpacing: "0.22em",
  lineHeight: 1.1,
};

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
  const live = result != null && result.valid;
  const refusal = result && !result.valid ? limRefusalMessage(result) : null;
  const pt = limPlanePoint(result);
  const discR = limDiscRadiusPx(plot.w, plot.h);
  const discD = discR * 2;
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
      <div className="flex min-h-0 flex-1 flex-row gap-4 px-5 pb-2 pt-5">
        <div className="flex min-h-0 min-w-0 flex-[3] flex-col">
          <div className="flex min-h-0 flex-1">
            <div className="flex w-11 shrink-0 flex-col pr-3">
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <span
                  data-testid="lim-label-expansion"
                  style={{ ...vLabel, color: LIM_AXIS_GREEN }}
                >
                  {LIM_LABEL_EXPANSION}
                </span>
              </div>
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <span
                  data-testid="lim-label-compression"
                  style={{ ...vLabel, color: LIM_AXIS_RED }}
                >
                  {LIM_LABEL_COMPRESSION}
                </span>
              </div>
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
                  <Cell fill="a" testid="lim-cell-ul" />
                  <Cell fill="b" testid="lim-cell-ur" />
                  <Cell fill="b" testid="lim-cell-ll" />
                  <Cell fill="a" testid="lim-cell-lr" />
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

                {live && flags.trail
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
                            width: discD,
                            height: discD,
                            marginLeft: -discR,
                            marginTop: -discR,
                            background: "var(--lim-identity)",
                            opacity: limGhostOpacity(g.opacity),
                          }}
                        />
                      );
                    })
                  : null}

                {live ? (
                  <span
                    data-testid="lim-dot"
                    data-lim-dot-opacity={String(LIM_DOT_OPACITY)}
                    className="pointer-events-none absolute z-[10] rounded-full"
                    style={{
                      left: dot.left,
                      top: dot.top,
                      width: discD,
                      height: discD,
                      marginLeft: -discR,
                      marginTop: -discR,
                      background: LIM_DISC_SPHERE,
                      boxShadow: "0 0 16px var(--lim-identity-glow)",
                      opacity: LIM_DOT_OPACITY,
                    }}
                  />
                ) : null}

                {refusal ? (
                  <p
                    className="absolute inset-0 z-[12] flex items-center justify-center px-6 text-center text-[13px] leading-snug text-white/85"
                    data-testid="lim-scale-refusal"
                  >
                    {refusal}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center justify-between px-1 pt-3">
                <span
                  data-testid="lim-label-weight-below"
                  className="text-[1.25rem] font-bold tracking-wide"
                  style={{ color: LIM_AXIS_RED }}
                >
                  {LIM_LABEL_WEIGHT_BELOW}
                </span>
                <span
                  data-testid="lim-label-weight-above"
                  className="text-[1.25rem] font-bold tracking-wide"
                  style={{ color: LIM_AXIS_GREEN }}
                >
                  {LIM_LABEL_WEIGHT_ABOVE}
                </span>
              </div>
              <div className="flex shrink-0 items-center justify-between px-1 pt-1 pb-3 text-[14px] tabular-nums text-white/80">
                <span data-testid="lim-tick-x-lo">−100</span>
                <span data-testid="lim-tick-x-0">0</span>
                <span data-testid="lim-tick-x-hi">+100</span>
              </div>
            </div>
            <div className="flex w-9 shrink-0 flex-col justify-between py-1 pl-2 text-right text-[15px] font-medium tabular-nums text-white/85">
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
        className="shrink-0 px-5 py-2 text-[11px] leading-snug text-white/70"
        data-testid="lim-chrome-line-3"
      >
        {limChromeLine3(result?.oiAsOf ?? null)}
      </p>
    </div>
  );
}

function Cell({
  fill,
  testid,
}: {
  fill: "a" | "b";
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
      className="border-[var(--lim-cell-border)]"
      style={{
        background: fill === "a" ? "var(--lim-cell-a)" : "var(--lim-cell-b)",
        borderRightWidth: testid.endsWith("ul") || testid.endsWith("ll") ? 1 : 0,
        borderBottomWidth: testid.endsWith("ul") || testid.endsWith("ur") ? 1 : 0,
      }}
    />
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
  const spotLabel =
    spot != null && Number.isFinite(spot) ? spot.toFixed(2) : null;

  return (
    <div
      className="relative flex min-h-0 min-w-[11rem] flex-1 flex-col overflow-hidden pt-1"
      data-testid="lim-companion-gex"
      data-lim-spot-line={glow ? "1" : undefined}
    >
      {points.map((pt) => {
        const mag = pt.value != null ? Math.abs(pt.value) : 0;
        const pct = `${((mag / scale) * 50).toFixed(2)}%`;
        const neg = (pt.value ?? 0) < 0;
        const above = spot != null && pt.strike > spot;
        const below = spot != null && pt.strike < spot;
        const barColor = above
          ? LIM_AXIS_GREEN
          : below
            ? LIM_AXIS_RED
            : "rgba(255,255,255,0.35)";
        return (
          <div
            key={pt.strike}
            className="flex min-h-0 flex-1 items-center px-1"
            data-lim-bar=""
            data-lim-bar-side={above ? "above" : below ? "below" : "spot"}
          >
            <span className="w-14 shrink-0 text-right text-[12px] tabular-nums text-white/70">
              {pt.label}
            </span>
            <div className="relative mx-1 h-[70%] min-h-[2px] flex-1 bg-white/[0.04]">
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
              {mag > 0 ? (
                <div
                  className="absolute top-0 bottom-0"
                  style={
                    neg
                      ? { right: "50%", width: pct, background: barColor }
                      : { left: "50%", width: pct, background: barColor }
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
          className="pointer-events-none absolute left-14 right-1 h-px"
          style={{
            top: `${spotTop}%`,
            background: glow.color,
            boxShadow: glow.boxShadow,
          }}
        />
      ) : null}
      {spotTop != null && spotLabel ? (
        <span
          data-testid="lim-spot-price"
          className="pointer-events-none absolute left-14 z-[6] -translate-y-1/2 pl-1 text-[13px] font-semibold tabular-nums"
          style={{ top: `${spotTop}%`, color: LIM_AXIS_RED }}
        >
          {spotLabel}
        </span>
      ) : null}
      {ann.cog != null && cogTop != null ? (
        <div
          data-testid="lim-cog-hairline"
          className="pointer-events-none absolute left-14 right-1 h-px bg-white/35"
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
            className="pointer-events-none absolute left-14 right-1 h-px bg-white/20"
            style={{ top: `${top}%` }}
          />
        );
      })}
    </div>
  );
}
