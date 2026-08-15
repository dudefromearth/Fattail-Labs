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
import DayTradesPanel from "./DayTradesPanel";
import SessionInterviewChat from "./SessionInterviewChat";
import JournalComposer from "./JournalComposer";
import SessionMediaHeader from "./SessionMediaHeader";
import JournalAiInstructionsChrome from "./JournalAiInstructionsOverlay";
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
import {
  dayNetFillClass,
  dayNetTextClass,
  fetchDayNetCalendar,
  fetchDayNetMapEnabled,
  formatDayNet,
  formatPeriodNet,
  patchDayNetMapEnabled,
  type DayNetDay,
} from "@/lib/journalDayNetApi";

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
  dayNetByDate,
  mapOn = false,
}: {
  year: number;
  month: number;
  selected: Date;
  today: Date;
  onSelect: (d: Date) => void;
  compact?: boolean;
  daysWithTrades?: Set<string>;
  dayNetByDate?: Map<string, DayNetDay>;
  mapOn?: boolean;
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
          const key = ymd(day);
          const hasTrades = daysWithTrades?.has(key) ?? false;
          const dn = mapOn ? dayNetByDate?.get(key) : undefined;
          const fill =
            mapOn && dn
              ? dayNetFillClass(dn.tone, dn.intensity_step)
              : "";
          const amt =
            mapOn && dn && dn.tone !== "none"
              ? formatDayNet(dn.net)
              : mapOn && dn
                ? "—"
                : null;
          const r2r =
            mapOn &&
            dn &&
            dn.day_r2r != null &&
            dn.day_r2r_sample_n > 0
              ? dn.day_r2r.toFixed(1)
              : null;
          if (compact) {
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(day)}
                className={[
                  "relative aspect-square w-full rounded-[2px] transition-colors",
                  fill || "bg-[var(--color-fill)]/80",
                  isSelected
                    ? "ring-1 ring-[var(--color-label)] ring-offset-0"
                    : "",
                  !fill && isToday ? "bg-[var(--color-tint-soft)]" : "",
                  !fill && hasTrades && !isSelected
                    ? "bg-[var(--color-tint-soft)]"
                    : "",
                ].join(" ")}
                aria-label={formatLong(day)}
                aria-pressed={isSelected}
              />
            );
          }
          const ariaMoney =
            mapOn && amt
              ? `, ${dn?.tone === "debit" ? "debit" : dn?.tone === "credit" ? "credit" : "flat"} ${amt}`
              : hasTrades
                ? ", has trades"
                : "";
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(day)}
              data-testid={`journal-month-day-${key}`}
              className={[
                "relative flex aspect-square w-full min-h-0 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-lg)] text-sm font-medium transition-shadow",
                tileBase,
                fill,
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
                isSelected
                  ? "ring-2 ring-[var(--color-tint)]"
                  : "",
                !fill && isToday
                  ? "text-[var(--color-tint)]"
                  : !fill
                    ? "text-[var(--color-label)]"
                    : "",
                "hover:brightness-[0.99]",
              ].join(" ")}
              aria-label={`${formatLong(day)}${ariaMoney}`}
              aria-pressed={isSelected}
            >
              <span
                className={
                  isSelected
                    ? "text-[var(--color-tint)]"
                    : "text-[var(--color-label)]"
                }
              >
                {day.getDate()}
              </span>
              {mapOn && amt != null && (
                <span
                  className={[
                    "text-[10px] font-semibold tabular-nums leading-none sm:text-[11px]",
                    dayNetTextClass(dn?.tone || "none"),
                  ].join(" ")}
                  data-testid={`journal-day-net-${key}`}
                >
                  {amt}
                </span>
              )}
              {mapOn && r2r != null && (
                <span className="hidden text-[9px] tabular-nums text-[var(--color-label-tertiary)] sm:block">
                  R {r2r}
                </span>
              )}
              {!mapOn && hasTrades && (
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
  dayNetByDate,
  mapOn = false,
}: {
  weekStart: Date;
  selected: Date;
  today: Date;
  onOpenDay: (d: Date) => void;
  /** Spec §1.6 — band click → day scrolled to first message in band */
  onOpenBand: (d: Date, band: WeekBandId) => void;
  activity: Record<string, WeekDayActivity>;
  dayNetByDate?: Map<string, DayNetDay>;
  mapOn?: boolean;
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
            const key = ymd(d);
            const dn = mapOn ? dayNetByDate?.get(key) : undefined;
            const fill =
              mapOn && dn
                ? dayNetFillClass(dn.tone, dn.intensity_step)
                : "";
            const amt =
              mapOn && dn && dn.tone !== "none"
                ? formatDayNet(dn.net)
                : mapOn
                  ? "—"
                  : null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onOpenDay(d)}
                className={[
                  "rounded-[var(--radius-sm)] px-0.5 py-1 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-tint)]",
                  fill || "hover:bg-[var(--color-fill)]",
                ].join(" ")}
                data-testid={`journal-week-header-${key}`}
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
                {mapOn && amt != null && (
                  <div
                    className={[
                      "mt-0.5 text-[10px] font-semibold tabular-nums",
                      dayNetTextClass(dn?.tone || "none"),
                    ].join(" ")}
                    data-testid={`journal-week-net-${key}`}
                  >
                    {amt}
                  </div>
                )}
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

  return (
    <div className="space-y-6" data-testid="journal-day-view">
      {/* Day card — date, retro, full-width media, thread, composer, trades */}
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
            <div className="w-full" data-testid="journal-session-header">
              <SessionMediaHeader
                sessionId={activeSession?.id ?? null}
                disabled={!mediaMutable || sessionBusy}
                onError={onSessionError}
                ensureSession={onEnsureSession}
              />
            </div>

            <JournalAiInstructionsChrome
              overlayTarget={
                activeSession ? (
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
                ) : (
                  <JournalComposer
                    value={draft}
                    onChange={onDraft}
                    onSend={onFirstSend}
                    disabled={sessionBusy}
                    draftTestId="journal-composer-empty-draft"
                    sendTestId="journal-composer-empty-send"
                  />
                )
              }
            />
          </div>
        )}

        {/* Closed day: still show existing session media/read-only when present */}
        {selectedClosed && activeSession && (
          <div
            className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4"
            data-testid="journal-session-active"
          >
            <div className="w-full" data-testid="journal-session-header">
              <SessionMediaHeader
                sessionId={activeSession.id}
                disabled
                onError={onSessionError}
              />
            </div>
            <JournalAiInstructionsChrome
              overlayTarget={
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
              }
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
    campaignId,
    prefsReady,
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
  /** Spec v0.2 — Day Net exposure map (toggle + derived nets). */
  const [dayNetMapOn, setDayNetMapOn] = useState(true);
  const [dayNetByDate, setDayNetByDate] = useState<Map<string, DayNetDay>>(
    () => new Map(),
  );
  const [dayNetPeriod, setDayNetPeriod] = useState<{
    net: number;
    outcome_days: number;
  } | null>(null);

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

  // Exposure map prefs (default ON)
  useEffect(() => {
    if (!prefsReady) return;
    void fetchDayNetMapEnabled().then(setDayNetMapOn);
  }, [prefsReady]);

  // Day-net calendar for visible month/week range
  useEffect(() => {
    if (!prefsReady || !dayNetMapOn) {
      setDayNetByDate(new Map());
      setDayNetPeriod(null);
      return;
    }
    if (view !== "month" && view !== "week" && view !== "year") {
      return;
    }
    let fromDay: string;
    let toDay: string;
    if (view === "week") {
      fromDay = ymd(weekStart);
      toDay = ymd(addDays(weekStart, 6));
    } else if (view === "month") {
      const y = cursor.getFullYear();
      const m = cursor.getMonth();
      fromDay = ymd(new Date(y, m, 1));
      toDay = ymd(new Date(y, m + 1, 0));
    } else {
      const y = selected.getFullYear();
      fromDay = `${y}-01-01`;
      toDay = `${y}-12-31`;
    }
    let cancelled = false;
    void fetchDayNetCalendar({
      fromDay,
      toDay,
      accountId: accountIdParam,
      practiceCampaignId: campaignId,
    }).then((doc) => {
      if (cancelled || !doc) return;
      const m = new Map<string, DayNetDay>();
      for (const d of doc.days || []) m.set(d.date, d);
      setDayNetByDate(m);
      setDayNetPeriod({
        net: doc.period?.net ?? 0,
        outcome_days: doc.period?.outcome_days ?? 0,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [
    prefsReady,
    dayNetMapOn,
    view,
    weekStart,
    cursor,
    selected,
    accountIdParam,
    campaignId,
  ]);

  async function onToggleDayNetMap() {
    const next = !dayNetMapOn;
    setDayNetMapOn(next);
    await patchDayNetMapEnabled(next);
  }

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
      {/* Day Net exposure map chrome (Spec v0.2) — money only when toggle ON */}
      {(view === "month" || view === "week") && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2.5 shadow-[var(--elevation-1)]"
          data-testid="journal-day-net-bar"
        >
          <div className="min-w-0">
            {dayNetMapOn ? (
              <>
                <p className="text-xs font-medium text-[var(--color-label-tertiary)]">
                  {view === "week" ? "Week P&L" : "Month P&L"}
                </p>
                <p
                  className={[
                    "text-lg font-semibold tabular-nums",
                    dayNetPeriod && dayNetPeriod.net > 0
                      ? "text-emerald-700 dark:text-emerald-300"
                      : dayNetPeriod && dayNetPeriod.net < 0
                        ? "text-red-700 dark:text-red-300"
                        : "text-[var(--color-label)]",
                  ].join(" ")}
                  data-testid="journal-period-pnl"
                >
                  {dayNetPeriod
                    ? dayNetPeriod.outcome_days > 0
                      ? formatPeriodNet(dayNetPeriod.net)
                      : "No closed outcomes this period"
                    : "…"}
                </p>
                {dayNetPeriod && dayNetPeriod.outcome_days > 0 && (
                  <p className="text-[11px] text-[var(--color-label-tertiary)]">
                    {dayNetPeriod.outcome_days} outcome day
                    {dayNetPeriod.outcome_days === 1 ? "" : "s"}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--color-label-secondary)]">
                Day net map off — activity only
              </p>
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--color-label-secondary)]">
            <span>Day net map</span>
            <button
              type="button"
              role="switch"
              aria-checked={dayNetMapOn}
              data-testid="journal-day-net-toggle"
              onClick={() => void onToggleDayNetMap()}
              className={[
                "relative h-6 w-11 rounded-full transition-colors",
                dayNetMapOn
                  ? "bg-emerald-500"
                  : "bg-[var(--color-fill)] ring-1 ring-[var(--color-separator)]",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  dayNetMapOn ? "left-5" : "left-0.5",
                ].join(" ")}
              />
            </button>
          </label>
        </div>
      )}

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
                dayNetByDate={dayNetByDate}
                mapOn={dayNetMapOn}
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
              dayNetByDate={dayNetByDate}
              mapOn={dayNetMapOn}
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
