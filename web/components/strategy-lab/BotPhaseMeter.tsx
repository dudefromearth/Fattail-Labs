"use client";

/**
 * BotPhaseMeter — visual readiness meter on Strategy Lab bin cards.
 *
 * Lifecycle face by phase (product metaphor):
 *   Design  → egg 🥚
 *   Curate  → hatchling 🐣
 *   Deploy  → eagle 🦅
 *
 * Ring fill = progress through that phase’s ordered states
 * (0% just arrived → 100% phase-complete / ready to promote when gates allow).
 */

export type BotPhaseKey = "development" | "curation" | "deployment" | "bin";

export type BotPhaseMeterProps = {
  /** Board phase the bot currently sits in */
  phase: BotPhaseKey | string;
  /** 0–100 progress through the current phase’s ordered states */
  percent: number;
  /** e.g. "Egg · 50% through Design · Back test" */
  title: string;
  /** Muted look for brand-new blanks (still an egg) */
  newborn?: boolean;
  className?: string;
  size?: number;
};

/** Stage face + short label for tooltips / a11y. */
export function lifecycleStage(phase: string): {
  glyph: string;
  label: string;
  short: string;
} {
  const p = (phase || "").toLowerCase();
  if (p === "development" || p === "design") {
    return { glyph: "🥚", label: "Egg", short: "Design · egg" };
  }
  if (p === "curation" || p === "curate") {
    return { glyph: "🐣", label: "Hatchling", short: "Curate · hatchling" };
  }
  if (p === "deployment" || p === "deploy") {
    return { glyph: "🦅", label: "Eagle", short: "Deploy · eagle" };
  }
  if (p === "bin" || p === "archive") {
    return { glyph: "🪺", label: "Nest", short: "Archive · nest" };
  }
  return { glyph: "🥚", label: "Egg", short: "Egg" };
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default function BotPhaseMeter({
  phase,
  percent,
  title,
  newborn = false,
  className = "",
  size = 36,
}: BotPhaseMeterProps) {
  const pct = clampPct(percent);
  const ready = pct >= 100;
  const empty = pct === 0;
  const stage = lifecycleStage(phase);

  // Ring geometry (viewBox 36×36)
  const vb = 36;
  const stroke = 3;
  const r = (vb - stroke) / 2 - 0.5;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - pct / 100);

  const track =
    "stroke-[var(--color-separator)] dark:stroke-neutral-600";
  const fill = ready
    ? "stroke-emerald-500 dark:stroke-emerald-400"
    : empty
      ? "stroke-[var(--color-label-secondary)] opacity-40"
      : "stroke-blue-500 dark:stroke-blue-400";
  const labelClass = ready
    ? "text-emerald-700 dark:text-emerald-300"
    : empty
      ? "text-[var(--color-label-secondary)]"
      : "text-blue-700 dark:text-blue-300";

  return (
    <div
      className={"flex shrink-0 flex-col items-center gap-0.5 " + className}
      title={title}
      aria-label={title}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={title}
      data-testid="bot-phase-meter"
      data-phase-pct={pct}
      data-ready={ready ? "1" : "0"}
      data-lifecycle={stage.label.toLowerCase()}
      data-phase={phase}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${vb} ${vb}`}
          className="block -rotate-90"
          aria-hidden
        >
          <circle
            cx={vb / 2}
            cy={vb / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className={track}
          />
          <circle
            cx={vb / 2}
            cy={vb / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dashOffset}
            className={
              fill + " transition-[stroke-dashoffset] duration-300 ease-out"
            }
          />
        </svg>
        <div
          className={
            "pointer-events-none absolute inset-0 flex items-center justify-center select-none leading-none " +
            (newborn || empty ? "opacity-70" : "")
          }
          aria-hidden
        >
          <span
            style={{ fontSize: Math.round(size * 0.42) }}
            className="block leading-none"
          >
            {stage.glyph}
          </span>
        </div>
      </div>
      <span
        className={
          "text-[0.62rem] font-bold tabular-nums leading-none " + labelClass
        }
      >
        {pct}%
      </span>
    </div>
  );
}

/** Pure helper: phase readiness % from ordered phase states. */
export function phaseProgressPercent(
  phaseState: string,
  states: { key: string }[] | undefined,
): number {
  const list = states || [];
  if (list.length === 0) return 0;
  if (list.length === 1) return 100;
  const idx = list.findIndex((st) => st.key === phaseState);
  if (idx < 0) return 0;
  return Math.round((idx / (list.length - 1)) * 100);
}

export function phaseMeterTitle(opts: {
  percent: number;
  phase: string;
  phaseLabel: string;
  stateLabel: string;
}): string {
  const { percent, phase, phaseLabel, stateLabel } = opts;
  const stage = lifecycleStage(phase);
  if (percent >= 100) {
    return `${stage.label} · ${phaseLabel} complete (${stateLabel}) — ready to promote when gates allow`;
  }
  return `${stage.label} · ${percent}% through ${phaseLabel} · ${stateLabel}`;
}
