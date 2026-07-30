"use client";

/**
 * Retrospective workspace — Spec v0.5 §6 render order (RT2-3).
 * Contract: Architecture/12-retrospective-report-dto.md
 * Copy: Tango RT0-3 (no success/fail moralizing; book last collapsed).
 */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui";
import {
  analyzeRetrospective,
  completeRetrospective,
  createHabitPlan,
  gatherRetrospective,
  getRetrospective,
  patchHabitPlan,
  patchRetrospective,
  type Retrospective,
} from "@/lib/retrospectiveApi";

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

function Section({
  title,
  children,
  testId,
  dashed,
}: {
  title: string;
  children: ReactNode;
  testId?: string;
  dashed?: boolean;
}) {
  return (
    <section
      data-testid={testId}
      className={`surface-card border p-5 ${
        dashed
          ? "border-dashed border-[var(--color-separator)]"
          : "border-[var(--color-separator)]"
      }`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function RetrospectiveWorkspace({
  retroId,
}: {
  retroId: number;
}) {
  const [data, setData] = useState<Retrospective | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  /** Book section open — default collapsed (false) until profile loads. */
  const [bookExpanded, setBookExpanded] = useState(false);
  const [bookPrefReady, setBookPrefReady] = useState(false);
  /** Proposed plans from agent — local accept/reject before create. */
  const [proposedPlans, setProposedPlans] = useState<Dict[]>([]);
  const [planEdits, setPlanEdits] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    setErr(null);
    getRetrospective(retroId)
      .then((d) => {
        setData(d);
        setBody(d.body_md || "");
        setTitle(d.title || "");
        const ag = asDict(d.agent);
        setProposedPlans(asList(ag?.habit_plans));
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"));
  }, [retroId]);

  useEffect(() => {
    load();
  }, [load]);

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
      });
      setData(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function reGather() {
    setBusy(true);
    setErr(null);
    try {
      const d = await gatherRetrospective(retroId);
      setData(d);
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
      await patchRetrospective(retroId, {
        title: title.trim(),
        body_md: body,
      });
      const d = await completeRetrospective(retroId);
      setData(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Complete failed");
    } finally {
      setBusy(false);
    }
  }

  async function runAnalysis() {
    setBusy(true);
    setErr(null);
    try {
      const d = await analyzeRetrospective(retroId);
      setData(d);
      const ag = asDict(d.agent);
      setProposedPlans(asList(ag?.habit_plans));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Analysis failed");
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
        const d = await gatherRetrospective(retroId);
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
  const book =
    asDict(report?.book_performance) || asDict(report?.pnl);
  const deviations = asList(report?.deviations);
  const whatWorked = asList(report?.what_worked);
  const expectedVsActual = report?.expected_vs_actual;
  const carryForward = asDict(report?.carry_forward);
  const comparison = asDict(data?.comparison);
  const isMaiden = Boolean(
    data?.is_maiden || asDict(report?.meta)?.is_maiden,
  );

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
                Save notes
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={busy}
                onClick={complete}
              >
                Mark complete
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

      {/* 1. Carry-forward (§6.0) — FIRST after chrome; absent for maiden only */}
      {!isMaiden && (
        <Section title="Carry-forward" testId="retro-carry-forward">
          <p className="mb-3 text-xs text-[var(--color-label-tertiary)]">
            Plans you committed to — review the work, not yourself. Set Kept,
            Partial, or Lapsed for each plan.
          </p>
          {carryForward && asList(carryForward.plans).length > 0 ? (
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
        </Section>
      )}

      {/* 2. Process performance (§6.1) */}
      <Section title="Process performance" testId="retro-process">
        <p className="text-xs text-[var(--color-label-tertiary)]">
          {str(
            process?.note,
            "How you practiced in this window — habits, not P&L theater.",
          )}
        </p>
        {process ? (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[var(--color-label-tertiary)]">
                Activity days / wk
              </dt>
              <dd className="text-lg font-semibold tabular-nums">
                {num(
                  routine?.activity_days_per_week ??
                    process.trade_days,
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
                  learning?.lesson_days_per_week ??
                    process.lessons_completed,
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-[var(--color-label-secondary)]">
            No process report yet — run gather.
          </p>
        )}
      </Section>

      {/* 3. Process Integrity (§6.2) */}
      <Section title="Process Integrity review" testId="retro-integrity">
        {integrity ? (
          <div>
            <p className="text-2xl font-semibold text-[var(--color-label)]">
              {str(integrity.grade)}
              {integrity.overall_percent != null && (
                <span className="ml-2 text-base font-medium text-[var(--color-label-secondary)]">
                  {str(integrity.overall_percent)}%
                </span>
              )}
              {integrity.direction != null && integrity.direction !== "" ? (
                <span className="ml-2 text-sm font-normal text-[var(--color-label-secondary)]">
                  · {str(integrity.direction)}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
              {str(integrity.blurb, "")}
            </p>
            <p className="mt-2 text-xs text-[var(--color-label-tertiary)]">
              {str(
                integrity.note,
                "Integrity describes how you practiced — not whether the book made money.",
              )}
            </p>
            {asList(integrity.drivers).length > 0 && (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {asList(integrity.drivers).map((m) => (
                  <li
                    key={str(m.id)}
                    className="rounded-[var(--radius-md)] bg-[var(--color-fill-quaternary)] px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{str(m.label)}</span>
                    {m.percent != null && (
                      <span className="ml-2 tabular-nums text-[var(--color-label-secondary)]">
                        {str(m.percent)}%
                      </span>
                    )}
                    {m.grade != null && (
                      <span className="ml-1 text-xs text-[var(--color-label-tertiary)]">
                        {str(m.grade)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-label-secondary)]">
            Integrity snapshot appears after gather.
          </p>
        )}
      </Section>

      {/* 4. Deviations (§6.3) */}
      <Section title="Bounded deviations" testId="retro-deviations">
        {deviations.length === 0 ? (
          <p className="text-sm text-[var(--color-label-secondary)]">
            No process deviations listed for this window.
          </p>
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
      </Section>

      {/* 5. What worked (§6.4) — process strengths; adverse rows never show $ */}
      <Section title="What worked" testId="retro-what-worked">
        <p className="mb-2 text-xs text-[var(--color-label-tertiary)]">
          Process strengths in this window — not P&amp;L theater.
        </p>
        {whatWorked.length === 0 ? (
          <p
            className="text-sm text-[var(--color-label-secondary)]"
            data-testid="retro-what-worked-empty"
          >
            No process strengths listed for this window yet. Strengths show up
            when adherence runs, routine stretches, or process-held days are
            visible in the data.
          </p>
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
          </ul>
        )}
      </Section>

      {/* 6. Expected vs actual (§6.5) — omit when null (no pre_market) */}
      {expectedVsActual != null && (
        <Section title="Expected vs actual" testId="retro-expected-vs-actual">
          <p className="mb-2 text-xs text-[var(--color-label-tertiary)]">
            Your pre-market intent (your words) vs what executed that day.
            Process pairing — not a scorecard.
          </p>
          {asList(expectedVsActual).length === 0 ? (
            <p className="text-sm text-[var(--color-label-secondary)]">
              No pre-market intents in this window.
            </p>
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
        </Section>
      )}

      {/* Comparison — Spec §7 / RT3-2: side-by-side rates; no delta when not comparable */}
      {comparison && (
        <Section
          title={
            comparison.has_prior
              ? str(comparison.label, "Progress comparison")
              : "Baseline"
          }
          testId="retro-comparison"
        >
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
        </Section>
      )}

      {/* 7. Book performance LAST, collapsed by default (§6.6) */}
      <section
        className="surface-card border border-[var(--color-separator)] p-5"
        data-testid="retro-book"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              Book performance (results)
            </h2>
            {!bookExpanded && (
              <p className="mt-1 max-w-xl text-sm text-[var(--color-label-secondary)]">
                {str(book?.collapsed_summary, BOOK_COLLAPSED_FALLBACK)}
              </p>
            )}
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
                  {str(
                    book.note,
                    "Neutral book context — not a success score.",
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--color-label-secondary)]">
                No book sample yet — run gather.
              </p>
            )}
          </div>
        )}
      </section>

      {/* 8. Member reflection */}
      <Section title="Your reflection" testId="retro-reflection">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={data.status === "complete"}
          rows={8}
          placeholder="What did this period teach you about your process?"
          className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-tint)] disabled:opacity-70"
        />
      </Section>

      {/* 9. Agent analysis (R5) — optional facilitator; dual report works without it */}
      <Section title="Agent analysis" testId="retro-agent" dashed>
        <p className="text-sm text-[var(--color-label-secondary)]">
          Optional facilitator — process only, never profit claims. You accept,
          edit, or reject every plan. The dual report above works without
          running analysis.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={
              busy ||
              !data.report ||
              (data.status !== "ready" && data.status !== "complete")
            }
            onClick={runAnalysis}
            data-testid="retro-agent-run"
          >
            {busy ? "Running…" : "Run analysis"}
          </Button>
        </div>

        {(() => {
          const agent = asDict(data.agent);
          if (!agent) {
            return (
              <p className="mt-3 text-xs text-[var(--color-label-tertiary)]">
                No analysis yet. Requires gather, then Run analysis (server:
                LABS_RETRO_AGENT_MODE=local).
              </p>
            );
          }
          const ww = asList(agent.what_worked);
          const concerns = asList(agent.concerns);
          const hyps = asList(agent.root_cause_hypotheses);
          return (
            <div className="mt-4 space-y-4" data-testid="retro-agent-results">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  What worked
                </h3>
                {ww.length === 0 ? (
                  <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
                    None listed.
                  </p>
                ) : (
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                    {ww.map((w, i) => (
                      <li key={i}>{str(w.observation)}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  Concerns
                </h3>
                {concerns.length === 0 ? (
                  <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
                    None listed.
                  </p>
                ) : (
                  <ul className="mt-1 space-y-2 text-sm">
                    {concerns.map((c, i) => (
                      <li
                        key={i}
                        className="rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-2"
                      >
                        <p className="font-medium">{str(c.area)}</p>
                        <p className="text-xs text-[var(--color-label-secondary)]">
                          {str(c.evidence, "")}
                          {c.severity != null && <> · {str(c.severity)}</>}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  Hypotheses (not diagnoses)
                </h3>
                {hyps.length === 0 ? (
                  <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
                    None listed.
                  </p>
                ) : (
                  <ul className="mt-1 space-y-2 text-sm">
                    {hyps.map((h, i) => (
                      <li
                        key={i}
                        className="rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-2"
                      >
                        <p>{str(h.hypothesis)}</p>
                        <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
                          Anchors:{" "}
                          {asList(h.anchors)
                            .map((a) =>
                              typeof a === "object" && a
                                ? `${str((a as Dict).type)}:${str((a as Dict).ref)}`
                                : str(a),
                            )
                            .join("; ") || "—"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  Proposed habit plans
                </h3>
                <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
                  You own activation — accept creates a proposed plan (max 2
                  active when you activate later).
                </p>
                {proposedPlans.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
                    No open proposals (accepted or none generated).
                  </p>
                ) : (
                  <ul className="mt-2 space-y-3">
                    {proposedPlans.map((p, i) => (
                      <li
                        key={i}
                        data-testid={`retro-agent-plan-${i}`}
                        className="rounded-[var(--radius-md)] border border-[var(--color-separator)] px-3 py-3 text-sm"
                      >
                        <label className="block text-xs text-[var(--color-label-tertiary)]">
                          Title (edit before accept)
                        </label>
                        <input
                          value={
                            planEdits[i] ??
                            str(p.title, str(p.habit, ""))
                          }
                          onChange={(e) =>
                            setPlanEdits((prev) => ({
                              ...prev,
                              [i]: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[var(--color-tint)]"
                        />
                        <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
                          {str(p.habit)}
                        </p>
                        <p className="text-xs text-[var(--color-label-tertiary)]">
                          Why (process): {str(p.why_process, "—")} · signal:{" "}
                          {str(p.observable_signal)}
                        </p>
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
                )}
              </div>
            </div>
          );
        })()}
      </Section>
    </div>
  );
}
