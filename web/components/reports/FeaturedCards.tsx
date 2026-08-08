"use client";

import type { ReactNode } from "react";
import type { SeriesPoint } from "@/lib/reportsBook";

export function moneyShort(n: number, parensNeg = false): string {
  if (parensNeg && n < 0) {
    return `($${Math.abs(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })})`;
  }
  const sign = n < 0 ? "-$" : "$";
  return `${sign}${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Simple big-number card shell for key left-rail stats. */
function HighlightShell({
  title,
  testId,
  children,
  badge,
}: {
  title: string;
  testId: string;
  children: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <section
      className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-4 shadow-[var(--elevation-1)] sm:p-5"
      data-testid={testId}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-label)]">
          {title}
        </h3>
        {badge}
      </div>
      <div className="mt-6 flex flex-1 flex-col items-center justify-center">
        {children}
      </div>
    </section>
  );
}

/**
 * Total return % of starting capital.
 * Path aggregate only — not in the six ratio magnifiers (Coach).
 * Kept for optional reuse; do not mount in the highlight grid.
 */
export function TotalReturnCard({
  totalReturnPct,
  hasPnlData,
}: {
  totalReturnPct: number;
  hasPnlData: boolean;
}) {
  const tone =
    !hasPnlData
      ? "text-[var(--color-label-tertiary)]"
      : totalReturnPct > 0
        ? "text-[var(--color-tint)]"
        : totalReturnPct < 0
          ? "text-[var(--color-destructive)]"
          : "text-[var(--color-label)]";
  return (
    <HighlightShell
      title="Total Return"
      testId="total-return"
    >
      {!hasPnlData ? (
        <p className="text-sm text-[var(--color-label-tertiary)]">
          Needs realized outcomes.
        </p>
      ) : (
        <p
          className={`text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl ${tone}`}
        >
          {totalReturnPct.toFixed(2)}%
        </p>
      )}
    </HighlightShell>
  );
}

/** Gross wins ÷ gross losses (book profit factor). */
export function ProfitFactorCard({
  profitFactor,
  hasPnlData,
}: {
  profitFactor: number | null;
  hasPnlData: boolean;
}) {
  const unbounded = hasPnlData && profitFactor == null;
  const display =
    !hasPnlData
      ? "—"
      : unbounded
        ? "∞"
        : (profitFactor as number).toFixed(2);
  const n = profitFactor ?? (unbounded ? 99 : 0);
  const tone =
    !hasPnlData
      ? "text-[var(--color-label-tertiary)]"
      : unbounded || n >= 1.5
        ? "text-[var(--color-tint)]"
        : n >= 1
          ? "text-[var(--color-label)]"
          : "text-[var(--color-destructive)]";
  return (
    <HighlightShell
      title="Profit Factor"
      testId="profit-factor"
    >
      {!hasPnlData ? (
        <p className="text-sm text-[var(--color-label-tertiary)]">
          Needs realized outcomes.
        </p>
      ) : (
        <p
          className={`text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl ${tone}`}
        >
          {display}
        </p>
      )}
    </HighlightShell>
  );
}

/**
 * Average entry R2R: potential profit ÷ risk (max you must put up) at open.
 * Not win rate, not avg-win/avg-loss.
 */
export function AvgR2rCard({
  avgEntryR2r,
  sampleSize,
}: {
  avgEntryR2r: number | null;
  sampleSize: number;
}) {
  const has = avgEntryR2r != null && sampleSize > 0 && avgEntryR2r > 0;
  const tone =
    !has
      ? "text-[var(--color-label-tertiary)]"
      : (avgEntryR2r as number) >= 3
        ? "text-[var(--color-tint)]"
        : (avgEntryR2r as number) >= 1
          ? "text-[var(--color-label)]"
          : "text-[var(--color-warning)]";
  return (
    <HighlightShell
      title="Risk to Reward"
      testId="avg-entry-r2r"
      badge={
        has ? (
          <span className="rounded-full bg-[var(--color-fill)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--color-label)]">
            n = {sampleSize}
          </span>
        ) : undefined
      }
    >
      {!has ? (
        <p className="text-sm text-[var(--color-label-tertiary)]">
          Needs open fills with net price and strike width.
        </p>
      ) : (
        <p
          className={`text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl ${tone}`}
        >
          {(avgEntryR2r as number).toFixed(2)}
        </p>
      )}
    </HighlightShell>
  );
}

/** Win rate among decided (win/loss) outcomes. */
export function WinRateCard({
  winRatePct,
  winners,
  losers,
}: {
  winRatePct: number;
  winners: number;
  losers: number;
}) {
  const decided = winners + losers;
  const has = decided > 0;
  const fill = has ? Math.min(1, Math.max(0, winRatePct / 100)) : 0;
  return (
    <HighlightShell
      title="Win Rate"
      testId="win-rate"
      badge={
        has ? (
          <span className="rounded-full bg-[var(--color-fill)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--color-label)]">
            {winners}W / {losers}L
          </span>
        ) : undefined
      }
    >
      {!has ? (
        <p className="text-sm text-[var(--color-label-tertiary)]">
          Needs signed closes.
        </p>
      ) : (
        <>
          <p className="text-4xl font-semibold tabular-nums tracking-tight text-[var(--color-label)] sm:text-5xl">
            {winRatePct.toFixed(1)}%
          </p>
          <div className="mt-4 h-2 w-full max-w-[12rem] overflow-hidden rounded-full bg-[var(--color-fill)]">
            <div
              className="h-full rounded-full bg-[var(--color-tint)]"
              style={{ width: `${fill * 100}%` }}
            />
          </div>
        </>
      )}
    </HighlightShell>
  );
}

/** Featured outcome card: average winner vs average loser (book stats only). */
export function AvgWinLossCard({
  avgWin,
  avgLoss,
  ratio,
  winners,
  losers,
}: {
  avgWin: number;
  avgLoss: number;
  ratio: number;
  winners: number;
  losers: number;
}) {
  const max = Math.max(avgWin, avgLoss, 1);
  const winH = Math.max(8, (avgWin / max) * 100);
  const lossH = Math.max(8, (avgLoss / max) * 100);
  const has = winners > 0 || losers > 0;

  return (
    <section
      className="surface-card h-full border border-[var(--color-separator)] p-4 shadow-[var(--elevation-1)] sm:p-5"
      data-testid="avg-win-loss"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-label)]">
          Avg win vs loss
        </h3>
        {has && (
          <span className="rounded-full bg-[var(--color-tint)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--color-on-tint)]">
            Ratio {ratio >= 99 ? "∞" : ratio.toFixed(2)}
          </span>
        )}
      </div>

      {!has ? (
        <p className="mt-6 text-sm text-[var(--color-label-tertiary)]">—</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-6">
          <div className="flex flex-col items-center">
            <div
              className="flex w-full max-w-[7rem] flex-col justify-end"
              style={{ height: 120 }}
            >
              <div
                className="w-full rounded-t-[var(--radius-md)] bg-[var(--color-tint)]"
                style={{ height: winH }}
                title={`Avg win ${moneyShort(avgWin)}`}
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              Avg win
            </p>
            <p className="text-lg font-semibold tabular-nums text-[var(--color-tint)]">
              {winners > 0 ? moneyShort(avgWin) : "—"}
            </p>
            <p className="text-xs text-[var(--color-label-tertiary)]">
              {winners} trade{winners === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div
              className="flex w-full max-w-[7rem] flex-col justify-end"
              style={{ height: 120 }}
            >
              <div
                className="w-full rounded-t-[var(--radius-md)] bg-[var(--color-destructive)]"
                style={{ height: lossH, opacity: 0.9 }}
                title={`Avg loss ${moneyShort(-avgLoss, true)}`}
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              Avg loss
            </p>
            <p className="text-lg font-semibold tabular-nums text-[var(--color-destructive)]">
              {losers > 0 ? moneyShort(-avgLoss, true) : "—"}
            </p>
            <p className="text-xs text-[var(--color-label-tertiary)]">
              {losers} trade{losers === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/** Featured: Sharpe on trade returns (mean/std × √n). */
export function SharpeCard({
  sharpe,
  sampleSize,
}: {
  sharpe: number;
  sampleSize: number;
}) {
  const has = sampleSize > 1;
  // Soft gauge 0–4 for display (capped); not a hard grade.
  const gaugeMax = 4;
  const fill = has ? Math.min(1, Math.max(0, sharpe / gaugeMax)) : 0;
  const tone =
    !has
      ? "text-[var(--color-label-tertiary)]"
      : sharpe >= 2
        ? "text-[var(--color-tint)]"
        : sharpe >= 1
          ? "text-[var(--color-label)]"
          : sharpe >= 0
            ? "text-[var(--color-warning)]"
            : "text-[var(--color-destructive)]";

  return (
    <section
      className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-4 shadow-[var(--elevation-1)] sm:p-5"
      data-testid="sharpe-ratio"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-label)]">
          Sharpe ratio
        </h3>
        {has && (
          <span className="rounded-full bg-[var(--color-tint)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--color-on-tint)]">
            n = {sampleSize}
          </span>
        )}
      </div>

      {!has ? (
        <p className="mt-6 text-sm text-[var(--color-label-tertiary)]">—</p>
      ) : (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center">
          <p
            className={`text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl ${tone}`}
          >
            {sharpe.toFixed(2)}
          </p>
          <div className="mt-4 h-2 w-full max-w-[12rem] overflow-hidden rounded-full bg-[var(--color-fill)]">
            <div
              className="h-full rounded-full bg-[var(--color-tint)] transition-[width]"
              style={{ width: `${fill * 100}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

/** Featured: max drawdown % of peak balance (capital preservation). */
export function DrawdownCard({
  maxDrawdownPct,
  hasPnlData,
  series,
}: {
  maxDrawdownPct: number;
  hasPnlData: boolean;
  series: SeriesPoint[];
}) {
  // maxDrawdownPct is ≤ 0 (fraction of peak)
  const absPct = Math.abs(maxDrawdownPct) * 100;
  const has = hasPnlData && series.length > 1;
  // Gauge: 0% good → 20%+ fills bar (capital preservation first)
  const gaugeMax = 20;
  const fill = has ? Math.min(1, absPct / gaugeMax) : 0;
  const tone =
    !has
      ? "text-[var(--color-label-tertiary)]"
      : absPct <= 5
        ? "text-[var(--color-tint)]"
        : absPct <= 10
          ? "text-[var(--color-warning)]"
          : "text-[var(--color-destructive)]";

  // Mini spark from series drawdown
  const w = 200;
  const h = 48;
  let spark: string | null = null;
  if (has && series.length >= 2) {
    const vals = series.map((p) => p.drawdownPct * 100);
    const minV = Math.min(...vals, -0.5);
    const maxV = 0;
    const xAt = (i: number) =>
      series.length === 1 ? w / 2 : (i / (series.length - 1)) * w;
    const yAt = (v: number) =>
      h - ((v - minV) / (maxV - minV || 1)) * (h - 4) - 2;
    spark = series
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.drawdownPct * 100).toFixed(1)}`,
      )
      .join(" ");
  }

  return (
    <section
      className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-4 shadow-[var(--elevation-1)] sm:p-5"
      data-testid="max-drawdown"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-label)]">
          Max drawdown
        </h3>
        {has && (
          <span className="rounded-full bg-[var(--color-destructive)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-white">
            of peak
          </span>
        )}
      </div>

      {!has ? (
        <p className="mt-6 text-sm text-[var(--color-label-tertiary)]">—</p>
      ) : (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center">
          <p
            className={`text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl ${tone}`}
          >
            {absPct.toFixed(2)}%
          </p>
          {spark && (
            <svg
              viewBox={`0 0 ${w} ${h}`}
              className="mt-3 h-12 w-full max-w-[14rem]"
              aria-hidden
            >
              <path
                d={spark}
                fill="none"
                stroke="var(--color-destructive)"
                strokeWidth={1.75}
                strokeLinejoin="round"
              />
            </svg>
          )}
          <div className="mt-3 h-2 w-full max-w-[12rem] overflow-hidden rounded-full bg-[var(--color-fill)]">
            <div
              className="h-full rounded-full bg-[var(--color-destructive)] transition-[width]"
              style={{ width: `${fill * 100}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
