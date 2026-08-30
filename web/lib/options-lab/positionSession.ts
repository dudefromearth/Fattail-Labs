/**
 * Session clocks on a position.
 * Entry is configurable (default = cash open). Close is a transaction —
 * you cannot set a close time on an open position.
 */

import {
  nyWall,
  nyWallToUtcMs,
  rthOpenMs,
} from "./timeOrthoSession";

/** Beginning of the cash session (9:30 AM ET) on the wall-day of `nowMs`. */
export function defaultSessionEntryAt(nowMs = Date.now()): number {
  return rthOpenMs(nyWall(nowMs));
}

export function resolveEntryAt(
  pos: { entryAt?: number | null; createdAt?: number },
  nowMs = Date.now(),
): number {
  if (pos.entryAt != null && Number.isFinite(pos.entryAt)) return pos.entryAt;
  return defaultSessionEntryAt(pos.createdAt || nowMs);
}

/** §13a item 1: dark until the playhead reaches entry. Live (no playhead) is never dark. */
export function isTmPositionDark(
  pos: { entryAt?: number | null; createdAt?: number },
  playheadMs: number | null | undefined,
): boolean {
  if (playheadMs == null || !Number.isFinite(playheadMs)) return false;
  return playheadMs < resolveEntryAt(pos);
}

export function isPositionClosed(pos: { closedAt?: number | null }): boolean {
  return pos.closedAt != null && Number.isFinite(pos.closedAt);
}

export function formatEtHm(ms: number): string {
  const w = nyWall(ms);
  const h12 = w.hour % 12 || 12;
  const ampm = w.hour >= 12 ? "PM" : "AM";
  return `${h12}:${String(w.minute).padStart(2, "0")} ${ampm}`;
}

export function etHmValue(ms: number): string {
  const w = nyWall(ms);
  return `${String(w.hour).padStart(2, "0")}:${String(w.minute).padStart(2, "0")}`;
}

export function applyEtHm(dayMs: number, hm: string): number {
  const parts = hm.split(":");
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  const d = nyWall(dayMs);
  return nyWallToUtcMs(
    d.year,
    d.month,
    d.day,
    Number.isFinite(hour) ? hour : 9,
    Number.isFinite(minute) ? minute : 30,
  );
}
