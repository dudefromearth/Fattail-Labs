"use client";

/**
 * Standard period infographic — same tiles for every member.
 * Filled from gather `period_brief` (process + journal compile).
 * Not a P&L scoreboard.
 */

type Tile = {
  label: string;
  value: string;
};

function asDict(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function asList(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function fmtRange(start: string, end: string): string {
  const a = start.slice(0, 10);
  const b = end.slice(0, 10);
  if (!a && !b) return "This window";
  if (a && b) return `${a} → ${b}`;
  return a || b;
}

export default function RetroPeriodBrief({
  brief,
}: {
  brief: Record<string, unknown> | null | undefined;
}) {
  if (!brief || Object.keys(brief).length === 0) return null;
  const tiles = asDict(brief.tiles);
  const journalDays = num(tiles.journal_days);
  const trades = num(tiles.trade_count);
  const adhN = num(tiles.adherence_total);
  const followed = num(tiles.followed_or_partial);
  const adh =
    adhN > 0 ? `${Math.round((followed / adhN) * 100)}%` : "—";
  const cells: Tile[] = [
    { label: "Days in window", value: String(num(tiles.window_days) || "—") },
    { label: "Journal days", value: String(journalDays) },
    { label: "Trades", value: String(trades) },
    { label: "Plan followed+", value: adh },
    { label: "Live check-ins", value: String(num(tiles.live_checkins)) },
    { label: "Lessons done", value: String(num(tiles.lessons_completed)) },
  ];
  const lastThing = str(brief.last_one_thing).trim();
  const preview = asList(brief.journal_preview);
  const range = fmtRange(str(brief.scope_start), str(brief.scope_end));

  return (
    <section
      className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-1)]"
      data-testid="retro-period-brief"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[length:var(--text-title-3)] font-semibold tracking-tight text-[var(--color-label)]">
          {str(brief.title) || "Since last review"}
        </h2>
        <p className="text-xs tabular-nums text-[var(--color-label-tertiary)]">
          {range}
        </p>
      </div>
      <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
        Same layout for every member. Process counts — not a P&L scoreboard.
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cells.map((c) => (
          <div
            key={c.label}
            className="rounded-[var(--radius-md)] bg-[var(--color-fill)]/40 px-3 py-3"
          >
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              {c.label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-label)]">
              {c.value}
            </dd>
          </div>
        ))}
      </dl>

      {lastThing ? (
        <div className="mt-4 border-t border-[var(--color-separator)] pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
            Last review — the fix
          </p>
          <p className="mt-1 text-sm text-[var(--color-label)]">{lastThing}</p>
        </div>
      ) : null}

      {preview.length > 0 ? (
        <div className="mt-4 border-t border-[var(--color-separator)] pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
            From the journal
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--color-label-secondary)]">
            {preview.map((row, i) => (
              <li key={`${str(row.day)}-${i}`}>
                <span className="mr-2 tabular-nums text-[var(--color-label-tertiary)]">
                  {str(row.day)}
                </span>
                {str(row.text)}
              </li>
            ))}
          </ul>
        </div>
      ) : brief.empty_journal ? (
        <p className="mt-4 text-sm text-[var(--color-label-tertiary)]">
          No journal notes in this window.
        </p>
      ) : null}
    </section>
  );
}
