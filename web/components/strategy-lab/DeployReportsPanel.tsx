"use client";

/**
 * Deploy equity + stats — mirrors Practice Reports layout
 * (StatsTable | Equity + Drawdown, featured cards, distributions).
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import EquityChart from "@/components/reports/EquityChart";
import DrawdownChart from "@/components/reports/DrawdownChart";
import StatsTable from "@/components/reports/StatsTable";
import { AvgWinLossCard, SharpeCard, DrawdownCard } from "@/components/reports/FeaturedCards";
import BarDist from "@/components/reports/BarDist";
import {
  loadStartingCapital,
  reportsBookFromServer,
  saveStartingCapital,
  type ReportsBook,
} from "@/lib/reportsBook";
import type { ServerReportsBook } from "@/lib/tradeLogAnalytics";
import { getJSON } from "@/lib/client";

type DeployBookDto = ServerReportsBook & {
  source?: string;
  source_note?: string;
  phase?: string;
};

async function fetchDeployReportsBook(
  startingCapital: number,
): Promise<DeployBookDto | null> {
  const q = new URLSearchParams({
    starting_capital: String(startingCapital),
  });
  return getJSON(
    `/api/me/strategy-lab/deploy/reports-book?${q.toString()}`,
  );
}

export default function DeployReportsPanel() {
  const [capital, setCapital] = useState(50_000);
  const [book, setBook] = useState<ReportsBook | null>(null);
  const [sourceNote, setSourceNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCapital(loadStartingCapital(50_000));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchDeployReportsBook(capital);
      if (!raw) {
        setError("Could not load Deploy reports");
        setBook(null);
        return;
      }
      setSourceNote(raw.source_note || "");
      setBook(reportsBookFromServer(raw));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBook(null);
    } finally {
      setLoading(false);
    }
  }, [capital]);

  useEffect(() => {
    void load();
  }, [load]);

  function onCapital(n: number) {
    setCapital(n);
    saveStartingCapital(n);
  }

  if (loading && !book) {
    return (
      <p className="text-sm text-[var(--color-label-secondary)]">
        Loading Deploy equity & stats…
      </p>
    );
  }

  if (error && !book) {
    return (
      <div className="text-sm">
        <p className="text-rose-600">{error}</p>
        <button
          type="button"
          className="mt-2 text-blue-600 underline"
          onClick={() => void load()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div
      className="space-y-6"
      data-testid="deploy-reports-dashboard"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className="font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]"
            style={{ fontSize: "var(--text-caption)" }}
          >
            Deploy · equity & stats
          </p>
          <p
            className="font-semibold text-[var(--color-label)]"
            style={{ fontSize: "var(--text-headline)" }}
          >
            {book.accountLabel}
          </p>
          {sourceNote ? (
            <p className="mt-1 max-w-2xl text-xs text-[var(--color-label-secondary)]">
              {sourceNote}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-[var(--color-separator)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--color-fill)]"
        >
          Refresh
        </button>
      </div>

      {/* Main: stats | equity + drawdown — same grid as Practice Reports */}
      <div className="grid gap-5 lg:grid-cols-[minmax(17rem,22rem)_1fr] lg:items-stretch">
        <StatsTable
          stats={book.stats}
          startingCapital={capital}
          onCapital={onCapital}
        />

        <div className="flex min-h-0 min-w-0 flex-col gap-4">
          <section className="flex min-h-0 flex-1 flex-col rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-[var(--elevation-1)] sm:p-5">
            <div className="mb-3 flex shrink-0 flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2
                  className="font-semibold text-[var(--color-label)]"
                  style={{ fontSize: "var(--text-headline)" }}
                >
                  Equity curve
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
                  Path from starting capital · closed Strategy Lab outcomes
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-fill)] px-3 py-1 text-xs font-semibold tabular-nums text-[var(--color-label)]">
                {book.stats.find((s) => s.key === "balance")?.value}
              </span>
            </div>
            <div className="min-h-[280px] flex-1">
              <EquityChart series={book.series} height={420} />
            </div>
          </section>

          <section className="shrink-0 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-[var(--elevation-1)] sm:p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2
                  className="font-semibold text-[var(--color-label)]"
                  style={{ fontSize: "var(--text-headline)" }}
                >
                  Drawdown
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
                  Peak-to-trough on the path
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-destructive-soft)] px-3 py-1 text-xs font-semibold tabular-nums text-[var(--color-destructive)]">
                Max{" "}
                {book.hasPnlData
                  ? `${(Math.abs(book.maxDrawdownPct) * 100).toFixed(3)}%`
                  : "—"}
              </span>
            </div>
            <DrawdownChart series={book.series} />
          </section>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-[var(--elevation-1)] sm:p-5">
        <BarDist
          bins={book.distribution}
          title="Outcome distribution"
          subtitle="Realized $ per closed package · same density style as Practice Reports"
          dense
        />
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-[var(--elevation-1)] sm:p-5">
        <BarDist bins={book.strategyDist} title="Closes by bot" />
      </section>

      <p
        className="text-[var(--color-label-tertiary)]"
        style={{ fontSize: "var(--text-footnote)" }}
      >
        Layout matches{" "}
        <Link href="/app/reports" className="font-medium text-[var(--color-tint)]">
          Practice Reports
        </Link>
        . Process metrics — not profit theater. Prove packages in{" "}
        <Link
          href="/app/strategy-lab?phase=curation"
          className="font-medium text-[var(--color-tint)]"
        >
          Curate
        </Link>{" "}
        to grow this book.
      </p>
    </div>
  );
}
