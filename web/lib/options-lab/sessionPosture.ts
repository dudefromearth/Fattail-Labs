/**
 * Session posture mapping — market plane primary, clock fallback secondary (B2 · P-B4).
 * Pure helpers for unit/fixture tests (holiday · half-day · index window).
 */

export type SessionPosture = "Live" | "Held" | "Closed" | "Error";

export type SessionStatusDoc = {
  open?: boolean | null;
  market?: string | null;
  ok?: boolean;
  error?: string;
};

/**
 * Map `/api/me/market/session-status` body → Analyzer posture.
 * `open: true` → Live; otherwise Held/Closed from market label.
 * Missing open → null (caller uses clock fallback).
 */
export function postureFromSessionStatus(
  doc: SessionStatusDoc | null | undefined,
): SessionPosture | null {
  if (!doc || typeof doc.open !== "boolean") return null;
  if (doc.open) return "Live";
  const m = String(doc.market || "").toLowerCase();
  if (m === "closed" || m === "early-close") return "Closed";
  // extended-hours, holidays (closed with open:false), half-day after close → Held
  return "Held";
}

/**
 * Clock fallback only when plane facts unavailable.
 * Index-friendly: Live 09:30–16:15 ET weekdays (SPX/options often print to 16:15).
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
    id: "extended_hours_held",
    doc: { open: false, market: "extended-hours", ok: true },
    expected: "Held",
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
