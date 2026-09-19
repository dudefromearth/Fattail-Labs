/** D5 — LIVE/STALE from heartbeat last-print age, not stream liveness. */

export const STALE_AFTER_MS = 3000;

export function liveFromPrintAge(
  ageMs: number | null | undefined,
): "LIVE" | "STALE" | "OFF" {
  if (ageMs == null || !Number.isFinite(ageMs) || ageMs < 0) return "OFF";
  return ageMs <= STALE_AFTER_MS ? "LIVE" : "STALE";
}
