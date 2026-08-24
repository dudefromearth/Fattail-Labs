"use client";

/**
 * HI Spec DetentSlider — discrete stops, ticks + labels, ≥44 pt thumb (DL-574).
 */

export function stopIndex(stops: readonly number[], value: number): number {
  let best = 0;
  let dist = Infinity;
  for (let i = 0; i < stops.length; i++) {
    const d = Math.abs(stops[i] - value);
    if (d < dist) {
      dist = d;
      best = i;
    }
  }
  return best;
}

export default function DetentSlider({
  label,
  stops,
  value,
  onChange,
  valuetext,
  testId,
}: {
  label: string;
  stops: readonly number[];
  value: number;
  onChange: (n: number) => void;
  valuetext: (n: number) => string;
  testId?: string;
}) {
  const idx = stopIndex(stops, value);
  const max = Math.max(0, stops.length - 1);
  return (
    <label className="flex flex-col items-stretch gap-1 py-2">
      <span className="px-3 text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
        {label}
      </span>
      <div className="px-3">
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={idx}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={idx}
          aria-valuetext={valuetext(stops[idx] ?? value)}
          data-testid={testId}
          className="min-h-[var(--hit-min)] w-full accent-[var(--color-tint)] motion-reduce:transition-none"
          onChange={(e) => {
            const i = Number(e.target.value);
            const n = stops[i];
            if (n != null) onChange(n);
          }}
        />
        <div className="mt-0.5 flex justify-between">
          {stops.map((s) => (
            <span
              key={s}
              className="text-[length:var(--text-caption)] tabular-nums text-[var(--color-label-secondary)]"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </label>
  );
}
