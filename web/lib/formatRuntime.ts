/**
 * Adaptive runtime since last start/restart.
 * - &lt; 60s:   42s
 * - &lt; 60m:   3:45  (min:sec)
 * - &lt; 24h:   2h 15m
 * - ≥ 24h:   3d 4h
 */

export function formatRuntimeSeconds(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) return "—";
  const s = Math.floor(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }
  if (s < 86400) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  return `${d}d ${h}h`;
}

/** Elapsed seconds from an ISO run_started_at timestamp to now. */
export function runtimeSecondsSince(
  runStartedAt: string | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  if (!runStartedAt) return null;
  const t = Date.parse(runStartedAt);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((nowMs - t) / 1000));
}

export function formatRuntimeSince(
  runStartedAt: string | null | undefined,
  nowMs: number = Date.now(),
): string {
  return formatRuntimeSeconds(runtimeSecondsSince(runStartedAt, nowMs));
}
