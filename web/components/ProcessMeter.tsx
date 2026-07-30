"use client";

// Personal process health — meters + trading-psych process integrity grades.
// Scale: Poor → Fair → Good → Great → Excellent (process, not P&L / identity).

export type ProcessGrade = {
  id: string;
  label: string;
  blurb: string;
  color: string;
  percent?: number;
  band_low: number;
  band_high: number;
  establishing?: boolean;
};

export type ProcessMeterItem = {
  id: string;
  label: string;
  hint: string;
  percent: number;
  detail: string;
  empty?: boolean;
  soon?: boolean;
  grade?: ProcessGrade;
  /** RT7 cadence: d > H invitational nudge (never shame) */
  nudge?: boolean;
  days_since?: number;
  horizon_days?: number;
  clock?: string;
};

export type ProcessPayload = {
  framing: string;
  overall_percent: number;
  overall_raw_percent?: number;
  overall_label: string;
  grade?: ProcessGrade;
  grade_scale?: ProcessGrade[];
  tenure?: {
    days: number;
    ramp_days: number;
    weight: number;
    establishing: boolean;
    note: string;
  };
  meters: ProcessMeterItem[];
  profile?: {
    id: string;
    label: string;
    horizon_label: string;
    focus: string;
    retro_horizon_days?: number | null;
    grade_ramp_days?: number;
  };
  window?: Record<string, number>;
};

/** Client fallback if API has no grade yet (pre-restart). */
function gradeFromPercent(pct: number): ProcessGrade {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  if (p <= 24)
    return {
      id: "poor",
      label: "Poor",
      blurb: "Off process — reinstall the routine",
      color: "#b91c1c",
      band_low: 0,
      band_high: 24,
      percent: p,
    };
  if (p <= 49)
    return {
      id: "fair",
      label: "Fair",
      blurb: "Developing discipline — partial process",
      color: "#ea580c",
      band_low: 25,
      band_high: 49,
      percent: p,
    };
  if (p <= 69)
    return {
      id: "good",
      label: "Good",
      blurb: "Solid process integrity",
      color: "#ca8a04",
      band_low: 50,
      band_high: 69,
      percent: p,
    };
  if (p <= 84)
    return {
      id: "great",
      label: "Great",
      blurb: "Disciplined process — habits holding",
      color: "#16a34a",
      band_low: 70,
      band_high: 84,
      percent: p,
    };
  return {
    id: "excellent",
    label: "Excellent",
    blurb: "Locked-in process integrity",
    color: "#047857",
    band_low: 85,
    band_high: 100,
    percent: p,
  };
}

const FALLBACK_SCALE: ProcessGrade[] = [
  gradeFromPercent(12),
  gradeFromPercent(37),
  gradeFromPercent(60),
  gradeFromPercent(77),
  gradeFromPercent(92),
].map((g) => ({
  id: g.id,
  label: g.label,
  blurb: g.blurb,
  color: g.color,
  band_low: g.band_low,
  band_high: g.band_high,
}));

