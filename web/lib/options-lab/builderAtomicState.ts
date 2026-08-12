/**
 * Position Builder atomic plane state (OT-EF · card-parity).
 *
 * Same law as position cards / usePackageQuotes:
 *   1. Definition changes once
 *   2. Resolve once (hydrate → listed structure → package mids)
 *   3. Settle to **one** final UI state — never a blank broken dialog
 *
 * Backend-down is a **named expected rarity**, not a crash:
 *   "OPF is temporarily unavailable — it should be back shortly."
 */

export type BuilderPlaneKind =
  /** Full structure + OPF mids available */
  | "ready"
  /** Atomic resolve in flight */
  | "updating"
  /** OPF / dual-side plane unreachable — theoretically rare */
  | "plane_unavailable"
  /** Structure cannot sit on listed grid (user/geometry) */
  | "unplaceable";

export type BuilderPlaneState = {
  kind: BuilderPlaneKind;
  /** Short uppercase label (banner / package cell) */
  title: string;
  /** Calm member-facing detail — never stack traces or internal codes */
  detail: string;
  /** True when this is an expected edge, not a system defect */
  expected: boolean;
};

export const BUILDER_PLANE_UPDATING: BuilderPlaneState = {
  kind: "updating",
  title: "UPDATING",
  detail:
    "Resolving this structure on the OPF chain — strikes and package settle together.",
  expected: true,
};

export const BUILDER_PLANE_UNAVAILABLE: BuilderPlaneState = {
  kind: "plane_unavailable",
  title: "OPF UNAVAILABLE",
  detail:
    "The options pricing plane is temporarily unavailable. It should be back shortly — your structure is not lost.",
  expected: true,
};

export const BUILDER_PLANE_READY: BuilderPlaneState = {
  kind: "ready",
  title: "READY",
  detail: "Structure and package marks are live from OPF.",
  expected: true,
};

export function builderUnplaceable(detail?: string): BuilderPlaneState {
  return {
    kind: "unplaceable",
    title: "CHECK STRUCTURE",
    detail:
      detail ||
      "That shape cannot sit on the listed OPF strikes for this expiration. Adjust width, center, or strategy.",
    expected: true,
  };
}

/**
 * Definition key for atomic settle — any change restarts one resolve unit.
 */
export function builderDefinitionKey(parts: {
  mode: string;
  symbol: string;
  template: string;
  direction: string;
  optionSide: string;
  center: number;
  width: number;
  expiration: string;
  backExpiration?: string;
  spot: number;
  contracts: number;
}): string {
  return [
    parts.mode,
    parts.symbol,
    parts.template,
    parts.direction,
    parts.optionSide,
    parts.center,
    parts.width,
    parts.expiration.slice(0, 10),
    (parts.backExpiration || "").slice(0, 10),
    Math.round(parts.spot * 100) / 100,
    parts.contracts,
  ].join("|");
}

/**
 * Map chain + structure facts → single plane state for the dialog shell.
 */
export function resolveBuilderPlaneState(opts: {
  open: boolean;
  hasListedStrikes: boolean;
  hasLegs: boolean;
  packageComplete: boolean;
  chainError: string | null;
  chainLoading: boolean;
  /** True while this definition's atomic resolve is in flight */
  resolving: boolean;
  /** True when regenerate could not place on listed grid */
  unplaceable: boolean;
  unplaceableDetail?: string | null;
}): BuilderPlaneState {
  if (!opts.open) return BUILDER_PLANE_READY;

  if (opts.unplaceable) {
    return builderUnplaceable(opts.unplaceableDetail || undefined);
  }

  // Plane down only when we have an error and no listed strikes (true outage)
  if (opts.chainError && !opts.hasListedStrikes) {
    return BUILDER_PLANE_UNAVAILABLE;
  }

  if (opts.resolving || opts.chainLoading) {
    if (!opts.hasListedStrikes || !opts.hasLegs || !opts.packageComplete) {
      return BUILDER_PLANE_UPDATING;
    }
  }

  if (!opts.hasListedStrikes || !opts.hasLegs) {
    return BUILDER_PLANE_UPDATING;
  }

  // Legs on grid; package may still fill mids — still ready shell with UPDATING package
  if (!opts.packageComplete) {
    return {
      kind: "updating",
      title: "UPDATING",
      detail:
        "Structure is on the OPF grid. Package marks are settling from dual-side mids.",
      expected: true,
    };
  }

  return BUILDER_PLANE_READY;
}
