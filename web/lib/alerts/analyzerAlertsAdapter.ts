/**
 * Analyzer hook to the Labs-wide Alerts Manager (identity DB).
 * HTTP when Manager is live; fail open to localStorage stub if 503/down.
 * Spec: FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md §2
 * Seed S-1 / AT-ALB-9.
 */

import {
  durableAlerts,
  type AnalyzerThresholdAlert,
  type ThresholdAlertType,
} from "@/lib/options-lab/analyzerBook";

export const ALERTS_SOURCE_SYSTEM = "analyzer_risk_graph";
export const ALERTS_SUITE = "options_lab";
export const ALERTS_DOMAIN = "work_surface";
/** Named default — Builder v1 has no severity field (AZ-ALB §2.2 / ALM §3.2). */
export const ALERTS_SEVERITY_DEFAULT = "medium" as const;

export type AlertsManagerKind = "canvas" | "position";
export type AlertsManagerClass = "threshold" | "algo" | "prompt";
export type AlertsManagerBehavior =
  | "once_only"
  | "repeating"
  | "persistent";
export type AlertsManagerCondition = "above" | "below" | "at";
export type AlertsManagerRunState = "idle" | "live" | "touched";
export type AlertsManagerSeverity =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type AlertsManagerDraft = {
  id?: string;
  source_system: typeof ALERTS_SOURCE_SYSTEM;
  suite: typeof ALERTS_SUITE;
  domain: typeof ALERTS_DOMAIN;
  alert_class: AlertsManagerClass;
  kind: AlertsManagerKind;
  symbol: string;
  title: string;
  color: string;
  behavior: AlertsManagerBehavior;
  severity: AlertsManagerSeverity;
  run_state: AlertsManagerRunState;
  position_id?: string;
  position_label?: string;
  expires_at?: string;
  goal?: string;
  trigger: {
    family: "price" | "pnl" | "greek" | "placeholder" | "algo";
    condition: AlertsManagerCondition;
    target: number;
    greek?: "delta" | "gamma" | "theta";
    algo?: {
      variant: "otm_fly_trail";
      entry_pct: number;
      trail_start_pct: number;
      trail_floor_pct: number;
      /** `"eod"` (default) or ISO datetime when trail decay reaches the end %. */
      decay_end?: "eod" | string;
      /** Optional focus prompt. Mount gate is `reason`. */
      trail_stop_reason?: string;
      trail_end_reason?: string;
      demo?: boolean;
      overlay: boolean;
      reason?: boolean;
      high_water_color: string;
      trail_color: string;
    };
  };
};

export type AlertsManagerRecord = AlertsManagerDraft & {
  id: string;
  enabled: boolean;
  created_at: string;
  unbound?: boolean;
  local_ref?: { position_id?: string | null } | null;
};

/**
 * Stable names the Manager spec must honor (or map 1:1).
 * Analyzer never calls a second store.
 */
export type AlertsManagerHook = {
  listAlerts: (q: {
    surface: "analyzer";
    symbol: string;
  }) => Promise<AlertsManagerRecord[]>;
  upsertAlert: (draft: AlertsManagerDraft) => Promise<AlertsManagerRecord>;
  subscribeAlerts: (onChange: () => void) => () => void;
};

/** Chip UI uses tokens; paint hex is payload data for the canvas line (AT-ALB-14). */
export const ALERT_TAG_CHIPS = [
  { id: "watch", token: "var(--color-tint)", paint: "#2dd4bf" },
  { id: "urgent", token: "var(--color-destructive)", paint: "#ff453a" },
  { id: "warning", token: "var(--color-warning)", paint: "#ffd60a" },
  { id: "target", token: "var(--color-tint-emphasis)", paint: "#5eead4" },
  { id: "setup", token: "var(--color-tint-soft)", paint: "#99f6e4" },
  { id: "caution", token: "var(--color-warning)", paint: "#ffd60a" },
  { id: "neutral", token: "var(--color-fill)", paint: "#98989d" },
  { id: "other", token: "var(--color-label-tertiary)", paint: "#636366" },
] as const;

export function alertUnbound(
  kind: AlertsManagerKind,
  positionId: string | undefined,
  bookIds: ReadonlySet<string>,
): boolean {
  if (kind !== "position") return false;
  if (!positionId) return true;
  return !bookIds.has(positionId);
}

function typeFromCondition(
  condition: string | undefined,
  family: string | undefined,
): ThresholdAlertType {
  if (family === "algo") return "price_touch";
  if (condition === "above") return "price_above";
  if (condition === "below") return "price_below";
  return "price_touch";
}

export function toManagerDraft(
  a: AnalyzerThresholdAlert,
): AlertsManagerDraft {
  const condition: AlertsManagerCondition =
    a.type === "price_above"
      ? "above"
      : a.type === "price_below"
        ? "below"
        : "at";
  const algo = a.alertClass === "algo" || Boolean(a.algo);
  return {
    id: a.id,
    source_system: ALERTS_SOURCE_SYSTEM,
    suite: ALERTS_SUITE,
    domain: ALERTS_DOMAIN,
    alert_class: algo ? "algo" : "threshold",
    kind: a.kind,
    symbol: a.symbol,
    title: a.title,
    color: a.color,
    behavior: "persistent",
    severity: (a.severity as AlertsManagerSeverity) || ALERTS_SEVERITY_DEFAULT,
    run_state: a.runState,
    position_id: a.positionId,
    position_label: a.positionLabel,
    trigger: {
      family: algo ? "algo" : "price",
      condition,
      target: a.targetPrice,
      algo: a.algo
        ? {
            variant: a.algo.variant,
            entry_pct: a.algo.entry_pct,
            trail_start_pct: a.algo.trail_start_pct,
            trail_floor_pct: a.algo.trail_floor_pct,
            decay_end: a.algo.decay_end,
            trail_stop_reason: a.algo.trail_stop_reason,
            trail_end_reason: a.algo.trail_end_reason,
            demo: a.algo.demo,
            overlay: a.algo.overlay,
            reason: a.algo.reason,
            high_water_color: a.algo.high_water_color,
            trail_color: a.algo.trail_color,
          }
        : undefined,
    },
  };
}

