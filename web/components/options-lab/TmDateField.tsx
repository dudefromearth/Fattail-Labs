"use client";

import { useEffect, useRef, useState } from "react";
import { nyYmd } from "@/lib/options-lab/algoDayReplay";

function parseYmd(ymd: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function ymdOf(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function weekdaySun0(y: number, m: number, d: number): number {
  return new Date(y, m - 1, d).getDay();
}

export default function TmDateField(props: {
  day: string;
  onDay: (day: string) => void;
  onUncovered: (day: string) => void;
  coverage: Map<string, boolean> | null;
  onNeedMonth?: (from: string, to: string) => void;
  max: string;
}) {
  const today = nyYmd();
  const parsed = parseYmd(props.day) ?? parseYmd(today)!;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ y: parsed.y, m: parsed.m });
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const p = parseYmd(props.day);
    if (p) setView({ y: p.y, m: p.m });
  }, [props.day]);

  useEffect(() => {
    if (!open) return;
    const from = ymdOf(view.y, view.m, 1);
    const to = ymdOf(view.y, view.m, daysInMonth(view.y, view.m));
    props.onNeedMonth?.(from, to);
  }, [open, view.y, view.m, props.onNeedMonth]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const dim = daysInMonth(view.y, view.m);
  const pad = weekdaySun0(view.y, view.m, 1);
  const cells: Array<{ ymd: string; inMonth: boolean } | null> = [];
  for (let i = 0; i < pad; i += 1) cells.push(null);
  for (let d = 1; d <= dim; d += 1) {
    cells.push({ ymd: ymdOf(view.y, view.m, d), inMonth: true });
  }

  function pick(ymd: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return;
    if (ymd > props.max) return;
    const isToday = ymd === today;
    const flag = props.coverage?.get(ymd);
    const covered = flag === true;
    if (flag === false && !isToday) {
      props.onUncovered(ymd);
      setOpen(false);
      return;
    }
    props.onDay(ymd);
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    let { y, m } = view;
    m += delta;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setView({ y, m });
  }

  return (
    <div ref={rootRef} className="relative">
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
        max={props.max}
        onChange={(e) => pick(e.currentTarget.value)}
        onInput={(e) => pick((e.target as HTMLInputElement).value)}
        onPointerDown={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        aria-label="Time Machine day"
        data-testid="analyzer-tm-day"
      />
      {open ? (
        <div
          className="absolute left-0 top-full z-40 mt-1 w-[18rem] rounded-lg border border-white/15 bg-[#16161d] p-2 shadow-[var(--elevation-2)]"
          data-testid="analyzer-tm-calendar"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <button
              type="button"
              className="min-h-11 min-w-11 text-white/70"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="font-mono text-[13px] text-white/80">
              {view.y}-{String(view.m).padStart(2, "0")}
            </div>
            <button
              type="button"
              className="min-h-11 min-w-11 text-white/70"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center font-mono text-[10px] text-white/40">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, i) => {
              if (!cell) return <div key={`e${i}`} />;
              const isToday = cell.ymd === today;
              const future = cell.ymd > props.max;
              const flag = props.coverage?.get(cell.ymd);
              const covered = flag === true;
              const grey = flag === false && !isToday;
              const unknown = !future && flag === undefined;
              return (
                <button
                  key={cell.ymd}
                  type="button"
                  disabled={future}
                  title={
                    future
                      ? undefined
                      : grey
                        ? "No archive"
                        : covered
                          ? isToday
                            ? "Today — in the archive"
                            : "In the archive"
                          : isToday
                            ? "Today"
                            : "Coverage not loaded yet"
                  }
                  data-tm-covered={grey ? "false" : covered ? "true" : "unknown"}
                  data-testid={`analyzer-tm-cal-${cell.ymd}`}
                  className={
                    "relative min-h-11 rounded text-[12px] font-mono tabular-nums " +
                    (cell.ymd === props.day ? "bg-white/15 text-white " : "") +
                    (grey
                      ? "text-white/25"
                      : future
                        ? "text-white/20"
                        : unknown
                          ? "text-white/45 hover:bg-white/10"
                          : "text-white/95 hover:bg-white/10")
                  }
                  onClick={() => pick(cell.ymd)}
                >
                  {Number(cell.ymd.slice(8))}
                  {covered && !future ? (
                    <span
                      className={
                        "absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full " +
                        (isToday ? "bg-[var(--color-tint)]" : "bg-white/70")
                      }
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 px-0.5 font-mono text-[10px] leading-snug text-white/40">
            Dot = in the archive. Dim = no path.
          </p>
        </div>
      ) : null}
    </div>
  );
}
