"use client";

import {
  isRealityAltered,
  sliderToTau,
  tauToSlider,
} from "@/lib/risk-graph/surfaceInspect";

const resetBtn =
  "inline-flex min-h-11 items-center justify-center rounded-full " +
  "border border-white/15 bg-black/55 px-3.5 text-[13px] font-medium text-white/90 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-white/70 disabled:opacity-35 disabled:pointer-events-none";

export default function TimeHud({
  tauLo,
  tauHi,
  playhead,
  volOffsetPts,
  spotPct,
  sample,
  cadenceLabel,
  lastMinuteGold,
  onPlayhead,
  onVol,
  onSpotPct,
  onReset,
}: {
  tauLo: number;
  tauHi: number;
  playhead: number;
  volOffsetPts: number;
  spotPct: number;
  sample: number | null;
  cadenceLabel: string;
  lastMinuteGold: boolean;
  onPlayhead: (t: number) => void;
  onVol: (pts: number) => void;
  onSpotPct: (pct: number) => void;
  onReset: () => void;
}) {
  const altered = isRealityAltered({
    tau: playhead,
    tauNow: tauHi,
    tauExpiry: tauLo,
    volOffsetPts,
    spotPct,
  });
  const slider = tauToSlider(playhead, tauHi, tauLo);
  return (
    <div
      className="pointer-events-auto w-full rounded-2xl border border-white/12 bg-black/55 p-3 text-white/80"
      data-testid="surface-time-hud"
      data-altered={altered ? "1" : "0"}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span>Time machine</span>
        <span
          data-testid="surface-cadence"
          data-last-minute-gold={lastMinuteGold ? "1" : "0"}
        >
          {cadenceLabel}
        </span>
      </div>
      <label className="mt-2 block text-[11px] text-white/55">
        Time — left is now, right is later
        <input
          type="range"
          className="mt-1 w-full"
          min={0}
          max={1}
          step={0.005}
          value={slider}
          onChange={(e) => onPlayhead(sliderToTau(Number(e.target.value), tauHi, tauLo))}
          data-testid="surface-playhead"
        />
      </label>
      <div className="mt-0.5 flex justify-between text-[10px] uppercase tracking-wide text-white/40">
        <span>Now</span>
        <span>Expiry</span>
      </div>
      <label className="mt-2 block text-[11px] text-white/55">
        Vol {volOffsetPts >= 0 ? "+" : ""}
        {volOffsetPts.toFixed(0)} pts
        <input
          type="range"
          className="mt-1 w-full"
          min={-30}
          max={30}
          step={1}
          value={volOffsetPts}
          onChange={(e) => onVol(Number(e.target.value))}
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