export default function ProcessMeter({
  process,
  compact = false,
}: {
  process: ProcessPayload;
  compact?: boolean;
}) {
  const prof = process.profile;
  const grade = process.grade ?? gradeFromPercent(process.overall_percent);
  const scale = process.grade_scale?.length
    ? process.grade_scale
    : FALLBACK_SCALE;
  const isEstablishing = !!(
    grade.establishing ||
    grade.id === "establishing" ||
    process.tenure?.establishing
  );
  const needlePct = isEstablishing
    ? 50
    : Math.min(100, Math.max(0, process.overall_percent));
  const weightPct = process.tenure
    ? Math.round(process.tenure.weight * 100)
    : null;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div>
        {prof && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-tint)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-tint)]">
              {prof.label}
            </span>
            <span className="text-[11px] text-[var(--color-label-tertiary)]">
              {prof.horizon_label}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              Process integrity
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span
                className="rounded-md px-2.5 py-1 text-sm font-bold uppercase tracking-wide text-white"
                style={{ background: grade.color }}
              >
                {grade.label}
              </span>
              {!isEstablishing && (
                <span
                  className="text-2xl font-semibold tabular-nums"
                  style={{ color: grade.color }}
                >
                  {process.overall_percent}
                  <span className="text-sm font-medium text-[var(--color-label-secondary)]">
                    %
                  </span>
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
              {grade.blurb}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
              {process.overall_label}
            </p>
            {process.tenure && !isEstablishing && weightPct != null && weightPct < 100 && (
              <p className="mt-1 text-[11px] text-[var(--color-label-tertiary)]">
                Grade confidence {weightPct}% · day{" "}
                {Math.floor(process.tenure.days) + 1} of{" "}
                {process.tenure.ramp_days} (extremes open as you stay)
              </p>
            )}
          </div>
        </div>

        {/* Graded scale bar — needle overshoots band so it stays visible */}
        <div className="mt-3">
          <div className="relative h-3 rounded-full">
            <div className="absolute inset-0 flex overflow-hidden rounded-full">
              {scale.map((b) => {
                // Segment widths match band sizes: 25+25+20+15+15 = 100
                const pctW =
                  b.id === "poor"
                    ? 25
                    : b.id === "fair"
                      ? 25
                      : b.id === "good"
                        ? 20
                        : b.id === "great"
                          ? 15
                          : 15;
                return (
                  <div
                    key={b.id}
                    className="h-full"
                    style={{
                      width: `${pctW}%`,
                      background: b.color,
                      opacity: grade.id === b.id ? 1 : 0.35,
                    }}
                    title={`${b.label} (${b.band_low}-${b.band_high}%)`}
                  />
                );
              })}
            </div>
            {/* Needle: extends ~35% above/below the bar for contrast */}
            <div
              className="pointer-events-none absolute z-10 w-[3px] rounded-full bg-[var(--color-label)] shadow-[0_0_0_1px_var(--color-surface)]"
              style={{
                left: `calc(${needlePct}% - 1.5px)`,
                top: "-35%",
                height: "170%",
                opacity: isEstablishing ? 0.45 : 1,
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute z-10 h-[5px] w-[5px] rounded-full bg-[var(--color-label)] shadow-[0_0_0_1.5px_var(--color-surface)]"
              style={{
                left: `calc(${needlePct}% - 2.5px)`,
                top: "-45%",
                opacity: isEstablishing ? 0.45 : 1,
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute z-10 h-[5px] w-[5px] rounded-full bg-[var(--color-label)] shadow-[0_0_0_1.5px_var(--color-surface)]"
              style={{
                left: `calc(${needlePct}% - 2.5px)`,
                bottom: "-45%",
                opacity: isEstablishing ? 0.45 : 1,
              }}
              aria-hidden
            />
          </div>
          <div className="mt-1.5 flex justify-between gap-0.5 text-[9px] font-semibold uppercase tracking-wide">
            {scale.map((b) => (
              <span
                key={b.id}
                className={
                  !isEstablishing && grade.id === b.id
                    ? "text-[var(--color-label)]"
                    : "text-[var(--color-label-tertiary)]"
                }
                style={
                  !isEstablishing && grade.id === b.id
                    ? { color: b.color }
                    : undefined
                }
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-2 text-[11px] leading-snug text-[var(--color-label-tertiary)]">
          {isEstablishing
            ? "You start ungraded — Poor and Excellent are earned over time as you practice, not handed out on day one."
            : prof?.focus ||
              "Process integrity grade — journal-style process score. Not P&L, not talent. Extremes open as you stay in the game."}
        </p>
      </div>

      <ul className="space-y-3">
        {process.meters.map((m) => {
          const g =
            m.soon || m.empty
              ? null
              : m.grade ?? gradeFromPercent(m.percent);
          const color = g?.color ?? "var(--color-label-tertiary)";
          const isCadence = m.id === "retrospective";
          return (
            <li
              key={m.id}
              data-testid={isCadence ? "process-meter-retrospective" : undefined}
              data-cadence-empty={isCadence && m.empty ? "1" : undefined}
              data-cadence-nudge={isCadence && m.nudge ? "1" : undefined}
            >
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span
                  className="font-medium text-[var(--color-label)]"
                  title={m.hint}
                >
                  {m.label}
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  {g && (
                    <span
                      className="rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide text-white"
                      style={{ background: g.color }}
                      data-testid={
                        isCadence ? "process-meter-retro-grade" : undefined
                      }
                    >
                      {g.label}
                    </span>
                  )}
                  <span className="tabular-nums text-[var(--color-label-secondary)]">
                    {m.soon
                      ? m.detail
                      : m.empty
                        ? "—"
                        : `${m.percent}%`}
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-fill)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${m.soon || m.empty ? 0 : m.percent}%`,
                    background: color,
                    opacity: m.soon || m.empty ? 0.35 : 1,
                  }}
                />
              </div>
              {!compact && (
                <p className="mt-0.5 text-[11px] text-[var(--color-label-tertiary)]">
                  {m.detail}
                  {!m.soon && !m.empty
                    ? ` · ${m.hint}`
                    : m.empty || m.soon
                      ? ` · ${m.hint}`
                      : ""}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
