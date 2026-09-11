/**
 * Chain-bound controls (PC-CHAIN, PC-EXP, PC-FOUND).
 * Constraint at the control: never offer what the chain lacks, never snap
 * a missing value to options[0] on render.
 */

import { OPF_ACTIVE_DTE_HORIZON } from "./dteHorizon";
import { calendarDteOf } from "./analyzerBook";
import type { TemplateType } from "./positionTypes";
import { tickSize } from "./tickSize";

export type LadderKind = "empty" | "singular" | "many";

export function ladderKind(listed: readonly unknown[]): LadderKind {
  if (!listed.length) return "empty";
  if (listed.length === 1) return "singular";
  return "many";
}

export function ladderStatusLabel(kind: LadderKind): string {
  if (kind === "empty") return "loading";
  return "";
}

/**
 * Select value that never falls back to options[0].
 * Invalid current → empty string + invalid flag (AT-PC-17).
 */
export function boundSelectValue(
  current: string,
  options: readonly string[],
): { value: string; invalid: boolean } {
  if (current && options.includes(current)) {
    return { value: current, invalid: false };
  }
  return { value: "", invalid: true };
}

/** Step one listed strike. Edge is a no-op (PC-CHAIN-3). */
export function stepListedStrike(
  current: number,
  listed: readonly number[],
  dir: "up" | "down",
): number {
  if (!listed.length) return current;
  const sorted = [...listed].sort((a, b) => a - b);
  const i = sorted.findIndex((s) => s === current);
  if (i < 0) return current;
  const j = dir === "up" ? i + 1 : i - 1;
  if (j < 0 || j >= sorted.length) return current;
  return sorted[j];
}

const MULTI_DATE: ReadonlySet<TemplateType> = new Set([
  "calendar",
  "diagonal",
]);

/** With one listed expiration, multi-date strategies are not offered. */
export function offeredTemplates(
  expCount: number,
  all: readonly TemplateType[],
): TemplateType[] {
  if (expCount >= 2) return [...all];
  return all.filter((t) => !MULTI_DATE.has(t));
}

export function dteFromClock(expiration: string, clock: Date): number {
  return calendarDteOf(expiration, clock);
}

export function listedInHorizon(
  expirations: readonly string[],
  clock: Date,
  horizon = OPF_ACTIVE_DTE_HORIZON,
): string[] {
  return expirations
    .map((e) => e.slice(0, 10))
    .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e))
    .filter((e) => {
      const d = dteFromClock(e, clock);
      return d >= 0 && d <= horizon;
    })
    .sort();
}

/** Seed-time defaults: front = listed[0], back = listed[1]. */
export function seedExpirations(listed: readonly string[]): {
  front: string | null;
  back: string | null;
} {
  return {
    front: listed[0] ?? null,
    back: listed[1] ?? null,
  };
}

/**
 * Propose a structure roll to the next listed expiration.
 * Does not apply (PC-FOUND-4).
 */
export function proposeExpirationRoll(
  current: string,
  listed: readonly string[],
): string | null {
  const cur = current.slice(0, 10);
  const sorted = [...listed].map((e) => e.slice(0, 10)).sort();
  const next = sorted.find((e) => e > cur);
  return next ?? null;
}

export function basisTick(product: string, premium: number): number {
  return tickSize(product, premium);
}

export function residualStillEditable(opts: {
  sessionEnded: boolean;
  expiredMidnightEt: boolean;
}): boolean {
  return opts.sessionEnded && !opts.expiredMidnightEt;
}
