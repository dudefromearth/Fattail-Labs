"use client";

/**
 * Journal calendar suite — Year · Month · Week · Day.
 * Day trades panel extracted (PH2-3); date helpers in dateUtils.
 */

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui";
import { createRetrospective } from "@/lib/retrospectiveApi";
import {
  createJournalSession,
  fetchWeekActivity,
  getJournalSession,
  listJournalClosures,
  listJournalSessions,
  postAgentTurn,
  postJournalMessage,
  type JournalSession,
  type WeekBandId,
  type WeekDayActivity,
} from "@/lib/journalSessionApi";
import {
  dayBookFromServer,
  emptyDayBook,
  ymdLocal,
  type DayBook,
} from "@/lib/journalDayBook";
import { fetchDayBook, fetchDaysInterest } from "@/lib/tradeLogApi";
import DayTradesPanel from "./DayTradesPanel";
import SessionInterviewChat from "./SessionInterviewChat";
import SessionMediaHeader from "./SessionMediaHeader";
import StructuredSessionForm from "./StructuredSessionForm";
import JournalTagsControl from "./JournalTagsControl";
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
  onOpenMonth,
  daysWithTrades,
}: {
  year: number;
  selected: Date;
  today: Date;
  /** Spec §1.7 — Year cell navigates to Month view for that month */
  onOpenMonth: (year: number, month: number) => void;
  daysWithTrades?: Set<string>;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {MONTH_SHORT.map((label, month) => (
        <button
          key={label}
          type="button"
          onClick={() => onOpenMonth(year, month)}
          className="rounded-[var(--radius-md)] p-1 text-left transition-colors hover:bg-[var(--color-fill)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
          data-testid={`journal-year-month-${year}-${month}`}
        >
          <p className="mb-1.5 text-sm font-semibold text-[var(--color-label)]">
            {label}
          </p>
          <MonthGrid
            year={year}
            month={month}
            selected={selected}
            today={today}
            onSelect={() => onOpenMonth(year, month)}
            compact
            daysWithTrades={daysWithTrades}
          />
        </button>
      ))}
    </div>
  );
}

