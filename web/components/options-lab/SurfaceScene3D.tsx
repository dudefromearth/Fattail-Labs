"use client";

/**
 * Options Lab Surface viewport — MSC 3D scene (alpha / charlie / echo + mesh).
 * Heritage: strategy-lab-proto/msc-risk-graph-ui RiskGraph3DView.
 * P&L grid: shared Strategy Lab surfaceModel.ts (AZ-VP-S3 / DL-391).
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { initScene } from "@/lib/risk-graph/3d/alpha.js";
import { buildCoords } from "@/lib/risk-graph/3d/charlie.js";
import {
  buildReferenceBox,
  buildSpotPlane,
  buildZeroPnLPlane,
} from "@/lib/risk-graph/3d/echo.js";
import {
  buildSurfaceMesh,
  sheetToMeshData,
} from "@/lib/risk-graph/3d/surfaceMesh";
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
  label?: string;
};

export default function SurfaceScene3D({
  legs,
  spot,
  quality = "per_leg_iv",
  ivSource = "per_leg",
  label,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !legs.length || !(spot > 0)) return;

    let sheet;
    try {
      sheet = computeSurfaceSheet(legs, {
        spot,
        nx: 64,
        nt: 32,
        quality,
        ivSource,
      });
    } catch {
      return;
    }

    const ctx = initScene(host);
    const data = sheetToMeshData(sheet);
    const coords = buildCoords(
      {
        sMin: data.sMin,
        sMax: data.sMax,
        pMin: data.minPnL,
        pMax: data.maxPnL,
        maxDTE: data.T_max,
      },
      { width: host.clientWidth, height: host.clientHeight },
    );
    const box = buildReferenceBox(coords, ctx.scene, ctx.renderer);
    const zero = buildZeroPnLPlane(coords, ctx.scene);
    const spotPlane = buildSpotPlane(coords, ctx.scene);
    const mesh = buildSurfaceMesh(data, coords, ctx.scene);
    const nowPnl = sheet.pnlGrid[0][Math.floor(sheet.spotAxis.length / 2)];
    spotPlane.update(spot, nowPnl);

    const cam = ctx.camera as THREE.PerspectiveCamera;
    let theta = Math.PI / 4;
    let phi = Math.PI / 3;
    let R = 14;
    const look = new THREE.Vector3(0, 0, 0);
    const applyCam = () => {
      cam.position.set(
        R * Math.sin(phi) * Math.sin(theta),
        R * Math.cos(phi),
        R * Math.sin(phi) * Math.cos(theta),
      );
      cam.lookAt(look);
    };
    applyCam();

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      host.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      theta -= dx * 0.008;
      phi = Math.max(0.12, Math.min(Math.PI - 0.12, phi - dy * 0.008));
      applyCam();
    };
    const onUp = () => {
      dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      R = Math.max(6, Math.min(28, R + e.deltaY * 0.01));
      applyCam();
    };
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("wheel", onWheel, { passive: false });

    const ro = new ResizeObserver(() => ctx.onResize());
    ro.observe(host);
    ctx.startLoop();

    return () => {
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("wheel", onWheel);
      ro.disconnect();
      mesh.dispose();
      box?.dispose?.();
      zero?.dispose?.();
      spotPlane?.dispose?.();
      ctx.dispose();
    };
  }, [legs, spot, quality, ivSource]);

  return (
    <div className="relative h-full min-h-[420px] w-full" data-testid="msc-surface-scene">
      <div
        className="pointer-events-none absolute left-3 top-2 z-10 text-[11px] text-white/55"
      >
        <span className="font-medium text-white/80">{label || "Surface"}</span>
        <span className="ml-2 font-mono">
          {ivSource} · {quality}
        </span>
      </div>
      <div ref={hostRef} className="h-full min-h-[420px] w-full touch-none" />
    </div>
  );
}
