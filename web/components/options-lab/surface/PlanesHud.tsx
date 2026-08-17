"use client";

export default function PlanesHud({
  strikeOn,
  timeOn,
  strikePos,
  strikeMin,
  strikeMax,
  onStrikeOn,
  onTimeOn,
  onStrikePos,
}: {
  strikeOn: boolean;
  timeOn: boolean;
  strikePos: number;
  strikeMin: number;
  strikeMax: number;
  onStrikeOn: (v: boolean) => void;
  onTimeOn: (v: boolean) => void;
  onStrikePos: (v: number) => void;
}) {
  return (
    <div
      className="pointer-events-auto absolute right-3 top-24 z-20 w-40 rounded-2xl border border-white/12 bg-black/55 p-3 text-[11px] text-white/80"
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
    </div>
  );
}