function WeekView({
  weekStart,
  selected,
  today,
  onOpenDay,
  onOpenBand,
  activity,
}: {
  weekStart: Date;
  selected: Date;
  today: Date;
  onOpenDay: (d: Date) => void;
  /** Spec §1.6 — band click → day scrolled to first message in band */
  onOpenBand: (d: Date, band: WeekBandId) => void;
  activity: Record<string, WeekDayActivity>;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="overflow-x-auto px-1 pb-5 pt-1">
      <div className="min-w-[640px]">
        <div className="mb-3 grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] gap-2">
          <div />
          {days.map((d, i) => {
            const isSelected = sameDay(d, selected);
            const isToday = sameDay(d, today);
            return (
              <button
                key={ymd(d)}
                type="button"
                onClick={() => onOpenDay(d)}
                className="rounded-[var(--radius-sm)] text-center hover:bg-[var(--color-fill)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-tint)]"
                data-testid={`journal-week-header-${ymd(d)}`}
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
                const key = ymd(d);
                const isSelected = sameDay(d, selected);
                const hasDot = Boolean(
                  activity[key]?.bands?.[band.id as WeekBandId],
                );
                return (
                  <button
                    key={`${band.id}-${key}`}
                    type="button"
                    onClick={() => onOpenBand(d, band.id as WeekBandId)}
                    className={[
                      "relative flex min-h-[3.5rem] items-center justify-center rounded-[var(--radius-md)] transition-shadow",
                      tileBase,
                      isSelected
                        ? "ring-2 ring-[var(--color-tint)] ring-offset-2 ring-offset-[var(--color-canvas)]"
                        : "hover:brightness-[0.99]",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
                    ].join(" ")}
                    aria-label={`${band.label} ${formatLong(d)}${hasDot ? ", has notes" : ""}`}
                    data-testid={`journal-week-band-${band.id}-${key}`}
                  >
                    {hasDot && (
                      <span
                        className="h-2.5 w-2.5 rounded-full bg-[var(--color-tint)]"
                        data-testid={`journal-week-dot-${band.id}-${key}`}
                        aria-hidden
                      />
                    )}
                  </button>
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
  onFirstSend,
  onOpenRetrospective,
  book,
  tradesLoadState,
  onRetryTrades,
  retroBusy = false,
  retroErr = null,
  sessionBusy = false,
  sessionErr = null,
  activeSession = null,
  selectedClosed = false,
  onSessionUpdated,
  onSessionBusy,
  onSessionError,
  scrollToMessageId = null,
}: {
  selected: Date;
  draft: string;
  onDraft: (v: string) => void;
  onFirstSend: () => void;
  onOpenRetrospective: () => void;
  book: DayBook;
  tradesLoadState: "loading" | "ok" | "anon" | "forbidden" | "err";
  onRetryTrades: () => void;
  retroBusy?: boolean;
  retroErr?: string | null;
  sessionBusy?: boolean;
  sessionErr?: string | null;
  activeSession?: JournalSession | null;
  selectedClosed?: boolean;
  onSessionUpdated?: (s: JournalSession) => void;
  onSessionBusy?: (v: boolean) => void;
  onSessionError?: (msg: string | null) => void;
  scrollToMessageId?: number | null;
}) {
  const mutable =
    activeSession &&
    (activeSession.status === "open" || activeSession.status === "partial");
  const [interviewOpen, setInterviewOpen] = useState(false);
  useEffect(() => {
    setInterviewOpen(false);
  }, [activeSession?.id]);

  return (
    <div className="space-y-6" data-testid="journal-day-view">
      {/* Spec v0.6 §1.1 — date, retro, header (tags+media), thread, composer, interview, trades */}
      <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface-secondary)] px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p
            className="text-sm font-medium text-[var(--color-label)]"
            data-testid="journal-day-date"
          >
            {formatLong(selected)}
          </p>
          <button
            type="button"
            onClick={onOpenRetrospective}
            disabled={retroBusy}
            className="text-xs font-medium text-[var(--color-tint)] underline underline-offset-2 disabled:opacity-40"
            data-testid="journal-open-retrospective"
          >
            {retroBusy ? "Opening…" : "Open retrospective"}
          </button>
        </div>

        {selectedClosed && (
          <p
            className="mb-3 text-center text-sm text-[var(--color-label-secondary)]"
            data-testid="journal-day-closed"
            role="status"
          >
            This date is closed after a completed retrospective — no new
            writing. You can still review the day-book and existing notes.
          </p>
        )}

        {(retroErr || sessionErr) && (
          <p className="mb-3 text-center text-sm text-red-600" role="alert">
            {sessionErr || retroErr}
          </p>
        )}

        {activeSession && (
          <div
            className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4"
            data-testid="journal-session-active"
          >
            {/* §1.4 session header: tags + image thumbnails */}
            <div
              className="flex flex-col gap-2 sm:flex-row sm:items-start"
              data-testid="journal-session-header"
            >
              <div className="min-w-0 flex-1">
                <JournalTagsControl
                  sessionId={activeSession.id}
                  disabled={!mutable || sessionBusy}
                  onError={onSessionError}
                />
              </div>
              <div className="min-w-0 flex-[1.2]">
                <SessionMediaHeader
                  sessionId={activeSession.id}
                  disabled={!mutable || sessionBusy}
                  onError={onSessionError}
                />
              </div>
            </div>

            <SessionInterviewChat
              session={activeSession}
              busy={sessionBusy}
              onBusy={onSessionBusy}
              onError={onSessionError}
              onUpdated={(s) => {
                onSessionUpdated?.(s);
              }}
              scrollToMessageId={scrollToMessageId}
            />

            <div
              className="border-t border-[var(--color-separator)] pt-3"
              data-testid="journal-interview-bar"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 text-left text-sm"
                onClick={() => setInterviewOpen((v) => !v)}
                aria-expanded={interviewOpen}
                data-testid="journal-interview-toggle"
              >
                <span className="font-semibold text-[var(--color-label)]">
                  Structured interview
                </span>
                <span className="text-xs text-[var(--color-label-tertiary)]">
                  {interviewOpen ? "Hide" : "Show"}
                </span>
              </button>
              {interviewOpen && (
                <div className="mt-3">
                  <StructuredSessionForm
                    session={activeSession}
                    busy={sessionBusy}
                    onBusy={onSessionBusy}
                    onError={onSessionError}
                    onUpdated={(s) => {
                      onSessionUpdated?.(s);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {!activeSession && !selectedClosed && (
          <div
            className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4"
            data-testid="journal-composer-empty"
          >
            <div className="relative">
              <textarea
                value={draft}
                onChange={(e) => onDraft(e.target.value)}
                rows={4}
                placeholder="Write in your words…"
                className="w-full resize-y rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-4 py-3 pr-20 text-sm text-[var(--color-label)] placeholder:text-[var(--color-label-tertiary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
                aria-label="Journal message"
                data-testid="journal-composer-empty-draft"
                disabled={sessionBusy}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    if (draft.trim() && !sessionBusy) onFirstSend();
                  }
                }}
              />
              <div className="absolute bottom-3 right-3">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-tint)] text-[var(--color-on-tint)] disabled:opacity-40"
                  title="Send"
                  aria-label="Send"
                  disabled={!draft.trim() || sessionBusy}
                  onClick={onFirstSend}
                  data-testid="journal-composer-empty-send"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <DayTradesPanel
        book={book}
        loadState={tradesLoadState}
        onRetry={onRetryTrades}
      />
    </div>
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
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionErr, setSessionErr] = useState<string | null>(null);
  const [sessions, setSessions] = useState<JournalSession[]>([]);
  const [sessionsLoad, setSessionsLoad] = useState<
    "idle" | "loading" | "ok" | "err"
  >("idle");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<JournalSession | null>(
    null,
  );
  const [dayBook, setDayBook] = useState<DayBook>(() =>
    emptyDayBook(ymdLocal(new Date())),
  );
  const [daysWithTrades, setDaysWithTrades] = useState<Set<string>>(
    () => new Set(),
  );
  const [closedDates, setClosedDates] = useState<Set<string>>(() => new Set());
  const [tradesLoadState, setTradesLoadState] =
    useState<TradesLoadState>("loading");
  const [weekActivity, setWeekActivity] = useState<
    Record<string, WeekDayActivity>
  >({});
  const [scrollToMessageId, setScrollToMessageId] = useState<number | null>(
    null,
  );

  const selectedYmd = useMemo(() => ymdLocal(selected), [selected]);
  const selectedClosed = closedDates.has(selectedYmd);
  const weekStart = useMemo(() => startOfWeek(selected), [selected]);

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

  const loadClosures = useCallback(async () => {
    try {
      const rows = await listJournalClosures();
      setClosedDates(new Set(rows.map((r) => r.journal_date)));
    } catch {
      setClosedDates(new Set());
    }
  }, []);

  useEffect(() => {
    void loadClosures();
  }, [loadClosures]);

  const loadSessions = useCallback(async () => {
    setSessionsLoad("loading");
    setSessionErr(null);
    try {
      const rows = await listJournalSessions({
        journal_date: selectedYmd,
        limit: 50,
      });
      // Spec v0.6 §3 — one conversation per date (prefer earliest / sole row)
      const sorted = [...rows].sort((a, b) => a.id - b.id);
      setSessions(sorted);
      setSessionsLoad("ok");
      if (sorted[0]) {
        setActiveSessionId(sorted[0].id);
      } else {
        setActiveSessionId(null);
        setActiveSession(null);
      }
    } catch {
      setSessions([]);
      setSessionsLoad("err");
      setActiveSessionId(null);
      setActiveSession(null);
    }
  }, [selectedYmd]);

  useEffect(() => {
    setDraft("");
    setSessionErr(null);
    setScrollToMessageId(null);
    void loadSessions();
  }, [loadSessions]);

  // Week activity map (member-message dots)
  useEffect(() => {
    if (view !== "week") return;
    const from = ymdLocal(weekStart);
    const to = ymdLocal(addDays(weekStart, 6));
    let cancelled = false;
    (async () => {
      try {
        const days = await fetchWeekActivity(from, to);
        if (!cancelled) setWeekActivity(days);
      } catch {
        if (!cancelled) setWeekActivity({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view, weekStart]);

  useEffect(() => {
    if (activeSessionId == null) {
      setActiveSession(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const s = await getJournalSession(activeSessionId);
        if (!cancelled) setActiveSession(s);
      } catch (e) {
        if (!cancelled) {
          setSessionErr(
            e instanceof Error ? e.message : "Could not load entry",
          );
          setActiveSession(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSessionId]);

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
    setView("day");
  }

  /** Spec §1.7 — Month cell → Day view */
  function openDayFromCell(d: Date) {
    const x = startOfDay(d);
    setSelected(x);
    setCursor(startOfMonth(x));
    setScrollToMessageId(null);
    setView("day");
    setDraft("");
    setActivePrompt(null);
  }

  /** Spec §1.7 — Year cell → Month view */
  function openMonthFromYear(y: number, month: number) {
    const d = new Date(y, month, 1);
    setCursor(startOfMonth(d));
    setSelected(startOfDay(d));
    setView("month");
  }

  /** Spec §1.6 — Week band → Day scrolled to first message in band */
  function openDayFromBand(d: Date, band: WeekBandId) {
    const x = startOfDay(d);
    const key = ymdLocal(x);
    const msgId =
      weekActivity[key]?.first_message_id_by_band?.[band] ?? null;
    setSelected(x);
    setCursor(startOfMonth(x));
    setScrollToMessageId(msgId);
    setView("day");
    setDraft("");
  }

  /** Spec §6 — retrospective is a dedicated action, not a tag chip. */
  async function onOpenRetrospective() {
    setRetroErr(null);
    setSessionErr(null);
    setRetroBusy(true);
    try {
      const r = await createRetrospective({ gather: true });
      router.push(`/app/retrospective/${r.id}`);
    } catch (e) {
      setRetroErr(
        e instanceof Error ? e.message : "Could not start retrospective",
      );
      setRetroBusy(false);
    }
  }

  /** Spec v0.5 §1.1 / J1 — empty composer first send creates open session + message. */
  async function onFirstSend() {
    if (!draft.trim() || selectedClosed) return;
    const text = draft.trim();
    setSessionErr(null);
    setSessionBusy(true);
    try {
      const session = await createJournalSession({
        journal_date: selectedYmd,
      });
      // Prefer agent turn (member message + reply); plain-text if agent unavailable.
      try {
        const res = await postAgentTurn(session.id, { body_md: text });
        setDraft("");
        setActiveSessionId(session.id);
        setActiveSession(res.session);
      } catch {
        await postJournalMessage(session.id, text);
        setDraft("");
        setActiveSessionId(session.id);
        const s = await getJournalSession(session.id);
        setActiveSession(s);
      }
      await loadSessions();
      setView("day");
    } catch (e) {
      setSessionErr(
        e instanceof Error ? e.message : "Could not start journal entry",
      );
    } finally {
      setSessionBusy(false);
    }
  }

  function onSessionUpdated(s: JournalSession) {
    setActiveSession(s);
    setActiveSessionId(s.id);
    void loadSessions();
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
            onOpenMonth={openMonthFromYear}
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
                onSelect={openDayFromCell}
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
              onOpenDay={openDayFromCell}
              onOpenBand={openDayFromBand}
              activity={weekActivity}
            />
          </div>
        )}

        {view === "day" && (
          <DayView
            selected={selected}
            draft={draft}
            onDraft={setDraft}
            onFirstSend={() => void onFirstSend()}
            onOpenRetrospective={() => void onOpenRetrospective()}
            book={dayBook}
            tradesLoadState={tradesLoadState}
            onRetryTrades={loadDayBook}
            retroBusy={retroBusy}
            retroErr={retroErr}
            sessionBusy={sessionBusy}
            sessionErr={sessionErr}
            activeSession={activeSession}
            selectedClosed={selectedClosed}
            onSessionUpdated={onSessionUpdated}
            onSessionBusy={setSessionBusy}
            onSessionError={setSessionErr}
            scrollToMessageId={scrollToMessageId}
          />
        )}
      </div>
    </div>
  );
}
