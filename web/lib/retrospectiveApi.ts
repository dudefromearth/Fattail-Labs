/** Client for /api/me/retrospectives + habit-plans (Spec v0.5 R4). */

export type RetroScopePreview = {
  is_maiden: boolean;
  scope_start: string;
  scope_end: string;
  prior_id: number | null;
  prior_completed_at: string | null;
  label: string;
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

export async function listRetrospectives(): Promise<Retrospective[]> {
  const r = await fetch("/api/me/retrospectives", { credentials: "same-origin" });
  const d = await parse<{ retrospectives: Retrospective[] }>(r);
  return d.retrospectives || [];
}

export async function createRetrospective(opts?: {
  title?: string;
  gather?: boolean;
}): Promise<Retrospective> {
  const r = await fetch("/api/me/retrospectives", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: opts?.title || "",
      gather: opts?.gather !== false,
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

export async function gatherRetrospective(id: number): Promise<Retrospective> {
  const r = await fetch(`/api/me/retrospectives/${id}/gather`, {
    method: "POST",
    credentials: "same-origin",
  });
  return parse(r);
}

export async function completeRetrospective(id: number): Promise<Retrospective> {
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

export async function analyzeRetrospective(id: number): Promise<Retrospective> {
  const r = await fetch(`/api/me/retrospectives/${id}/analyze`, {
    method: "POST",
    credentials: "same-origin",
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
