"use client";

/**
 * Reports dashboard shell — charts/cards live in sibling modules (PH2-4).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import type { Account } from "@/lib/tradeLog";
import {
  accountPages,
  loadStartingCapital,
  reportsBookFromServer,
  saveStartingCapital,
  type ReportsBook,
} from "@/lib/reportsBook";
import { fetchAccounts, fetchReportsBook } from "@/lib/tradeLogApi";
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
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [book, setBook] = useState<ReportsBook | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [capital, setCapital] = useState(50000);

  useEffect(() => {
    setCapital(loadStartingCapital(50000));
  }, []);

  const pages = useMemo(() => accountPages(accounts), [accounts]);
  const safeIdx = Math.min(pageIdx, Math.max(0, pages.length - 1));
  const page = pages[safeIdx] || pages[0];
  const filter: number | "all" = page?.kind === "one" ? page.id : "all";

  const loadAccounts = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const res = await fetchAccounts();
      if (!res.ok) {
        setState(res.error.kind === "err" ? "err" : res.error.kind);
        if (res.error.kind === "err") setError(res.error.message);
        setAccounts([]);
        setBook(null);
        return;
      }
      setAccounts(res.data.accounts || []);
      setState("ok");
    } catch (e) {
      setState("err");
      setError(e instanceof Error ? e.message : String(e));
      setAccounts([]);
      setBook(null);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Server domain read model — re-fetch when account filter or capital changes
  useEffect(() => {
    if (state !== "ok") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchReportsBook({
          accountId: filter,
          startingCapital: capital,
        });
        if (cancelled) return;
        if (!res.ok) {
          if (res.error.kind === "anon" || res.error.kind === "forbidden") {
            setState(res.error.kind);
            setBook(null);
            return;
          }
          setError(res.error.message);
          setBook(null);
          return;
        }
        setError(null);
        setBook(reportsBookFromServer(res.data));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setBook(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, filter, capital]);

  function onCapital(n: number) {
    setCapital(n);
    saveStartingCapital(n);
  }

  const load = loadAccounts;

  function shiftPage(delta: number) {
    setPageIdx((i) => {
      const next = i + delta;
      if (next < 0) return pages.length - 1;
      if (next >= pages.length) return 0;
      return next;
    });
  }

  if (state === "loading") {
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
  if (state === "err") {
    return (
      <div className="mt-8 text-sm">
        Could not load.{" "}
        <button type="button" className="text-[var(--color-tint)] underline" onClick={load}>
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
      {/* Account pager — HIG secondary controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className="font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]"
            style={{ fontSize: "var(--text-caption)" }}
          >
            Account
          </p>
          <p
            className="font-semibold text-[var(--color-label)]"
            style={{ fontSize: "var(--text-headline)" }}
          >
            {book.accountLabel}
          </p>
        </div>
        {pages.length > 1 && (
          <div
            className="inline-flex items-center gap-1 rounded-full bg-[var(--color-fill)] p-1"
            role="group"
            aria-label="Account page"
          >
            <Button
              type="button"
              variant="plain"
              className="!min-h-9 !rounded-full !px-3"
              onClick={() => shiftPage(-1)}
              aria-label="Previous account"
            >
              ‹
            </Button>
            <span className="min-w-[4.5rem] text-center text-sm tabular-nums text-[var(--color-label-secondary)]">
              {safeIdx + 1} / {pages.length}
            </span>
            <Button
              type="button"
              variant="plain"
              className="!min-h-9 !rounded-full !px-3"
              onClick={() => shiftPage(1)}
              aria-label="Next account"
            >
              ›
            </Button>
          </div>
        )}
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
