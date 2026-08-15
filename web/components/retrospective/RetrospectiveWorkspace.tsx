"use client";

/**
 * Retrospective workspace — Spec v0.7.1 + layout §6.2 (3×3 map ceremony).
 * Fixed-order steps; persistent 3×3 grid; one step expanded below — not a wizard.
 * Contract: Architecture/12-retrospective-report-dto.md · carry-forward first · book last.
 */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui";
import {
  analyzeRetrospective,
  completeRetrospective,
  fetchClosurePreview,
  createHabitPlan,
  gatherRetrospective,
  getRetrospective,
  patchHabitPlan,
  patchRetrospective,
  type Retrospective,
} from "@/lib/retrospectiveApi";
import { usePracticeContextOptional } from "@/lib/practiceContext";
import RetroPeriodWindow from "@/components/retrospective/RetroPeriodWindow";
import RetroPeriodBrief from "@/components/retrospective/RetroPeriodBrief";
import RetroHeadingCard, {
  useRetroHeading,
} from "@/components/retrospective/RetroHeadingCard";

type Dict = Record<string, unknown>;

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function asDict(v: unknown): Dict | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Dict) : null;
}

function asList(v: unknown): Dict[] {
  return Array.isArray(v) ? (v as Dict[]) : [];
}

function str(v: unknown, fallback = "—"): string {
  if (v == null || v === "") return fallback;
  return String(v);
}

function num(v: unknown): string {
  if (v == null || v === "") return "—";
  return String(v);
}

const BOOK_COLLAPSED_FALLBACK =
  "Book performance (results) — neutral sample from this window. Expand when you want the numbers.";

const CARRY_FORWARD_EMPTY =
  "No plans carried in — this is where they'll appear next time.";

/** Tango RT0-3 — plan status only, never success/fail moralizing. */
const SELF_ASSESSMENT_OPTIONS = [
  { value: "kept", label: "Kept" },
  { value: "partial", label: "Partial" },
  { value: "lapsed", label: "Lapsed" },
] as const;

const METRIC_LABELS: Record<string, string> = {
  routine_days_per_week: "Routine (activity days / week)",
  live_checkins_per_week: "Live (check-ins / week)",
  lesson_days_per_week: "Learning (lesson days / week)",
  adherence_followed_partial_rate: "Adherence (followed + partial)",
  integrity_overall_percent: "Process integrity %",
  book_net_per_trade: "Book net per trade (neutral)",
};

const COMPARABLE_REASON_COPY: Record<string, string> = {
  window_length_ratio_ge_3x: "Window lengths differ too much to compare rates.",
  window_days_below_14: "Needs at least 14 days in each window for activity rates.",
  sample_below_min_inference_n: "Needs more trades in each window before comparing.",
  missing_value: "A value is missing for one window.",
};

function formatMetricValue(metric: string, value: unknown): string {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return str(value);
  if (metric === "adherence_followed_partial_rate") {
    return `${Math.round(n * 100)}%`;
  }
  if (metric === "integrity_overall_percent") {
    return `${Math.round(n)}%`;
  }
  if (metric === "book_net_per_trade") {
    return n.toFixed(2);
  }
  return String(Math.round(n * 100) / 100);
}

async function fetchPnlExpanded(): Promise<boolean> {
  try {
    const r = await fetch("/api/me/profile", { credentials: "same-origin" });
    if (!r.ok) return false;
    const d = (await r.json()) as { retrospective_pnl_expanded?: boolean };
    return Boolean(d.retrospective_pnl_expanded);
  } catch {
    return false;
  }
}

async function setPnlExpanded(expanded: boolean): Promise<void> {
  const r = await fetch("/api/me/profile", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ retrospective_pnl_expanded: expanded }),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    const detail =
      typeof body.detail === "string" ? body.detail : `HTTP ${r.status}`;
    throw new Error(detail);
  }
}

/** Spec §6 — nine fixed steps; layout §6.2 map + one expanded body. */
const CEREMONY_STEPS = [
  { id: 1, key: "commitments", title: "Commitments", short: "Commit" },
  { id: 2, key: "practice", title: "Practice", short: "Practice" },
  { id: 3, key: "obstacles", title: "Obstacles", short: "Obstacles" },
  { id: 4, key: "clustered", title: "Where it clustered", short: "Clustered" },
  { id: 5, key: "cause", title: "What I name as the cause", short: "Cause" },
  { id: 6, key: "worked", title: "What worked", short: "Worked" },
  { id: 7, key: "eva", title: "Expected versus actual", short: "Expected" },
  { id: 8, key: "onething", title: "The one thing", short: "One thing" },
  { id: 9, key: "book", title: "The book", short: "Book" },
] as const;

type TileState = "needs_you" | "has_content" | "nothing_here";

type TileInfo = {
  id: number;
  key: string;
  title: string;
  short: string;
  state: TileState;
  summary: string;
};

