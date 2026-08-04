/**
 * AlertContext — Real implementation backed by alertsApi + SSE.
 *
 * Fetches canonical alerts/rules from REST on mount.
 * Subscribes to SSE 'alerts' channel for real-time updates.
 * OS Notification on new alert if permission granted.
 *
 * Preserves the same export signatures (useAlerts, AlertProvider,
 * useAlertsForSource, useAlertsForStrategy) so existing transplant
 * consumers (RiskGraphPanel, AlertDesigner, etc.) keep compiling.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { subscribe } from '../../lib/sseBus';
import * as alertsApi from '../../lib/alertsApi';
import { ToastHost } from '../../components/ToastHost';
import { AlertToast } from '../../components/AlertToast';
import type {
  Alert,
  CreateAlertInput,
  EditAlertInput,
  AlertSource,
  AIEvaluation,
  AlertMode,
  AlertDefinition,
  CreateAlertDefinitionInput,
  CanonicalAlert,
  AlertRule,
} from '../types/alerts';

// ── Stage-aware surface config ────────────────────────────────────────

export interface AlertSurfaceConfig {
  backgroundEvalEnabled: boolean;
  alertsSectionEnabled: boolean;
  toastsEnabled: boolean;
  badgeEnabled: boolean;
  alertCenterEnabled: boolean;
  /** null = unlimited */
  ruleLimit: number | null;
}

function getAlertSurfaceConfig(stage: string): AlertSurfaceConfig {
  switch (stage) {
    case 'shu':
      return {
        backgroundEvalEnabled: false,
        alertsSectionEnabled: false,
        toastsEnabled: false,
        badgeEnabled: false,
        alertCenterEnabled: false,
        ruleLimit: 3,
      };
    case 'ha':
      return {
        backgroundEvalEnabled: true,
        alertsSectionEnabled: true,
        toastsEnabled: false,
        badgeEnabled: false,
        alertCenterEnabled: false,
        ruleLimit: 10,
      };
    case 'ri':
    default:
      return {
        backgroundEvalEnabled: true,
        alertsSectionEnabled: true,
        toastsEnabled: true,
        badgeEnabled: true,
        alertCenterEnabled: true,
        ruleLimit: null,
      };
  }
}

// ── Context value interface (unchanged for transplant compat) ────────

interface AlertContextValue {
  alerts: Alert[];
  canonicalAlerts: CanonicalAlert[];
  rules: AlertRule[];
  unreadCount: number;
  surfaceConfig: AlertSurfaceConfig;
  aiEvaluations: Record<string, AIEvaluation>;
  alertDefinitions: AlertDefinition[];
  connected: boolean;
  loading: boolean;
  error: string | null;
  createAlert: (input: CreateAlertInput) => Alert;
  updateAlert: (input: EditAlertInput) => void;
  deleteAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  setAlertMode: (id: string, mode: AlertMode) => void;
  getAlert: (id: string) => Alert | undefined;
  getAlertsForSource: (sourceType: AlertSource['type'], sourceId?: string) => Alert[];
  getAlertsForStrategy: (strategyId: string) => Alert[];
  getTriggeredAlerts: () => Alert[];
  getAIEvaluation: (alertId: string) => AIEvaluation | undefined;
  clearTriggeredAlerts: () => void;
  importAlerts: (alerts: Alert[]) => void;
  exportAlerts: () => Alert[];
  createCanonicalAlert: (input: Parameters<typeof alertsApi.createAlert>[0]) => Promise<CanonicalAlert | null>;
  updateCanonicalAlertStatus: (alertId: string, status: string) => Promise<CanonicalAlert | null>;
  deleteCanonicalAlert: (alertId: string) => Promise<boolean>;
  patchCanonicalAlert: (alertId: string, patch: Partial<CanonicalAlert>) => void;
  createDefinition: (input: CreateAlertDefinitionInput) => Promise<AlertDefinition | null>;
  pauseDefinition: (id: string) => Promise<void>;
  resumeDefinition: (id: string) => Promise<void>;
  acknowledgeDefinition: (id: string) => Promise<void>;
  dismissDefinition: (id: string) => Promise<void>;
  overrideDefinition: (id: string, reason: string) => Promise<void>;
  deleteDefinition: (id: string) => Promise<void>;
  getDefinition: (id: string) => AlertDefinition | undefined;
  getDefinitionsNeedingAttention: () => AlertDefinition[];
}

const noop = () => {};
const noopAsync = async () => {};

// ── SSE event handler (module-level, no inline arrow) ────────────────

function fireOSNotification(title: string, body: string): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try { new Notification(title, { body, icon: '/favicon.ico' }); } catch { /* swallow */ }
}

