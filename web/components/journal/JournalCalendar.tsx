"use client";

/**
 * Journal calendar suite — Year · Month · Week · Day.
 * Day trades panel extracted (PH2-3); date helpers in dateUtils.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { createRetrospective } from "@/lib/retrospectiveApi";
import {
  dayBookFromServer,
  emptyDayBook,
  ymdLocal,
  type DayBook,
} from "@/lib/journalDayBook";
import { fetchDayBook, fetchDaysInterest } from "@/lib/tradeLogApi";
import DayTradesPanel, { DayPanel } from "./DayTradesPanel";
import {
  addDays,
  formatDayTitle,
  formatLong,
  monthCells,
  monthTitle,
  sameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  weekTitle,
  ymd,
} from "./dateUtils";

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
  "Retrospective",
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

const navBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-label-secondary)] shadow-[var(--elevation-1)] transition-colors hover:bg-[var(--color-fill)] hover:text-[var(--color-label)] sm:min-h-9 sm:min-w-9";

const tileBase =
  "bg-[var(--color-surface)] shadow-[var(--elevation-1)] rounded-[var(--radius-md)]";

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
  retroBusy = false,
  retroErr = null,
}: {
  selected: Date;
  draft: string;
  onDraft: (v: string) => void;
  onPrompt: (label: string) => void;
  book: DayBook;
  tradesLoadState: "loading" | "ok" | "anon" | "forbidden" | "err";
  onRetryTrades: () => void;
  retroBusy?: boolean;
  retroErr?: string | null;
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
              disabled={label === "Retrospective" && retroBusy}
              className={[
                "chip min-h-9 px-3.5 text-sm font-medium text-[var(--color-label)]",
                label === "Retrospective"
                  ? "border-[var(--color-tint)] text-[var(--color-tint)]"
                  : "",
              ].join(" ")}
            >
              {label === "Retrospective" && retroBusy
                ? "Starting retrospective…"
                : label}
            </button>
          ))}
        </div>
        {retroErr && (
          <p className="mt-3 text-center text-sm text-red-600" role="alert">
            {retroErr}
          </p>
        )}
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
  const router = useRouter();
  const today = useMemo(() => startOfDay(new Date()), []);

  const [view, setView] = useState<ViewMode>("month");
  const [selected, setSelected] = useState<Date>(() => startOfDay(new Date()));
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [draft, setDraft] = useState("");
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [retroBusy, setRetroBusy] = useState(false);
  const [retroErr, setRetroErr] = useState<string | null>(null);
  const [dayBook, setDayBook] = useState<DayBook>(() =>
    emptyDayBook(ymdLocal(new Date())),
  );
  const [daysWithTrades, setDaysWithTrades] = useState<Set<string>>(
    () => new Set(),
  );
  const [tradesLoadState, setTradesLoadState] =
    useState<TradesLoadState>("loading");

  const selectedYmd = useMemo(() => ymdLocal(selected), [selected]);

  const loadDayBook = useCallback(async () => {
    setTradesLoadState("loading");
    try {
      const res = await fetchDayBook(selectedYmd);
      if (!res.ok) {
        setTradesLoadState(
          res.error.kind === "err" ? "err" : res.error.kind,
        );
        setDayBook(emptyDayBook(selectedYmd));
        return;
      }
      setDayBook(dayBookFromServer(res.data));
      setTradesLoadState("ok");
    } catch {
      setTradesLoadState("err");
      setDayBook(emptyDayBook(selectedYmd));
    }
  }, [selectedYmd]);

  // Calendar dots must cover Trade Log history (e.g. 2022+), not only last/next year.
  // Previously only [today.year-1, today.year+1] was requested — older fills never dotted.
  const loadDaysInterest = useCallback(async () => {
    const years = [
      today.getFullYear(),
      cursor.getFullYear(),
      selected.getFullYear(),
    ];
    const fromYear = Math.min(...years) - 15; // wide enough for multi-year books
    const toYear = Math.max(...years) + 1;
    const fromDay = `${fromYear}-01-01`;
    const toDay = `${toYear}-12-31`;
    try {
      const res = await fetchDaysInterest(fromDay, toDay);
      if (!res.ok) {
        if (res.error.kind === "anon" || res.error.kind === "forbidden") {
          setTradesLoadState(res.error.kind);
        }
        setDaysWithTrades(new Set());
        return;
      }
      setDaysWithTrades(new Set(res.data.days || []));
    } catch {
      setDaysWithTrades(new Set());
    }
  }, [today, cursor, selected]);

  useEffect(() => {
    loadDaysInterest();
  }, [loadDaysInterest]);

  useEffect(() => {
    loadDayBook();
  }, [loadDayBook]);

  const weekStart = useMemo(() => startOfWeek(selected), [selected]);
  const year = cursor.getFullYear();

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

  async function onPrompt(label: string) {
    if (label === "Retrospective") {
      // Spec v0.2: Journal type = Retrospective starts gather workspace
      setRetroErr(null);
      setRetroBusy(true);
      try {
        const r = await createRetrospective({ gather: true });
        router.push(`/app/retrospective/${r.id}`);
      } catch (e) {
        setRetroErr(e instanceof Error ? e.message : "Could not start retrospective");
        setRetroBusy(false);
      }
      return;
    }
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
            onRetryTrades={loadDayBook}
            retroBusy={retroBusy}
            retroErr={retroErr}
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
