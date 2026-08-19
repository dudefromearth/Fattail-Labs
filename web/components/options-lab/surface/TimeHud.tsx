"use client";

const resetBtn =
  "inline-flex min-h-11 items-center justify-center rounded-full " +
  "border border-white/15 bg-black/55 px-3.5 text-[13px] font-medium text-white/90 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-white/70 disabled:opacity-35 disabled:pointer-events-none";

export default function TimeHud({
  elapsedHours,
  remainingHours,
  timeStepHours,
  timeReadout,
  timeDisabled,
  onElapsedHours,
  simIvPct,
  volMin,
  volMax,
  volReadout,
  volDisabled,
  onSimIvPct,
  spotPct,
  sample,
  cadenceLabel,
  lastMinuteGold,
  altered,
  onSpotPct,
  onReset,
}: {
  elapsedHours: number;
  remainingHours: number;
  timeStepHours: number;
  timeReadout: string;
  timeDisabled: boolean;
  onElapsedHours: (h: number) => void;
  simIvPct: number;
  volMin: number;
  volMax: number;
  volReadout: string;
  volDisabled: boolean;
  onSimIvPct: (pct: number) => void;
  spotPct: number;
  sample: number | null;
  cadenceLabel: string;
  lastMinuteGold: boolean;
  altered: boolean;
  onSpotPct: (pct: number) => void;
  onReset: () => void;
}) {
  const rem = Math.max(0, remainingHours);
  const elapsed = Math.min(Math.max(0, elapsedHours), rem);
  const volHi = volMax > volMin ? volMax : volMin + 0.1;
  return (
    <div
      className="pointer-events-auto w-full text-white/80"
      data-testid="surface-time-hud"
      data-altered={altered ? "1" : "0"}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span>What-if</span>
        <span
          data-testid="surface-cadence"
          data-last-minute-gold={lastMinuteGold ? "1" : "0"}
        >
          {cadenceLabel}
        </span>
      </div>
      <label className="mt-2 block text-[11px] text-white/55">
        Time
        <span className="ml-2 font-mono tabular-nums text-white/80">
          {timeReadout}
        </span>
        <input
          type="range"
          className="mt-1 w-full"
          min={0}
          max={rem > 0 ? rem : timeStepHours}
          step={timeStepHours}
          value={elapsed}
          disabled={timeDisabled}
          onChange={(e) => onElapsedHours(Number(e.target.value))}
          data-testid="surface-playhead"
        />
      </label>
      <div className="mt-0.5 flex justify-between text-[10px] uppercase tracking-wide text-white/40">
        <span>Now</span>
        <span data-testid="surface-time-end">Last trade</span>
      </div>
      <label className="mt-2 block text-[11px] text-white/55">
        Implied vol
        <span className="ml-2 font-mono tabular-nums text-white/80">
          {volReadout}
        </span>
        <input
          type="range"
          className="mt-1 w-full"
          min={volMin}
          max={volHi}
          step={0.1}
          value={simIvPct}
          disabled={volDisabled}
          onChange={(e) => onSimIvPct(Number(e.target.value))}
          data-testid="surface-vol"
        />
      </label>
      <label className="mt-2 block text-[11px] text-white/55">
        Spot {spotPct >= 0 ? "+" : ""}
        {spotPct.toFixed(1)}%
        <input
          type="range"
          className="mt-1 w-full"
          min={-5}
          max={5}
          step={0.1}
          value={spotPct}
          onChange={(e) => onSpotPct(Number(e.target.value))}
          data-testid="surface-spot-pct"
        />
      </label>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="text-[11px]" data-testid="surface-sample">
          Model P&amp;L {sample == null ? "—" : sample.toFixed(0)}
        </div>
        <button
          type="button"
          className={resetBtn}
          disabled={!altered}
          onClick={onReset}
          data-testid="surface-time-reset"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
