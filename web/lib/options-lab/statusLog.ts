/**
 * Analyzer inspector exception log — always-on 3-line field above Alerts.
 * Plane / override copy is OPF session language. Newest entry first.
 */

import type { SessionPosture } from "@/lib/options-lab/sessionPosture";
import { formatEtHm } from "@/lib/options-lab/positionSession";

export type StatusLogEntry = {
  at: number;
  text: string;
};

export function planeExceptionMessage(opts: {
  inputOverrideActive: boolean;
  sessionHeld: boolean;
  posture: SessionPosture;
}): string | null {
  if (opts.inputOverrideActive) {
    return "Override active — RECON is override (not live pass/fail).";
  }
  if (!opts.sessionHeld) return null;
  if (opts.posture === "Extended") {
    return "Pre/post session — last print / extended quotes. Not RTH NBBO.";
  }
  return "Off market — last print. Not polling a live chain.";
}

export function appendStatusLog(
  log: StatusLogEntry[],
  text: string | null | undefined,
  at: number,
): StatusLogEntry[] {
  const t = (text || "").trim();
  if (!t) return log;
  if (log[0]?.text === t) return log;
  return [{ at, text: t }, ...log].slice(0, 50);
}

export function formatStatusLogLine(entry: StatusLogEntry): string {
  return `${formatEtHm(entry.at)} ET  ${entry.text}`;
}