export function fromManagerRecord(
  r: AlertsManagerRecord,
): AnalyzerThresholdAlert {
  const trigger = r.trigger || { family: "price", condition: "at", target: 0 };
  const algo = trigger.algo;
  const kind = r.kind;
  const positionId =
    r.position_id ||
    (typeof r.local_ref === "object" && r.local_ref && "position_id" in r.local_ref
      ? String((r.local_ref as { position_id?: string }).position_id || "")
      : undefined) ||
    undefined;
  return {
    id: r.id,
    kind,
    type: typeFromCondition(trigger.condition, trigger.family),
    symbol: (r.symbol || "").toUpperCase(),
    targetPrice: Number(trigger.target) || 0,
    positionId: positionId || undefined,
    positionLabel: r.position_label,
    title: r.title,
    severity: r.severity,
    status: r.run_state === "touched" ? "triggered" : "new",
    runState: r.run_state,
    enabled: r.enabled,
    createdAt: r.created_at,
    color: r.color || "#98989d",
    alertClass: r.alert_class === "algo" ? "algo" : "threshold",
    algo: algo
      ? {
          variant: "otm_fly_trail",
          entry_pct: algo.entry_pct,
          trail_start_pct: algo.trail_start_pct,
          trail_floor_pct: algo.trail_floor_pct,
          decay_end: algo.decay_end,
          trail_stop_reason: algo.trail_stop_reason,
          trail_end_reason: algo.trail_end_reason,
          demo: algo.demo,
          overlay: algo.overlay,
          reason: algo.reason,
          high_water_color: algo.high_water_color,
          trail_color: algo.trail_color,
        }
      : undefined,
  };
}

type ManagerRow = AlertsManagerRecord & {
  alert_id?: string;
  surface_type?: AlertsManagerKind;
  local_ref?: { position_id?: string | null } | null;
};

function normalizeRow(raw: ManagerRow): AlertsManagerRecord {
  const id = raw.id || raw.alert_id || "";
  const kind = raw.kind || raw.surface_type || "canvas";
  const position_id =
    raw.position_id || raw.local_ref?.position_id || undefined;
  return { ...raw, id, kind, position_id };
}

async function managerFetch(
  path: string,
  init?: RequestInit,
): Promise<Response | null> {
  try {
    const r = await fetch(path, {
      credentials: "include",
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers || {}),
      },
    });
    if (r.status === 503) return null;
    return r;
  } catch {
    return null;
  }
}

export async function listAlerts(q: {
  surface: "analyzer";
  symbol?: string;
}): Promise<AlertsManagerRecord[] | null> {
  const params = new URLSearchParams({
    source_system: ALERTS_SOURCE_SYSTEM,
    suite: ALERTS_SUITE,
  });
  if (q.symbol) params.set("symbol", q.symbol);
  const r = await managerFetch(`/api/me/alerts?${params}`);
  if (!r || !r.ok) return null;
  const body = (await r.json()) as { alerts?: ManagerRow[] };
  return (body.alerts || []).map(normalizeRow);
}

export async function upsertAlert(
  draft: AlertsManagerDraft,
): Promise<AlertsManagerRecord | null> {
  const r = await managerFetch("/api/me/alerts", {
    method: "POST",
    body: JSON.stringify({
      ...draft,
      alert_id: draft.id,
      surface_type: draft.kind,
      local_ref: draft.position_id
        ? { position_id: draft.position_id }
        : undefined,
      enabled: draft.run_state === "live" || draft.run_state === "touched",
    }),
  });
  if (!r || !r.ok) return null;
  return normalizeRow((await r.json()) as ManagerRow);
}

export async function deleteAlert(alertId: string): Promise<boolean> {
  const r = await managerFetch(
    `/api/me/alerts/${encodeURIComponent(alertId)}`,
    { method: "DELETE" },
  );
  return Boolean(r && (r.ok || r.status === 404));
}

/** Server SoR when Manager is live; null → keep local stub. */
export async function hydrateAlertsFromManager(
  local: AnalyzerThresholdAlert[],
): Promise<AnalyzerThresholdAlert[] | null> {
  const listed = await listAlerts({ surface: "analyzer" });
  if (listed == null) return null;
  const rehearsal = local.filter((a) => a.rehearsal);
  const durable = durableAlerts(local);
  if (listed.length === 0 && durable.length > 0) {
    await Promise.all(durable.map((a) => upsertAlert(toManagerDraft(a))));
    return [...durable, ...rehearsal];
  }
  return [...listed.map(fromManagerRecord), ...rehearsal];
}

export async function syncAlertsToManager(
  alerts: readonly AnalyzerThresholdAlert[],
): Promise<void> {
  const listed = await listAlerts({ surface: "analyzer" });
  if (listed == null) return;
  const durable = durableAlerts(alerts);
  const localIds = new Set(durable.map((a) => a.id));
  await Promise.all(durable.map((a) => upsertAlert(toManagerDraft(a))));
  await Promise.all(
    listed
      .map((r) => r.id)
      .filter((id) => id && !localIds.has(id))
      .map((id) => deleteAlert(id)),
  );
}
