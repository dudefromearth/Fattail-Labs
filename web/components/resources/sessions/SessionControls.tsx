"use client";

type Scale = "focus" | "fit";

export default function SessionControls({
  isoDate,
  scale,
  onDate,
  onToday,
  onScale,
}: {
  isoDate: string;
  scale: Scale;
  onDate: (iso: string) => void;
  onToday: () => void;
  onScale: (s: Scale) => void;
}) {
  const pill = (on: boolean) =>
    [
      "inline-flex min-h-[var(--hit-min)] items-center justify-center rounded-full px-3.5 text-sm font-medium",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
      on
        ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
        : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
    ].join(" ");

  return (
    <div
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
      data-testid="sessions-controls"
    >
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-[var(--color-label-secondary)]">
          Date
          <input
            type="date"
            value={isoDate}
            onChange={(e) => onDate(e.target.value)}
            className="ml-2 min-h-[var(--hit-min)] rounded-full border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-label)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
            data-testid="sessions-date"
          />
        </label>
        <button
          type="button"
          onClick={onToday}
          className={pill(false)}
          data-testid="sessions-today"
        >
          Today
        </button>
      </div>
      <div
        className="inline-flex rounded-full bg-[var(--color-fill)] p-1"
        role="group"
        aria-label="Timescale"
      >
        <button
          type="button"
          aria-pressed={scale === "focus"}
          onClick={() => onScale("focus")}
          className={pill(scale === "focus")}
          data-testid="sessions-scale-focus"
        >
          Focus
        </button>
        <button
          type="button"
          aria-pressed={scale === "fit"}
          onClick={() => onScale("fit")}
          className={pill(scale === "fit")}
          data-testid="sessions-scale-fit"
        >
          Fit
        </button>
      </div>
    </div>
  );
}
