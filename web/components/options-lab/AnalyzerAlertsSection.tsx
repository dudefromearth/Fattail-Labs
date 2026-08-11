"use client";

/**
 * Threshold alert cards — same UX family as MSC Risk Graph AlertsSection.
 * Local session store; chart right-click creates price rules.
 */

import type { AnalyzerThresholdAlert } from "@/lib/options-lab/analyzerBook";

const SEVERITY: Record<string, string> = {
  info: "#3B82F6",
  low: "#9CA3AF",
  medium: "#F59E0B",
  high: "#F97316",
  critical: "#EF4444",
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export type AnalyzerAlertsSectionProps = {
  alerts: AnalyzerThresholdAlert[];
  symbol?: string;
  onAck: (id: string) => void;
  onDismiss: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function AnalyzerAlertsSection({
  alerts,
  symbol,
  onAck,
  onDismiss,
  onDelete,
}: AnalyzerAlertsSectionProps) {
  const filtered = alerts
    .filter((a) => a.status !== "dismissed")
    .filter((a) => !symbol || a.symbol === symbol || !a.symbol)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 20);

  return (
    <div className="space-y-2" data-testid="analyzer-alerts-section">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
        Alerts
      </span>
      {filtered.length === 0 ? (
        <p className="text-[11px] text-[var(--color-label-tertiary)]">
          No threshold alerts — right-click the risk graph to set price above /
          below / touch.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-2 rounded-lg bg-[var(--color-fill)]/50 py-2 pl-0 pr-2"
              style={{
                borderLeft: `3px solid ${SEVERITY[alert.severity] ?? SEVERITY.info}`,
              }}
              data-testid={`analyzer-alert-${alert.id}`}
            >
              <div className="min-w-0 flex-1 pl-2">
                <div className="truncate text-xs font-medium text-[var(--color-label)]">
                  {alert.title.slice(0, 60)}
                  {alert.status === "triggered" && (
                    <span className="ml-1 text-amber-400">· triggered</span>
                  )}
                </div>
                <div className="mt-0.5 text-[10px] text-[var(--color-label-tertiary)]">
                  {relTime(alert.createdAt)}
                  {alert.status !== "new" && alert.status !== "triggered" && (
                    <span className="ml-1.5 opacity-70">{alert.status}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {alert.status === "new" && (
                  <>
                    <button
                      type="button"
                      className="rounded border border-[var(--color-separator)] px-1.5 py-0.5 text-[10px] text-[var(--color-label-secondary)]"
                      onClick={() => onAck(alert.id)}
                    >
                      Ack
                    </button>
                    <button
                      type="button"
                      className="rounded border border-[var(--color-separator)] px-1.5 py-0.5 text-[10px] text-[var(--color-label-secondary)]"
                      onClick={() => onDismiss(alert.id)}
                    >
                      ×
                    </button>
                  </>
                )}
                {(alert.status === "acknowledged" ||
                  alert.status === "triggered") && (
                  <button
                    type="button"
                    className="rounded border border-[var(--color-separator)] px-1.5 py-0.5 text-[10px] text-[var(--color-label-secondary)]"
                    onClick={() => onDelete(alert.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
