"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { IconPause, IconPlay, IconStop } from "@/components/ui/icons";
import {
  REPLAY_SPEEDS,
  nyYmd,
  type ReplaySample,
  type ReplaySpeed,
} from "@/lib/options-lab/algoDayReplay";
import TmDateField from "@/components/options-lab/TmDateField";
import { formatHoldHorizon, subscribeTmSlots } from "@/lib/options-lab/tmSlots";

function useCompactStrip(): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 40rem)");
    const on = () => setCompact(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return compact;
}

export default function AnalyzerTimeMachineStrip(props: {
  day: string;
  onDay: (day: string) => void;
  samples: readonly ReplaySample[];
  playing: boolean;
  speed: ReplaySpeed;
  onSpeed: (s: ReplaySpeed) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onLeave: () => void;
  loading?: boolean;
  disabled?: boolean;
  replayActive?: boolean;
  coverage?: Map<string, boolean> | null;
  onNeedMonth?: (from: string, to: string) => void;
  fidelity?: number | null;
  hole?: string | null;
  onUncovered?: (day: string) => void;
  playheadT?: number | null;
}) {
  const compact = useCompactStrip();
  const [holdLine, setHoldLine] = useState(() => formatHoldHorizon().line);
  useEffect(() => {
    setHoldLine(formatHoldHorizon().line);
    return subscribeTmSlots(() => setHoldLine(formatHoldHorizon().line));
  }, []);
  const cycleSpeed = () => {
    const i = REPLAY_SPEEDS.indexOf(props.speed);
    const next = REPLAY_SPEEDS[(i + 1) % REPLAY_SPEEDS.length];
    props.onSpeed(next);
  };
  return (
    <div
      className="pointer-events-auto flex min-h-11 w-full min-w-0 flex-wrap items-center gap-1.5"
      data-testid="analyzer-time-machine"
      data-tm-playhead-t={props.playheadT != null ? String(props.playheadT) : ""}
    >
      <TmDateField
        day={props.day}
        max={nyYmd()}
        coverage={props.coverage ?? null}
        onNeedMonth={props.onNeedMonth}
        onDay={props.onDay}
        onUncovered={props.onUncovered ?? props.onDay}
      />
      {props.hole === "NO PATH" ? (
        <span
          className="font-mono text-[11px] tracking-wide text-white/55"
          data-testid="analyzer-tm-no-path"
        >
          NO PATH
        </span>
      ) : props.hole === "WAITING" ? (
        <span
          className="font-mono text-[11px] tracking-wide text-white/55"
          data-testid="analyzer-tm-waiting"
        >
          WAITING
        </span>
      ) : null}
      <span
        className="max-w-[14rem] truncate font-mono text-[11px] tracking-wide text-white/55"
        data-testid="analyzer-tm-hold"
        title={holdLine}
      >
        {holdLine}
      </span>
      {props.fidelity != null && props.hole !== "NO PATH" ? (
        <span
          className="font-mono text-[11px] tabular-nums text-white/55"
          data-testid="analyzer-tm-fidelity"
          data-tm-fidelity={Math.round(props.fidelity * 100)}
        >
          {props.fidelity >= 0.995
            ? "full"
            : props.fidelity < 0.01
              ? "coarse"
              : `${Math.round(props.fidelity * 100)}%`}
        </span>
      ) : null}
      <Button
        variant="bordered"
        className="min-w-11 px-2"
        onClick={props.onPlay}
        disabled={!props.samples.length || props.disabled || props.loading}
        aria-label="Play"
        data-testid="analyzer-tm-play"
      >
        <IconPlay size={16} />
      </Button>
      <Button
        variant="bordered"
        className="min-w-11 px-2"
        onClick={props.onPause}
        disabled={!props.playing}
        aria-label="Pause"
        data-testid="analyzer-tm-pause"
      >
        <IconPause size={16} />
      </Button>
      <Button
        variant="bordered"
        className="min-w-11 px-2"
        onClick={props.onStop}
        disabled={!props.samples.length}
        aria-label="Stop"
        data-testid="analyzer-tm-stop"
      >
        <IconStop size={16} />
      </Button>
      {compact ? (
        <button
          type="button"
          className="min-h-11 min-w-11 rounded-full bg-white/10 px-2 text-[12px] font-medium text-white/80"
          onClick={cycleSpeed}
          aria-label={`Speed ${props.speed}×`}
          data-testid={`analyzer-tm-speed-${props.speed}`}
          data-tm-speed-collapsed=""
        >
          {props.speed}×
        </button>
      ) : (
        REPLAY_SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            className={
              "min-h-11 min-w-11 rounded-full px-2 text-[12px] font-medium " +
              (props.speed === s
                ? "bg-white/15 text-white/90"
                : "text-white/60 hover:bg-white/10")
            }
            onClick={() => props.onSpeed(s)}
            aria-pressed={props.speed === s}
            data-testid={`analyzer-tm-speed-${s}`}
          >
            {s}×
          </button>
        ))
      )}
      <Button
        variant="plain"
        className="!min-h-11 !px-3 shrink-0"
        onClick={props.onLeave}
        disabled={!props.replayActive && !props.loading}
        aria-label="Reset"
        data-testid="analyzer-tm-reset"
      >
        Reset
      </Button>
    </div>
  );
}
