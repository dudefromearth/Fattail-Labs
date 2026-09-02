"use client";

/**
 * LIM quadrant plane — Spec v0.4.3 §7.3. No LIM math here; LimResult is the source.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import SegmentedControl from "@/components/ui/SegmentedControl";
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
  LIM_AXIS_X,
  LIM_AXIS_Y,
  LIM_DISC_R_PT,
  LIM_DOT_OPACITY,
  limChromeLines,
  limDotXY,
  limGhostXY,
  limMagFDisplay,
  limPlanePoint,
  limProximityDisplay,
  limRingRadius,
  limStateLine,
  type LimDensity,
} from "@/lib/options-lab/templates/limChrome";

export type HeatmapLimQuadrantProps = {
  result: LimResult | null;
  errorMessage: string | null;
  ghosts: readonly LimTrailGhost[];
  gexPoints?: readonly GexProfilePoint[] | null;
  spot?: number | null;
  showAnnotations?: boolean;
};

const PLANE_MIN = 240;

export default function HeatmapLimQuadrant({
  result,
  errorMessage,
  ghosts,
  gexPoints = null,
  spot = null,
  showAnnotations = false,
}: HeatmapLimQuadrantProps) {
  const [density, setDensity] = useState<LimDensity>("comfort");
  const [userSet, setUserSet] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [wh, setWh] = useState({ w: 320, h: 320 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const w = Math.max(PLANE_MIN, cr.width);
      const h = Math.max(PLANE_MIN, cr.height);
      setWh({ w, h });
      if (!userSet && cr.width < 420) setDensity("compact");
      if (!userSet && cr.width >= 420) setDensity("comfort");
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [userSet]);

  const comfort = density === "comfort";
  const pt = limPlanePoint(result);
  const proximity = result?.crossingProximity ?? 1;
  const minWH = Math.min(wh.w, wh.h);
  const dot = limDotXY(pt.x, pt.y, wh.w, wh.h);
  const ringR = limRingRadius(proximity, minWH);
  const lines = limChromeLines(result?.oiAsOf ?? null, density);
  const state = limStateLine(
    {
      expiration: result?.expiration ?? "—",
      wings: result?.wings ?? 0,
      crossingCount: result?.crossingCount ?? 0,
    },
    density,
  );

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
      ref={boxRef}
      className="flex min-h-full flex-col text-[13px] text-white/80"
      data-testid="heatmap-lim-quadrant"
      data-lim-plane
      data-density={density}
      style={
        {
          "--lim-identity": "#0a84ff",
          "--lim-identity-glow": "rgba(10, 132, 255, 0.55)",
          "--lim-identity-ring": "#0a84ff",
          "--lim-crosshair": "rgba(255, 255, 255, 0.22)",
        } as CSSProperties
      }
    >
      <div className="flex shrink-0 items-center justify-end gap-2 px-3 py-1">
        <div className="w-56">
          <SegmentedControl
            ariaLabel="LIM density"
            value={density}
            onChange={(id) => {
              setUserSet(true);
              setDensity(id);
            }}
            options={[
              { id: "comfort", label: "Comfort" },
              { id: "compact", label: "Compact" },
            ]}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 md:flex-row">
      <div
        className="relative mx-auto min-h-[16rem] w-full max-w-[36rem] flex-1 overflow-visible"
        data-testid="lim-plane"
        style={{ minHeight: minWH }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${wh.w} ${wh.h}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <line
            x1={wh.w / 2}
            y1={0}
            x2={wh.w / 2}
            y2={wh.h}
            stroke="var(--lim-crosshair)"
            strokeWidth="1"
            data-testid="lim-crosshair-x"
          />
          <line
            x1={0}
            y1={wh.h / 2}
            x2={wh.w}
            y2={wh.h / 2}
            stroke="var(--lim-crosshair)"
            strokeWidth="1"
            data-testid="lim-crosshair-y"
          />
        </svg>

        {comfort
          ? ghosts.map((g, i) => {
              const p = limGhostXY(g.xUnclamped, g.y, wh.w, wh.h);
              return (
                <span
                  key={`${g.t}-${i}`}
                  data-testid="lim-ghost"
                  className="pointer-events-none absolute rounded-full"
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
          data-testid="lim-ring"
          data-lim-ring=""
          className="pointer-events-none absolute rounded-full border"
          style={{
            left: dot.left,
            top: dot.top,
            width: ringR * 2,
            height: ringR * 2,
            marginLeft: -ringR,
            marginTop: -ringR,
            borderColor: "var(--lim-identity-ring)",
            background: "transparent",
            opacity: 1,
          }}
        />

        <span
          data-testid="lim-dot"
          data-lim-dot-opacity={String(LIM_DOT_OPACITY)}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: dot.left,
            top: dot.top,
            width: LIM_DISC_R_PT * 2,
            height: LIM_DISC_R_PT * 2,
            marginLeft: -LIM_DISC_R_PT,
            marginTop: -LIM_DISC_R_PT,
            background: "var(--lim-identity)",
            boxShadow: "0 0 10px var(--lim-identity-glow)",
            opacity: LIM_DOT_OPACITY,
          }}
        />

        {comfort && result ? (
          <div
            className="absolute right-2 top-2 flex flex-col items-end gap-1 text-[11px] tabular-nums"
            data-testid="lim-comfort-readout"
          >
            <span data-testid="lim-chip-proximity" className="rounded px-1.5 py-0.5 bg-black/40">
              {limProximityDisplay(proximity)}
            </span>
            <span data-testid="lim-readout-magf" className="rounded px-1.5 py-0.5 bg-black/40">
              magF {limMagFDisplay(result?.magF ?? 0)}
            </span>
          </div>
        ) : null}

        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white/45">
          {LIM_AXIS_X}
        </span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-white/45">
          {LIM_AXIS_Y}
        </span>
        <span className="absolute bottom-1 left-2 text-[10px] tabular-nums text-white/35">
          −100
        </span>
        <span className="absolute bottom-1 right-2 text-[10px] tabular-nums text-white/35">
          +100
        </span>
        <span className="absolute right-1 top-2 text-[10px] tabular-nums text-white/35">
          100
        </span>
        <span className="absolute bottom-6 right-1 text-[10px] tabular-nums text-white/35">
          0
        </span>
      </div>

      {gexPoints && gexPoints.length > 0 ? (
        <LimCompanionGex
          points={gexPoints}
          spot={spot}
          result={result}
          showAnnotations={comfort && showAnnotations}
        />
      ) : null}
      </div>

      <div className="shrink-0 space-y-0.5 px-3 py-2 text-[11px] leading-snug text-white/55">
        <p data-testid="lim-state-line">{state}</p>
        {lines.map((line) => (
          <p key={line} data-testid="lim-chrome-line">
            {line}
          </p>
        ))}
      </div>
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
      className="relative min-h-[12rem] w-full max-w-[18rem] flex-1 overflow-hidden"
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
            className="flex h-5 items-center px-1"
            data-lim-bar=""
          >
            <span className="w-12 shrink-0 text-right text-[10px] tabular-nums text-white/40">
              {pt.label}
            </span>
            <div className="relative mx-1 h-3 flex-1 bg-white/[0.04]">
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
          className="pointer-events-none absolute left-12 right-1 h-px"
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
          className="pointer-events-none absolute left-12 right-1 h-px bg-white/35"
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
            className="pointer-events-none absolute left-12 right-1 h-px bg-white/20"
            style={{ top: `${top}%` }}
          />
        );
      })}
    </div>
  );
}
