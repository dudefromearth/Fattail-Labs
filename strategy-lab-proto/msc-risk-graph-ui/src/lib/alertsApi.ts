/**
 * Alert API client — fetch wrappers for all 12 alert endpoints.
 * Fire-and-forget pattern: credentials included, errors returned as null.
 */

import type {
  CanonicalAlert,
  AlertRule,
  DeliverySettings,
  CreateCanonicalAlertRequest,
  CreateRuleRequest,
} from '../ms-transplant/types/alerts';

// ── Helpers ──────────────────────────────────────────────────────────

async function api<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, { credentials: 'include', ...options });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function jsonOpts(body: unknown): RequestInit {
  return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

// ── Alert endpoints (6) ──────────────────────────────────────────────

interface AlertListResponse {
  alerts: CanonicalAlert[];
  pagination: { page: number; per_page: number; total: number; pages: number };
}

export async function fetchAlerts(params?: {
  status?: string;
  severity?: string;
  alert_class?: string;
  domain?: string;
  symbol?: string;
  source_system?: string;
  page?: number;
  per_page?: number;
}): Promise<AlertListResponse | null> {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null) qs.set(k, String(v));
    }
  }
  const suffix = qs.toString() ? `?${qs}` : '';
  return api<AlertListResponse>(`/api/alerts${suffix}`);
}

export async function createAlert(body: CreateCanonicalAlertRequest): Promise<CanonicalAlert | null> {
  return api<CanonicalAlert>('/api/alerts', { method: 'POST', ...jsonOpts(body) });
}

export async function fetchAlert(alertId: string): Promise<CanonicalAlert | null> {
  return api<CanonicalAlert>(`/api/alerts/${alertId}`);
}

export async function updateAlertStatus(alertId: string, status: string): Promise<CanonicalAlert | null> {
  return api<CanonicalAlert>(`/api/alerts/${alertId}/status`, { method: 'PATCH', ...jsonOpts({ status }) });
}

export async function deleteAlert(alertId: string): Promise<boolean> {
  const res = await api<{ deleted: boolean }>(`/api/alerts/${alertId}`, { method: 'DELETE' });
  return res?.deleted ?? false;
}

export async function fetchAlertCount(status?: string): Promise<number> {
  const qs = status ? `?status=${status}` : '';
  const res = await api<{ count: number }>(`/api/alerts/count${qs}`);
  return res?.count ?? 0;
}

// ── Rule endpoints (4) ───────────────────────────────────────────────

interface RuleListResponse { rules: AlertRule[] }

export async function fetchRules(enabled?: boolean): Promise<AlertRule[]> {
  const qs = enabled != null ? `?enabled=${enabled}` : '';
  const res = await api<RuleListResponse>(`/api/alerts/rules${qs}`);
  return res?.rules ?? [];
}

export async function createRule(body: CreateRuleRequest): Promise<AlertRule | null> {
  return api<AlertRule>('/api/alerts/rules', { method: 'POST', ...jsonOpts(body) });
}

export async function updateRule(
  ruleId: string,
  updates: Partial<CreateRuleRequest>,
): Promise<AlertRule | null> {
  return api<AlertRule>(`/api/alerts/rules/${ruleId}`, { method: 'PATCH', ...jsonOpts(updates) });
}

export async function deleteRule(ruleId: string): Promise<boolean> {
  const res = await api<{ deleted: boolean }>(`/api/alerts/rules/${ruleId}`, { method: 'DELETE' });
  return res?.deleted ?? false;
}

// ── Delivery settings (2) ────────────────────────────────────────────

export async function fetchDeliverySettings(): Promise<DeliverySettings | null> {
  return api<DeliverySettings>('/api/alerts/delivery-settings');
}

export async function updateDeliverySettings(
  settings: Partial<DeliverySettings>,
): Promise<DeliverySettings | null> {
  return api<DeliverySettings>('/api/alerts/delivery-settings', { method: 'PUT', ...jsonOpts(settings) });
}
