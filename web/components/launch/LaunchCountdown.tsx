"use client";

import { useEffect, useState } from "react";

type Parts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

function split(ms: number): Parts {
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds, done: false };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[4.5rem] flex-col items-center rounded-2xl border border-white/15 bg-zinc-950/70 px-3 py-3 shadow-inner shadow-black/30 sm:min-w-[5.5rem] sm:px-4 sm:py-4">
      <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
        {label}
      </span>
    </div>
  );
}

export default function LaunchCountdown({
  launchAtIso,
}: {
  /** Absolute instant (ISO) when Labs opens. */
  launchAtIso: string;
}) {
  const target = new Date(launchAtIso).getTime();
  const [parts, setParts] = useState<Parts>(() =>
    split(target - Date.now()),
  );

  useEffect(() => {
    const tick = () => setParts(split(target - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (parts.done) {
    return (
      <p className="text-center text-lg font-medium text-emerald-300">
        We&apos;re live — refreshing…
      </p>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Launches in ${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes, ${parts.seconds} seconds`}
    >
      <Unit value={parts.days} label={parts.days === 1 ? "Day" : "Days"} />
      <Unit value={parts.hours} label="Hours" />
      <Unit value={parts.minutes} label="Min" />
      <Unit value={parts.seconds} label="Sec" />
    </div>
  );
}
