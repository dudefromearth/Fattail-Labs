"use client";

/**
 * Reports dashboard shell — charts/cards live in sibling modules (PH2-4).
 * Account + date from Practice Context Spec v0.2 (replaces local pager).
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  loadStartingCapitalOverride,
  reportsBookFromServer,
  resolveReportsStartingCapital,
  saveStartingCapitalOverride,
  type ReportsBook,
} from "@/lib/reportsBook";
import { fetchReportsBook } from "@/lib/tradeLogApi";
import { usePracticeContext } from "@/lib/practiceContext";
import EmptyPeriodNotice from "@/components/practice/EmptyPeriodNotice";
import EquityChart from "./EquityChart";
import DrawdownChart from "./DrawdownChart";
import StatsTable from "./StatsTable";
import {
  AvgWinLossCard,
  AvgR2rCard,
  DrawdownCard,
  SharpeCard,
  WinRateCard,
  ProfitFactorCard,
} from "./FeaturedCards";
import BarDist from "./BarDist";

type LoadState = "loading" | "ok" | "anon" | "forbidden" | "err";

/** Compact money for equity context chip (e.g. $0.00 · $112.1K). */
function formatEquityContextMoney(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1000) {
    const k = abs / 1000;
    const body =
      k >= 100
        ? k.toFixed(0)
        : k.toFixed(1).replace(/\.0$/, "");
    return `${sign}$${body}K`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

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
    accounts,
    campaignId,
    campaignLabel,
    rangeFromYmd,
    rangeToYmd,
    dateFilterActive,
    periodLabel,
    prefsReady,
    setGranularity,
  } = usePracticeContext();

  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<ReportsBook | null>(null);
  /** Full-book end balance for period-vs-all context on the equity chip. */
  const [fullBookEndBalance, setFullBookEndBalance] = useState<number | null>(
    null,
  );
  const [capital, setCapital] = useState(50000);
  /** Avoid looping if all-time is also empty. */
  const [emptyPeriodRecovered, setEmptyPeriodRecovered] = useState(false);

  // B1 — starting capital from account starting_balance (per-scope override optional)
  useEffect(() => {
    if (!prefsReady) return;
    const base = resolveReportsStartingCapital(accounts, accountId);
    const ov = loadStartingCapitalOverride(accountId);
    setCapital(ov ?? base);
  }, [prefsReady, accountId, accounts]);

  // New account/campaign scope → allow empty-period recover again
  useEffect(() => {
    setEmptyPeriodRecovered(false);
  }, [accountId, campaignId]);

  const loadBook = useCallback(async () => {
    // Do not fetch until Practice Context prefs are final — prevents equity flash
    // (full book) then empty (saved Primary / day scope).
    if (!prefsReady) {
      setState("loading");
      return;
    }
    setState("loading");
    setError(null);
    try {
      const res = await fetchReportsBook({
        accountId,
        startingCapital: capital,
        fromDay: dateFilterActive ? rangeFromYmd : undefined,
        toDay: dateFilterActive ? rangeToYmd : undefined,
        practiceCampaignId: campaignId,
      });
      if (!res.ok) {
        setState(res.error.kind === "err" ? "err" : res.error.kind);
        if (res.error.kind === "err") setError(res.error.message);
        setBook(null);
        setFullBookEndBalance(null);
        return;
      }
      const next = reportsBookFromServer(res.data);
      setBook(next);
      setState("ok");

      // When a date window is active, also load the unscoped book so the equity
      // header can show period $ vs full-book $ (empty months no longer look empty).
      if (dateFilterActive) {
        try {
          const fullRes = await fetchReportsBook({
            accountId,
            startingCapital: capital,
            practiceCampaignId: campaignId,
          });
          if (fullRes.ok) {
            setFullBookEndBalance(fullRes.data.end_balance);
          } else {
            setFullBookEndBalance(null);
          }
        } catch {
          setFullBookEndBalance(null);
        }
      } else {
        setFullBookEndBalance(next.endBalance);
      }

      // Stale month/week/day prefs often land on a window with zero fills while
      // the selected account has a full book (e.g. May 2026 empty, Jul 2026 full).
      const acct =
        accountId === "all"
          ? null
          : accounts.find((a) => a.id === accountId);
      const bookHasFills =
        accountId === "all"
          ? accounts.some((a) => (a.trade_count ?? 0) > 0)
          : (acct?.trade_count ?? 0) > 0;
      if (
        dateFilterActive &&
        !emptyPeriodRecovered &&
        next.tradeCount === 0 &&
        bookHasFills
      ) {
        setEmptyPeriodRecovered(true);
        setGranularity("all");
      }
    } catch (e) {
      setState("err");
      setError(e instanceof Error ? e.message : String(e));
      setBook(null);
      setFullBookEndBalance(null);
    }
  }, [
    accountId,
    campaignId,
    accounts,
    capital,
    rangeFromYmd,
    rangeToYmd,
    dateFilterActive,
    prefsReady,
    emptyPeriodRecovered,
    setGranularity,
  ]);

  useEffect(() => {
    void loadBook();
  }, [loadBook]);

  function onCapital(n: number) {
    setCapital(n);
    saveStartingCapitalOverride(accountId, n);
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
          Reports are included with Observer and Navigator memberships.
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
    <div className="mt-4 space-y-6" data-testid="reports-dashboard">
      {/* D3 — one strip: cash vs marks vs reports equity languages */}
      <p
        className="text-[11px] leading-snug text-[var(--color-label-tertiary)]"
        data-testid="reports-money-glossary"
      >
        <span className="font-medium text-[var(--color-label-secondary)]">
          Money words:
        </span>{" "}
        <strong className="font-medium text-[var(--color-label-secondary)]">
          Starting capital
        </strong>{" "}
        is this book&apos;s starting balance (Accounts &amp; Capital).{" "}
        <strong className="font-medium text-[var(--color-label-secondary)]">
          Balance / equity
        </strong>{" "}
        here is starting + closed outcomes (not live cash).{" "}
        <strong className="font-medium text-[var(--color-label-secondary)]">
          Positions
        </strong>{" "}
        uses live marks (age shown on Positions). Cash balance lives under
        Accounts &amp; Capital.
      </p>
      {dateFilterActive && book.tradeCount === 0 && (
        <EmptyPeriodNotice
          periodLabel={periodLabel}
          accountLabel={accountId !== "all" ? accountLabel : null}
          variant="outcomes"
          onShowAllTime={() => setGranularity("all")}
          testId="reports-empty-period"
        />
      )}
      {/* Main: stats | charts — scope is only the context controls above */}
      <div className="grid gap-5 lg:grid-cols-[minmax(17rem,22rem)_1fr] lg:items-stretch">
        <StatsTable
          stats={book.stats}
          startingCapital={capital}
          onCapital={onCapital}
        />

        <div className="flex min-h-0 min-w-0 flex-col gap-4">
          <section className="surface-card flex min-h-0 flex-1 flex-col border border-[var(--color-separator)] p-4 sm:p-5">
            <div className="mb-3 flex shrink-0 flex-wrap items-baseline justify-between gap-2">
              <h2
                className="font-semibold text-[var(--color-label)]"
                style={{ fontSize: "var(--text-headline)" }}
              >
                Equity curve
              </h2>
              <span
                className="rounded-full bg-[var(--color-fill)] px-3 py-1 text-xs font-semibold tabular-nums text-[var(--color-label)]"
                data-testid="reports-equity-context"
                title={
                  dateFilterActive && fullBookEndBalance != null
                    ? `${periodLabel} window balance vs full book`
                    : "Ending balance (starting capital + closed outcomes)"
                }
              >
                {dateFilterActive && fullBookEndBalance != null ? (
                  <>
                    <span className="font-medium text-[var(--color-label-secondary)]">
                      {periodLabel}
                    </span>{" "}
                    <span>{formatEquityContextMoney(book.endBalance)}</span>
                    <span className="mx-1 text-[var(--color-label-tertiary)]">
                      :
                    </span>
                    <span>{formatEquityContextMoney(fullBookEndBalance)}</span>
                  </>
                ) : (
                  book.stats.find((s) => s.key === "balance")?.value
                )}
              </span>
            </div>
            <div className="min-h-[280px] flex-1">
              <EquityChart
                series={book.series}
                height={480}
                highlightTradeId={highlightTradeId}
                periodLabel={periodLabel}
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
              <h2
                className="font-semibold text-[var(--color-label)]"
                style={{ fontSize: "var(--text-headline)" }}
              >
                Drawdown
              </h2>
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

      <section className="surface-card border border-[var(--color-separator)] p-4 sm:p-5">
        <BarDist bins={book.distribution} title="Outcome distribution" dense />
      </section>

      {/* Ratio magnifiers only (not aggregates like Total Return / Balance).
          Row 1: outcome asymmetry · entry R2R · drawdown
          Row 2: Sharpe · win rate · profit factor */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AvgWinLossCard
          avgWin={book.avgWin}
          avgLoss={book.avgLoss}
          ratio={book.winLossRatio}
          winners={book.winners}
          losers={book.losers}
        />
        <AvgR2rCard
          avgEntryR2r={book.avgEntryR2r}
          sampleSize={book.entryR2rSampleSize}
        />
        <DrawdownCard
          maxDrawdownPct={book.maxDrawdownPct}
          hasPnlData={book.hasPnlData}
          series={book.series}
        />
        <SharpeCard
          sharpe={book.sharpe}
          sampleSize={book.sharpeSampleSize}
        />
        <WinRateCard
          winRatePct={book.winRatePct}
          winners={book.winners}
          losers={book.losers}
        />
        <ProfitFactorCard
          profitFactor={book.profitFactor}
          hasPnlData={book.hasPnlData}
        />
      </div>

      <section className="surface-card border border-[var(--color-separator)] p-4 sm:p-5">
        <BarDist bins={book.strategyDist} title="Trades by strategy" />
      </section>
    </div>
  );
}
