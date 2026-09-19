"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatReplayClock,
  fullReplayWindow,
  panReplayWindow,
  replayFracInWindow,
  sampleAtWindowFrac,
  zoomReplayWindow,
  type ReplayCursor,
  type ReplaySample,
  type ReplayWindow,
} from "@/lib/options-lab/algoDayReplay";
import { downsampleLine } from "@/lib/options-lab/archiveLoad";

export default function AnalyzerDayReplayHud(props: {
  day: string;
  samples: readonly ReplaySample[];
  cursor: ReplayCursor | null;
  hole?: string | null;
  loading?: boolean;
  onSeek: (sample: ReplaySample) => void;
}) {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const axisRef = useRef<HTMLDivElement | null>(null);
  const samples = props.samples;
  const tMs = props.cursor?.t_ms ?? samples[0]?.t_ms ?? 0;
  const full = useMemo(() => fullReplayWindow(samples), [samples]);
  const [win, setWin] = useState<ReplayWindow | null>(null);
  const view = win ?? full;
  const drag = useRef<{
    kind: "pan" | "zoom";
    x: number;
    moved: boolean;
    originMs: number;
    win0: ReplayWindow;
  } | null>(null);

  useEffect(() => {
    setWin(null);
  }, [props.day, samples]);

  const line = useMemo(() => {
    if (!view) return downsampleLine(samples, 160);
    const cut = samples.filter((s) => s.t_ms >= view.loMs && s.t_ms <= view.hiMs);
    return downsampleLine(cut.length ? cut : samples, 160);
  }, [samples, view]);

  const spots = line.map((s) => s.spot);
  const min = spots.length ? Math.min(...spots) : 0;
  const max = spots.length ? Math.max(...spots) : 1;
  const span = Math.max(1e-6, max - min);
  const w = 100;
  const h = 100;
  const d = line
    .map((s, i) => {
      const x = line.length < 2 ? 0 : (i / (line.length - 1)) * w;
      const y = h - ((s.spot - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const playX = view ? replayFracInWindow(view, tMs) * w : 0;

  function fracFromClientX(el: HTMLElement, clientX: number): number {
    const box = el.getBoundingClientRect();
    return box.width > 0 ? (clientX - box.left) / box.width : 0;
  }

  function seekFrac(f: number) {
    if (!view) return;
    const s = sampleAtWindowFrac(samples, view, f);
    if (s) props.onSeek(s);
  }

  function keepPlayhead(next: ReplayWindow, originMs: number, win0: ReplayWindow) {
    const f = replayFracInWindow(win0, originMs);
    const s = sampleAtWindowFrac(samples, next, f);
    if (s) props.onSeek(s);
  }

  function onPlotDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || !view) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    drag.current = {
      kind: "pan",
      x: e.clientX,
      moved: false,
      originMs: tMs,
      win0: view,
    };
  }

  function onAxisDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || !view) return;
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    const f = fracFromClientX(e.currentTarget, e.clientX);
    drag.current = {
      kind: "zoom",
      x: e.clientX,
      moved: false,
      originMs: view.loMs + f * (view.hiMs - view.loMs),
      win0: view,
    };
  }

  function onDragMove(e: React.PointerEvent<HTMLDivElement>) {
    const st = drag.current;
    if (!st || e.buttons !== 1 || !view) return;
    const box = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - st.x;
    if (Math.abs(dx) > 3) st.moved = true;
    if (!st.moved || !(box.width > 0)) return;
    if (st.kind === "pan") {
      const dxFrac = dx / box.width;
      const next = panReplayWindow(st.win0, samples, dxFrac);
      const blocked =
        next.loMs === st.win0.loMs && next.hiMs === st.win0.hiMs;
      if (blocked) {
        seekFrac(replayFracInWindow(st.win0, st.originMs) - dxFrac);
      } else {
        setWin(next);
        keepPlayhead(next, st.originMs, st.win0);
      }
    } else {
      const factor = Math.max(0.25, Math.min(4, 1 + dx / box.width));
      const next = zoomReplayWindow(st.win0, samples, st.originMs, factor);
      setWin(next);
    }
  }

  function onDragUp(e: React.PointerEvent<HTMLDivElement>) {
    const st = drag.current;
    drag.current = null;
    if (!st || !view) return;
    if (st.moved) return;
    seekFrac(fracFromClientX(e.currentTarget, e.clientX));
  }

  return (
    <div
      className="pointer-events-auto absolute right-2 top-2 z-30 w-[min(36rem,calc(100%-1rem))] rounded-lg border border-white/15 bg-black/75 p-2 shadow-[var(--elevation-2)] backdrop-blur-sm"
      data-testid="analyzer-day-replay-hud"
      data-tlo={view?.loMs ?? ""}
      data-thi={view?.hiMs ?? ""}
    >
      <div className="mb-1 flex items-baseline justify-between gap-2 tracking-wide text-white/80">
        <span className="font-mono text-[22px] tabular-nums leading-none">
          {props.day || "Day"}
        </span>
        <span className="font-mono text-[22px] tabular-nums leading-none text-white/90">
          {props.hole === "NO PATH"
            ? "NO PATH"
            : tMs
              ? formatReplayClock(tMs)
              : props.loading
                ? "WAITING"
                : props.hole || "—"}
        </span>
      </div>
      <div
        ref={plotRef}
        className="relative cursor-ew-resize"
        data-testid="analyzer-day-replay-scrubber"
        onPointerDown={onPlotDown}
        onPointerMove={onDragMove}
        onPointerUp={onDragUp}
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
      </div>
      <div
        ref={axisRef}
        className="mt-1 h-3 cursor-ew-resize rounded-full bg-white/15"
        data-testid="analyzer-day-replay-time-axis"
        aria-label="Time scale"
        onPointerDown={onAxisDown}
        onPointerMove={onDragMove}
        onPointerUp={onDragUp}
      >
        <div
          className="h-3 rounded-full bg-sky-400"
          style={{ width: `${Math.round(playX)}%` }}
        />
      </div>
      <div className="mt-1 font-mono text-[10px] tabular-nums text-white/45">
        {samples.length} prints
      </div>
    </div>
  );
}
