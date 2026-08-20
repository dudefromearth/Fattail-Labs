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
  definedDebitSigned,
  isOptionPointerExpired,
  type AnalyzerPosition,
} from "@/lib/options-lab/analyzerBook";
import { bindPackageLabel } from "@/lib/options-lab/optionBind";
import { positionToParsedTrade } from "@/lib/options-lab/positionToTrade";
import type { ParsedTosTrade } from "@/lib/options-lab/tosParser";
import { generateTosScript } from "@/lib/options-lab/tosGenerator";
import { sumAlignedPnL } from "@/lib/options-lab/opfPricingApi";
import { buildPayoffCurve } from "@/lib/options-lab/riskPayoff";

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
        "This expiration day has ended (after midnight Eastern Time). The viewport shows the residual (ghost) until you hide the card or roll to a later listed date.",
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
  const preOpen =
    typeof pos.markMode === "string" && pos.markMode.startsWith("pre_open");
  if (preOpen && pos.markDisclaimer) {
    return {
      kind: "price",
      packageLabel: null,
      chipLabel: "theo · until open",
      detail: pos.markDisclaimer,
      expected: true,
    };
  }
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

/**
 * Risk-graph / Surface focus policy (OT-EF · PB-VIEW-6).
 *
 * Incomplete or non-representable focus must **never** fabricate a curve and
 * must **never** replace the viewport with a cryptic internal string
 * (no "PB-VIEW-6", no "dual-side generations"). Keep scales + grid; optional
 * centered named state + calm detail.
 */
export type ViewportCurveMode =
  /** Full live + theoretical package curves */
  | "live"
  /** At-expiry residual only (expired pointer — MSC-style ghost) */
  | "expired_ghost"
  /** Axes + grid only — no position series */
  | "empty";

export type ViewportFocusPolicy = {
  curveMode: ViewportCurveMode;
  /** Shown expired cards draw the at-expiry residual (ghost), even next to live curves. */
  showExpiredGhost: boolean;
  /** When set, center over the grid (named Law B state) */
  notice: { title: string; detail: string } | null;
  display: CardDisplayState;
};

export function resolveViewportFocusPolicy(
  pos: AnalyzerPosition | null | undefined,
  opts?: {
    now?: Date;
    sessionHeld?: boolean;
  },
): ViewportFocusPolicy | null {
  if (!pos || !pos.visible) return null;
  const display = resolveCardDisplayState(pos, opts);

  if (display.kind === "price") {
    return { curveMode: "live", showExpiredGhost: false, notice: null, display };
  }

  if (display.kind === "expired") {
    return {
      curveMode: "expired_ghost",
      showExpiredGhost: true,
      notice: {
        title: display.packageLabel ?? "EXPIRED",
        detail: display.detail,
      },
      display,
    };
  }

  // incomplete · skewed · not traded · check legs · budget · waiting · updating · hidden
  return {
    curveMode: "empty",
    showExpiredGhost: false,
    notice: {
      title: display.packageLabel ?? display.chipLabel.toUpperCase(),
      detail: display.detail,
    },
    display,
  };
}

/**
 * Viewport policy for the **shown book** — every visible card, independently.
 * Show/Hide is a checkbox, not a radio: hiding A does not hide B.
 * Live cards win (additive book curve). All-expired shown book → ghost.
 * Non-representable shown cards do not blank a drawable sibling.
 */
export function resolveViewportBookPolicy(
  positions: AnalyzerPosition[],
  opts?: {
    now?: Date;
    sessionHeld?: boolean;
  },
): ViewportFocusPolicy | null {
  const shown = positions.filter((p) => p.visible);
  if (shown.length === 0) return null;

  const states = shown.map((p) => resolveCardDisplayState(p, opts));
  const expired = shown.filter((_, i) => states[i].kind === "expired");
  const showExpiredGhost = expired.length > 0;
  const live = shown.find((_, i) => states[i].kind === "price");
  if (live) {
    return {
      curveMode: "live",
      showExpiredGhost,
      notice: null,
      display: resolveCardDisplayState(live, opts),
    };
  }
  if (expired.length === shown.length) {
    return resolveViewportFocusPolicy(expired[0], opts);
  }
  // Held / last-print: a shown definition may still resolve on the
  // generation OPF holds even when the card cell is still settling.
  const liveDefs = shown.filter((_, i) => states[i].kind !== "expired");
  if (liveDefs.length > 0) {
    return {
      curveMode: "live",
      showExpiredGhost,
      notice: null,
      display: states[0],
    };
  }
  return resolveViewportFocusPolicy(shown[0], opts);
}

