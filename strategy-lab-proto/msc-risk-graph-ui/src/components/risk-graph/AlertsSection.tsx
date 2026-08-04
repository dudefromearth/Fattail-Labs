/* AlertsSection — Threshold alerts in the left rail, backed by AlertContext. */

import type { CSSProperties } from 'react';
import { useAlerts } from '../../ms-transplant/contexts/AlertContext';

interface AlertsSectionProps {
  symbol?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  info: '#3B82F6',
  low: '#9CA3AF',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const actionButtonStyle: CSSProperties = {
  background: 'none',
  border: '1px solid var(--border-secondary)',
  borderRadius: 4,
  padding: '2px 8px',
  fontSize: 11,
  cursor: 'pointer',
  color: 'var(--text-secondary)',
};

export function AlertsSection({ symbol }: AlertsSectionProps) {
  const { canonicalAlerts, surfaceConfig, updateCanonicalAlertStatus } = useAlerts();

  if (!surfaceConfig.alertsSectionEnabled) {
    return null;
  }

  const filtered = canonicalAlerts
    .filter(a => a.alert_class === 'threshold')
    .filter(a => !symbol || a.symbol === symbol || !a.symbol)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  const handleAck = (alertId: string) => {
    updateCanonicalAlertStatus(alertId, 'acknowledged');
  };

  const handleDismiss = (alertId: string) => {
    updateCanonicalAlertStatus(alertId, 'dismissed');
  };

  return (
    <div className="rg-rail-section">
      <div className="rg-rail-section-header">
        <span className="rg-rail-section-title">ALERTS</span>
      </div>
      {filtered.length === 0 ? (
        <div className="rg-rail-empty">
          No threshold alerts — define rules in Settings → Alerts
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map(alert => (
            <div
              key={alert.alert_id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '8px 12px',
                borderLeft: `3px solid ${SEVERITY_COLORS[alert.severity] ?? SEVERITY_COLORS.info}`,
                fontSize: 13,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {alert.title?.slice(0, 60)}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 2 }}>
                  {formatRelativeTime(alert.created_at)}
                  {alert.status !== 'new' && (
                    <span style={{ marginLeft: 8, opacity: 0.7 }}>{alert.status}</span>
                  )}
                </div>
              </div>
              {alert.status === 'new' && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => handleAck(alert.alert_id)} style={actionButtonStyle}>
                    Ack
                  </button>
                  <button onClick={() => handleDismiss(alert.alert_id)} style={actionButtonStyle}>
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
