"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import type { Trade } from "@/lib/tradeLog";
import { formatQtyEffect } from "@/lib/tradeLog";
import {
  dayBookBadge,
  type DayBook,
  type DayBookItem,
} from "@/lib/journalDayBook";
import { formatLong } from "./dateUtils";

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

export function DayPanel({
  selected,
  onOpen,
  itemCount,
  openCount,
  closedCount,
  openedCount,
}: {
  selected: Date;
  onOpen: () => void;
  itemCount: number;
  openCount: number;
  closedCount: number;
  openedCount: number;
}) {
  let blurb = "Open the day to start a journal entry or review the trade book.";
  if (itemCount > 0) {
    const parts: string[] = [];
    if (openCount > 0) {
      parts.push(`${openCount} open`);
    }
    if (openedCount > 0) {
      parts.push(`${openedCount} opened`);
    }
    if (closedCount > 0) {
      parts.push(`${closedCount} closed`);
    }
    blurb =
      (parts.length > 0 ? parts.join(" · ") : `${itemCount} on the book`) +
      " · open day for journal entries";
  }
  return (
    <div className="surface-card flex flex-wrap items-start justify-between gap-3 border border-[var(--color-separator)] px-4 py-4 sm:px-5">
      <div className="min-w-0">
        <p
          className="font-semibold text-[var(--color-label)]"
          style={{ fontSize: "var(--text-headline)" }}
        >
          {formatLong(selected)}
        </p>
        <p
          className="mt-1 text-[var(--color-label-secondary)]"
          style={{ fontSize: "var(--text-subheadline)" }}
        >
          {blurb}
        </p>
      </div>
      <Button type="button" variant="secondary" className="shrink-0" onClick={onOpen}>
        Open
      </Button>
    </div>
  );
}

export function TradeRow({
  item,
  badge,
}: {
  item: DayBookItem;
  badge: string;
}) {
  const t = item.trade;
  const time = t.exec_at ? t.exec_at.replace("T", " ").slice(11, 16) : "";
  const isClose = item.role === "fill_close";
  const isOpenPos = item.role === "open";
  const logHref = `/app/trade-log?id=${t.id}`;
  const chartHref = `/app/reports?trade=${t.id}`;

  function go(e: React.MouseEvent) {
    // Option/Alt-click → equity chart at this trade; plain click → Trade Log selected
    if (e.altKey) {
      e.preventDefault();
      window.location.href = chartHref;
    }
    // plain / ⌘-click: follow logHref (same tab or new tab)
  }

  return (
    <li>
      <a
        href={logHref}
        onClick={go}
        title="Open in Trade Log · Option-click: show on equity curve"
        className={[
          "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-2.5 text-sm transition-colors",
          "bg-[var(--color-surface)] hover:bg-[var(--color-fill)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
        ].join(" ")}
      >
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
        {!isOpenPos && time && (
          <span className="tabular-nums text-[var(--color-label-tertiary)]">
            {time}
          </span>
        )}
        {isOpenPos && (
          <span className="text-[var(--color-label-tertiary)]">
            opened {item.opened_on}
            {item.expires_on ? ` · exp ${item.expires_on}` : ""}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[var(--color-label-secondary)]">
          {tradeSummaryLine(t)}
        </span>
        <span className="ml-auto font-medium tabular-nums text-[var(--color-label)]">
          {tradeNetLabel(t)}
        </span>
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
