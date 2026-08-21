"use client";

import Button from "@/components/ui/Button";
import { IconPause, IconPlay, IconStop } from "@/components/ui/icons";
import {
  REPLAY_SPEEDS,
  nyYmd,
  type ReplaySample,
  type ReplaySpeed,
} from "@/lib/options-lab/algoDayReplay";

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
}) {
  return (
    <div
      className="pointer-events-auto flex min-h-11 items-center gap-1.5"
      data-testid="analyzer-time-machine"
    >
      <input
        type="date"
        className={
          "min-h-11 rounded-[var(--radius-md,0.5rem)] border border-white/20 bg-[#1c1c24] px-2 " +
          "font-mono text-[22px] tabular-nums leading-none text-white/90 outline-none " +
          "[color-scheme:dark] " +
          "[&::-webkit-calendar-picker-indicator]:h-7 " +
          "[&::-webkit-calendar-picker-indicator]:w-7 " +
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer " +
          "[&::-webkit-calendar-picker-indicator]:opacity-90"
        }
        value={props.day}
        max={nyYmd()}
        onChange={(e) => props.onDay(e.target.value)}
        aria-label="Time Machine day"
        data-testid="analyzer-tm-day"
      />
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
      {REPLAY_SPEEDS.map((s) => (
        <button
          key={s}
          type="button"
          className={
            "min-h-11 min-w-11 rounded-full px-2 text-[12px] font-medium " +
            (props.speed === s
              ? "bg-sky-500/30 text-sky-100"
              : "text-white/60 hover:bg-white/10")
          }
          onClick={() => props.onSpeed(s)}
          aria-pressed={props.speed === s}
          data-testid={`analyzer-tm-speed-${s}`}
        >
          {s}×
        </button>
      ))}
      <Button
        variant="bordered"
        className="shrink-0 whitespace-nowrap px-3"
        onClick={props.onLeave}
        disabled={!props.day && !props.loading}
        aria-label="Leave Time Machine"
        data-testid="analyzer-tm-leave"
      >
        Leave Time Machine
      </Button>
    </div>
  );
}
