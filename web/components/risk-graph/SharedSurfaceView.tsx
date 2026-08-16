"use client";

/**
 * Shared P&L surface canvas — Strategy Lab Design + Analyzer Surface.
 * Same `computeSurfaceSheet` model. Presentation only differs by `tone`.
 */

import { useEffect, useMemo, useRef } from "react";
import {
  computeSurfaceSheet,
  type SurfaceLeg,
  type SurfaceQuality,
} from "@/lib/risk-graph/surfaceModel";

type Props = {
  legs: SurfaceLeg[];
  spot: number;
  quality?: SurfaceQuality;
  ivSource?: string;
  tone?: "lab" | "dark";
  label?: string;
};

export default function SharedSurfaceView({
  legs,
  spot,
  quality = "per_leg_iv",
  ivSource = "per_leg",
  tone = "lab",
  label,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sheet = useMemo(() => {
    if (!legs.length || !(spot > 0)) return null;
    try {
      return computeSurfaceSheet(legs, {
        spot,
        nx: 56,
        nt: 28,
        quality,
        ivSource,
      });
    } catch {
      return null;
    }
  }, [legs, spot, quality, ivSource]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sheet) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 640;
    const cssH = canvas.clientHeight || 280;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSheet(ctx, cssW, cssH, sheet, tone);
  }, [sheet, tone]);

  const dark = tone === "dark";
  return (
    <div
      className={
        dark
          ? "flex h-full min-h-[280px] flex-col bg-[#0a0a0e]"
          : "flex min-h-[16rem] flex-col overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)]"
      }
      data-testid="shared-surface-view"
      data-quality={sheet?.quality ?? "empty"}
    >
      <div
        className={
          "flex items-baseline justify-between px-3 pt-2 text-[12px] " +
          (dark ? "text-white/55" : "text-[var(--color-label-secondary)]")
        }
      >
        <span className={dark ? "font-medium text-white/80" : "font-medium text-[var(--color-label)]"}>
          {label || "P&L surface"}
        </span>
        <span className="font-mono">
          {sheet
            ? `${sheet.ivSource} · ${sheet.quality}`
            : "no structure"}
        </span>
      </div>
      {sheet ? (
        <canvas ref={canvasRef} className="min-h-0 w-full flex-1" />
      ) : (
        <p
          className={
            "flex flex-1 items-center justify-center px-4 text-center text-[12px] " +
            (dark ? "text-white/40" : "text-[var(--color-label-secondary)]")
          }
        >
          Focus a listed structure to drive the sheet.
        </p>
      )}
    </div>
  );
}

function drawSheet(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sheet: NonNullable<ReturnType<typeof computeSurfaceSheet>>,
  tone: "lab" | "dark",
) {
  ctx.clearRect(0, 0, w, h);
  const pad = { l: 28, r: 12, t: 10, b: 22 };
  const nt = sheet.timeAxis.length;
  const nx = sheet.spotAxis.length;
  const span = Math.max(sheet.maxPnL - sheet.minPnL, 1);
  const project = (i: number, j: number, pnl: number) => {
    const u = i / Math.max(nx - 1, 1);
    const v = j / Math.max(nt - 1, 1);
    const x =
      pad.l +
      u * (w - pad.l - pad.r) * 0.82 +
      v * (w - pad.l - pad.r) * 0.16;
    const yBase =
      pad.t +
      (1 - v) * (h - pad.t - pad.b) * 0.22 +
      (h - pad.t - pad.b) * 0.62;
    const y = yBase - ((pnl - sheet.minPnL) / span) * (h - pad.t - pad.b) * 0.55;
    return { x, y };
  };

  const grid = tone === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  for (let j = 0; j < nt; j += 4) {
    ctx.beginPath();
    for (let i = 0; i < nx; i++) {
      const p = project(i, j, sheet.pnlGrid[j][i]);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < nx; i += 4) {
    ctx.beginPath();
    for (let j = 0; j < nt; j++) {
      const p = project(i, j, sheet.pnlGrid[j][i]);
      if (j === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  ctx.lineWidth = 1.4;
  ctx.lineJoin = "round";
  for (let j = 0; j < nt - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const z = sheet.pnlGrid[j][i];
      const a = project(i, j, z);
      const b = project(i + 1, j, sheet.pnlGrid[j][i + 1]);
      const c = project(i, j + 1, sheet.pnlGrid[j + 1][i]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(c.x, c.y);
      ctx.closePath();
      const t = (z - sheet.minPnL) / span;
      const pos = z >= 0;
      if (tone === "dark") {
        ctx.fillStyle = pos
          ? `rgba(52, 211, 153, ${0.08 + t * 0.28})`
          : `rgba(248, 113, 113, ${0.08 + (1 - t) * 0.28})`;
      } else {
        ctx.fillStyle = pos
          ? `rgba(34, 197, 94, ${0.06 + t * 0.22})`
          : `rgba(239, 68, 68, ${0.06 + (1 - t) * 0.22})`;
      }
      ctx.fill();
    }
  }

  let si = 0;
  let best = Infinity;
  for (let i = 0; i < nx; i++) {
    const d = Math.abs(sheet.spotAxis[i] - sheet.spot);
    if (d < best) {
      best = d;
      si = i;
    }
  }
  ctx.strokeStyle = tone === "dark" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  for (let j = 0; j < nt; j++) {
    const p = project(si, j, sheet.pnlGrid[j][si]);
    if (j === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}
