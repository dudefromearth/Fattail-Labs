/**
 * Session posture mapping — market plane primary, clock fallback secondary (B2 · P-B4).
 * Pure helpers for unit/fixture tests (holiday · half-day · index window).
 */

export type SessionPosture = "Live" | "Extended" | "Held" | "Closed" | "Error";

export type SessionStatusDoc = {
  open?: boolean | null;
  /** Massive still producing prints (RTH or pre/post). */
  printing?: boolean | null;
  market?: string | null;
  ok?: boolean;
  error?: string;
};

/** True when Massive is printing — RTH or pre/post. Not a cash-bell gate. */
export function planeIsPrinting(posture: SessionPosture): boolean {
  return posture === "Live" || posture === "Extended";
}

/**
 * Map `/api/me/market/session-status` body → Analyzer posture.
 * `open: true` → Live (RTH).
 * `extended-hours` / printing → Extended (pre/post Massive prints).
 * `closed` → Closed. Else Held (last print, plane dark).
 * Missing open → null (caller uses clock fallback).
 */
export function postureFromSessionStatus(
  doc: SessionStatusDoc | null | undefined,
): SessionPosture | null {
  if (!doc) return null;
  const m = String(doc.market || "").toLowerCase();
  if (doc.open === true) return "Live";
  if (m === "extended-hours" || doc.printing === true) return "Extended";
  if (typeof doc.open !== "boolean" && doc.printing == null && !m) {
    return null;
  }
  if (m === "closed" || m === "early-close") return "Closed";
  if (doc.open === false) return "Held";
  return null;
}

/**
 * Clock fallback only when plane facts unavailable.
 * Do not hard-cut at 16:00 / 09:30 — Massive prints pre (04:00) and post
 * (to 20:00 ET). Index RTH window 09:30–16:15.
 */
export function clockPostureFallback(now: Date = new Date()): SessionPosture {
  try {
    const et = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" }),
    );
    const day = et.getDay();
    const mins = et.getHours() * 60 + et.getMinutes();
    if (day === 0 || day === 6) return "Closed";
    if (mins >= 9 * 60 + 30 && mins < 16 * 60 + 15) return "Live";
    if (mins >= 4 * 60 && mins < 9 * 60 + 30) return "Extended";
    if (mins >= 16 * 60 + 15 && mins < 20 * 60) return "Extended";
    return "Held";
  } catch {
    return "Error";
  }
}

/**
 * Fixture cases for S/K evidence (P-B4).
 * These mirror plane docs — not wall-clock alone.
 */
export const POSTURE_FIXTURES: {
  id: string;
  doc: SessionStatusDoc;
  expected: SessionPosture;
}[] = [
  {
    id: "holiday_closed",
    doc: { open: false, market: "closed", ok: true },
    expected: "Closed",
  },
  {
    id: "half_day_early_close",
    doc: { open: false, market: "early-close", ok: true },
    expected: "Closed",
  },
  {
    id: "extended_hours_pre_post",
    doc: { open: false, market: "extended-hours", printing: true, ok: true },
    expected: "Extended",
  },
  {
    id: "regular_open_live",
    doc: { open: true, market: "open", ok: true },
    expected: "Live",
  },
  {
    id: "index_window_plane_open",
    // Plane says open through index close — 16:05 is Live if Massive still open
    doc: { open: true, market: "open", ok: true },
    expected: "Live",
  },
  {
    id: "index_window_plane_held",
    // After equity close before index residual if plane reports closed
    doc: { open: false, market: "closed", ok: true },
    expected: "Closed",
  },
];

export function runPostureFixtures(): {
  id: string;
  pass: boolean;
  expected: SessionPosture;
  got: SessionPosture | null;
}[] {
  return POSTURE_FIXTURES.map((f) => {
    const got = postureFromSessionStatus(f.doc);
    return {
      id: f.id,
      pass: got === f.expected,
      expected: f.expected,
      got,
    };
  });
}