// ── Default value ────────────────────────────────────────────────────

const defaultValue: AlertContextValue = {
  alerts: [],
  canonicalAlerts: [],
  rules: [],
  unreadCount: 0,
  surfaceConfig: getAlertSurfaceConfig('ri'),
  aiEvaluations: {},
  alertDefinitions: [],
  connected: false,
  loading: false,
  error: null,
  createAlert: () => ({ id: 'stub', type: 'price', source: { type: 'price' }, condition: 'above', targetValue: 0, color: '#3b82f6', behavior: 'once_only', priority: 'medium', enabled: false, triggered: false, createdAt: 0, updatedAt: 0 }) as Alert,
  updateAlert: noop,
  deleteAlert: noop,
  toggleAlert: noop,
  setAlertMode: noop,
  getAlert: () => undefined,
  getAlertsForSource: () => [],
  getAlertsForStrategy: () => [],
  getTriggeredAlerts: () => [],
  getAIEvaluation: () => undefined,
  clearTriggeredAlerts: noop,
  importAlerts: noop,
  exportAlerts: () => [],
  createCanonicalAlert: async () => null,
  updateCanonicalAlertStatus: async () => null,
  deleteCanonicalAlert: async () => false,
  patchCanonicalAlert: noop,
  createDefinition: async () => null,
  pauseDefinition: noopAsync,
  resumeDefinition: noopAsync,
  acknowledgeDefinition: noopAsync,
  dismissDefinition: noopAsync,
  overrideDefinition: noopAsync,
  deleteDefinition: noopAsync,
  getDefinition: () => undefined,
  getDefinitionsNeedingAttention: () => [],
};

const AlertContext = createContext<AlertContextValue>(defaultValue);

// ── Provider ─────────────────────────────────────────────────────────

// Cap local arrays
const MAX_TRANSPLANT_ALERTS = 500;
const MAX_CANONICAL_ALERTS = 500;

// ── localStorage persistence for canonical alerts ───────────────
const ALERTS_STORAGE_KEY = 'canonicalAlerts';

function loadPersistedAlerts(): CanonicalAlert[] {
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function persistAlerts(alerts: CanonicalAlert[]): void {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  } catch { /* storage full — silently skip */ }
}

