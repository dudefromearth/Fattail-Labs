/**
 * Map CanonicalAlert (API store) → transplant Alert (evaluator / designer shape).
 *
 * Designer saves only to the canonical store. The client evaluator historically
 * read empty localAlerts — this adapter is the single bridge so condition-met
 * indicators track the same objects the list and chart lines use.
 */

import type {
  Alert,
  AlertCondition,
  AlertType,
  CanonicalAlert,
  GreekName,
  ThresholdScope,
} from '../../ms-transplant/types/alerts';

const EVALUATABLE_TYPES = new Set<string>([
  'price',
  'profit_target',
  'greeks_threshold',
  'portfolio_pnl',
]);

const TERMINAL_STATUS = new Set([
  'dismissed',
  'expired',
  'resolved',
]);

/**
 * Convert one risk-graph canonical threshold alert into evaluator shape.
 * Returns null when the alert should not be evaluated (wrong class/status).
 */
export function canonicalToEvaluatorAlert(ca: CanonicalAlert): Alert | null {
  if (ca.alert_class !== 'threshold') return null;
  if (ca.source_system && ca.source_system !== 'risk_graph') return null;
  if (TERMINAL_STATUS.has(ca.status)) return null;

  const payload = (ca.trigger_payload ?? {}) as Record<string, unknown>;
  const meta = (ca.metadata ?? {}) as Record<string, unknown>;

  const typeFromKey = String(ca.trigger_key || '').split(':')[0];
  const rawType = String(payload.alert_type ?? typeFromKey ?? 'price');
  const alertType = (EVALUATABLE_TYPES.has(rawType) ? rawType : 'price') as AlertType;

  const threshold = Number(payload.threshold ?? payload.price ?? payload.targetValue);
  if (!Number.isFinite(threshold)) return null;

  const conditionRaw = String(payload.condition ?? 'above').toLowerCase();
  const condition: AlertCondition =
    conditionRaw === 'below' || conditionRaw === 'at' ? conditionRaw : 'above';

  const mode = String(meta.mode ?? 'observe');
  const strategyId =
    (payload.strategy_id as string | undefined)
    || (payload.strategyId as string | undefined)
    || ca.source_ref_id
    || undefined;

  const greekNameRaw = payload.greek_name ?? payload.greekName ?? payload.label ?? meta.greek_name;
  const greekName = typeof greekNameRaw === 'string' ? greekNameRaw : undefined;

  const scopeRaw = payload.threshold_scope ?? payload.thresholdScope ?? (strategyId ? 'single' : 'all');
  const thresholdScope = scopeRaw as ThresholdScope;

  // "triggered" skips re-eval in useAlertEvaluator. Only treat terminal lifecycle
  // as done; observe/active alerts keep evaluating for the live indicator.
  const triggered = ca.status === 'acted';

  const createdAt = Date.parse(ca.created_at) || Date.now();
  const updatedAt = Date.parse(ca.updated_at) || createdAt;

  return {
    id: ca.alert_id,
    type: alertType,
    source: {
      type: alertType === 'greeks_threshold' ? 'greeks'
        : alertType === 'profit_target' || alertType === 'portfolio_pnl' ? 'strategy'
        : 'price',
      id: strategyId,
    },
    condition,
    targetValue: threshold,
    color: (meta.color as string) || '#f59e0b',
    behavior: mode === 'active' ? 'active' : 'observe',
    priority: 'medium',
    enabled: true,
    triggered,
    strategyId,
    label: greekName || (meta.label as string | undefined) || alertType,
    greekName: (greekName as GreekName | undefined) || undefined,
    thresholdScope,
    mode: mode === 'active' ? 'active' : 'observe',
    goal: (meta.goal as string | undefined) || undefined,
    entryDebit: payload.entry_debit != null ? Number(payload.entry_debit) : undefined,
    symbol: ca.symbol ?? undefined,
    createdAt,
    updatedAt,
  };
}

/** All evaluatable risk-graph canonical alerts (stable order). */
export function canonicalAlertsForEvaluator(
  canonicalAlerts: readonly CanonicalAlert[],
): Alert[] {
  const out: Alert[] = [];
  for (const ca of canonicalAlerts) {
    const a = canonicalToEvaluatorAlert(ca);
    if (a) out.push(a);
  }
  return out;
}
