/** Client for /api/me/retrospectives + habit-plans (Spec v0.5 R4). */

export type RetroStartReadiness = {
  recommended: boolean;
  overridable: boolean;
  days: number;
  trades: number;
  min_days: number;
  min_trades: number;
  meets_days: boolean;
  meets_trades: boolean;
  notice: string | null;
};

export type RetroCadenceHistory = {
  period_count: number;
  avg_days: number | null;
  avg_trades: number | null;
  last_days: number | null;
  last_trades: number | null;
  maiden_days: number | null;
  maiden_trades: number | null;
  summary: string | null;
};

export type RetroScopePreview = {
  is_maiden: boolean;
  scope_start: string;
  scope_end: string;
  prior_id: number | null;
  prior_completed_at: string | null;
  label: string;
  /** Gentle 7-day / 5-trade floors — never a create gate. */
  readiness?: RetroStartReadiness | null;
  /** Derived from completed retros — maiden excluded from the average. */
  history?: RetroCadenceHistory | null;
};

export type Retrospective = {
  id: number;
  status: string;
  is_maiden: boolean;
  scope_start: string;
  scope_end: string;
  title: string;
  body_md: string;
  report: Record<string, unknown> | null;
  comparison: Record<string, unknown> | null;
  agent: Record<string, unknown> | null;
  prompt_version_id?: string | null;
  cadence_days_at_period?: number | null;
  period_index?: number | null;
  interrupted?: boolean;
  /** Spec §9 — structured interruption notice when period was missed */
  interruption?: {
    interrupted?: boolean;
    notice?: string;
    scope_label?: string;
    missed_label?: string;
    span_days?: number;
    expected_cadence_days?: number;
    instead_of_one?: string;
    tone?: string;
    note?: string;
  } | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type HabitPlanStatus =
  | "proposed"
  | "active"
  | "kept"
  | "partial"
  | "lapsed"
  | "retired";

export type HabitPlan = {
  id: number;
  identity_id: number;
  retrospective_id: number | null;
  title: string;
  habit: string;
  why_process: string;
  observable_signal: string;
  status: HabitPlanStatus | string;
  activated_at: string | null;
  retired_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

async function parse<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    const detail =
      typeof body.detail === "string" ? body.detail : `HTTP ${r.status}`;
    throw new Error(detail);
  }
  return r.json() as Promise<T>;
}

export async function patchHabitPlan(
  id: number,
  body: { status?: HabitPlanStatus | string; title?: string; habit?: string },
): Promise<HabitPlan> {
  const r = await fetch(`/api/me/habit-plans/${id}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse(r);
}

export async function listHabitPlans(): Promise<HabitPlan[]> {
  const r = await fetch("/api/me/habit-plans", { credentials: "same-origin" });
  const d = await parse<{ habit_plans: HabitPlan[] }>(r);
  return d.habit_plans || [];
}


export async function previewRetroScope(): Promise<RetroScopePreview> {
  const r = await fetch("/api/me/retrospectives/preview-scope", {
    credentials: "same-origin",
  });
  return parse(r);
}

export type RetrospectiveListPage = {
  retrospectives: Retrospective[];
  total: number;
  limit: number;
  offset: number;
};

/** Default page size for the retrospective library. */
export const RETRO_LIST_PAGE_SIZE = 10;

export async function listRetrospectives(opts?: {
  limit?: number;
  offset?: number;
}): Promise<RetrospectiveListPage> {
  const limit = opts?.limit ?? RETRO_LIST_PAGE_SIZE;
  const offset = opts?.offset ?? 0;
  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const r = await fetch(`/api/me/retrospectives?${qs}`, {
    credentials: "same-origin",
  });
  const d = await parse<{
    retrospectives: Retrospective[];
    total?: number;
    limit?: number;
    offset?: number;
  }>(r);
  const list = d.retrospectives || [];
  return {
    retrospectives: list,
    total: typeof d.total === "number" ? d.total : list.length,
    limit: typeof d.limit === "number" ? d.limit : limit,
    offset: typeof d.offset === "number" ? d.offset : offset,
  };
}

export async function createRetrospective(opts?: {
  title?: string;
  gather?: boolean;
  /** Book sample account scope at gather (null = all). */
  accountId?: number | null;
}): Promise<Retrospective> {
  const r = await fetch("/api/me/retrospectives", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: opts?.title || "",
      gather: opts?.gather !== false,
      account_id: opts?.accountId ?? null,
    }),
  });
  return parse(r);
}

export async function getRetrospective(id: number): Promise<Retrospective> {
  const r = await fetch(`/api/me/retrospectives/${id}`, {
    credentials: "same-origin",
  });
  return parse(r);
}

export async function gatherRetrospective(
  id: number,
  opts?: { accountId?: number | null },
): Promise<Retrospective> {
  const r = await fetch(`/api/me/retrospectives/${id}/gather`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_id: opts?.accountId ?? null,
    }),
  });
  return parse(r);
}

export type ClosurePreview = {
  gather_date: string;
  dates_to_close: string[];
  gather_date_stays_open: boolean;
  warning: string;
};

export async function fetchClosurePreview(id: number): Promise<ClosurePreview> {
  const r = await fetch(`/api/me/retrospectives/${id}/closure-preview`, {
    credentials: "same-origin",
  });
  return parse(r);
}

export type CompleteRetrospectiveResult = Retrospective & {
  closed_journal_dates?: string[];
  gather_date_stays_open?: boolean;
};

export async function completeRetrospective(
  id: number,
): Promise<CompleteRetrospectiveResult> {
  const r = await fetch(`/api/me/retrospectives/${id}/complete`, {
    method: "POST",
    credentials: "same-origin",
  });
  return parse(r);
}

export async function abandonRetrospective(id: number): Promise<void> {
  const r = await fetch(`/api/me/retrospectives/${id}/abandon`, {
    method: "POST",
    credentials: "same-origin",
  });
  await parse(r);
}

export async function patchRetrospective(
  id: number,
  body: { title?: string; body_md?: string },
): Promise<Retrospective> {
  const r = await fetch(`/api/me/retrospectives/${id}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse(r);
}

export async function analyzeRetrospective(
  id: number,
  opts?: { focused_step?: number },
): Promise<Retrospective> {
  const r = await fetch(`/api/me/retrospectives/${id}/analyze`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts || {}),
  });
  return parse(r);
}

export async function createHabitPlan(body: {
  title?: string;
  habit?: string;
  why_process?: string;
  observable_signal: string;
  retrospective_id?: number;
  status?: HabitPlanStatus | string;
}): Promise<HabitPlan> {
  const r = await fetch("/api/me/habit-plans", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse(r);
}
