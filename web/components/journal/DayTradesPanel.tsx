"use client";

import Link from "next/link";
import type { Trade } from "@/lib/tradeLog";
import { formatQtyEffect } from "@/lib/tradeLog";
import {
  dayBookBadge,
  type DayBook,
  type DayBookItem,
} from "@/lib/journalDayBook";

export function tradeSummaryLine(t: Trade): string {
  const legs = t.legs || [];
  const under =
    legs.find((l) => l.underlier)?.underlier ||
    legs.find((l) => l.symbol)?.symbol ||
    "—";
  const legBits = legs
    .slice(0, 3)
    .map((l) => formatQtyEffect(l))
    .join(" · ");
  const more = legs.length > 3 ? ` · +${legs.length - 3}` : "";
  return `${under}${legBits ? ` · ${legBits}${more}` : ""}`;
}

export function tradeNetLabel(t: Trade): string {
  if (t.net_price == null) return "—";
  const side = t.net_side ? ` ${t.net_side}` : "";
  const sign = t.net_side === "CREDIT" ? "+" : "";
  return `${sign}${Number(t.net_price).toFixed(2)}${side}`;
}

/** Spread width from option strikes (structural; Spec v0.6 §1.5). */
export function tradeSpreadWidth(t: Trade): number | null {
  const strikes = (t.legs || [])
    .map((l) => l.strike)
    .filter((s): s is number => s != null && Number.isFinite(s));
  if (strikes.length < 2) return null;
  const w = Math.max(...strikes) - Math.min(...strikes);
  return w > 0 ? w : null;
}

/**
 * Risk-to-reward from structure when Trade Log does not yet expose R2R (§17-4b).
 * Defined-risk credit: reward ≈ |net|, risk ≈ width − |net| (points).
 * Debit: risk ≈ |net|, reward ≈ width − |net|.
 * Returns null when not computable — never invent expectancy.
 */
export function tradeRiskReward(t: Trade): string | null {
  const width = tradeSpreadWidth(t);
  const net = t.net_price != null ? Math.abs(Number(t.net_price)) : null;
  if (width == null || net == null || net <= 0) return null;
  const side = (t.net_side || "").toUpperCase();
  if (side === "CREDIT") {
    const risk = width - net;
    if (risk <= 0) return null;
    return `1 : ${(net / risk).toFixed(2)}`;
  }
  if (side === "DEBIT") {
    const reward = width - net;
    if (reward <= 0) return null;
    return `1 : ${(reward / net).toFixed(2)}`;
  }
  return null;
}

function formatExec(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso.replace("T", " ").slice(0, 16);
    }
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return iso.slice(0, 16);
  }
}

export function TradeRow({
  item,
  badge,
}: {
  item: DayBookItem;
  badge: string;
}) {
  const t = item.trade;
  const isClose = item.role === "fill_close";
  const isOpenPos = item.role === "open";
  const logHref = `/app/trade-log?id=${t.id}`;
  const chartHref = `/app/reports?trade=${t.id}`;
  const width = tradeSpreadWidth(t);
  const r2r = tradeRiskReward(t);
  const entryLabel = formatExec(
    isOpenPos || item.role === "fill_open" ? t.exec_at : null,
  );
  // Entry from open day when available; exit on close fills
  const entry =
    item.role === "fill_close"
      ? item.opened_on
        ? `${item.opened_on}`
        : "—"
      : entryLabel !== "—"
        ? entryLabel
        : item.opened_on || "—";
  const exit =
    item.role === "fill_close"
      ? formatExec(t.exec_at)
      : isOpenPos
        ? "open"
        : "—";

  function go(e: React.MouseEvent) {
    if (e.altKey) {
      e.preventDefault();
      window.location.href = chartHref;
    }
  }

  return (
    <li>
      <a
        href={logHref}
        onClick={go}
        title="Open in Trade Log · Option-click: show on equity curve"
        className={[
          "flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-2.5 text-sm transition-colors",
          "bg-[var(--color-surface)] hover:bg-[var(--color-fill)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
        ].join(" ")}
        data-testid={`journal-trade-row-${t.id}`}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className={[
              "inline-block h-2 w-2 shrink-0 rounded-full",
              isClose
                ? "bg-[var(--color-destructive)]"
                : "bg-[var(--color-success)]",
            ].join(" ")}
            title={badge}
            aria-hidden
          />
          <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
            {badge}
          </span>
          <span className="font-semibold text-[var(--color-label)]">
            {t.strategy}
          </span>
          <span className="min-w-0 flex-1 truncate text-[var(--color-label-secondary)]">
            {tradeSummaryLine(t)}
          </span>
          <span className="ml-auto font-medium tabular-nums text-[var(--color-label)]">
            {tradeNetLabel(t)}
          </span>
        </div>
        {/* Spec v0.6 §1.5 — width · R2R · entry/exit (process, not P&L aggregates) */}
        <div
          className="flex flex-wrap gap-x-4 gap-y-0.5 pl-5 text-xs text-[var(--color-label-secondary)]"
          data-testid="journal-trade-structure"
        >
          <span>
            Width{" "}
            <span className="tabular-nums text-[var(--color-label)]">
              {width != null ? width.toFixed(width % 1 ? 1 : 0) : "—"}
            </span>
          </span>
          <span>
            R:R{" "}
            <span className="tabular-nums text-[var(--color-label)]">
              {r2r ?? "—"}
            </span>
          </span>
          <span>
            Entry{" "}
            <span className="tabular-nums text-[var(--color-label)]">
              {entry}
            </span>
          </span>
          <span>
            Exit{" "}
            <span className="tabular-nums text-[var(--color-label)]">
              {exit}
            </span>
          </span>
        </div>
      </a>
    </li>
  );
}

