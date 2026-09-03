"use client";

/**
 * Analyzer ISO PiP — 3D tent only. Corner docks are tiny squares on the frame.
 */

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  bindListedSurfaceLegs,
  computeSurfaceSheet,
  expiryFaceTau,
  MIN_TAU,
  type OpfLegMarkForSheet,
  type SurfaceSheet,
} from "@/lib/risk-graph/surfaceModel";
import {
  mountSurfaceScene,
  SURFACE_VALUE_PLANE_OPACITY_DEFAULT,
} from "@/lib/risk-graph/surfaceScene";
import {
  SURFACE_PAD_FRAC,
  surfaceAutofitWindow,
  surfaceValueWindow,
} from "@/lib/risk-graph/surfaceAutofit";
import { tauYearsWhatIf } from "@/lib/options-lab/whatIfClocks";
import type { ParsedTosTrade } from "@/lib/options-lab/tosParser";
import {
  PIP_SIZE_PX,
  pipCornerClass,
  type PipCorner,
  type PipSize,
} from "@/lib/options-lab/analyzerPip";

const DOCKS: PipCorner[] = ["ul", "ur", "ll", "lr"];

function dockClass(c: PipCorner): string {
  if (c === "ul") return "left-0 top-0";
  if (c === "ur") return "right-0 top-0";
  if (c === "ll") return "bottom-0 left-0";
  return "bottom-0 right-0";
}

function applyPipLook(
  scene: ReturnType<typeof mountSurfaceScene>,
  sheet: SurfaceSheet | null,
) {
  scene.setInspect({
    planes: {
      strike: { visible: false, opacity: 0, position: 0 },
      time: { visible: false, opacity: 0, position: 0 },
      value: {
        visible: true,
        opacity: SURFACE_VALUE_PLANE_OPACITY_DEFAULT,
        position: 0,
      },
    },
    valueWindow: sheet
      ? surfaceValueWindow(sheet.minPnL, sheet.maxPnL, SURFACE_PAD_FRAC)
      : undefined,
  });
}

export default function AnalyzerSurfacePip({
  trades,
  marks,
  spot,
  volOffsetPts = 0,
  timeOffsetHours = 0,
  size,
  corner,
  onCorner,
}: {
  trades: ParsedTosTrade[];
  marks: OpfLegMarkForSheet[] | null;
  spot: number | null;
  volOffsetPts?: number;
  timeOffsetHours?: number;
  size: PipSize;
  corner: PipCorner;
  onCorner: (c: PipCorner) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<ReturnType<typeof mountSurfaceScene> | null>(null);
  const dim = PIP_SIZE_PX[size];
  const [mountError, setMountError] = useState<string | null>(null);

  const sheet = useMemo(() => {
    const nowMs = Date.now() + (Number(timeOffsetHours) || 0) * 3_600_000;
    if (!(spot && spot > 0) || !trades.length || !marks?.length) return null;
    const liveLegs = trades.flatMap((t) => t.legs);
    const bound = bindListedSurfaceLegs(liveLegs, marks, {
      spot,
      tauFor: (exp) => {
        const rows = marks.filter((m) => {
          if (!exp || !m.expiration) return true;
          return (
            String(m.expiration).slice(0, 10) === String(exp).slice(0, 10)
          );
        });
        const taus = rows
          .map((m) => Number(m.tau))
          .filter((n) => Number.isFinite(n) && n > 0);
        return taus.length ? Math.max(...taus) : MIN_TAU;
      },
    });
    if (!bound.ok) return null;
    const legs = bound.legs.map((leg, i) => {
      const listed = (liveLegs[i]?.expiration || "").slice(0, 10);
      const tau0 = listed
        ? tauYearsWhatIf(listed, nowMs)
        : Math.max(leg.tauYears0, MIN_TAU);
      return {
        ...leg,
        iv: Math.max(1e-8, leg.iv + (Number(volOffsetPts) || 0) / 100),
        tauYears0: tau0,
      };
    });
    const tauNow = Math.max(...legs.map((l) => l.tauYears0), MIN_TAU);
    const tauFace = expiryFaceTau(legs);
    const tauEnd = tauFace < tauNow ? tauFace : 0;
    try {
      const strikes = liveLegs.map((l) => l.strike);
      const fit = surfaceAutofitWindow(legs, spot, strikes, SURFACE_PAD_FRAC);
      return computeSurfaceSheet(legs, {
        spot,
        nx: 40,
        nt: 24,
        sMin: fit.sMin,
        sMax: fit.sMax,
        quality: "per_leg_iv",
        ivSource: bound.ivSources.join("+"),
        listedStrikes: strikes,
        tauHi: tauNow,
        tauLo: tauEnd,
      });
    } catch {
      return null;
    }
  }, [trades, marks, spot, volOffsetPts, timeOffsetHours]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.style.width = `${dim.w}px`;
    host.style.height = `${dim.h}px`;
    try {
      if (!sceneRef.current) {
        const scene = mountSurfaceScene(host, { sheet, windowLift: false });
        scene.applyFactoryView("iso");
        scene.setSurfaceLocked(false);
        applyPipLook(scene, sheet);
        sceneRef.current = scene;
      } else {
        sceneRef.current.setSheet(sheet);
        applyPipLook(sceneRef.current, sheet);
      }
      host.dataset.scene = "ok";
      delete host.dataset.sceneError;
      setMountError(null);
    } catch (err) {
      // The 3D surface (Three.js/WebGL) can fail to init in some browsers
      // (e.g. a WebGL context is denied). Never let that crash the whole
      // Analyzer page — degrade to an empty inset and record the reason on the
      // element for diagnosis (mirrors SurfaceApp's guard around mountSurfaceScene).
      host.dataset.scene = "fail";
      host.dataset.sceneError = err instanceof Error ? err.message : String(err);
      try {
        sceneRef.current?.dispose();
      } catch {
        /* ignore secondary dispose errors */
      }
      sceneRef.current = null;
      setMountError(err instanceof Error ? err.message : "3D preview unavailable");
    }
  }, [sheet, dim.w, dim.h]);

  useLayoutEffect(() => {
    return () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  return (
    <div
      className={
        "pointer-events-auto absolute z-20 overflow-hidden rounded-md " +
        "border border-white/20 bg-[#0a0a0e] shadow-[0_8px_24px_rgba(0,0,0,0.45)] " +
        pipCornerClass(corner)
      }
      style={{ width: dim.w, height: dim.h }}
      data-testid="analyzer-surface-pip"
      data-pip-size={size}
      data-pip-corner={corner}
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        ref={hostRef}
        className="absolute inset-0"
        style={{ width: dim.w, height: dim.h }}
        data-testid="analyzer-pip-scene"
      />
      {mountError ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-2 text-center text-[11px] text-white/55"
          data-testid="analyzer-pip-fallback"
        >
          3D preview unavailable
        </div>
      ) : null}
      {DOCKS.map((c) => {
        const on = c === corner;
        return (
          <button
            key={c}
            type="button"
            className={
              "absolute z-10 h-2.5 w-2.5 " + dockClass(c)
            }
            style={{ background: on ? "#ef4444" : "#ffffff" }}
            aria-label={
              c === "ur"
                ? "Dock upper right"
                : c === "ul"
                  ? "Dock upper left"
                  : c === "ll"
                    ? "Dock lower left"
                    : "Dock lower right"
            }
            data-testid={`analyzer-pip-dock-${c}`}
            data-active={on ? "1" : "0"}
            onClick={() => onCorner(c)}
          />
        );
      })}
    </div>
  );
}
