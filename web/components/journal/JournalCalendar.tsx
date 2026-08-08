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
  useState,
} from "react";
import { createRetrospective } from "@/lib/retrospectiveApi";
import { confirmStartRetrospective } from "@/lib/retroCreateGuard";
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
import {
  JOURNAL_HYPOTHESIS_BEATS,
  JOURNAL_REFLECTION_BEATS,
} from "@/lib/journalBeats";
import DayTradesPanel from "./DayTradesPanel";
import SessionInterviewChat from "./SessionInterviewChat";
import SessionMediaHeader from "./SessionMediaHeader";
import StructuredSessionForm from "./StructuredSessionForm";
import JournalTagsControl from "./JournalTagsControl";
import {
  addDays,
  formatLong,
  monthCells,
  sameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  ymd,
} from "./dateUtils";
import {
  usePracticeContext,
  type DateGranularity,
} from "@/lib/practiceContext";

type ViewMode = "year" | "month" | "week" | "day";

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
  onEnsureSession,
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
  /** Empty-day image drop creates a session without requiring chat first. */
  onEnsureSession?: () => Promise<number>;
  scrollToMessageId?: number | null;
}) {
  const mutable =
    !activeSession ||
    activeSession.status === "open" ||
    activeSession.status === "partial";
  const mediaMutable = mutable && !selectedClosed;
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

        {/* Media drop zone is always present (active or empty day) so members
            can attach images without writing first. */}
        {!selectedClosed && (
          <div
            className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4"
            data-testid={
              activeSession ? "journal-session-active" : "journal-composer-empty"
            }
          >
            <div
              className="flex flex-col gap-2 sm:flex-row sm:items-start"
              data-testid="journal-session-header"
            >
              {activeSession ? (
                <div className="min-w-0 flex-1">
                  <JournalTagsControl
                    sessionId={activeSession.id}
                    disabled={!mediaMutable || sessionBusy}
                    onError={onSessionError}
                  />
                </div>
              ) : null}
              <div
                className={
                  activeSession ? "min-w-0 flex-[1.2]" : "min-w-0 w-full"
                }
              >
                <SessionMediaHeader
                  sessionId={activeSession?.id ?? null}
                  disabled={!mediaMutable || sessionBusy}
                  onError={onSessionError}
                  ensureSession={onEnsureSession}
                />
              </div>
            </div>

            {activeSession ? (
              <>
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
              </>
            ) : (
              <div className="space-y-2">
                <div
                  className="flex flex-wrap gap-1.5"
                  data-testid="journal-soft-beats"
                >
                  <span className="mr-1 self-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                    Soft beats
                  </span>
                  {[
                    ...JOURNAL_HYPOTHESIS_BEATS,
                    ...JOURNAL_REFLECTION_BEATS,
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      disabled={sessionBusy}
                      data-testid={`journal-beat-${b.id}`}
                      className="rounded-full border border-[var(--color-separator)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)] disabled:opacity-40"
                      title={
                        b.phase === "reflection"
                          ? "Records variance — never adjusts today's plan (weekly pivot does that)"
                          : "Optional hypothesis scaffold — freeform always works"
                      }
                      onClick={() => {
                        const next = draft.trim()
                          ? `${draft.trim()}\n\n${b.seed}`
                          : b.seed;
                        onDraft(next);
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <textarea
                    value={draft}
                    onChange={(e) => onDraft(e.target.value)}
                    rows={4}
                    placeholder="Write in your words… (or drop an image above)"
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
        )}

        {/* Closed day: still show existing session media/read-only when present */}
        {selectedClosed && activeSession && (
          <div
            className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4"
            data-testid="journal-session-active"
          >
            <div
              className="flex flex-col gap-2 sm:flex-row sm:items-start"
              data-testid="journal-session-header"
            >
              <div className="min-w-0 flex-1">
                <JournalTagsControl
                  sessionId={activeSession.id}
                  disabled
                  onError={onSessionError}
                />
              </div>
              <div className="min-w-0 flex-[1.2]">
                <SessionMediaHeader
                  sessionId={activeSession.id}
                  disabled
                  onError={onSessionError}
                />
              </div>
            </div>
            <SessionInterviewChat
              session={activeSession}
              busy={false}
              onBusy={onSessionBusy}
              onError={onSessionError}
              onUpdated={(s) => {
                onSessionUpdated?.(s);
              }}
              scrollToMessageId={scrollToMessageId}
            />
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

  // Date + account from Practice chrome (Context Spec v0.2).
  const {
    selectedDate: selected,
    setSelectedDate,
    granularity,
    setGranularity,
    accountIdParam,
  } = usePracticeContext();
  // accountIdParam scopes day trades only; conversation stays trader-level.
  // "All" is not a calendar layout — fall back to month for the work surface.
  const view: ViewMode =
    granularity === "all" ? "month" : (granularity as ViewMode);
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

  // Keep month/year grid cursor aligned with shared date.
  useEffect(() => {
    setCursor(startOfMonth(selected));
  }, [selected]);

  const selectedYmd = useMemo(() => ymdLocal(selected), [selected]);
  const selectedClosed = closedDates.has(selectedYmd);
  const weekStart = useMemo(() => startOfWeek(selected), [selected]);

  const loadDayBook = useCallback(async () => {
    setTradesLoadState("loading");
    try {
      // Trades on this day are account-scoped; conversation is not (§2).
      const res = await fetchDayBook(
        selectedYmd,
        accountIdParam ?? undefined,
      );
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
  }, [selectedYmd, accountIdParam]);

  // Calendar dots — account-scoped interest for trade markers.
  const loadDaysInterest = useCallback(async () => {
    const years = [
      today.getFullYear(),
      cursor.getFullYear(),
      selected.getFullYear(),
    ];
    const fromYear = Math.min(...years) - 15;
    const toYear = Math.max(...years) + 1;
    const fromDay = `${fromYear}-01-01`;
    const toDay = `${toYear}-12-31`;
    try {
      const res = await fetchDaysInterest(
        fromDay,
        toDay,
        accountIdParam ?? undefined,
      );
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
  }, [today, cursor, selected, accountIdParam]);

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

  /** Spec §1.7 — Month cell → Day view */
  function openDayFromCell(d: Date) {
    const x = startOfDay(d);
    setSelectedDate(x);
    setScrollToMessageId(null);
    setGranularity("day");
    setDraft("");
    setActivePrompt(null);
  }

  /** Spec §1.7 — Year cell → Month view */
  function openMonthFromYear(y: number, month: number) {
    const d = new Date(y, month, 1);
    setSelectedDate(startOfDay(d));
    setGranularity("month");
  }

  /** Spec §1.6 — Week band → Day scrolled to first message in band */
  function openDayFromBand(d: Date, band: WeekBandId) {
    const x = startOfDay(d);
    const key = ymdLocal(x);
    const msgId =
      weekActivity[key]?.first_message_id_by_band?.[band] ?? null;
    setSelectedDate(x);
    setScrollToMessageId(msgId);
    setGranularity("day");
    setDraft("");
  }

  /** Spec §6 — retrospective is a dedicated action, not a tag chip. */
  async function onOpenRetrospective() {
    setRetroErr(null);
    setSessionErr(null);
    // Warn with scope dates + lock consequences before create.
    try {
      const { ok } = await confirmStartRetrospective();
      if (!ok) return;
    } catch (e) {
      setRetroErr(
        e instanceof Error ? e.message : "Could not prepare retrospective",
      );
      return;
    }
    setRetroBusy(true);
    try {
      const r = await createRetrospective({
        gather: true,
        accountId: accountIdParam,
      });
      router.push(`/app/retrospective/${r.id}`);
    } catch (e) {
      setRetroErr(
        e instanceof Error ? e.message : "Could not start retrospective",
      );
      setRetroBusy(false);
    }
  }

  /** Open a session for this day without requiring a first chat message
   *  (image drop / paste on empty journal). Reuses an already-active open session. */
  async function ensureSessionForMedia(): Promise<number> {
    if (
      activeSession &&
      (activeSession.status === "open" || activeSession.status === "partial")
    ) {
      return activeSession.id;
    }
    if (selectedClosed) {
      throw new Error("This date is closed — no new journal activity.");
    }
    setSessionErr(null);
    setSessionBusy(true);
    try {
      const session = await createJournalSession({
        journal_date: selectedYmd,
      });
      setActiveSessionId(session.id);
      setActiveSession(session);
      await loadSessions();
      setGranularity("day");
      return session.id;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not start journal entry";
      setSessionErr(msg);
      throw e instanceof Error ? e : new Error(msg);
    } finally {
      setSessionBusy(false);
    }
  }

  /** Spec v0.5 §1.1 / J1 — empty composer first send creates open session + message. */
  async function onFirstSend() {
    if (!draft.trim() || selectedClosed) return;
    const text = draft.trim();
    setSessionErr(null);
    setSessionBusy(true);
    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const session = await createJournalSession({
          journal_date: selectedYmd,
        });
        sessionId = session.id;
        setActiveSessionId(session.id);
        setActiveSession(session);
      }
      // Prefer agent turn (member message + reply); plain-text if agent unavailable.
      try {
        const res = await postAgentTurn(sessionId, { body_md: text });
        setDraft("");
        setActiveSessionId(sessionId);
        setActiveSession(res.session);
      } catch {
        await postJournalMessage(sessionId, text);
        setDraft("");
        setActiveSessionId(sessionId);
        const s = await getJournalSession(sessionId);
        setActiveSession(s);
      }
      await loadSessions();
      setGranularity("day");
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

  return (
    <div
      className="mt-6 flex flex-col gap-6"
      data-testid="journal-calendar"
      data-view={view}
    >
      {/* Date chrome lives in PracticeSuiteChrome (Context Spec v0.2). */}
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
            onEnsureSession={ensureSessionForMedia}
            scrollToMessageId={scrollToMessageId}
          />
        )}
      </div>
    </div>
  );
}
