import { useEffect, useRef, useCallback } from 'react';
import * as alertsApi from '../lib/alertsApi';
import type { CanonicalAlert } from '../ms-transplant/types/alerts';

// Static — outside component to avoid re-allocation on render
const SEVERITY_BORDER: Record<string, string> = {
  info: '#3B82F6',
  low: '#9CA3AF',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
};

export interface AlertToastProps {
  alert: CanonicalAlert;
  onDismiss: (id: string) => void;
}

export function AlertToast({ alert, onDismiss }: AlertToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(alert.alert_id), 5000);
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [alert.alert_id, onDismiss]);

  const handleAck = useCallback(async () => {
    await alertsApi.updateAlertStatus(alert.alert_id, 'acknowledged');
    onDismiss(alert.alert_id);
  }, [alert.alert_id, onDismiss]);

  const handleClose = useCallback(() => {
    onDismiss(alert.alert_id);
  }, [alert.alert_id, onDismiss]);

  const borderColor = SEVERITY_BORDER[alert.severity] ?? '#9CA3AF';
  const displayMessage = alert.short_message
    ? alert.short_message
    : alert.message.length > 80
      ? alert.message.slice(0, 80) + '\u2026'
      : alert.message;

  return (
    <div style={{
      pointerEvents: 'auto',
      background: 'var(--bg-content, #1C1C1E)',
      backdropFilter: 'blur(var(--glass-blur, 20px)) saturate(var(--glass-saturate, 180%))',
      WebkitBackdropFilter: 'blur(var(--glass-blur, 20px)) saturate(var(--glass-saturate, 180%))',
      borderTop: '1px solid var(--separator, rgba(255,255,255,0.1))',
      borderRight: '1px solid var(--separator, rgba(255,255,255,0.1))',
      borderBottom: '1px solid var(--separator, rgba(255,255,255,0.1))',
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: 10,
      padding: '10px 12px',
      minWidth: 280,
      maxWidth: 360,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>
      {/* Header row: severity badge + title + close */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase' as const,
          color: borderColor,
          flexShrink: 0,
        }}>
          {alert.severity}
        </span>
        <span style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' as const,
        }}>
          {alert.title}
        </span>
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary, #666)',
            cursor: 'pointer',
            padding: '0 2px',
            fontSize: 16,
            lineHeight: 1,
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          \xd7
        </button>
      </div>

      {/* Message */}
      <div style={{
        fontSize: 12,
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
        marginBottom: 8,
      }}>
        {displayMessage}
      </div>

      {/* Ack button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleAck}
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--accent, #007AFF)',
            background: 'none',
            border: '1px solid var(--accent, #007AFF)',
            borderRadius: 5,
            padding: '2px 8px',
            cursor: 'pointer',
          }}
        >
          Ack
        </button>
      </div>
    </div>
  );
}
