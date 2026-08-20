/**
 * Analyzer hook to the Labs-wide Alerts Manager.
 * Today: session stub. When Manager + API GO, swap this module — Builder/canvas stay.
 * Spec: FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md §2
 */

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
    family: "price" | "pnl" | "greek" | "placeholder";
    condition: AlertsManagerCondition;
    target: number;
    greek?: "delta" | "gamma" | "theta";
  };
};

export type AlertsManagerRecord = AlertsManagerDraft & {
  id: string;
  enabled: boolean;
  created_at: string;
  unbound?: boolean;
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
