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
  onStrikeOn,
  onTimeOn,
  onStrikePos,
  widthPadFrac,
  heightPadFrac,
  onWidthPadFrac,
  onHeightPadFrac,
  valueOpacity,
  onValueOpacity,
}: {
  strikeOn: boolean;
  timeOn: boolean;
  strikePos: number;
  strikeMin: number;
  strikeMax: number;
  onStrikeOn: (v: boolean) => void;
  onTimeOn: (v: boolean) => void;
  onStrikePos: (v: number) => void;
  widthPadFrac: number;
  heightPadFrac: number;
  onWidthPadFrac: (v: number) => void;
  onHeightPadFrac: (v: number) => void;
  valueOpacity: number;
  onValueOpacity: (v: number) => void;
}) {
  return (
    <div
      className="pointer-events-auto w-full rounded-2xl border border-white/12 bg-black/55 p-3 text-[11px] text-white/80"
      data-testid="surface-planes-hud"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mb-2 font-medium">Planes</div>
      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          checked={strikeOn}
          onChange={(e) => onStrikeOn(e.target.checked)}
          data-testid="surface-plane-strike"
        />
        Strike Show
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          checked={timeOn}
          onChange={(e) => onTimeOn(e.target.checked)}
          data-testid="surface-plane-time"
        />
        Time Show
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
    </div>
  );
}
