"use client";

import {
  SURFACE_HEIGHT_PAD_FRAC_MAX,
  SURFACE_PAD_FRAC_MIN,
  SURFACE_WIDTH_PAD_FRAC_MAX,
} from "@/lib/risk-graph/surfaceAutofit";

function pct(frac: number) {
  return Math.round(frac * 100);
}

export default function PlanesHud({
  strikeOn,
  timeOn,
  strikePos,
  strikeMin,
  strikeMax,
  timePos,
  onStrikeOn,
  onTimeOn,
  onStrikePos,
  onTimePos,
  widthPadFrac,
  heightPadFrac,
  onWidthPadFrac,
  onHeightPadFrac,
  valueOpacity,
  onValueOpacity,
  onAutofit,
}: {
  strikeOn: boolean;
  timeOn: boolean;
  strikePos: number;
  strikeMin: number;
  strikeMax: number;
  timePos: number;
  onStrikeOn: (v: boolean) => void;
  onTimeOn: (v: boolean) => void;
  onStrikePos: (v: number) => void;
  onTimePos: (v: number) => void;
  widthPadFrac: number;
  heightPadFrac: number;
  onWidthPadFrac: (v: number) => void;
  onHeightPadFrac: (v: number) => void;
  valueOpacity: number;
  onValueOpacity: (v: number) => void;
  onAutofit: () => void;
}) {
  return (
    <div
      className="pointer-events-auto w-full text-[11px] text-white/80"
      data-testid="surface-planes-hud"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          checked={strikeOn}
          onChange={(e) => onStrikeOn(e.target.checked)}
          data-testid="surface-plane-strike"
        />
        Strike Plane
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          checked={timeOn}
          onChange={(e) => onTimeOn(e.target.checked)}
          data-testid="surface-plane-time"
        />
        Time Plane
      </label>
      <label className="mt-1 block text-white/55">
        $0 plane {pct(valueOpacity)}%
        <input
          type="range"
          className="w-full"
          min={0}
          max={1}
          step={0.01}
          value={valueOpacity}
          onChange={(e) => onValueOpacity(Number(e.target.value))}
          data-testid="surface-value-opacity"
        />
      </label>
      <label className="mt-1 block text-white/55">
        Strike
        <input
          type="range"
          className="w-full"
          min={strikeMin}
          max={strikeMax}
          step={Math.max((strikeMax - strikeMin) / 200, 0.01)}
          value={strikePos}
          onChange={(e) => onStrikePos(Number(e.target.value))}
        />
      </label>
      <label className="mt-1 block text-white/55">
        Time
        <input
          type="range"
          className="w-full"
          min={0}
          max={1}
          step={0.01}
          value={timePos}
          onChange={(e) => onTimePos(Number(e.target.value))}
          data-testid="surface-plane-time-pos"
        />
        <div className="mt-0.5 flex justify-between text-[10px] uppercase tracking-wide text-white/40">
          <span>Now</span>
          <span>Expiry</span>
        </div>
      </label>
      <div className="mt-2 font-medium text-white/80">Autofit pad</div>
      <label className="mt-1 block text-white/55">
        Width {pct(widthPadFrac)}%
        <input
          type="range"
          className="w-full"
          min={SURFACE_PAD_FRAC_MIN}
          max={SURFACE_WIDTH_PAD_FRAC_MAX}
          step={0.01}
          value={widthPadFrac}
          onChange={(e) => onWidthPadFrac(Number(e.target.value))}
          data-testid="surface-width-pad"
        />
      </label>
      <label className="mt-1 block text-white/55">
        Height {pct(heightPadFrac)}%
        <input
          type="range"
          className="w-full"
          min={SURFACE_PAD_FRAC_MIN}
          max={SURFACE_HEIGHT_PAD_FRAC_MAX}
          step={0.01}
          value={heightPadFrac}
          onChange={(e) => onHeightPadFrac(Number(e.target.value))}
          data-testid="surface-height-pad"
        />
      </label>
      <button
        type="button"
        className={
          "mt-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full " +
          "border border-white/15 bg-black/55 px-3.5 text-[13px] font-medium text-white/90 " +
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
          "focus-visible:outline-white/70"
        }
        data-testid="surface-planes-autofit"
        onClick={onAutofit}
      >
        Autofit
      </button>
    </div>
  );
}
