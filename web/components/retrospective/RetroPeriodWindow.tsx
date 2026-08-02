"use client";

/**
 * Windowed graphical view of the retrospective period — equity path, drawdown,
 * and summary stats for scope_start → scope_end (account frozen at gather).
 * Process ceremony remains the detailed look below; this is capital-path context,
 * not a success scoreboard.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import EquityChart from "@/components/reports/EquityChart";
import DrawdownChart from "@/components/reports/DrawdownChart";
import {
  AvgWinLossCard,
  DrawdownCard,
  SharpeCard,
} from "@/components/reports/FeaturedCards";
import StatsTable from "@/components/reports/StatsTable";
import {
  loadStartingCapital,
  reportsBookFromServer,
  saveStartingCapital,
  type ReportsBook,
} from "@/lib/reportsBook";
import { fetchReportsBook } from "@/lib/tradeLogAnalytics";

function toDayYmd(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const s = String(iso).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

function fmtDay(ymd: string | undefined): string {
  if (!ymd) return "—";
  try {
    return new Date(ymd + "T12:00:00").toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  } catch {
    return ymd;
  }
}

export type RetroPeriodWindowProps = {
  scopeStart: string | null | undefined;
  scopeEnd: string | null | undefined;
  /** Account frozen at gather; null/undefined = all accounts. */
  accountId?: number | null;
  accountLabel?: string | null;
  /** When true, copy notes that account/window were fixed at gather. */
  readOnly?: boolean;
};

