"use client";

/**
 * Width Fit ranking sink — Coach mock. Maps existing per-width aggregates only.
 */

import {
  confidenceLabel,
  rankWidths,
  type ConfidenceLabel,
  type RankedWidth,
} from "@/lib/options-lab/widthFitRanking";
import { DEFAULT_MIN_VALID_N } from "@/lib/options-lab/templates/widthFit";

export default function WidthFitRanking({
  symbol,
  expirationLabel,
  asOfLabel,
  snapshotLine,
  widthPts,
  median,
  n,
  stability,
}: {
  symbol: string;
  expirationLabel: string;
  asOfLabel: string;
  snapshotLine: string;
  widthPts: number[];
  median: Array<number | null>;
  n: number[];
  stability: Array<number | null>;
}) {
  const ranked = rankWidths({ widthPts, median, n, stability });
  const lead = ranked.find((r) => r.score != null) ?? ranked[0];
  const runner = ranked.filter((r) => r.score != null)[1];
  const conf = confidenceLabel(ranked, DEFAULT_MIN_VALID_N);
  const maxScore = ranked.reduce(
    (m, r) => (r.score != null && r.score > m ? r.score : m),
    0,
  );

  return (
    <div
      className="min-h-0 flex-1 overflow-auto px-4 py-5 text-[var(--color-label)]"
      data-testid="width-fit-ranking"
    >
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[length:var(--text-caption)] uppercase tracking-[0.12em] text-[var(--color-label-secondary)]">
            {symbol} · {expirationLabel} · Width Fit
          </p>
          <h2 className="text-[length:var(--text-title-1)] font-semibold tracking-tight">
            Width Ranking
          </h2>
        </div>
        <div className="text-right">
          <p className="text-[length:var(--text-title-3)] font-semibold tabular-nums">
            {asOfLabel}
          </p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
            {snapshotLine}
          </p>
        </div>
      </header>

      <section className="mb-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-5 py-4 shadow-[var(--elevation-1)]">
        <p className="text-[length:var(--text-caption)] uppercase tracking-[0.14em] text-[var(--color-label-secondary)]">
          Most asymmetrically efficient width
        </p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <p className="text-[length:var(--text-title-1)] font-semibold tabular-nums">
              {lead?.widthPts ?? "—"}{" "}
              <span className="text-[length:var(--text-title-3)] font-normal text-[var(--color-label-secondary)]">
                points
              </span>
            </p>
            <p className="mt-2 max-w-xl text-[length:var(--text-footnote)] leading-snug text-[var(--color-label-secondary)]">
              Best current balance of movement capture, developing tent value
              and call/put asymmetry relative to debit.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[length:var(--text-title-1)] font-semibold tabular-nums">
              {lead?.score ?? "—"}
            </p>
            <p className="text-[length:var(--text-caption)] uppercase tracking-[0.12em] text-[var(--color-label-secondary)]">
              Efficiency score
            </p>
          </div>
        </div>
      </section>

      <section className="mb-4 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--elevation-1)]">
        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="text-[length:var(--text-headline)] font-semibold">
            Ranked Widths
          </h3>
          <span className="rounded-full bg-[var(--color-fill)] px-2.5 py-1 text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
            Higher = better
          </span>
        </div>
        <ol>
          {ranked.map((r) => (
            <RankRow key={r.widthPts} row={r} maxScore={maxScore || 100} />
          ))}
        </ol>
      </section>

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Best width" value={lead?.widthPts ?? "—"} />
        <StatCard label="Runner-up" value={runner?.widthPts ?? "—"} />
        <StatCard label="Confidence / separation" value={conf} />
      </div>

      <p className="text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
        Order is Width Fit median on this snapshot. Display scores are spaced
        among the top widths so gaps are readable — not a second formula, not a
        forecast.
      </p>
    </div>
  );
}

function RankRow({ row, maxScore }: { row: RankedWidth; maxScore: number }) {
  const pct =
    row.score != null && maxScore > 0 ? (row.score / maxScore) * 100 : 0;
  return (
    <li
      className="flex min-h-[var(--hit-min)] items-center gap-3 border-t border-[var(--color-separator)] px-5 py-2"
      data-testid={`width-fit-rank-${row.widthPts}`}
    >
      <span className="w-6 tabular-nums text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
        {row.rank}
      </span>
      <span className="w-20 tabular-nums text-[length:var(--text-headline)]">
        {row.widthPts}-wide
      </span>
      <div className="h-2 min-w-0 flex-1 rounded-full bg-[var(--color-fill)]">
        <div
          className="h-2 rounded-full bg-[var(--color-label)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right tabular-nums text-[length:var(--text-headline)]">
        {row.score ?? "—"}
      </span>
    </li>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number | ConfidenceLabel;
}) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--elevation-1)]">
      <p className="text-[length:var(--text-caption)] uppercase tracking-[0.12em] text-[var(--color-label-secondary)]">
        {label}
      </p>
      <p className="mt-1 text-[length:var(--text-title-2)] font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
