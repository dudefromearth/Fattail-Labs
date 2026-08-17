"use client";

/**
 * W3-2 camera cluster. Echo words. ≥44pt. stopPropagation so orbit stays on the mesh.
 */

const btn =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full " +
  "border border-white/15 bg-black/55 px-3.5 text-[13px] font-medium text-white/90 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-white/70";

export default function CameraHud({
  onFit,
  onAutofit,
  onIso,
  projection = "perspective",
}: {
  onFit: () => void;
  onAutofit: () => void;
  onIso: () => void;
  projection?: "perspective" | "orthographic";
}) {
  return (
    <div
      className="pointer-events-auto absolute bottom-3 right-3 z-20 flex flex-wrap items-center gap-1.5"
      data-testid="surface-camera-hud"
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <span className="px-2 text-[11px] uppercase tracking-wide text-white/45">
        {projection === "orthographic" ? "Orthogonal" : "Perspective"}
      </span>
      <span className="px-2 text-[11px] text-white/45">Orbit</span>
      <span className="px-2 text-[11px] text-white/45" data-testid="surface-zoom-gain">
        Zoom Slow
      </span>
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
  );
}
