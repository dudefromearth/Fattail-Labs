// Transplant alert types (used by AlertDesigner, RiskGraphPanel)
// Kept for backward compatibility with existing transplant components.

export type AlertType = 'price' | 'debit' | 'profit_target' | 'trailing_stop' | 'ai_theta_gamma' | 'ai_sentiment' | 'ai_risk_zone' | 'portfolio_pnl' | 'portfolio_trailing' | 'greeks_threshold';
export type AlertBehavior = 'once_only' | 'repeating' | 'observe' | 'active';
export type AlertCondition = 'above' | 'below' | 'at';
export type AlertMode = 'observe' | 'active';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type ThresholdScope = 'single' | 'group' | 'any' | 'all';
export type GreekName = 'delta' | 'gamma' | 'theta' | 'vega';
export type AlertLifecycleStage = 'dormant' | 'update' | 'warn' | 'accomplished' | 'dismissed' | 'overridden';

export interface AlertSource {
  type: 'price' | 'strategy' | 'portfolio' | 'greeks' | 'ai';
  id?: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  source: AlertSource;
  condition: AlertCondition;
  targetValue: number;
  color: string;
  behavior: AlertBehavior;
  priority: AlertPriority;
  enabled: boolean;
  triggered: boolean;
  triggeredAt?: number;
  triggerCount?: number;
  strategyId?: string;
  label?: string;
  minProfitThreshold?: number;
  mode?: AlertMode;
  goal?: string;
  thresholdScope?: ThresholdScope;
  isZoneActive?: boolean;
  zoneLow?: number;
  zoneHigh?: number;
  aiConfidence?: number;
  aiReasoning?: string;
  lastAIUpdate?: number;
  entryDebit?: number;
  highWaterMark?: number;
  symbol?: string;
  sentimentThreshold?: number;
  direction?: string;
  zoneType?: string;
  greekName?: GreekName;
  createdAt: number;
  updatedAt: number;
}

export interface CreateAlertInput {
  type: AlertType;
  source: AlertSource;
  condition: AlertCondition;
  targetValue: number;
  color?: string;
  behavior?: AlertBehavior;
  priority?: AlertPriority;
  label?: string;
  mode?: AlertMode;
  goal?: string;
  thresholdScope?: ThresholdScope;
  strategyId?: string;
  strategyIds?: string[];
  minProfitThreshold?: number;
  entryDebit?: number;
  symbol?: string;
  sentimentThreshold?: number;
  direction?: string;
  zoneType?: string;
  greekName?: GreekName;
}

export interface EditAlertInput {
  id: string;
  condition?: AlertCondition;
  targetValue?: number;
  color?: string;
  behavior?: AlertBehavior;
  enabled?: boolean;
  label?: string;
  mode?: AlertMode;
  goal?: string;
}

export interface AIEvaluation {
  alertId: string;
  timestamp: number;
  provider: string;
  model: string;
  shouldTrigger: boolean;
  confidence: number;
  reasoning: string;
  latencyMs: number;
  zoneLow?: number;
  zoneHigh?: number;
}

export interface AlertTriggerEvent {
  alertId: string;
  triggeredAt: number;
  aiConfidence?: number;
  aiReasoning?: string;
}

export interface AlertUpdateEvent {
  alertId: string;
  updates: Partial<Alert>;
}

export interface AlertDefinition {
  id: string;
  type: AlertType;
  prompt: string;
  status: 'active' | 'paused' | 'expired';
  lifecycleStage: AlertLifecycleStage;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  overrideReason?: string;
}

export interface CreateAlertDefinitionInput {
  type: AlertType;
  prompt: string;
}

// Sub-type interfaces used by RiskGraphPanel
export interface AIThetaGammaAlert extends Alert {
  type: 'ai_theta_gamma';
  strategyId: string;
  isZoneActive: boolean;
  zoneLow?: number;
  zoneHigh?: number;
}

export interface ProfitTargetAlert extends Alert {
  type: 'profit_target';
  strategyId: string;
  entryDebit: number;
}

export interface TrailingStopAlert extends Alert {
  type: 'trailing_stop';
  strategyId: string;
  highWaterMark: number;
}

// ── Canonical Alert Types (matching backend API) ─────────────────────

export type AlertClass = 'threshold' | 'algo' | 'prompt' | 'system';
export type AlertDomain = 'work_surface' | 'process_surface' | 'routine_surface' | 'system' | 'account';
export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'new' | 'seen' | 'acknowledged' | 'acted' | 'dismissed' | 'expired' | 'resolved';

export interface CanonicalAlert {
  alert_id: string;
  identity_id: number;
  alert_class: AlertClass;
  domain: AlertDomain;
  source_system: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  short_message?: string | null;
  symbol?: string | null;
  strategy?: string | null;
  expiration?: string | null;
  source_ref_type?: string | null;
  source_ref_id?: string | null;
  trigger_type?: string | null;
  trigger_key?: string | null;
  trigger_payload?: Record<string, unknown> | null;
  delivery_targets?: string[] | null;
  actions?: Record<string, unknown>[] | null;
  metadata?: Record<string, unknown> | null;
  dedupe_key?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertRule {
  rule_id: string;
  identity_id: number;
  scope_type: string;
  scope_ref_id?: string | null;
  metric: string;
  operator: string;
  threshold_value: number;
  severity: AlertSeverity;
  enabled: boolean;
  cooldown_sec: number;
  created_at: string;
  updated_at: string;
}

export interface DeliverySettings {
  identity_id: number;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  process_surface_enabled: boolean;
  severity_minimums: Record<string, AlertSeverity> | null;
  class_filters: Record<string, boolean> | null;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_min_severity: AlertSeverity;
  timezone: string;
  digest_mode: boolean;
  digest_interval_min: number;
}

export interface CreateCanonicalAlertRequest {
  alert_class: AlertClass;
  domain: AlertDomain;
  source_system: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  dedupe_key: string;
  short_message?: string;
  symbol?: string;
  strategy?: string;
  expiration?: string;
  source_ref_type?: string;
  source_ref_id?: string;
  trigger_type?: string;
  trigger_key?: string;
  trigger_payload?: Record<string, unknown>;
  delivery_targets?: string[];
  actions?: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
  tag_ids?: string[];
}

export interface CreateRuleRequest {
  scope_type: string;
  scope_ref_id?: string;
  domain?: AlertDomain;
  metric: string;
  operator: string;
  threshold_value: number;
  severity: AlertSeverity;
  enabled?: boolean;
  cooldown_sec?: number;
}
