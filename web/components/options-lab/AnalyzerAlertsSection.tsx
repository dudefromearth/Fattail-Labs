"use client";

/**
 * Threshold alert cards — same UX family as MSC Risk Graph AlertsSection.
 * Local session store; chart right-click creates price rules.
 * A7: show first 20 of N with count label.
 */

import ReplayBadge from "@/components/options-lab/ReplayBadge";
import { formatReplayClock } from "@/lib/options-lab/algoDayReplay";
import type { AnalyzerThresholdAlert } from "@/lib/options-lab/analyzerBook";

const SEVERITY: Record<string, string> = {
  info: "#3B82F6",
  low: "#9CA3AF",
  medium: "#F59E0B",
  high: "#F97316",
  critical: "#EF4444",
};

const ALERT_LIST_CAP = 20;

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
  const active = alerts
    .filter((a) => a.status !== "dismissed")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  // Prefer session symbol but keep others visible with count honesty
  const sorted = [
    ...active.filter((a) => !symbol || a.symbol === symbol || !a.symbol),
    ...active.filter(
      (a) => symbol && a.symbol && a.symbol !== symbol,
    ),
  ];
  // de-dupe after prefer sort
  const seen = new Set<string>();
  const ordered: AnalyzerThresholdAlert[] = [];
  for (const a of sorted) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    ordered.push(a);
  }
  const total = ordered.length;
  const filtered = ordered.slice(0, ALERT_LIST_CAP);

  return (
    <div className="space-y-2" data-testid="analyzer-alerts-section">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
          Alerts
        </span>
        {total > 0 && (
          <span
            className="text-[10px] text-[var(--color-label-tertiary)]"
            data-testid="analyzer-alerts-count"
          >
            {total > ALERT_LIST_CAP
              ? `showing ${ALERT_LIST_CAP} of ${total}`
              : `${total} alert${total === 1 ? "" : "s"}`}
          </span>
        )}
      </div>
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
              data-rehearsal={alert.rehearsal ? "1" : "0"}
            >
              {alert.rehearsal ? <ReplayBadge className="!min-h-9 !min-w-9" /> : null}
              <div className="min-w-0 flex-1 pl-2">
                <div className="truncate text-xs font-medium text-[var(--color-label)]">
                  {alert.title.slice(0, 60)}
                  {alert.rehearsal ? (
                    <span className="ml-1 text-white/55">· rehearsal</span>
                  ) : alert.status === "triggered" ? (
                    <span className="ml-1 text-amber-400">· triggered</span>
                  ) : null}
                </div>
                <div className="mt-0.5 text-[10px] text-[var(--color-label-tertiary)]">
                  {alert.rehearsal
                    ? formatReplayClock(Date.parse(alert.createdAt) || Date.now())
                    : relTime(alert.createdAt)}
                  {alert.symbol && symbol && alert.symbol !== symbol && (
                    <span className="ml-1.5 rounded bg-sky-600/20 px-1 text-sky-700 dark:text-sky-300">
                      {alert.symbol}
                    </span>
                  )}
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
