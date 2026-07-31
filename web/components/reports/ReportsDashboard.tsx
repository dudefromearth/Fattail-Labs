"use client";

/**
 * Reports dashboard shell — charts/cards live in sibling modules (PH2-4).
 * Account + date from Practice Context Spec v0.2 (replaces local pager).
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  loadStartingCapital,
  reportsBookFromServer,
  saveStartingCapital,
  type ReportsBook,
} from "@/lib/reportsBook";
import { fetchReportsBook } from "@/lib/tradeLogApi";
import { usePracticeContext } from "@/lib/practiceContext";
import EquityChart from "./EquityChart";
import DrawdownChart from "./DrawdownChart";
import StatsTable from "./StatsTable";
import { AvgWinLossCard, SharpeCard, DrawdownCard } from "./FeaturedCards";
import BarDist from "./BarDist";

type LoadState = "loading" | "ok" | "anon" | "forbidden" | "err";

export default function ReportsDashboard() {
  const searchParams = useSearchParams();
  const highlightTradeId = (() => {
    const raw = searchParams.get("trade");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  const {
    accountId,
    accountLabel,
    rangeFromYmd,
    rangeToYmd,
    periodLabel,
    dateFilterActive,
  } = usePracticeContext();

  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<ReportsBook | null>(null);
  const [capital, setCapital] = useState(50000);

  useEffect(() => {
    setCapital(loadStartingCapital(50000));
  }, []);

  const loadBook = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const res = await fetchReportsBook({
        accountId,
        startingCapital: capital,
        fromDay: dateFilterActive ? rangeFromYmd : undefined,
        toDay: dateFilterActive ? rangeToYmd : undefined,
      });
      if (!res.ok) {
        setState(res.error.kind === "err" ? "err" : res.error.kind);
        if (res.error.kind === "err") setError(res.error.message);
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
  }, [accountId, capital, rangeFromYmd, rangeToYmd, dateFilterActive]);

  useEffect(() => {
    void loadBook();
  }, [loadBook]);

  function onCapital(n: number) {
    setCapital(n);
    saveStartingCapital(n);
  }

  if (state === "loading" && !book) {
    return (
      <p className="mt-8 text-sm text-[var(--color-label-tertiary)]">
        Loading reports…
      </p>
    );
  }
  if (state === "anon") {
    return (
      <p className="mt-8 text-sm">
        <Link href="/login" className="font-medium text-[var(--color-tint)]">
          Sign in
        </Link>{" "}
        to view Practice reports.
      </p>
    );
  }
  if (state === "forbidden") {
    return (
      <div className="surface-card mt-8 border border-[var(--color-separator)] p-5 text-sm">
        <p className="font-medium text-[var(--color-label)]">
          Membership required
        </p>
        <p className="mt-2 text-[var(--color-label-secondary)]">
          Practice tools are available to Activator and above.
        </p>
      </div>
    );
  }
  if (state === "err" && !book) {
    return (
      <div className="mt-8 text-sm">
        Could not load.{" "}
        <button type="button" className="text-[var(--color-tint)] underline" onClick={() => void loadBook()}>
          Retry
        </button>
        {error && <p className="mt-1 font-mono text-xs opacity-70">{error}</p>}
      </div>
    );
  }

  if (!book) {
    return (
      <p className="mt-8 text-sm text-[var(--color-label-tertiary)]">
        Loading reports…
        {error && (
          <span className="mt-1 block font-mono text-xs opacity-70">{error}</span>
        )}
      </p>
    );
  }

return (
    <div className="mt-6 space-y-6" data-testid="reports-dashboard">
      {/* Scope stated — Practice Context Spec v0.2 (no local pager) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className="font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]"
            style={{ fontSize: "var(--text-caption)" }}
          >
            Account · window
          </p>
          <p
            className="font-semibold text-[var(--color-label)]"
            style={{ fontSize: "var(--text-headline)" }}
            data-testid="reports-account-label"
          >
            {book.accountLabel || accountLabel}
          </p>
          <p
            className="mt-0.5 text-xs text-[var(--color-label-tertiary)]"
            data-testid="reports-period-label"
          >
            Analysis window:{" "}
            {dateFilterActive
              ? `${periodLabel} (${rangeFromYmd} → ${rangeToYmd})`
              : "All time"}
          </p>
        </div>
      </div>

      {/* Main: stats | charts — equity fills remaining height; no dead gap */}
      <div className="grid gap-5 lg:grid-cols-[minmax(17rem,22rem)_1fr] lg:items-stretch">
        <StatsTable
          stats={book.stats}
          startingCapital={capital}
          onCapital={onCapital}
        />

        <div className="flex min-h-0 min-w-0 flex-col gap-4">
          <section className="surface-card flex min-h-0 flex-1 flex-col border border-[var(--color-separator)] p-4 sm:p-5">
            <div className="mb-3 flex shrink-0 flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2
                  className="font-semibold text-[var(--color-label)]"
                  style={{ fontSize: "var(--text-headline)" }}
                >
                  Equity curve
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
                  Path from starting capital · closed outcomes may use{" "}
                  <span className="text-[var(--color-label-secondary)]">
                    estimated PnL
                  </span>{" "}
                  when a fill has none stored
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-fill)] px-3 py-1 text-xs font-semibold tabular-nums text-[var(--color-label)]">
                {book.stats.find((s) => s.key === "balance")?.value}
              </span>
            </div>
            <div className="min-h-[280px] flex-1">
              <EquityChart
                series={book.series}
                height={480}
                highlightTradeId={highlightTradeId}
              />
            </div>
            {highlightTradeId != null && (
              <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
                Highlighted trade #{highlightTradeId}
                {book.series.some((p) => p.tradeId === highlightTradeId)
                  ? " on the equity path."
                  : " — not on this account’s realized path (open-only or filtered out)."}{" "}
                <Link
                  href={`/app/trade-log?id=${highlightTradeId}`}
                  className="font-medium text-[var(--color-tint)]"
                >
                  Open in Trade Log
                </Link>
              </p>
            )}
          </section>

          <section className="surface-card shrink-0 border border-[var(--color-separator)] p-4 sm:p-5">
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

      {/* Featured: win/loss asymmetry · Sharpe · max drawdown */}
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

      {/* Outcome histogram — full width, granular bins for skew */}
      <section className="surface-card border border-[var(--color-separator)] p-4 sm:p-5">
        <BarDist
          bins={book.distribution}
          title="Outcome distribution"
          subtitle="Realized $ per closed trade · 125 equal-width bins (1st–99th pct range) — same density as the spreadsheet."
          dense
        />
      </section>

      <section className="surface-card border border-[var(--color-separator)] p-4 sm:p-5">
        <BarDist bins={book.strategyDist} title="Trades by strategy" />
      </section>

      <p
        className="text-[var(--color-label-tertiary)]"
        style={{ fontSize: "var(--text-footnote)" }}
      >
        Path from starting capital + realized outcomes in{" "}
        <Link
          href="/app/trade-log"
          className="font-medium text-[var(--color-tint)]"
        >
          Trade Log
        </Link>
        . Starting capital is stored in this browser.
      </p>
    </div>
  );
}