export default function DayTradesPanel({
  book,
  loadState,
  onRetry,
}: {
  book: DayBook;
  loadState: "loading" | "ok" | "anon" | "forbidden" | "err";
  onRetry: () => void;
}) {
  const n = book.items.length;
  const openN = book.items.filter(
    (i) => i.role === "open" && i.opened_on !== book.day,
  ).length;
  const openedN = book.items.filter(
    (i) =>
      (i.role === "open" || i.role === "fill_open") && i.opened_on === book.day,
  ).length;
  const closedN = book.items.filter((i) => i.role === "fill_close").length;

  return (
    <section data-testid="journal-day-trades" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-separator)] pb-2">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label)]">
            Trades on this day
          </h3>
          <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
            Opened, closed, or still open · click → Trade Log · Option-click →
            equity chart
          </p>
        </div>
        <span className="text-sm tabular-nums text-[var(--color-label-tertiary)]">
          {loadState === "loading"
            ? "…"
            : n > 0
              ? [
                  openN > 0 ? `${openN} open` : null,
                  openedN > 0 ? `${openedN} opened` : null,
                  closedN > 0 ? `${closedN} closed` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || `${n}`
              : "0 trades"}
        </span>
      </div>

      {loadState === "loading" && (
        <p className="text-sm text-[var(--color-label-tertiary)]">
          Loading Trade Log…
        </p>
      )}

      {loadState === "anon" && (
        <p className="text-sm text-[var(--color-label-secondary)]">
          <Link href="/login" className="font-medium text-[var(--color-tint)]">
            Sign in
          </Link>{" "}
          to see Trade Log context for this day.
        </p>
      )}

      {loadState === "forbidden" && (
        <p className="text-sm text-[var(--color-label-secondary)]">
          Trade Log requires Activator membership.{" "}
          <Link href="/membership" className="text-[var(--color-tint)]">
            View membership
          </Link>
        </p>
      )}

      {loadState === "err" && (
        <p className="text-sm text-[var(--color-label-secondary)]">
          Could not load trades.{" "}
          <button
            type="button"
            className="font-medium text-[var(--color-tint)] underline"
            onClick={onRetry}
          >
            Retry
          </button>
        </p>
      )}

      {loadState === "ok" && n === 0 && (
        <>
          <p className="text-sm text-[var(--color-label-secondary)]">
            No trades opened, closed, or still open on this date.
          </p>
          <p className="text-xs text-[var(--color-label-tertiary)]">
            From{" "}
            <Link href="/app/trade-log" className="text-[var(--color-tint)]">
              Trade Log
            </Link>
            : longer-dated opens stay listed until closed or past expiry.
          </p>
        </>
      )}

      {loadState === "ok" && n > 0 && (
        <>
          <ul className="space-y-2">
            {book.items.map((item) => (
              <TradeRow
                key={`${item.role}-${item.trade.id}`}
                item={item}
                badge={dayBookBadge(item, book.day)}
              />
            ))}
          </ul>
          <p className="text-xs text-[var(--color-label-tertiary)]">
            <strong className="font-medium text-[var(--color-label-secondary)]">
              Open
            </strong>{" "}
            = still live ·{" "}
            <strong className="font-medium text-[var(--color-label-secondary)]">
              Opened
            </strong>{" "}
            /{" "}
            <strong className="font-medium text-[var(--color-label-secondary)]">
              Closed
            </strong>{" "}
            = executed this calendar day. Source:{" "}
            <Link href="/app/trade-log" className="text-[var(--color-tint)]">
              Trade Log
            </Link>
            .
          </p>
        </>
      )}
    </section>
  );
}