function CeremonyStep({
  step,
  title,
  children,
  testId,
  dashed,
}: {
  step: number;
  title: string;
  children: ReactNode;
  testId?: string;
  dashed?: boolean;
}) {
  return (
    <section
      id={`ceremony-step-${step}`}
      data-testid={testId}
      data-ceremony-step={step}
      data-focused="1"
      className={[
        "scroll-mt-4 rounded-[var(--radius-lg)] border p-5",
        dashed
          ? "border-dashed border-[var(--color-separator)]"
          : "border-[var(--color-separator)]",
        "bg-[var(--color-surface)] shadow-[var(--elevation-2)] ring-2 ring-[var(--color-tint)] ring-offset-2 ring-offset-[var(--color-canvas)]",
      ].join(" ")}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
        {step} · {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function NothingHere({
  testId,
  children,
}: {
  testId?: string;
  children?: ReactNode;
}) {
  return (
    <p
      className="text-sm text-[var(--color-label-secondary)]"
      data-testid={testId}
    >
      {children ?? "Nothing here."}
    </p>
  );
}

/** Module-level so typing does not remount the focused step (and steal caret). */
function Step({
  step,
  focusedStep,
  title,
  children,
  testId,
  dashed,
}: {
  step: number;
  focusedStep: number;
  title: string;
  children: ReactNode;
  testId?: string;
  dashed?: boolean;
}) {
  if (focusedStep !== step) return null;
  return (
    <CeremonyStep step={step} title={title} testId={testId} dashed={dashed}>
      {children}
    </CeremonyStep>
  );
}

function CompileList({
  title,
  rows,
  empty,
  testId,
}: {
  title: string;
  rows: Dict[];
  empty: string;
  testId: string;
}) {
  return (
    <div data-testid={testId}>
      <p className="text-sm font-semibold text-[var(--color-label)]">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-1 text-sm text-[var(--color-label-tertiary)]">{empty}</p>
      ) : (
        <ul className="mt-1 space-y-1 text-sm text-[var(--color-label)]">
          {rows.map((row, i) => (
            <li key={`${str(row.day)}-${i}`}>
              {row.day ? (
                <span className="text-[var(--color-label-tertiary)]">
                  {str(row.day)} ·{" "}
                </span>
              ) : null}
              {str(row.text)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WriteField({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder,
  inputRef,
  testId,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder: string;
  inputRef: { current: HTMLTextAreaElement | null };
  testId: string;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-base font-semibold text-[var(--color-label)]">
        {label}
      </span>
      <textarea
        id={id}
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={5}
        placeholder={placeholder}
        className="mt-2 w-full resize-y rounded-[var(--journal-composer-radius)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--text-body)] leading-[1.45] shadow-[var(--journal-composer-shadow)] outline-none focus:ring-2 focus:ring-[var(--color-tint)] disabled:opacity-70"
        data-testid={testId}
      />
    </label>
  );
}

export default function RetrospectiveWorkspace({
  retroId,
  onStatusChange,
}: {
  retroId: number;
  /** Notify chrome when complete so contexts show as inert (§4). */
  onStatusChange?: (status: string) => void;
}) {
  const practice = usePracticeContextOptional();
  const accountIdParam = practice?.accountIdParam ?? null;

  const [data, setData] = useState<Retrospective | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [body, setBody] = useState("");
  const [oneThing, setOneThing] = useState("");
  const [title, setTitle] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const skipAutosave = useRef(true);
  const causeRef = useRef<HTMLTextAreaElement | null>(null);
  const oneThingRef = useRef<HTMLTextAreaElement | null>(null);
  /** Book section open — default collapsed (false) until profile loads. */
  const [bookExpanded, setBookExpanded] = useState(false);
  const [bookPrefReady, setBookPrefReady] = useState(false);
  /** Proposed plans from agent — local accept/reject before create. */
  const [proposedPlans, setProposedPlans] = useState<Dict[]>([]);
  const [planEdits, setPlanEdits] = useState<Record<number, string>>({});
  /** Spec §6.2 — focused step; only that body expands under the 3×3 map. */
  const [focusedStep, setFocusedStep] = useState(1);
  const [focusInitialized, setFocusInitialized] = useState(false);

  const load = useCallback(() => {
    setErr(null);
    getRetrospective(retroId)
      .then((d) => {
        setData(d);
        const compiled = asDict(asDict(d.report)?.journal_compile);
        setOneThing(
          d.one_thing_md ||
            str(compiled?.suggested_one_thing, "") ||
            "",
        );
        setTitle(d.title || "");
        if (!String(d.body_md || "").trim()) {
          const hint = str(compiled?.suggested_cause, "");
          setBody(hint);
        } else {
          setBody(d.body_md || "");
        }
        skipAutosave.current = true;
        const ag = asDict(d.agent);
        setProposedPlans(asList(ag?.habit_plans));
        setFocusInitialized(false);
        onStatusChange?.(d.status);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"));
  }, [retroId, onStatusChange]);

  useEffect(() => {
    load();
  }, [load]);

  const notesLocked = data?.status === "complete";
  const hasRetro = Boolean(data);
  useEffect(() => {
    if (!hasRetro || notesLocked) return;
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      setSaveState("saving");
      patchRetrospective(retroId, {
        title: title.trim(),
        body_md: body,
        one_thing_md: oneThing,
      })
        .then((d) => {
          setData(d);
          setSaveState("saved");
        })
        .catch((e) => {
          setErr(e instanceof Error ? e.message : "Save failed");
          setSaveState("idle");
        });
    }, 600);
    return () => window.clearTimeout(handle);
  }, [title, body, oneThing, hasRetro, notesLocked, retroId]);

  useEffect(() => {
    let cancelled = false;
    fetchPnlExpanded().then((exp) => {
      if (!cancelled) {
        setBookExpanded(exp);
        setBookPrefReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleBook() {
    const next = !bookExpanded;
    setBookExpanded(next);
    try {
      await setPnlExpanded(next);
    } catch (e) {
      setBookExpanded(!next);
      setErr(e instanceof Error ? e.message : "Could not save book preference");
    }
  }

  async function saveNotes() {
    setBusy(true);
    setErr(null);
    try {
      const d = await patchRetrospective(retroId, {
        title: title.trim(),
        body_md: body,
        one_thing_md: oneThing,
      });
      setData(d);
      setSaveState("saved");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function reGather() {
    if (data?.status === "complete") {
      setErr(
        "Completed retrospectives are fixed at gather — re-gather is blocked.",
      );
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      // Open retro book follows current Practice account until gather fixes it (§4).
      const d = await gatherRetrospective(retroId, {
        accountId: accountIdParam,
      });
      setData(d);
      onStatusChange?.(d.status);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gather failed");
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    setBusy(true);
    setErr(null);
    try {
      // Appendix B: name dates before irreversible complete
      let previewMsg = "";
      try {
        const prev = await fetchClosurePreview(retroId);
        const named =
          prev.dates_to_close?.length > 0
            ? prev.dates_to_close.join(", ")
            : "none";
        previewMsg =
          `Complete this review?\n\n` +
          `This closes ${named} to new journal entries and attachments. ` +
          `Those dates were reviewed here, so the record stays as it is.\n` +
          `Gather date (${prev.gather_date}) stays open.`;
      } catch {
        previewMsg =
          "Complete this review? Prior journal dates may close to new entries. Today stays open.";
      }
      if (typeof window !== "undefined" && !window.confirm(previewMsg)) {
        return;
      }
      await patchRetrospective(retroId, {
        title: title.trim(),
        body_md: body,
        one_thing_md: oneThing,
      });
      const d = await completeRetrospective(retroId);
      setData(d);
      onStatusChange?.(d.status);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Complete failed");
    } finally {
      setBusy(false);
    }
  }

  async function runSequenceAgent() {
    setBusy(true);
    setErr(null);
    try {
      const d = await analyzeRetrospective(retroId, {
        focused_step: focusedStep,
      });
      setData(d);
      // Sequence agent does not prescribe habit plans (Spec §16)
      setProposedPlans([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sequence agent failed");
    } finally {
      setBusy(false);
    }
  }

  async function acceptProposedPlan(index: number) {
    const p = proposedPlans[index];
    if (!p) return;
    setBusy(true);
    setErr(null);
    try {
      const title =
        planEdits[index] ??
        str(p.title, str(p.habit, "Process habit"));
      await createHabitPlan({
        title,
        habit: str(p.habit, title),
        why_process: str(p.why_process, ""),
        observable_signal: str(p.observable_signal, "routine_days"),
        retrospective_id: retroId,
        status: "proposed",
      });
      setProposedPlans((prev) => prev.filter((_, i) => i !== index));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not accept plan");
    } finally {
      setBusy(false);
    }
  }

  function rejectProposedPlan(index: number) {
    setProposedPlans((prev) => prev.filter((_, i) => i !== index));
  }

  async function setPlanAssessment(planId: number, status: string) {
    setBusy(true);
    setErr(null);
    try {
      await patchHabitPlan(planId, { status });
      // Open workspace: re-gather so carry_forward reflects assessment.
      // Complete: optimistically patch local report (gather blocked on complete).
      if (data?.status === "ready" || data?.status === "draft") {
        const d = await gatherRetrospective(retroId, {
          accountId: accountIdParam,
        });
        setData(d);
      } else {
        setData((prev) => {
          if (!prev?.report) return prev;
          const rep = { ...(prev.report as Dict) };
          const cf = asDict(rep.carry_forward);
          if (!cf) return prev;
          const plans = asList(cf.plans).map((p) =>
            Number(p.id) === planId
              ? { ...p, status, self_assessment: status }
              : p,
          );
          rep.carry_forward = { ...cf, plans };
          return { ...prev, report: rep };
        });
      }
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Could not save plan assessment",
      );
    } finally {
      setBusy(false);
    }
  }

  const report = useMemo(
    () => asDict(data?.report) || null,
    [data?.report],
  );

  const process = asDict(report?.process);
  const integrity =
    asDict(report?.integrity_review) ||
    asDict(asDict(report?.process)?.integrity);
  /** Spec v0.7.1 §7 — period only; never co-display with Journey rolling */
  const periodIndicator = asDict(report?.period_indicator);
  /** Spec v0.7.1 §8.1 — Behavior tags + member journal words only */
  const emotionMirror = asDict(report?.emotion_mirror);
  /** Spec v0.7.1 §8.1a — category → ceremony step */
  /** Spec v0.7.1 §8.2 / §12 / §13 — R5 */
  const clustering = asDict(report?.clustering);
  const trends = asDict(report?.trends);
  const correlation = asDict(report?.correlation);
  const book =
    asDict(report?.book_performance) || asDict(report?.pnl);
  const deviations = asList(report?.deviations);
  const whatWorked = asList(report?.what_worked);
  const expectedVsActual = report?.expected_vs_actual;
  const carryForward = asDict(report?.carry_forward);
  const comparison = asDict(data?.comparison);
  const behaviorTags = asList(emotionMirror?.behavior_tags);
  const contextTags = asList(emotionMirror?.context_tags);
  const insightTags = asList(emotionMirror?.insight_tags);
  const journalWords = asList(emotionMirror?.journal_words);
  const clusterStatements = asList(clustering?.statements);
  const correlationStatements = asList(correlation?.statements);
  const trendSeries = asList(trends?.series);
  const tagTrendSeries = asList(trends?.tag_frequency_series);
  const isMaiden = Boolean(
    data?.is_maiden || asDict(report?.meta)?.is_maiden,
  );
  const journalCompile = asDict(report?.journal_compile);
  const compiledSaid = asList(journalCompile?.said);
  const compiledInWay = asList(journalCompile?.in_the_way);
  const compiledWorked = asList(journalCompile?.worked);
  const compiledNext = asList(journalCompile?.next);

  /** Spec §6.2 — tile state + summary (process/inventory only; no $ / character grades). */
  const ceremonyTiles: TileInfo[] = useMemo(() => {
    const plans = asList(carryForward?.plans);
    const pi = periodIndicator;
    const piStatus = str(pi?.status, "");
    const clusterN = clusterStatements.length;
    const ctxN = contextTags.length;
    const behN = behaviorTags.length;
    const devN = deviations.length;
    const wwN = whatWorked.length + insightTags.length;
    const evaN = asList(expectedVsActual).length;
    const complete = data?.status === "complete";

    function tile(
      id: number,
      state: TileState,
      summary: string,
    ): TileInfo {
      const meta = CEREMONY_STEPS[id - 1];
      return {
        id,
        key: meta.key,
        title: meta.title,
        short: meta.short,
        state,
        summary,
      };
    }

    const t1: TileInfo = (() => {
      if (isMaiden) return tile(1, "nothing_here", "Nothing here");
      if (plans.length === 0) return tile(1, "nothing_here", "Nothing here");
      return tile(1, "has_content", `${plans.length} plan${plans.length === 1 ? "" : "s"}`);
    })();

    const t2: TileInfo = (() => {
      if (!pi || Object.keys(pi).length === 0)
        return tile(2, "nothing_here", "Nothing here");
      if (piStatus === "not_enough_yet")
        return tile(2, "has_content", "Not enough yet");
      if (piStatus === "steady") return tile(2, "has_content", "Steady");
      return tile(2, "has_content", str(pi.headline, "Practice"));
    })();

    const t3: TileInfo = (() => {
      if (behN === 0 && devN === 0 && journalWords.length === 0)
        return tile(3, "nothing_here", "Nothing here");
      const parts: string[] = [];
      if (behN > 0) parts.push(`${behN} tag${behN === 1 ? "" : "s"}`);
      if (devN > 0) parts.push(`${devN} deviation${devN === 1 ? "" : "s"}`);
      if (journalWords.length > 0 && parts.length === 0)
        parts.push("journal words");
      return tile(3, "has_content", parts.join(", "));
    })();

    const t4: TileInfo = (() => {
      if (clusterN === 0 && ctxN === 0)
        return tile(4, "nothing_here", "Nothing here");
      if (clusterN > 0)
        return tile(
          4,
          "has_content",
          `${clusterN} co-occurrence${clusterN === 1 ? "" : "s"}`,
        );
      return tile(4, "has_content", `${ctxN} context tag${ctxN === 1 ? "" : "s"}`);
    })();

    const t5: TileInfo = (() => {
      if (body.trim() || compiledInWay.length > 0)
        return tile(5, "has_content", "Named");
      return tile(
        5,
        complete ? "nothing_here" : "needs_you",
        complete ? "Nothing here" : "Needs you",
      );
    })();

    const t6: TileInfo =
      wwN === 0
        ? tile(6, "nothing_here", "Nothing here")
        : tile(6, "has_content", `${wwN} item${wwN === 1 ? "" : "s"}`);

    const t7: TileInfo =
      evaN === 0
        ? tile(7, "nothing_here", "Nothing here")
        : tile(7, "has_content", `${evaN} day${evaN === 1 ? "" : "s"}`);

    const t8: TileInfo = oneThing.trim()
      ? tile(8, "has_content", "Named")
      : tile(8, complete ? "nothing_here" : "needs_you", complete ? "Nothing here" : "Needs you");

    const t9: TileInfo = (() => {
      if (!book || Object.keys(book).length === 0)
        return tile(9, "nothing_here", "Nothing here");
      const n = Number(book.trade_count);
      if (!Number.isFinite(n) || n <= 0)
        return tile(9, "has_content", "Book sample");
      return tile(9, "has_content", `${n} trade${n === 1 ? "" : "s"}`);
    })();

    return [t1, t2, t3, t4, t5, t6, t7, t8, t9];
  }, [
    body,
    oneThing,
    compiledInWay.length,
    book,
    behaviorTags.length,
    carryForward,
    clusterStatements.length,
    contextTags.length,
    data?.status,
    deviations.length,
    expectedVsActual,
    insightTags.length,
    isMaiden,
    journalWords.length,
    periodIndicator,
    whatWorked.length,
  ]);

  // Default focus: first "needs you", else step 1 (Coach L4)
  useEffect(() => {
    if (!data || focusInitialized) return;
    const needs = ceremonyTiles.find((t) => t.state === "needs_you");
    setFocusedStep(needs?.id ?? 1);
    setFocusInitialized(true);
  }, [data, ceremonyTiles, focusInitialized]);

  const headingAccountId = (() => {
    const scope = asDict(asDict(data?.report)?.account_scope);
    const raw = scope?.account_id;
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const heading = useRetroHeading({
    scopeStart: data?.scope_start,
    scopeEnd: data?.scope_end,
    accountId: headingAccountId,
    comparison: data?.comparison,
    periodBrief: asDict(asDict(data?.report)?.period_brief),
    periodProcess: asDict(asDict(data?.report)?.process),
    integrity:
      asDict(asDict(data?.report)?.integrity_review) ||
      asDict(asDict(asDict(data?.report)?.process)?.integrity),
    isMaiden: Boolean(
      data?.is_maiden || asDict(asDict(data?.report)?.meta)?.is_maiden,
    ),
  });

  if (err && !data) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {err}
      </p>
    );
  }
  if (!data) {
    return (
      <p className="text-sm text-[var(--color-label-tertiary)]">Loading…</p>
    );
  }

  const adherence = asDict(process?.adherence);
  const routine = asDict(process?.routine);
  const live = asDict(process?.live);
  const learning = asDict(process?.learning);

  return (
    <div
      className="space-y-5"
      data-testid="retrospective-workspace"
      data-book-expanded={bookExpanded ? "1" : "0"}
      data-book-pref-ready={bookPrefReady ? "1" : "0"}
    >
      <RetroHeadingCard
        model={heading.model}
        loading={heading.loading}
        kicker={
          data.is_maiden
            ? "Maiden journey · opening reckoning"
            : "Retrospective · opening reckoning"
        }
      />

      {/* Header chrome */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
            {data.is_maiden ? "Maiden journey" : "Retrospective"} · {data.status}
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={data.status === "complete"}
            className="mt-1 w-full max-w-xl border-0 bg-transparent text-2xl font-semibold text-[var(--color-label)] outline-none focus:ring-0"
          />
          <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
            Scope {fmtDate(data.scope_start)} → {fmtDate(data.scope_end)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.status !== "complete" && (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={reGather}
              >
                Re-gather
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={saveNotes}
              >
                {saveState === "saving"
                  ? "Saving…"
                  : saveState === "saved"
                    ? "Saved"
                    : "Save"}
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={busy}
                onClick={complete}
              >
                Done
              </Button>
            </>
          )}
          <Link href="/app/retrospective">
            <Button type="button" variant="plain">
              All retrospectives
            </Button>
          </Link>
        </div>
      </div>

      {err && (
        <p className="text-sm text-red-600" role="alert">
          {err}
        </p>
      )}

      {/* Spec §9 interruption notice — before ceremony body; stated, not scolded */}
      {data.interrupted && (
        <div
          className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-fill)]/50 px-4 py-3 text-sm text-[var(--color-label)]"
          data-testid="retro-interruption-notice"
          role="status"
          data-tone={str(
            asDict(data.interruption)?.tone,
            "stated_not_scolded",
          )}
        >
          <p className="font-medium">
            {str(
              asDict(data.interruption)?.notice,
              `Your cadence was interrupted — no review completed for a prior period. This one covers ${fmtDate(data.scope_start)} → ${fmtDate(data.scope_end)}. The window is stamped; it does not rewrite.`,
            )}
          </p>
        </div>
      )}

      <RetroPeriodBrief brief={asDict(report?.period_brief)} />

      {/* Period path — graphical window for scope; process detail is the map below */}
      <RetroPeriodWindow
        scopeStart={data.scope_start}
        scopeEnd={data.scope_end}
        accountId={(() => {
          const scope = asDict(report?.account_scope);
          const raw = scope?.account_id;
          if (raw == null || raw === "") return null;
          const n = Number(raw);
          return Number.isFinite(n) && n > 0 ? n : null;
        })()}
        accountLabel={
          str(asDict(report?.account_scope)?.label, "All accounts") ||
          "All accounts"
        }
        readOnly={data.status === "complete"}
      />

      {/* Spec §6.2 — persistent 3×3 ceremony map; only multi-column chrome */}
      <div
        className="grid grid-cols-3 gap-1.5 sm:gap-2"
        role="tablist"
        aria-label="Ceremony steps"
        data-testid="ceremony-step-nav"
        data-layout="map-3x3"
      >
        {ceremonyTiles.map((t) => {
          const selected = focusedStep === t.id;
          const needsYou = t.state === "needs_you";
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`ceremony-step-${t.id}`}
              id={`ceremony-tab-${t.id}`}
              onClick={() => {
                setFocusedStep(t.id);
                if (t.id === 5) {
                  window.requestAnimationFrame(() => causeRef.current?.focus());
                }
                if (t.id === 8) {
                  window.requestAnimationFrame(() =>
                    oneThingRef.current?.focus(),
                  );
                }
              }}
              data-testid={`ceremony-nav-${t.id}`}
              data-tile-state={t.state}
              data-needs-you={needsYou ? "1" : "0"}
              className={[
                "flex min-h-[4.25rem] flex-col items-stretch rounded-[var(--radius-md)] border px-2 py-2 text-left transition-colors sm:min-h-[4.75rem] sm:px-2.5",
                selected
                  ? "border-[var(--color-tint)] bg-[var(--color-tint)]/10 ring-2 ring-[var(--color-tint)]"
                  : "border-[var(--color-separator)] bg-[var(--color-surface)] hover:border-[var(--color-label-tertiary)]",
                needsYou && !selected
                  ? "border-[var(--color-tint)]/60 bg-[var(--color-tint)]/5"
                  : "",
                t.state === "nothing_here" && !selected
                  ? "opacity-75"
                  : "",
              ].join(" ")}
            >
              <span className="flex items-baseline justify-between gap-1">
                <span
                  className={[
                    "text-[11px] font-semibold tabular-nums sm:text-xs",
                    selected
                      ? "text-[var(--color-tint)]"
                      : "text-[var(--color-label-tertiary)]",
                  ].join(" ")}
                >
                  {t.id}
                </span>
                {needsYou && (
                  <span
                    className="rounded-full bg-[var(--color-tint)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--color-on-tint)]"
                    data-testid={`ceremony-tile-needs-you-${t.id}`}
                  >
                    You
                  </span>
                )}
              </span>
              <span className="mt-0.5 text-[11px] font-medium leading-tight text-[var(--color-label)] sm:text-xs">
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.title}</span>
              </span>
              <span
                className={[
                  "mt-auto pt-1 text-[10px] leading-snug sm:text-[11px]",
                  needsYou
                    ? "font-medium text-[var(--color-tint)]"
                    : "text-[var(--color-label-tertiary)]",
                ].join(" ")}
                data-testid={`ceremony-tile-summary-${t.id}`}
              >
                {t.summary}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="space-y-5 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-2)]"
        data-testid="retro-write-answers"
      >
        <p className="text-[length:var(--text-title-3)] font-semibold tracking-tight text-[var(--color-label)]">
          From your journal
        </p>
        <CompileList
          title="What you said you'd do"
          rows={compiledSaid}
          empty="Nothing captured this window."
          testId="retro-compile-said"
        />
        <CompileList
          title="What got in the way"
          rows={compiledInWay}
          empty="Nothing named."
          testId="retro-compile-in-the-way"
        />
        <CompileList
          title="What worked"
          rows={compiledWorked}
          empty="Nothing named."
          testId="retro-compile-worked"
        />
        <CompileList
          title="Open threads"
          rows={compiledNext}
          empty="No carry-forward notes."
          testId="retro-compile-next"
        />
        <WriteField
          id="retro-one-thing"
          label="The fix"
          value={oneThing}
          onChange={setOneThing}
          disabled={data.status === "complete"}
          placeholder="One checkable thing for next time"
          inputRef={oneThingRef}
          testId="retro-onething-input"
        />
        <WriteField
          id="retro-cause"
          label="Add anything the journal missed"
          value={body}
          onChange={setBody}
          disabled={data.status === "complete"}
          placeholder="Optional"
          inputRef={causeRef}
          testId="retro-cause-input"
        />
      </div>

      {/* Inventory for the selected tile — look, not a form */}
      <div data-testid="ceremony-step-body" data-focused-step={focusedStep}>

      {/* 1. Commitments / carry-forward — always present (§6.1 nothing-here) */}
      <Step focusedStep={focusedStep} step={1} title="Commitments" testId="retro-carry-forward">
          {isMaiden ? (
            <NothingHere testId="retro-cf-maiden" />
          ) : carryForward && asList(carryForward.plans).length > 0 ? (
            <ul className="space-y-3 text-sm">
              {asList(carryForward.plans).map((p, i) => {
                const planId = Number(p.id);
                const planStatus = str(p.status);
                const assessment = str(
                  p.self_assessment ??
                    (["kept", "partial", "lapsed"].includes(planStatus)
                      ? planStatus
                      : null),
                  "",
                );
                // Member-set only while plan is active and retro not complete
                const canAssess =
                  data.status !== "complete" &&
                  !Number.isNaN(planId) &&
                  planStatus === "active";
                return (
                  <li
                    key={str(p.id, String(i))}
                    data-testid={`retro-cf-plan-${str(p.id, String(i))}`}
                    className="rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-3"
                  >
                    <p className="font-medium text-[var(--color-label)]">
                      {str(p.title, str(p.habit))}
                    </p>
                    {p.habit != null && str(p.habit) !== str(p.title) && (
                      <p className="text-xs text-[var(--color-label-secondary)]">
                        {str(p.habit)}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
                      Observable signal: {str(p.observable_signal)}
                      {p.committed_on != null && (
                        <> · committed {fmtDate(str(p.committed_on))}</>
                      )}
                    </p>
                    {(p.signal_this_window != null ||
                      p.signal_prior_window != null) && (
                      <p className="mt-1 text-xs text-[var(--color-label-secondary)]">
                        You committed to {str(p.habit || p.title)}. Signal this
                        window: {num(p.signal_this_window)}
                        {p.signal_prior_window != null && (
                          <> (prior {num(p.signal_prior_window)})</>
                        )}
                        .
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-[var(--color-label-tertiary)]">
                        Self-assessment
                      </span>
                      {canAssess ? (
                        SELF_ASSESSMENT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={busy}
                            data-testid={`retro-cf-assess-${opt.value}-${planId}`}
                            onClick={() =>
                              setPlanAssessment(planId, opt.value)
                            }
                            className="rounded-full border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-label)] hover:bg-[var(--color-fill-quaternary)] disabled:opacity-50"
                          >
                            {opt.label}
                          </button>
                        ))
                      ) : (
                        <span
                          className="text-xs font-medium text-[var(--color-label-secondary)]"
                          data-testid={`retro-cf-assessment-${str(p.id)}`}
                        >
                          {assessment
                            ? SELF_ASSESSMENT_OPTIONS.find(
                                (o) => o.value === assessment,
                              )?.label || assessment
                            : planStatus === "active"
                              ? "Not set"
                              : str(p.status)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p
              className="text-sm text-[var(--color-label-secondary)]"
              data-testid="retro-cf-empty"
            >
              {str(carryForward?.empty_message, CARRY_FORWARD_EMPTY)}
            </p>
          )}
      </Step>

      {/* 2. Practice — period-scoped indicator only (Spec §7; never + rolling) */}
      <Step focusedStep={focusedStep} step={2} title="Practice" testId="retro-process">
        {periodIndicator ? (
          <div
            className="mt-3"
            data-testid="retro-period-indicator"
            data-context={str(periodIndicator.context, "period")}
            data-status={str(periodIndicator.status)}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              Context: period
            </p>
            <p className="mt-1 text-xl font-semibold text-[var(--color-label)]">
              {str(periodIndicator.headline)}
            </p>
            <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
              {str(
                periodIndicator.summary,
                str(periodIndicator.pattern, ""),
              )}
            </p>
            {asList(periodIndicator.readings).length > 0 && (
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                {asList(periodIndicator.readings).map((r) => {
                  const id = str(r.id);
                  const unit = str(r.unit);
                  let display = num(r.value);
                  if (r.value != null && unit === "rate") {
                    display = `${Math.round(Number(r.value) * 100)}%`;
                  }
                  return (
                    <div key={id}>
                      <dt className="text-[var(--color-label-tertiary)]">
                        {str(r.label)}
                      </dt>
                      <dd className="text-lg font-semibold tabular-nums">
                        {display}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
            <p className="mt-2 text-xs text-[var(--color-label-tertiary)]">
              n={num(periodIndicator.trade_count)} trades · window{" "}
              {num(periodIndicator.window_days)}d
              {periodIndicator.status === "not_enough_yet" &&
                ` · floor ${num(periodIndicator.min_inference_n)}`}
            </p>
          </div>
        ) : process ? (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[var(--color-label-tertiary)]">
                Activity days / wk
              </dt>
              <dd className="text-lg font-semibold tabular-nums">
                {num(
                  routine?.activity_days_per_week ?? process.trade_days,
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-label-tertiary)]">
                Followed+partial
              </dt>
              <dd className="text-lg font-semibold tabular-nums">
                {adherence?.followed_or_partial_rate != null
                  ? `${Math.round(
                      Number(adherence.followed_or_partial_rate) * 100,
                    )}%`
                  : num(
                      adherence
                        ? Number(adherence.followed || 0) +
                            Number(adherence.partial || 0)
                        : null,
                    )}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-label-tertiary)]">
                Live check-ins / wk
              </dt>
              <dd className="tabular-nums">
                {num(live?.checkins_per_week ?? process.live_checkins)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-label-tertiary)]">
                Lessons / wk
              </dt>
              <dd className="tabular-nums">
                {num(
                  learning?.lesson_days_per_week ?? process.lessons_completed,
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <NothingHere testId="retro-process-empty" />
        )}
        {/* Rolling integrity grade intentionally not rendered here (§7 one frame). */}
        {integrity && (
          <p className="sr-only" data-testid="retro-integrity-hidden-rolling">
            Rolling integrity available for comparison only, not co-displayed.
          </p>
        )}
      </Step>

      {/* 3. Obstacles — deviations + emotion mirror (Spec §8.1) */}
      <Step focusedStep={focusedStep} step={3} title="Obstacles" testId="retro-deviations">
        {/* Emotion mirror — Behavior tags + journal words only */}
        <div
          className="mb-4 space-y-3"
          data-testid="retro-emotion-mirror"
          data-feeds-indicator="false"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-label-tertiary)]">
            Emotion mirror · your language
          </p>
          {behaviorTags.length === 0 && journalWords.length === 0 ? (
            <NothingHere testId="retro-emotion-mirror-empty">
              {str(
                emotionMirror?.empty_message,
                "Nothing from Behavior tags or your journal words this period.",
              )}
            </NothingHere>
          ) : (
            <>
              {behaviorTags.length > 0 && (
                <ul
                  className="space-y-2 text-sm"
                  data-testid="retro-behavior-tags"
                >
                  {behaviorTags.map((t, i) => (
                    <li
                      key={`${str(t.slug)}-${i}`}
                      data-testid={`retro-behavior-tag-${i}`}
                      data-source="tag"
                      className="rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-2"
                    >
                      <p className="text-[var(--color-label)]">
                        {str(t.mirror)}
                      </p>
                      <p className="mt-0.5 text-[11px] tabular-nums text-[var(--color-label-tertiary)]">
                        ×{num(t.count)}
                        {Array.isArray(t.days) && t.days.length > 0
                          ? ` · ${(t.days as unknown[])
                              .map((d) => str(d))
                              .filter((d) => d !== "—")
                              .join(", ")}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {journalWords.length > 0 && (
                <ul
                  className="space-y-2 text-sm"
                  data-testid="retro-journal-words"
                >
                  {journalWords.map((j, i) => (
                    <li
                      key={`${str(j.message_id)}-${i}`}
                      data-testid={`retro-journal-word-${i}`}
                      data-source="member_message"
                      className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-separator)] px-3 py-2"
                    >
                      <p className="text-[var(--color-label)]">
                        {str(j.mirror)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Process deviations inventory (facts, not tag scores) */}
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-label-tertiary)]">
          Process inventory
        </p>
        {deviations.length === 0 ? (
          <NothingHere testId="retro-deviations-empty" />
        ) : (
          <ul className="space-y-2 text-sm">
            {deviations.map((d, i) => (
              <li
                key={`${str(d.kind)}-${i}`}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-2"
              >
                <div>
                  <p className="font-medium text-[var(--color-label)]">
                    {str(d.label)}
                  </p>
                  {d.note != null && (
                    <p className="text-xs text-[var(--color-label-tertiary)]">
                      {str(d.note)}
                    </p>
                  )}
                </div>
                <p className="tabular-nums text-[var(--color-label-secondary)]">
                  ×{num(d.count)}
                  {d.rate != null && (
                    <span className="ml-1 text-xs">
                      ({Math.round(Number(d.rate) * 100)}%)
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Step>

      {/* 4. Clustering — co-occurrence + context inventory (Spec §8.2 · R5) */}
      <Step focusedStep={focusedStep} step={4} title="Where it clustered" testId="retro-clustered">
        {clusterStatements.length === 0 && contextTags.length === 0 ? (
          <NothingHere testId="retro-clustered-empty">
            {str(
              clustering?.empty_message,
              "No co-occurrence stood out this period — inventory only.",
            )}
          </NothingHere>
        ) : (
          <>
            {clusterStatements.length > 0 && (
              <ul
                className="mb-4 space-y-2 text-sm"
                data-testid="retro-cluster-statements"
              >
                {clusterStatements.map((s, i) => (
                  <li
                    key={i}
                    data-testid={`retro-cluster-stmt-${i}`}
                    data-kind={str(s.kind, "")}
                    className="rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-2"
                  >
                    <p className="text-[var(--color-label)]">
                      {str(s.observation)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {contextTags.length > 0 && (
              <>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  Context you marked
                </p>
                <ul
                  className="space-y-2 text-sm"
                  data-testid="retro-context-tags"
                >
                  {contextTags.map((t, i) => (
                    <li
                      key={`${str(t.slug)}-${i}`}
                      data-testid={`retro-context-tag-${i}`}
                      className="flex flex-wrap items-baseline justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-2"
                    >
                      <p className="text-[var(--color-label)]">
                        {str(t.mirror)}
                      </p>
                      <p className="tabular-nums text-[var(--color-label-secondary)]">
                        ×{num(t.count)}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        {clustering?.note != null && (
          <p className="mt-2 text-xs text-[var(--color-label-tertiary)]">
            {str(clustering.note)}
          </p>
        )}

        {/* Correlation — process damage only; never P&L (§13) */}
        <div
          className="mt-5 border-t border-[var(--color-separator)] pt-4"
          data-testid="retro-correlation"
          data-excludes-pnl="true"
        >
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-label-tertiary)]">
            Correlation · process only — never to P&L
          </p>
          {correlationStatements.length === 0 ? (
            <NothingHere testId="retro-correlation-empty">
              {str(
                correlation?.empty_message,
                "Not enough paired process observations yet.",
              )}
            </NothingHere>
          ) : (
            <ul className="space-y-2 text-sm" data-testid="retro-correlation-list">
              {correlationStatements.map((s, i) => (
                <li
                  key={i}
                  data-testid={`retro-correlation-${i}`}
                  data-layer={str(s.layer, "")}
                  className="rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-2"
                >
                  <p className="text-[var(--color-label)]">
                    {str(s.observation)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Step>

      {/* 6. What worked — process strengths + Insight tags you named */}
      <Step focusedStep={focusedStep} step={6} title="What worked" testId="retro-what-worked">
        {whatWorked.length === 0 && insightTags.length === 0 ? (
          <NothingHere testId="retro-what-worked-empty" />
        ) : (
          <ul className="space-y-2 text-sm" data-testid="retro-what-worked-list">
            {whatWorked.map((w, i) => (
              <li
                key={i}
                data-testid={`retro-what-worked-${i}`}
                className="rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-2"
              >
                <p className="font-medium text-[var(--color-label)]">
                  {str(w.observation)}
                </p>
                {w.evidence != null && str(w.evidence, "") !== "" && (
                  <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
                    {str(w.evidence)}
                    {w.window_n != null && Number(w.window_n) > 0
                      ? ` · n=${num(w.window_n)}`
                      : ""}
                  </p>
                )}
              </li>
            ))}
            {insightTags.map((t, i) => (
              <li
                key={`insight-${str(t.slug)}-${i}`}
                data-testid={`retro-insight-tag-${i}`}
                data-source="tag"
                className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-separator)] px-3 py-2"
              >
                <p className="font-medium text-[var(--color-label)]">
                  {str(t.mirror)}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
                  Insight tag · your label
                </p>
              </li>
            ))}
          </ul>
        )}
      </Step>

      {/* 7. Expected vs actual — always present */}
      <Step focusedStep={focusedStep} step={7} title="Expected versus actual" testId="retro-expected-vs-actual">
          {expectedVsActual == null || asList(expectedVsActual).length === 0 ? (
            <NothingHere testId="retro-eva-empty" />
          ) : (
            <ul
              className="space-y-3 text-sm"
              data-testid="retro-expected-vs-actual-list"
            >
              {asList(expectedVsActual).map((row, i) => (
                <li
                  key={i}
                  data-testid={`retro-eva-${i}`}
                  className="rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-3"
                >
                  <p className="text-xs font-medium text-[var(--color-label-tertiary)]">
                    {str(row.day)}
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                        Stated intent
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[var(--color-label)]">
                        {str(row.stated_intent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                        What executed
                      </p>
                      <p className="mt-1 text-[var(--color-label-secondary)]">
                        {str(row.what_executed)}
                      </p>
                    </div>
                  </div>
                  {row.gap != null && str(row.gap, "") !== "" && (
                    <div className="mt-2 border-t border-[var(--color-separator)] pt-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                        Gap (your note)
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-label-secondary)]">
                        {str(row.gap)}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
      </Step>

      {/* Rate-normalized trends (§12) — under practice context (step 2) */}
      {focusedStep === 2 && trends && (
        <div
          className="mt-4 surface-card border border-[var(--color-separator)] p-5"
          data-testid="retro-trends"
          data-status={str(trends.status)}
          data-feeds-indicator="false"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
            Trends · rates only
          </h2>
          <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
            {str(trends.message)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
            Cycles: {num(trends.cycle_count)} · floor {num(trends.min_cycles)} ·
            tag frequency reported, never scored
          </p>
          {trendSeries.length > 0 && (
            <ul className="mt-3 space-y-2 text-sm" data-testid="retro-trend-series">
              {trendSeries.map((s, i) => {
                const pts = Array.isArray(s.points) ? s.points : [];
                const last = pts.length
                  ? (pts[pts.length - 1] as Dict)
                  : null;
                return (
                  <li
                    key={str(s.id, String(i))}
                    data-testid={`retro-trend-${str(s.id, String(i))}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-[var(--color-label)]">
                        {str(s.label)}
                      </p>
                      {s.trend_asserted ? (
                        <p className="text-xs text-[var(--color-label-tertiary)]">
                          Direction: {str(s.direction, "—")}
                        </p>
                      ) : (
                        <p className="text-xs text-[var(--color-label-tertiary)]">
                          No direction below floor
                        </p>
                      )}
                    </div>
                    <p className="tabular-nums text-[var(--color-label-secondary)]">
                      {last != null ? num(last.value) : "—"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          {tagTrendSeries.length > 0 && trends.status === "trend_readable" && (
            <ul
              className="mt-3 space-y-1 text-xs text-[var(--color-label-secondary)]"
              data-testid="retro-tag-trend-series"
            >
              {tagTrendSeries.slice(0, 4).map((s, i) => (
                <li key={str(s.id, String(i))}>
                  {str(s.label)}
                  {s.trend_asserted ? ` · ${str(s.direction)}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Comparison — under practice context (step 2) */}
      {focusedStep === 2 && comparison && (
        <div
          className="mt-4 surface-card border border-[var(--color-separator)] p-5"
          data-testid="retro-comparison"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
            {comparison.has_prior
              ? str(comparison.label, "Progress comparison")
              : "Baseline"}
          </h2>
          <div className="mt-3">
          {!comparison.has_prior ? (
            <p
              className="text-sm text-[var(--color-label-secondary)]"
              data-testid="retro-comparison-maiden"
            >
              {str(
                comparison.label,
                "Maiden journey — this becomes your baseline",
              )}
            </p>
          ) : (
            <div data-testid="retro-comparison-metrics">
              <p className="text-xs text-[var(--color-label-tertiary)]">
                Rates with denominators. When windows are not comparable, both
                values are shown without trend or score language.
              </p>
              {asList(comparison.metrics).length === 0 ? (
                <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
                  No comparison metrics for this pair yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {asList(comparison.metrics).map((m) => {
                    const mid = str(m.metric, "metric");
                    const comparable = Boolean(m.comparable);
                    const cur = asDict(m.current);
                    const prev = asDict(m.previous);
                    const reasonKey = str(m.comparable_reason, "");
                    const reason =
                      COMPARABLE_REASON_COPY[reasonKey] ||
                      (reasonKey ? reasonKey.replace(/_/g, " ") : "");
                    return (
                      <li
                        key={mid}
                        data-testid={`retro-cmp-${mid}`}
                        data-comparable={comparable ? "1" : "0"}
                        className="rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-2 text-sm"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-medium text-[var(--color-label)]">
                            {METRIC_LABELS[mid] || mid}
                          </p>
                          {!comparable && (
                            <span
                              className="text-xs text-[var(--color-label-tertiary)]"
                              data-testid={`retro-cmp-${mid}-not-comparable`}
                            >
                              Not comparable
                            </span>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-[var(--color-label-tertiary)]">
                              This window
                              {cur?.window_days != null
                                ? ` (${num(cur.window_days)}d)`
                                : ""}
                            </p>
                            <p className="tabular-nums text-[var(--color-label)]">
                              {formatMetricValue(mid, cur?.value)}
                            </p>
                            {cur?.n != null && (
                              <p className="text-xs text-[var(--color-label-tertiary)]">
                                n={num(cur.n)}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-label-tertiary)]">
                              Previous
                              {prev?.window_days != null
                                ? ` (${num(prev.window_days)}d)`
                                : ""}
                            </p>
                            <p className="tabular-nums text-[var(--color-label)]">
                              {formatMetricValue(mid, prev?.value)}
                            </p>
                            {prev?.n != null && (
                              <p className="text-xs text-[var(--color-label-tertiary)]">
                                n={num(prev.n)}
                              </p>
                            )}
                          </div>
                        </div>
                        {!comparable && reason && (
                          <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
                            {reason}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {/* Grades as labels only — no arrow/delta when not comparable */}
              {(comparison.prior_integrity_grade != null ||
                comparison.current_integrity_grade != null) && (
                <p className="mt-3 text-xs text-[var(--color-label-secondary)]">
                  Integrity labels: this window{" "}
                  <span className="font-medium">
                    {str(comparison.current_integrity_grade)}
                  </span>
                  {"; "}
                  previous{" "}
                  <span className="font-medium">
                    {str(comparison.prior_integrity_grade)}
                  </span>
                  {comparison.integrity_direction != null &&
                  comparison.integrity_percent_delta != null ? (
                    <span className="text-[var(--color-label-tertiary)]">
                      {" "}
                      · direction (comparable only):{" "}
                      {str(comparison.integrity_direction)}
                    </span>
                  ) : null}
                </p>
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {/* 9. The book — last, collapsed by default; account-scoped at gather (§2 / §4) */}
      <Step focusedStep={focusedStep} step={9} title="The book" testId="retro-book">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            {!bookExpanded && (
              <p className="max-w-xl text-sm text-[var(--color-label-secondary)]">
                {str(book?.collapsed_summary, BOOK_COLLAPSED_FALLBACK)}
              </p>
            )}
            {(() => {
              const scope = asDict(report?.account_scope);
              const label = scope
                ? str(scope.label, "All accounts")
                : "All accounts";
              return (
                <p
                  className="mt-1 text-xs text-[var(--color-label-tertiary)]"
                  data-testid="retro-book-account-scope"
                >
                  Book account at gather:{" "}
                  <span className="font-medium text-[var(--color-label-secondary)]">
                    {label}
                  </span>
                  {data.status === "complete" &&
                    " · fixed (chrome account does not change this)"}
                </p>
              );
            })()}
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={!bookPrefReady}
            onClick={toggleBook}
            data-testid="retro-book-toggle"
          >
            {bookExpanded ? "Hide book sample" : "Show book sample"}
          </Button>
        </div>
        {bookExpanded && (
          <div className="mt-4" data-testid="retro-book-body">
            {book ? (
              <>
                {book.sample_below_min && book.sample_banner && (
                  <p
                    className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-fill-quaternary)] px-3 py-2 text-sm text-[var(--color-label-secondary)]"
                    data-testid="retro-sample-banner"
                    role="status"
                  >
                    {str(book.sample_banner)}
                    <span className="ml-2 tabular-nums text-xs text-[var(--color-label-tertiary)]">
                      n={num(book.trade_count)}
                    </span>
                  </p>
                )}
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-[var(--color-label-tertiary)]">
                      Trades
                    </dt>
                    <dd className="text-lg font-semibold tabular-nums">
                      {num(book.trade_count)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-label-tertiary)]">
                      Net P&amp;L
                    </dt>
                    <dd className="text-lg font-semibold tabular-nums">
                      {num(book.net_pnl)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-label-tertiary)]">
                      Winners
                    </dt>
                    <dd className="tabular-nums">{num(book.winners)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-label-tertiary)]">
                      Losers
                    </dt>
                    <dd className="tabular-nums">{num(book.losers)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-[var(--color-label-tertiary)]">
                  {str(book.note, "Neutral book context — not a success score.")}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--color-label-secondary)]">
                No book sample yet — run gather.
              </p>
            )}
          </div>
        )}
      </Step>

      </div>
      {/* end ceremony-step-body */}

      {/* Sequence agent — outside the nine tiles (Spec §16); not a 10th step */}
      <details
        className="surface-card border border-[var(--color-separator)] p-5"
        data-testid="retro-agent"
        data-role="sequence_keeper"
      >
        <summary className="cursor-pointer text-sm font-semibold text-[var(--color-label-secondary)]">
          Sequence helper
        </summary>
        {data.prompt_version_id != null && (
          <p
            className="mt-1 text-[11px] text-[var(--color-label-tertiary)]"
            data-testid="retro-prompt-version"
          >
            Prompt version: {str(data.prompt_version_id)}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={
              busy ||
              !data.report ||
              (data.status !== "ready" && data.status !== "complete")
            }
            onClick={runSequenceAgent}
            data-testid="retro-agent-run"
          >
            {busy ? "Running…" : "Refresh sequence for current step"}
          </Button>
        </div>

        {(() => {
          const agent = asDict(data.agent);
          if (!agent) {
            return (
              <p className="mt-3 text-xs text-[var(--color-label-tertiary)]">
                No sequence yet. Gather first, then refresh (server:
                LABS_RETRO_AGENT_MODE=local).
              </p>
            );
          }
          const turn = asDict(agent.turn);
          const steps = asList(agent.steps);
          const role = str(agent.role, "sequence_keeper");
          return (
            <div className="mt-4 space-y-4" data-testid="retro-agent-results">
              <p className="text-[11px] text-[var(--color-label-tertiary)]">
                Role: {role}
                {agent.meta != null &&
                  asDict(agent.meta)?.prescribes === false && (
                    <> · does not prescribe</>
                  )}
              </p>
              {turn && (
                <div
                  className="rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-3"
                  data-testid="retro-agent-turn"
                  data-step={str(turn.step_id)}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                    Focus · step {str(turn.step_id)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-label)]">
                    {str(turn.question)}
                  </p>
                  {turn.nothing_here === true && (
                    <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
                      Nothing here in inventory — still answer or skip
                      explicitly in the ceremony step.
                    </p>
                  )}
                  {asList(turn.inventory).length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-[var(--color-label-secondary)]">
                      {asList(turn.inventory)
                        .slice(0, 6)
                        .map((inv, i) => (
                          <li key={i}>· {str(inv.label)}</li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
              {steps.length > 0 && (
                <ol
                  className="flex flex-wrap gap-1.5 text-[11px]"
                  data-testid="retro-agent-step-strip"
                  aria-label="Sequence steps (all present — not a wizard)"
                >
                  {steps.map((s) => (
                    <li
                      key={str(s.id)}
                      className={[
                        "rounded-full px-2 py-0.5",
                        s.is_focused
                          ? "bg-[var(--color-tint)] text-[var(--color-on-tint)]"
                          : "bg-[var(--color-fill)] text-[var(--color-label-secondary)]",
                      ].join(" ")}
                      data-status={str(s.status)}
                    >
                      {str(s.id)}
                      {s.nothing_here === true ? " · ∅" : ""}
                    </li>
                  ))}
                </ol>
              )}
              {proposedPlans.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                    Your proposed plans
                  </h3>
                  <ul className="mt-2 space-y-3">
                    {proposedPlans.map((p, i) => (
                      <li
                        key={i}
                        data-testid={`retro-agent-plan-${i}`}
                        className="rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-3 text-sm"
                      >
                        <p className="text-sm">{str(p.habit, str(p.title))}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="primary"
                            disabled={busy}
                            onClick={() => acceptProposedPlan(i)}
                            data-testid={`retro-agent-accept-${i}`}
                          >
                            Accept
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => rejectProposedPlan(i)}
                            data-testid={`retro-agent-reject-${i}`}
                          >
                            Reject
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })()}
      </details>
    </div>
  );
}
