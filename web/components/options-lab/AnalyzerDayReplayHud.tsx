"use client";

import { useRef } from "react";
import {
  formatReplayClock,
  replayFrac,
  sampleAtFrac,
  type ReplayCursor,
  type ReplaySample,
} from "@/lib/options-lab/algoDayReplay";

export default function AnalyzerDayReplayHud(props: {
  day: string;
  samples: readonly ReplaySample[];
  cursor: ReplayCursor | null;
  hole?: string | null;
  loading?: boolean;
  onSeek: (sample: ReplaySample) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const samples = props.samples;
  const tMs = props.cursor?.t_ms ?? samples[0]?.t_ms ?? 0;
  const frac = replayFrac(samples, tMs);

  const spots = samples.map((s) => s.spot);
  const min = spots.length ? Math.min(...spots) : 0;
  const max = spots.length ? Math.max(...spots) : 1;
  const span = Math.max(1e-6, max - min);
  const w = 100;
  const h = 100;
  const d = samples
    .map((s, i) => {
      const x = samples.length < 2 ? 0 : (i / (samples.length - 1)) * w;
      const y = h - ((s.spot - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const playX = frac * w;

  function seekFromClientX(clientX: number) {
    const el = trackRef.current;
    if (!el || !samples.length) return;
    const box = el.getBoundingClientRect();
    const f = box.width > 0 ? (clientX - box.left) / box.width : 0;
    const s = sampleAtFrac(samples, f);
    if (s) props.onSeek(s);
  }

  return (
    <div
      className="pointer-events-auto absolute right-2 top-2 z-30 w-[min(36rem,calc(100%-1rem))] rounded-lg border border-white/15 bg-black/75 p-2 shadow-[var(--elevation-2)] backdrop-blur-sm"
      data-testid="analyzer-day-replay-hud"
    >
      <div className="mb-1 flex items-baseline justify-between gap-2 tracking-wide text-white/80">
        <span className="font-mono text-[22px] tabular-nums leading-none">
          {props.day || "Day"}
        </span>
        <span className="font-mono text-[22px] tabular-nums leading-none text-white/90">
          {tMs ? formatReplayClock(tMs) : props.loading ? "WAITING" : props.hole || "—"}
        </span>
      </div>
      <div
        ref={trackRef}
        className="relative cursor-ew-resize"
        data-testid="analyzer-day-replay-scrubber"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          seekFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return;
          seekFromClientX(e.clientX);
        }}
      >
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="block h-40 w-full"
          aria-hidden
        >
          {d ? (
            <path
              d={d}
              fill="none"
              stroke="rgba(147,197,253,0.9)"
              strokeWidth="1.25"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            <rect width={w} height={h} fill="rgba(255,255,255,0.04)" />
          )}
          {samples.length ? (
            <line
              x1={playX}
              x2={playX}
              y1={0}
              y2={h}
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="1"
            />
          ) : null}
        </svg>
        <div className="mt-1 h-1.5 rounded-full bg-white/15">
          <div
            className="h-1.5 rounded-full bg-sky-400"
            style={{ width: `${Math.round(frac * 100)}%` }}
          />
        </div>
      </div>
      <div className="mt-1 font-mono text-[10px] tabular-nums text-white/45">
        {samples.length} closes
        {props.loading ? " · WAITING" : ""}
        {props.hole ? ` · ${props.hole}` : ""}
      </div>
    </div>
  );
}
