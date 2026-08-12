/**
 * Position Builder types — Labs-owned (modeled on MSC Risk Graph PositionBuilder).
 * No MSC runtime imports.
 */

export type OptionRight = "call" | "put";
export type LegSide = "long" | "short";
export type TradeDirection = "buy" | "sell";

export type TemplateType =
  | "single"
  | "vertical"
  | "butterfly"
  | "bwb"
  | "condor"
  | "straddle"
  | "strangle"
  | "iron_fly"
  | "iron_condor"
  | "calendar"
  | "diagonal";

export type LegInput = {
  strike: number;
  type: OptionRight;
  quantity: number; // absolute units per package
  side: LegSide;
  entry_price: number; // mid at last live fill
  expiration?: string; // per-leg override (calendar/diagonal)
  volatility?: number; // IV from chain (decimal or percent as feed)
};

export type PositionInput = {
  underlying: string;
  expiration: string; // front / package default
  contracts: number; // package multiplier
  legs: LegInput[];
  /** Per-share package debit/credit magnitude override (ToS limit) */
  net_debit_override?: number | null;
  direction?: TradeDirection;
};

export type ChainContract = {
  strike: number;
  type: OptionRight;
  mid: number | null;
  bid: number | null;
  ask: number | null;
  iv: number | null;
  expiration: string;
};

export type ChainAccessors = {
  expirations: string[];
  spot: number | null;
  /** ATM listed strike from ladder (spot snap) — preferred Builder center. */
  spotStrike?: number | null;
  loading: boolean;
  error: string | null;
  /** Listed strikes only for expiration (from dual-side ladder). */
  getStrikes: (expiration: string) => number[];
  getContract: (
    expiration: string,
    strike: number,
    type: OptionRight,
  ) => ChainContract | undefined;
  nearestStrike: (expiration: string, target: number) => number;
  refresh: () => void;
  /**
   * Hydrate a listed expiration on demand (Builder front/back/leg exp).
   * Required so the user can select any OPF-listed expiration, not only
   * the pre-warmed near-term set.
   */
  ensureExpiration: (expiration: string) => void;
  /** Bumps when ladder rows change — Builder re-snaps illegal strikes. */
  rev?: number;
};
