"use client";

/**
 * W3-2 camera cluster. Echo words. ≥44pt. stopPropagation so orbit stays on the mesh.
 */

import { ZOOM_GAIN_MAX, ZOOM_GAIN_MIN } from "@/lib/risk-graph/surfaceScene/camera";

const btn =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full " +
  "border border-white/15 bg-black/55 px-3.5 text-[13px] font-medium text-white/90 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-white/70";

export default function CameraHud({
  onFit,
  onAutofit,
  onIso,
  onProjection,
  projection = "perspective",
  zoomGain,
  onZoomGain,
  spots,
  onSpotOn,
  onSpotBrightness,
}: {
  onFit: () => void;
  onAutofit: () => void;
  onIso: () => void;
  onProjection: () => void;
  projection?: "perspective" | "orthographic";
  zoomGain: number;
  onZoomGain: (gain: number) => void;
  spots: Array<{ on: boolean; brightness: number }>;
  onSpotOn: (index: number, on: boolean) => void;
  onSpotBrightness: (index: number, brightness: number) => void;
}) {
  const spotGroups = [
    { title: "Top", names: ["Now R", "Now L", "Exp R", "Exp L"], offset: 0 },
    { title: "Bottom", names: ["Now R", "Now L", "Exp R", "Exp L"], offset: 4 },
  ];
  return (
    <div
      className="pointer-events-auto absolute bottom-3 right-3 z-20 flex flex-col items-end gap-1.5"
      data-testid="surface-camera-hud"
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <label className="w-[14rem] rounded-2xl border border-white/12 bg-black/55 px-3 py-2 text-[11px] text-white/55">
        Zoom speed
        <input
          type="range"
          className="mt-1 w-full"
          min={ZOOM_GAIN_MIN}
          max={ZOOM_GAIN_MAX}
          step={0.05}
          value={zoomGain}
          onChange={(e) => onZoomGain(Number(e.target.value))}
          data-testid="surface-zoom-gain"
        />
        <div className="mt-0.5 flex justify-between text-[10px] uppercase tracking-wide text-white/40">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </label>
      <div
        className="w-[15rem] rounded-2xl border border-white/12 bg-black/55 px-3 py-2 text-[11px] text-white/55"
        data-testid="surface-spot-lights"
      >
        <div className="mb-1 text-white/80">Spot lights</div>
        {spotGroups.map((group) => (
          <div key={group.title} className="mt-2">
            <div className="text-[10px] uppercase tracking-wide text-white/40">
              {group.title}
            </div>
            {group.names.map((name, k) => {
              const i = group.offset + k;
              const lamp = spots[i] ?? { on: false, brightness: 0 };
              return (
                <label key={`${group.title}-${name}`} className="mt-1 block">
                  <span className="flex min-h-9 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={lamp.on}
                      onChange={(e) => onSpotOn(i, e.target.checked)}
                      data-testid={`surface-spot-${i}-on`}
                    />
                    <span className="w-12 shrink-0 text-white/70">{name}</span>
                    <input
                      type="range"
                      className="min-w-0 flex-1"
                      min={0}
                      max={1}
                      step={0.01}
                      value={lamp.brightness}
                      disabled={!lamp.on}
                      onChange={(e) => onSpotBrightness(i, Number(e.target.value))}
                      data-testid={`surface-spot-${i}-gain`}
                    />
                    <span className="w-8 text-right tabular-nums text-white/70">
                      {Math.round(lamp.brightness * 100)}%
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <button
          type="button"
          className={btn}
          data-testid="surface-projection"
          data-projection={projection}
          onClick={onProjection}
        >
          {projection === "orthographic" ? "Orthographic" : "Perspective"}
        </button>
        <span className="px-2 text-[11px] text-white/45">Orbit</span>
        <button type="button" className={btn} data-testid="surface-iso" onClick={onIso}>
          ISO
        </button>
        <button type="button" className={btn} data-testid="surface-fit" onClick={onFit}>
          Fit
        </button>
        <button
          type="button"
          className={btn}
          data-testid="surface-autofit"
          onClick={onAutofit}
        >
          Autofit
        </button>
      </div>
    </div>
  );
}