/**
 * Viewport book: every **shown** (visible) card that can draw a curve
 * (price or expired residual) on the session underlier. Independent of
 * which card is highlighted. Hidden cards never contribute.
 */
export function visibleBookTrade(
  positions: AnalyzerPosition[],
  opts?: {
    now?: Date;
    sessionHeld?: boolean;
    symbol?: string;
  },
): {
  trade: ParsedTosTrade | null;
  trades: ParsedTosTrade[];
  expiredTrades: ParsedTosTrade[];
  contributingIds: string[];
} {
  const shown = positions.filter((p) => p.visible);
  if (shown.length === 0) {
    return { trade: null, trades: [], expiredTrades: [], contributingIds: [] };
  }

  const now = opts?.now ?? new Date();
  const want = (opts?.symbol || shown[0].position.underlying || "").toUpperCase();
  const contributingIds: string[] = [];
  const trades: ParsedTosTrade[] = [];
  const expiredTrades: ParsedTosTrade[] = [];
  for (const p of shown) {
    if ((p.position.underlying || "").toUpperCase() !== want) continue;
    if (!p.position.legs.length) continue;
    contributingIds.push(p.id);
    const t = positionToParsedTrade(p.position);
    const exp = (
      p.position.expiration ||
      p.position.legs[0]?.expiration ||
      ""
    ).slice(0, 10);
    if (isOptionPointerExpired(exp, now)) {
      expiredTrades.push(withCardDebit(t, p));
    } else if (p.lock.mode === "locked") {
      // Canvas basis is the card's D* — not live mid.
      trades.push(withCardDebit(t, p));
    } else {
      // Unlocked: no frozen @LMT. Local sheet marks to market.
      trades.push(withMarketBasis(t));
    }
  }
  return {
    trade: trades[0] ?? expiredTrades[0] ?? null,
    trades,
    expiredTrades,
    contributingIds,
  };
}

function withCostBasis(
  trade: ParsedTosTrade,
  debit: number | null,
): ParsedTosTrade {
  if (debit == null || !Number.isFinite(debit)) {
    const raw =
      generateTosScript({
        symbol: trade.symbol,
        legs: trade.legs,
        costBasis: null,
      }) || trade.raw;
    return { ...trade, debit: null, limit: null, raw };
  }
  const limit = Math.abs(debit);
  const raw =
    generateTosScript({
      symbol: trade.symbol,
      legs: trade.legs,
      costBasis: limit,
    }) || trade.raw;
  return {
    ...trade,
    debit,
    isCredit: debit < 0,
    limit,
    raw,
  };
}

function withCardDebit(
  trade: ParsedTosTrade,
  pos: AnalyzerPosition,
): ParsedTosTrade {
  // Defined debit/credit for this pointer — frozen on expire / lock.
  // Must not fall back to zero; that is a different position.
  let debit = definedDebitSigned(pos);
  if (debit == null || !Number.isFinite(debit)) {
    if (
      pos.livePackagePerShare != null &&
      Number.isFinite(pos.livePackagePerShare)
    ) {
      debit =
        pos.priceSide === "credit"
          ? -Math.abs(pos.livePackagePerShare)
          : Math.abs(pos.livePackagePerShare);
    } else if (trade.debit != null && Number.isFinite(trade.debit)) {
      debit = trade.debit;
    }
  }
  if (debit == null || !Number.isFinite(debit)) return trade;
  return withCostBasis(trade, debit);
}

/** Unlocked live book: never carry a leftover @LMT into the canvas. */
function withMarketBasis(trade: ParsedTosTrade): ParsedTosTrade {
  if (trade.limit == null && trade.debit == null) return trade;
  return withCostBasis(trade, null);
}

/**
 * At-expiry residual (ghost) for every shown expired pointer.
 * Intrinsic payoff — does not need a live OPF generation for a dead exp.
 */
export function expiredGhostSeries(
  positions: AnalyzerPosition[],
  opts?: {
    now?: Date;
    sessionHeld?: boolean;
    symbol?: string;
    spot?: number | null;
  },
): { price: number; pnl: number }[] {
  const { expiredTrades } = visibleBookTrade(positions, opts);
  if (expiredTrades.length === 0) return [];
  const series = expiredTrades.map((t) => {
    const curve = buildPayoffCurve(t, {
      spot: opts?.spot ?? null,
      steps: 161,
      padPts: 120,
    });
    return curve.points.map((p) => ({ price: p.x, pnl: p.y }));
  });
  return sumAlignedPnL(series);
}