export default function RetroPeriodWindow({
  scopeStart,
  scopeEnd,
  accountId,
  accountLabel,
  readOnly = false,
}: RetroPeriodWindowProps) {
  const fromDay = toDayYmd(scopeStart);
  const toDay = toDayYmd(scopeEnd);
  const [capital, setCapital] = useState(50000);
  const [book, setBook] = useState<ReportsBook | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "err" | "empty">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setCapital(loadStartingCapital(50000));
  }, []);

  const load = useCallback(async () => {
    if (!fromDay || !toDay) {
      setState("empty");
      setBook(null);
      return;
    }
    setState("loading");
    setError(null);
    try {
      const res = await fetchReportsBook({
        accountId:
          accountId != null && Number.isFinite(accountId) ? accountId : "all",
        startingCapital: capital,
        fromDay,
        toDay,
      });
      if (!res.ok) {
        setState("err");
        setError(
          res.error.kind === "err"
            ? res.error.message
            : `Could not load period path (${res.error.kind})`,
        );
        setBook(null);
        return;
      }
      setBook(reportsBookFromServer(res.data));
      setState("ok");
    } catch (e) {
      setState("err");
      setError(e instanceof Error ? e.message : String(e));
      setBook(null);
    }
  }, [accountId, capital, fromDay, toDay]);

  useEffect(() => {
    void load();
  }, [load]);

  function onCapital(n: number) {
    // Starting capital is a display scale for the path — allowed even on complete retros.
    setCapital(n);
    saveStartingCapital(n);
  }

  const reportsHref =
    fromDay && toDay
      ? `/app/reports` // Practice Context date is separate; deep-link params not yet standard
      : "/app/reports";

  return (
    <section
      className="surface-card border border-[var(--color-separator)] p-4 sm:p-5"
      data-testid="retro-period-window"
      aria-label="Period path for this retrospective"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
            Period window
          </p>
          <h2
            className="mt-0.5 font-semibold text-[var(--color-label)]"
            style={{ fontSize: "var(--text-headline)" }}
          >
            Path under review
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-label-secondary)]">
            Graphical look at this retrospective&apos;s window — stats, equity
            curve, and drawdown from Trade Log.{" "}
            <strong className="font-medium text-[var(--color-label)]">
              Capital path risk, not a trophy
            </strong>
            . Process detail is the ceremony below.
          </p>
          <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
            {fmtDay(fromDay)} → {fmtDay(toDay)}
            {" · "}
            <span className="font-medium text-[var(--color-label-secondary)]">
              {accountLabel?.trim() || "All accounts"}
            </span>
            {readOnly ? " · fixed at gather" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-3 py-1.5 text-xs font-medium text-[var(--color-label)] hover:bg-[var(--color-fill)]"
            onClick={() => setExpanded((v) => !v)}
            data-testid="retro-period-window-toggle"
            aria-expanded={expanded}
          >
            {expanded ? "Collapse charts" : "Show charts"}
          </button>
          <Link
            href={reportsHref}
            className="rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-1.5 text-xs font-medium text-[var(--color-tint)] hover:bg-[var(--color-fill)]/40"
          >
            Open Reports
          </Link>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4" data-testid="retro-period-window-body">
          {state === "loading" && (
            <p className="text-sm text-[var(--color-label-tertiary)]">
              Loading period path…
            </p>
          )}
          {state === "empty" && (
            <p className="text-sm text-[var(--color-label-secondary)]">
              Scope dates are missing — re-gather this retrospective to fix the
              window.
            </p>
          )}
          {state === "err" && (
            <p className="text-sm text-red-600" role="alert">
              {error || "Could not load period path."}
            </p>
          )}
          {state === "ok" && book && (
            <>
              <div className="grid gap-4 lg:grid-cols-[minmax(15rem,20rem)_1fr] lg:items-stretch">
                <StatsTable
                  stats={book.stats}
                  startingCapital={capital}
                  onCapital={onCapital}
                />
                <div className="flex min-h-0 min-w-0 flex-col gap-3">
                  <div className="surface-card flex min-h-0 flex-1 flex-col border border-[var(--color-separator)] p-3 sm:p-4">
                    <div className="mb-2 flex shrink-0 flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--color-label)]">
                          Equity curve
                        </h3>
                        <p className="text-[11px] text-[var(--color-label-tertiary)]">
                          Closed outcomes in this window · starting capital
                          scales the path
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--color-fill)] px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--color-label)]">
                        {book.stats.find((s) => s.key === "balance")?.value ??
                          "—"}
                      </span>
                    </div>
                    <div className="min-h-[200px] flex-1">
                      <EquityChart series={book.series} height={280} />
                    </div>
                  </div>
                  <div className="surface-card border border-[var(--color-separator)] p-3 sm:p-4">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--color-label)]">
                          Drawdown
                        </h3>
                        <p className="text-[11px] text-[var(--color-label-tertiary)]">
                          Peak-to-trough on the path
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--color-destructive-soft)] px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--color-destructive)]">
                        Max{" "}
                        {book.hasPnlData
                          ? `${(Math.abs(book.maxDrawdownPct) * 100).toFixed(2)}%`
                          : "—"}
                      </span>
                    </div>
                    <DrawdownChart series={book.series} />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <AvgWinLossCard
                  avgWin={book.avgWin}
                  avgLoss={book.avgLoss}
                  ratio={book.winLossRatio}
                  winners={book.winners}
                  losers={book.losers}
                />
                <SharpeCard
                  sharpe={book.sharpe}
                  sampleSize={book.sharpeSampleSize}
                />
                <DrawdownCard
                  maxDrawdownPct={book.maxDrawdownPct}
                  hasPnlData={book.hasPnlData}
                  series={book.series}
                />
              </div>

              <p className="text-xs text-[var(--color-label-tertiary)]">
                {book.tradeCount === 0
                  ? "No closed outcomes in this window on the selected book — the process ceremony below still runs on journal and habits."
                  : `${book.tradeCount} closed outcome${book.tradeCount === 1 ? "" : "s"} on the path. Use the ceremony map for judgment; the book step holds the neutral sample stamp.`}{" "}
                <Link
                  href="/app/trade-log"
                  className="font-medium text-[var(--color-tint)]"
                >
                  Trade Log
                </Link>
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
