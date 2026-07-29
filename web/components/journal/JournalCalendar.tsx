"use client";

/**
 * Journal calendar suite — Year · Month · Week · Day (Coach mockups).
 * Day panel lists Trade Log fills for the selected date (Vexy session later).
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import type { Trade } from "@/lib/tradeLog";
import { formatQtyEffect } from "@/lib/tradeLog";
import {
  buildDayBook,
  dayBookBadge,
  daysWithBookInterest,
  type DayBookItem,
} from "@/lib/journalDayBook";

type ViewMode = "year" | "month" | "week" | "day";

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "year", label: "Year" },
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
];

/** Week bands — process day structure (mockup). */
const WEEK_BANDS = [
  { id: "gx", label: "GX" },
  { id: "am", label: "AM" },
  { id: "pm", label: "PM" },
  { id: "cl", label: "CL" },
] as const;

/** Day-view entry prompts (process-first, not P&L). */
const DAY_PROMPTS = [
  "End of Day",
  "Trade Reflection",
  "Pre-Market",
  "Deep Dive",
  "Lessons",
] as const;

const DOW_SHORT = ["M", "T", "W", "T", "F", "S", "S"] as const;
const DOW_WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Monday-first start of week containing d. */
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const monOffset = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - monOffset);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatLong(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDayTitle(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function monthTitle(d: Date) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function weekTitle(weekStart: Date) {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${weekStart.toLocaleDateString(undefined, { month: "short" })} ${weekStart.getDate()} – ${end.getDate()}`;
  }
  return `${weekStart.toLocaleDateString(undefined, { month: "short" })} ${weekStart.getDate()} – ${end.toLocaleDateString(undefined, { month: "short" })} ${end.getDate()}`;
}

function monthCells(year: number, month: number): (Date | null)[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const navBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-label-secondary)] shadow-[var(--elevation-1)] transition-colors hover:bg-[var(--color-fill)] hover:text-[var(--color-label)] sm:min-h-9 sm:min-w-9";

const tileBase =
  "bg-[var(--color-surface)] shadow-[var(--elevation-1)] rounded-[var(--radius-md)]";

function tradeSummaryLine(t: Trade): string {
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

function tradeNetLabel(t: Trade): string {
  if (t.net_price == null) return "—";
  const side = t.net_side ? ` ${t.net_side}` : "";
  const sign = t.net_side === "CREDIT" ? "+" : "";
  return `${sign}${Number(t.net_price).toFixed(2)}${side}`;
}

function DayPanel({
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
  let blurb = "No entries on this day.";
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
      " · no journal entries yet";
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

function TradeRow({
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

function DayTradesPanel({
  book,
  loadState,
  onRetry,
}: {
  book: ReturnType<typeof buildDayBook>;
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

function MonthGrid({
  year,
  month,
  selected,
  today,
  onSelect,
  compact = false,
  daysWithTrades,
}: {
  year: number;
  month: number;
  selected: Date;
  today: Date;
  onSelect: (d: Date) => void;
  compact?: boolean;
  daysWithTrades?: Set<string>;
}) {
  const cells = monthCells(year, month);
  return (
    <div>
      {!compact && (
        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium text-[var(--color-label-tertiary)]">
          {DOW_SHORT.map((d, i) => (
            <div key={`${d}-${i}`}>{d}</div>
          ))}
        </div>
      )}
      {compact && (
        <div className="mb-0.5 grid grid-cols-7 gap-px text-center text-[9px] font-medium text-[var(--color-label-tertiary)]">
          {DOW_SHORT.map((d, i) => (
            <div key={`${d}-${i}`}>{d}</div>
          ))}
        </div>
      )}
      <div
        className={
          // Every cell must share the same box model. Empty pads used
          // aspect-square while day tiles only had min-height → middle
          // weeks (no pads) looked squished vs first/last weeks.
          compact
            ? "grid grid-cols-7 gap-0.5"
            : "grid grid-cols-7 gap-2.5 [grid-auto-rows:1fr]"
        }
      >
        {cells.map((day, i) => {
          if (!day) {
            return (
              <div
                key={`e-${year}-${month}-${i}`}
                className={
                  compact
                    ? "aspect-square"
                    : "aspect-square w-full min-h-0"
                }
                aria-hidden
              />
            );
          }
          const isSelected = sameDay(day, selected);
          const isToday = sameDay(day, today);
          const hasTrades = daysWithTrades?.has(ymd(day)) ?? false;
          if (compact) {
            return (
              <button
                key={ymd(day)}
                type="button"
                onClick={() => onSelect(day)}
                className={[
                  "relative aspect-square w-full rounded-[2px] transition-colors",
                  "bg-[var(--color-fill)]/80",
                  isSelected
                    ? "ring-1 ring-[var(--color-label)] ring-offset-0 bg-[var(--color-surface)]"
                    : isToday
                      ? "bg-[var(--color-tint-soft)]"
                      : "",
                  hasTrades && !isSelected ? "bg-[var(--color-tint-soft)]" : "",
                ].join(" ")}
                aria-label={formatLong(day)}
                aria-pressed={isSelected}
              />
            );
          }
          return (
            <button
              key={ymd(day)}
              type="button"
              onClick={() => onSelect(day)}
              className={[
                // Same aspect-square as empty pads so every week row is equal.
                "relative flex aspect-square w-full min-h-0 flex-col items-center justify-center rounded-[var(--radius-lg)] text-sm font-medium transition-shadow",
                tileBase,
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
                isSelected
                  ? "ring-2 ring-[var(--color-tint)] text-[var(--color-tint)]"
                  : isToday
                    ? "text-[var(--color-tint)]"
                    : "text-[var(--color-label)]",
                "hover:brightness-[0.99]",
              ].join(" ")}
              aria-label={
                hasTrades
                  ? `${formatLong(day)}, has trades`
                  : formatLong(day)
              }
              aria-pressed={isSelected}
            >
              {day.getDate()}
              {hasTrades && (
                <span
                  className="absolute bottom-[12%] h-1.5 w-1.5 rounded-full bg-[var(--color-tint)]"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YearView({
  year,
  selected,
  today,
  onSelect,
  daysWithTrades,
}: {
  year: number;
  selected: Date;
  today: Date;
  onSelect: (d: Date) => void;
  daysWithTrades?: Set<string>;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {MONTH_SHORT.map((label, month) => (
        <div key={label}>
          <p className="mb-1.5 text-sm font-semibold text-[var(--color-label)]">
            {label}
          </p>
          <MonthGrid
            year={year}
            month={month}
            selected={selected}
            today={today}
            onSelect={onSelect}
            compact
            daysWithTrades={daysWithTrades}
          />
        </div>
      ))}
    </div>
  );
}

function WeekView({
  weekStart,
  selected,
  today,
  onSelect,
}: {
  weekStart: Date;
  selected: Date;
  today: Date;
  onSelect: (d: Date) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    // Horizontal scroll can clip Y overflow (rings/shadows). Pad inside so the
    // last band (CL) and selection chrome fully paint before the day panel.
    <div className="overflow-x-auto px-1 pb-5 pt-1">
      <div className="min-w-[640px]">
        {/* Day headers */}
        <div className="mb-3 grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] gap-2">
          <div />
          {days.map((d, i) => {
            const isSelected = sameDay(d, selected);
            const isToday = sameDay(d, today);
            return (
              <button
                key={ymd(d)}
                type="button"
                onClick={() => onSelect(d)}
                className="text-center"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  {DOW_WEEK[i]}
                </div>
                <div
                  className={[
                    "mt-0.5 text-lg font-semibold tabular-nums",
                    isSelected || isToday
                      ? "text-[var(--color-tint)]"
                      : "text-[var(--color-label)]",
                  ].join(" ")}
                >
                  {d.getDate()}
                </div>
                {isSelected && (
                  <div className="mx-auto mt-1 h-0.5 w-8 rounded-full bg-[var(--color-tint)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Session bands × days */}
        <div className="space-y-2.5 pb-1">
          {WEEK_BANDS.map((band) => (
            <div
              key={band.id}
              className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] gap-2"
            >
              <div className="flex items-center text-[11px] font-semibold text-[var(--color-label-tertiary)]">
                {band.label}
              </div>
              {days.map((d) => {
                const isSelected = sameDay(d, selected);
                return (
                  <button
                    key={`${band.id}-${ymd(d)}`}
                    type="button"
                    onClick={() => onSelect(d)}
                    className={[
                      "min-h-[3.5rem] rounded-[var(--radius-md)] transition-shadow",
                      tileBase,
                      isSelected
                        ? "ring-2 ring-[var(--color-tint)] ring-offset-2 ring-offset-[var(--color-canvas)]"
                        : "hover:brightness-[0.99]",
                    ].join(" ")}
                    aria-label={`${band.label} ${formatLong(d)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DayView({
  selected,
  draft,
  onDraft,
  onPrompt,
  book,
  tradesLoadState,
  onRetryTrades,
}: {
  selected: Date;
  draft: string;
  onDraft: (v: string) => void;
  onPrompt: (label: string) => void;
  book: ReturnType<typeof buildDayBook>;
  tradesLoadState: "loading" | "ok" | "anon" | "forbidden" | "err";
  onRetryTrades: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Session shell for Vexy (agent wiring later) */}
      <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface-secondary)] px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {DAY_PROMPTS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onPrompt(label)}
              className="chip min-h-9 px-3.5 text-sm font-medium text-[var(--color-label)]"
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-center">
          <button
            type="button"
            className="text-sm text-[var(--color-label-secondary)] underline underline-offset-2 hover:text-[var(--color-label)]"
            onClick={() => onPrompt("Manual")}
          >
            Write manually
          </button>
        </p>

        <div className="relative mt-5">
          <textarea
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            rows={5}
            placeholder="Tell Vexy about your day, a trade, or what's on your mind…"
            className="w-full resize-y rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-4 py-3 pr-24 text-sm text-[var(--color-label)] shadow-[var(--elevation-1)] placeholder:text-[var(--color-label-tertiary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
            aria-label="Message to Vexy"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-label-tertiary)]"
              title="Voice input — with Vexy"
              aria-label="Voice input"
              disabled
            >
              <MicIcon />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-fill)] text-[var(--color-label-secondary)] disabled:opacity-40"
              title="Send — Vexy session later"
              aria-label="Send"
              disabled={!draft.trim()}
              onClick={() => {
                /* Vexy session later */
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--color-label-tertiary)]">
          No journal entries for this day yet.
        </p>
      </div>

      <DayTradesPanel
        book={book}
        loadState={tradesLoadState}
        onRetry={onRetryTrades}
      />
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M5 11a7 7 0 0014 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M12 5l-6 6M12 5l6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type TradesLoadState = "loading" | "ok" | "anon" | "forbidden" | "err";

