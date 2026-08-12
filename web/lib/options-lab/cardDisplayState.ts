/**
 * Elegant failure law for Analyzer position cards
 * ------------------------------------------------
 * The system must never leave the user believing it is broken.
 * Exceptional cases are detected and reported as a **sensible, named state**.
 *
 * Priority (first match wins for package price cell):
 *  1. Hidden / not visible
 *  2. Pointer expired → EXPIRED
 *  3. Bind failed: missing market / chain edge → NOT TRADED
 *  4. Bind failed: other → CHECK LEGS
 *  5. Budget refused → BUDGET LIMIT
 *  6. Skewed epoch → WAITING (data)
 *  7. Incomplete / not_live without mark → UPDATING
 *  8. Live or held with package mark → PRICE
 */

import {
  isOptionPointerExpired,
  type AnalyzerPosition,
} from "@/lib/options-lab/analyzerBook";
import { bindPackageLabel } from "@/lib/options-lab/optionBind";

export type CardDisplayKind =
  | "price"
  | "expired"
  | "not_traded"
  | "check_legs"
  | "budget"
  | "waiting"
  | "updating"
  | "hidden";

export type CardDisplayState = {
  kind: CardDisplayKind;
  /** Short uppercase label for the package price cell (null when showing numeric price) */
  packageLabel: string | null;
  /** Live-column chip */
  chipLabel: string;
  /** Tooltip / aria — full sentence, never technical dump */
  detail: string;
  /** True when user should read this as a normal edge case, not an error */
  expected: boolean;
};

/**
 * Resolve a calm, named display state for a position card.
 * Always returns a state — never empty/unknown.
 */
export function resolveCardDisplayState(
  pos: AnalyzerPosition,
  opts?: {
    now?: Date;
    sessionHeld?: boolean;
    packageSide?: "debit" | "credit" | null;
  },
): CardDisplayState {
  const now = opts?.now ?? new Date();
  const exp = (
    pos.position.expiration ||
    pos.position.legs[0]?.expiration ||
    ""
  ).slice(0, 10);

  if (!pos.visible) {
    return {
      kind: "hidden",
      packageLabel: "HIDDEN",
      chipLabel: "hidden",
      detail: "Position is hidden from the risk graph. Toggle visibility to show it.",
      expected: true,
    };
  }

  if (isOptionPointerExpired(exp, now)) {
    return {
      kind: "expired",
      packageLabel: "EXPIRED",
      chipLabel: "expired",
      detail:
        "This expiration has settled. Choose a later listed expiration to point at a live option.",
      expected: true,
    };
  }

  // Bind assessment (exp + price for every leg)
  if (pos.bind && !pos.bind.bindable) {
    const pkg = bindPackageLabel(pos.bind);
    if (pkg === "NOT TRADED") {
      return {
        kind: "not_traded",
        packageLabel: "NOT TRADED",
        chipLabel: "not traded",
        detail:
          pos.bind.summary.includes("chain edge")
            ? "One or more strikes are past the edge of the option chain or have no listing. Nudge strikes back toward the center or pick a different structure — the system is fine; that option simply is not traded."
            : "One or more legs have no market price on this expiration. That is common near the edge of the chain. Adjust strikes with ▲/▼ until every leg is traded.",
        expected: true,
      };
    }
    if (pkg === "EXPIRED") {
      return {
        kind: "expired",
        packageLabel: "EXPIRED",
        chipLabel: "expired",
        detail:
          "A leg expiration has settled. Roll the structure to a listed live date.",
        expected: true,
      };
    }
    return {
      kind: "check_legs",
      packageLabel: "CHECK LEGS",
      chipLabel: "check legs",
      detail:
        pos.bind.summary ||
        "Not every leg can be bound yet. Check expiration and strikes — this is a structure issue, not a system failure.",
      expected: true,
    };
  }

  if (pos.liveState === "budget_refused") {
    return {
      kind: "budget",
      packageLabel: "BUDGET LIMIT",
      chipLabel: "budget",
      detail:
        "Live chain interest is throttled for this session. Marks will resume when capacity frees — your position definition is intact.",
      expected: true,
    };
  }

  if (pos.liveState === "skewed") {
    return {
      kind: "waiting",
      packageLabel: "WAITING",
      chipLabel: "waiting",
      detail:
        "Option data across expirations is briefly out of sync. Waiting for a clean mark — not a permanent error.",
      expected: true,
    };
  }

  const hasMark =
    pos.livePackagePerShare != null &&
    Number.isFinite(pos.livePackagePerShare);

  if (
    !hasMark &&
    (pos.liveState === "incomplete" ||
      pos.liveState === "not_live" ||
      pos.bind == null)
  ) {
    return {
      kind: "updating",
      packageLabel: "UPDATING",
      chipLabel: "updating",
      detail:
        opts?.sessionHeld
          ? "Refreshing last known marks for this structure. Market is closed; held values will appear when available."
          : "Fetching live marks for every leg. This usually takes a moment after you change strikes or expiration.",
      expected: true,
    };
  }

  // Happy path — numeric price rendered by caller
  const held =
    opts?.sessionHeld ||
    pos.liveState === "held" ||
    (pos.liveState === "live" && opts?.sessionHeld);
  return {
    kind: "price",
    packageLabel: null,
    chipLabel: held ? "held" : pos.liveState === "live" ? "live" : pos.liveState,
    detail: held
      ? "Held package mark from the last good OPF quote while the market is closed."
      : "Live package mark from OPF.",
    expected: true,
  };
}