export function AlertProvider({ children }: { children: ReactNode }) {
  // Transplant local alerts (used by AlertDesigner / RiskGraphPanel)
  const [localAlerts, setLocalAlerts] = useState<Alert[]>([]);

  // Canonical alerts — initialized from localStorage, then merged with API
  const [canonicalAlerts, setCanonicalAlerts] = useState<CanonicalAlert[]>(loadPersistedAlerts);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [toastQueue, setToastQueue] = useState<CanonicalAlert[]>([]);

  const unreadCount = useMemo(
    () => canonicalAlerts.filter(a => a.status === 'new').length,
    [canonicalAlerts],
  );

  // traderStage: shu_ha_ri_stage is not yet wired to the frontend.
  // Default to "ri" (most permissive) so all features are available.
  // TODO: fetch from /api/crce/state or extend /api/auth/me response.
  const surfaceConfig = useMemo(() => getAlertSurfaceConfig('ri'), []);

  // ── Persist to localStorage on every change ─────────────────────
  useEffect(() => {
    persistAlerts(canonicalAlerts);
  }, [canonicalAlerts]);

  // ── Fetch on mount (merges with persisted) ──────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [alertRes, rulesRes] = await Promise.all([
        alertsApi.fetchAlerts({ per_page: 100 }),
        alertsApi.fetchRules(),
      ]);
      if (cancelled) return;
      if (alertRes) {
        // Merge: API alerts take precedence, keep local-only alerts that API doesn't know about
        const apiIds = new Set(alertRes.alerts.map((a: CanonicalAlert) => a.alert_id));
        setCanonicalAlerts(prev => {
          const localOnly = prev.filter(a => !apiIds.has(a.alert_id));
          return [...alertRes.alerts, ...localOnly].slice(0, MAX_CANONICAL_ALERTS);
        });
      }
      setRules(rulesRes);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Toast queue ─────────────────────────────────────────────────
  const dismissToast = useCallback((alertId: string) => {
    setToastQueue(q => q.filter(a => a.alert_id !== alertId));
  }, []);

  // ── SSE subscription ───────────────────────────────────────────
  const handleSseEvent = useCallback((evt: MessageEvent) => {
    try {
      const payload = JSON.parse(evt.data);
      const eventType = payload.type ?? payload.event;
      const data = payload.data ?? payload;

      if (eventType === 'alert_triggered' || eventType === 'alert_created') {
        const alert = data as CanonicalAlert;
        setCanonicalAlerts(prev => {
          const next = [alert, ...prev.filter(a => a.alert_id !== alert.alert_id)];
          return next.length > MAX_CANONICAL_ALERTS ? next.slice(0, MAX_CANONICAL_ALERTS) : next;
        });
        if (alert.status === 'new') {
          setToastQueue(prev => {
            if (prev.find(a => a.alert_id === alert.alert_id)) return prev;
            const next = [...prev, alert];
            return next.length > 3 ? next.slice(-3) : next;
          });
        }
        fireOSNotification(alert.title, alert.message);
      }

      if (eventType === 'alert_status_changed') {
        const updated = data as CanonicalAlert;
        setCanonicalAlerts(prev =>
          prev.map(a => a.alert_id === updated.alert_id ? updated : a),
        );
      }
    } catch { /* malformed — skip */ }
  }, []);

  useEffect(() => {
    return subscribe(
      { alerts: handleSseEvent },
      { onOpen: () => setConnected(true), onClose: () => setConnected(false) },
    );
  }, [handleSseEvent]);

  // ── Transplant CRUD (local state, for AlertDesigner compat) ────
  const createLocalAlert = useCallback((input: CreateAlertInput): Alert => {
    const now = Date.now();
    const alert: Alert = {
      id: crypto.randomUUID(),
      type: input.type,
      source: input.source,
      condition: input.condition,
      targetValue: input.targetValue,
      color: input.color ?? '#3b82f6',
      behavior: input.behavior ?? 'once_only',
      priority: input.priority ?? 'medium',
      enabled: true,
      triggered: false,
      mode: input.mode,
      goal: input.goal,
      label: input.label,
      strategyId: input.strategyId,
      thresholdScope: input.thresholdScope,
      entryDebit: input.entryDebit,
      symbol: input.symbol,
      greekName: input.greekName,
      createdAt: now,
      updatedAt: now,
    };
    setLocalAlerts(prev => {
      const next = [alert, ...prev];
      return next.length > MAX_TRANSPLANT_ALERTS ? next.slice(0, MAX_TRANSPLANT_ALERTS) : next;
    });
    return alert;
  }, []);

  const updateLocalAlert = useCallback((input: EditAlertInput) => {
    setLocalAlerts(prev =>
      prev.map(a => a.id === input.id ? { ...a, ...input, updatedAt: Date.now() } : a),
    );
  }, []);

  const deleteLocalAlert = useCallback((id: string) => {
    setLocalAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const toggleLocalAlert = useCallback((id: string) => {
    setLocalAlerts(prev =>
      prev.map(a => a.id === id ? { ...a, enabled: !a.enabled, updatedAt: Date.now() } : a),
    );
  }, []);

  const setLocalAlertMode = useCallback((id: string, mode: AlertMode) => {
    setLocalAlerts(prev =>
      prev.map(a => a.id === id ? { ...a, mode, updatedAt: Date.now() } : a),
    );
  }, []);

  const getAlert = useCallback(
    (id: string) => localAlerts.find(a => a.id === id),
    [localAlerts],
  );

  const getAlertsForSource = useCallback(
    (sourceType: AlertSource['type'], sourceId?: string) =>
      localAlerts.filter(a => a.source.type === sourceType && (!sourceId || a.source.id === sourceId)),
    [localAlerts],
  );

  const getAlertsForStrategy = useCallback(
    (strategyId: string) => localAlerts.filter(a => a.strategyId === strategyId),
    [localAlerts],
  );

  const getTriggeredAlerts = useCallback(
    () => localAlerts.filter(a => a.triggered),
    [localAlerts],
  );

  const clearTriggeredAlerts = useCallback(() => {
    setLocalAlerts(prev =>
      prev.map(a => a.triggered ? { ...a, triggered: false, updatedAt: Date.now() } : a),
    );
  }, []);

  // ── Canonical CRUD (API calls + local state update) ────────────

  const createCanonicalAlert = useCallback(async (
    input: Parameters<typeof alertsApi.createAlert>[0],
  ): Promise<CanonicalAlert | null> => {
    const alert = await alertsApi.createAlert(input);
    const now = new Date().toISOString();
    // Use API response or create local fallback when API is unavailable
    const resolved: CanonicalAlert = alert ?? {
      alert_id: crypto.randomUUID(),
      identity_id: 0,
      alert_class: input.alert_class,
      domain: input.domain,
      source_system: input.source_system,
      severity: input.severity,
      status: 'new',
      title: input.title,
      message: input.message,
      short_message: input.short_message ?? null,
      symbol: input.symbol ?? null,
      strategy: input.strategy ?? null,
      expiration: input.expiration ?? null,
      source_ref_type: input.source_ref_type ?? null,
      source_ref_id: input.source_ref_id ?? null,
      trigger_type: input.trigger_type ?? null,
      trigger_key: input.trigger_key ?? null,
      trigger_payload: input.trigger_payload ?? null,
      delivery_targets: input.delivery_targets ?? null,
      actions: input.actions ?? null,
      metadata: input.metadata ?? null,
      dedupe_key: input.dedupe_key ?? null,
      created_at: now,
      updated_at: now,
    };
    setCanonicalAlerts(prev => {
      const next = [resolved, ...prev];
      return next.length > MAX_CANONICAL_ALERTS ? next.slice(0, MAX_CANONICAL_ALERTS) : next;
    });
    return resolved;
  }, []);

  const updateCanonicalAlertStatus = useCallback(async (
    alertId: string, status: string,
  ): Promise<CanonicalAlert | null> => {
    const updated = await alertsApi.updateAlertStatus(alertId, status);
    if (updated) {
      setCanonicalAlerts(prev => prev.map(a => a.alert_id === alertId ? updated : a));
    }
    return updated;
  }, []);

  const deleteCanonicalAlertFn = useCallback(async (alertId: string): Promise<boolean> => {
    // Always remove locally, also attempt API delete
    alertsApi.deleteAlert(alertId).catch(() => {});
    setCanonicalAlerts(prev => prev.filter(a => a.alert_id !== alertId));
    return true;
  }, []);

  const patchCanonicalAlertLocal = useCallback((alertId: string, patch: Partial<CanonicalAlert>) => {
    setCanonicalAlerts(prev => prev.map(a =>
      a.alert_id === alertId ? { ...a, ...patch, updated_at: new Date().toISOString() } : a
    ));
  }, []);

  // ── Build context value ────────────────────────────────────────
  const value = useMemo<AlertContextValue>(() => ({
    alerts: localAlerts,
    canonicalAlerts,
    rules,
    unreadCount,
    surfaceConfig,
    aiEvaluations: {},
    alertDefinitions: [],
    connected,
    loading,
    error,
    createAlert: createLocalAlert,
    updateAlert: updateLocalAlert,
    deleteAlert: deleteLocalAlert,
    toggleAlert: toggleLocalAlert,
    setAlertMode: setLocalAlertMode,
    getAlert,
    getAlertsForSource,
    getAlertsForStrategy,
    getTriggeredAlerts,
    getAIEvaluation: () => undefined,
    clearTriggeredAlerts,
    importAlerts: (alerts: Alert[]) => setLocalAlerts(alerts),
    exportAlerts: () => localAlerts,
    createCanonicalAlert,
    updateCanonicalAlertStatus,
    deleteCanonicalAlert: deleteCanonicalAlertFn,
    patchCanonicalAlert: patchCanonicalAlertLocal,
    createDefinition: async () => null,
    pauseDefinition: noopAsync,
    resumeDefinition: noopAsync,
    acknowledgeDefinition: noopAsync,
    dismissDefinition: noopAsync,
    overrideDefinition: noopAsync,
    deleteDefinition: noopAsync,
    getDefinition: () => undefined,
    getDefinitionsNeedingAttention: () => [],
  }), [
    localAlerts, canonicalAlerts, rules, unreadCount, surfaceConfig, connected, loading, error,
    createLocalAlert, updateLocalAlert, deleteLocalAlert, toggleLocalAlert,
    setLocalAlertMode, getAlert, getAlertsForSource, getAlertsForStrategy,
    getTriggeredAlerts, clearTriggeredAlerts,
    createCanonicalAlert, updateCanonicalAlertStatus, deleteCanonicalAlertFn, patchCanonicalAlertLocal,
  ]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      {surfaceConfig.toastsEnabled && toastQueue.length > 0 && (
        <ToastHost>
          {toastQueue.map(alert => (
            <AlertToast key={alert.alert_id} alert={alert} onDismiss={dismissToast} />
          ))}
        </ToastHost>
      )}
    </AlertContext.Provider>
  );
}

// ── Hooks (same exports as before) ───────────────────────────────────

export function useAlerts(): AlertContextValue {
  return useContext(AlertContext);
}

export function useAlertsForSource(sourceType: AlertSource['type'], sourceId?: string) {
  const ctx = useAlerts();
  return { ...ctx, alerts: ctx.getAlertsForSource(sourceType, sourceId) };
}

export function useAlertsForStrategy(strategyId: string) {
  const ctx = useAlerts();
  return { ...ctx, alerts: ctx.getAlertsForStrategy(strategyId) };
}