export default function JournalCalendar() {
  const today = useMemo(() => startOfDay(new Date()), []);

  const [view, setView] = useState<ViewMode>("month");
  const [selected, setSelected] = useState<Date>(() => startOfDay(new Date()));
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [draft, setDraft] = useState("");
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [tradesLoadState, setTradesLoadState] =
    useState<TradesLoadState>("loading");

  const loadTrades = useCallback(() => {
    setTradesLoadState("loading");
    fetch("/api/me/trade-log/trades", { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) {
          setTradesLoadState("anon");
          setAllTrades([]);
          return;
        }
        if (r.status === 403) {
          setTradesLoadState("forbidden");
          setAllTrades([]);
          return;
        }
        if (!r.ok) {
          setTradesLoadState("err");
          setAllTrades([]);
          return;
        }
        const data = await r.json();
        setAllTrades((data.trades || []) as Trade[]);
        setTradesLoadState("ok");
      })
      .catch(() => {
        setTradesLoadState("err");
        setAllTrades([]);
      });
  }, []);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const weekStart = useMemo(() => startOfWeek(selected), [selected]);
  const year = cursor.getFullYear();
  const dayBook = useMemo(
    () => buildDayBook(allTrades, selected),
    [allTrades, selected],
  );
  const daysWithTrades = useMemo(() => {
    // Interest range: ~2 years around today for calendar dots (open span + fills)
    const y = today.getFullYear();
    return daysWithBookInterest(
      allTrades,
      `${y - 1}-01-01`,
      `${y + 1}-12-31`,
    );
  }, [allTrades, today]);

  function setViewAndSync(v: ViewMode) {
    setView(v);
    if (v === "month") setCursor(startOfMonth(selected));
    if (v === "year") setCursor(new Date(selected.getFullYear(), 0, 1));
  }

  function shift(delta: number) {
    if (view === "year") {
      setCursor((c) => new Date(c.getFullYear() + delta, 0, 1));
      setSelected((s) => new Date(s.getFullYear() + delta, s.getMonth(), s.getDate()));
      return;
    }
    if (view === "month") {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
      return;
    }
    if (view === "week") {
      const next = addDays(selected, delta * 7);
      setSelected(next);
      setCursor(startOfMonth(next));
      return;
    }
    // day
    const next = addDays(selected, delta);
    setSelected(next);
    setCursor(startOfMonth(next));
    setDraft("");
    setActivePrompt(null);
  }

  function goToday() {
    const t = startOfDay(new Date());
    setSelected(t);
    setCursor(startOfMonth(t));
    setDraft("");
    setActivePrompt(null);
  }

  function selectDay(d: Date) {
    const x = startOfDay(d);
    setSelected(x);
    setCursor(startOfMonth(x));
  }

  function openDay() {
    setView("day");
    setDraft("");
    setActivePrompt(null);
  }

  function onPrompt(label: string) {
    setActivePrompt(label);
    if (label !== "Manual" && !draft.trim()) {
      setDraft(`${label}: `);
    }
  }

  const title: ReactNode =
    view === "year" ? (
      year
    ) : view === "month" ? (
      monthTitle(cursor)
    ) : view === "week" ? (
      weekTitle(weekStart)
    ) : (
      formatDayTitle(selected)
    );

  const prevLabel =
    view === "year"
      ? "Previous year"
      : view === "month"
        ? "Previous month"
        : view === "week"
          ? "Previous week"
          : "Previous day";
  const nextLabel =
    view === "year"
      ? "Next year"
      : view === "month"
        ? "Next month"
        : view === "week"
          ? "Next week"
          : "Next day";

  return (
    <div
      className="mt-6 flex flex-col gap-6"
      data-testid="journal-calendar"
      data-view={view}
    >
      {/* Controls: view · period · today */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex rounded-full bg-[var(--color-fill)] p-0.5"
          role="group"
          aria-label="Calendar view"
        >
          {VIEWS.map((v) => {
            const on = view === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setViewAndSync(v.id)}
                className={[
                  "min-h-8 rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  on
                    ? "bg-[var(--color-tint)] text-[var(--color-on-tint)] shadow-sm"
                    : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
                ].join(" ")}
                aria-pressed={on}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className={navBtn}
            onClick={() => shift(-1)}
            aria-label={prevLabel}
          >
            <span className="text-lg leading-none" aria-hidden>
              ‹
            </span>
          </button>
          <h2
            className="min-w-[10rem] text-center font-semibold text-[var(--color-label)]"
            style={{ fontSize: "var(--text-headline)" }}
          >
            {title}
          </h2>
          <button
            type="button"
            className={navBtn}
            onClick={() => shift(1)}
            aria-label={nextLabel}
          >
            <span className="text-lg leading-none" aria-hidden>
              ›
            </span>
          </button>
        </div>

        <Button type="button" variant="secondary" onClick={goToday}>
          Today
        </Button>
      </div>

      {/* Work surface — extra bottom pad so last tile row + selection ring clear the panel */}
      <div className="min-w-0 pb-1">
        {view === "year" && (
          <YearView
            year={year}
            selected={selected}
            today={today}
            onSelect={selectDay}
            daysWithTrades={daysWithTrades}
          />
        )}

        {view === "month" && (
          <div className="overflow-x-auto overflow-y-visible px-0.5 pb-3 pt-0.5">
            <div className="min-w-[320px]">
              <MonthGrid
                year={cursor.getFullYear()}
                month={cursor.getMonth()}
                selected={selected}
                today={today}
                onSelect={selectDay}
                daysWithTrades={daysWithTrades}
              />
            </div>
          </div>
        )}

        {view === "week" && (
          <div className="pb-3">
            <WeekView
              weekStart={weekStart}
              selected={selected}
              today={today}
              onSelect={selectDay}
            />
          </div>
        )}

        {view === "day" && (
          <DayView
            selected={selected}
            draft={draft}
            onDraft={setDraft}
            onPrompt={onPrompt}
            book={dayBook}
            tradesLoadState={tradesLoadState}
            onRetryTrades={loadTrades}
          />
        )}
      </div>

      {view !== "day" && (
        <div className="mt-1 shrink-0">
          <DayPanel
            selected={selected}
            onOpen={openDay}
            itemCount={dayBook.items.length}
            openCount={
              dayBook.items.filter(
                (i) => i.role === "open" && i.opened_on !== dayBook.day,
              ).length
            }
            openedCount={
              dayBook.items.filter(
                (i) =>
                  (i.role === "open" || i.role === "fill_open") &&
                  i.opened_on === dayBook.day,
              ).length
            }
            closedCount={
              dayBook.items.filter((i) => i.role === "fill_close").length
            }
          />
        </div>
      )}

      {activePrompt && view === "day" && (
        <p className="sr-only" aria-live="polite">
          Prompt: {activePrompt}
        </p>
      )}
    </div>
  );
}
