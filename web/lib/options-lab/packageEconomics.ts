/**
 * Package debit/credit economics from live chain mids (Builder display).
 *
 * Sign convention (aligns with positionNetPremium / OPF D_nat UI):
 *   credit > 0  ·  debit < 0  ·  incomplete → null
 *
 * Debit/credit is **per position** (one unit of the structure). Leg quantities
 * that share a common scale (Qty 5 of a single, or +5/−10/+5 of a fly) are
 * that many positions — they do not inflate the displayed debit.
 * Total = Qty × debit. Per-share (×1), not ×100.
 */

import type { LegInput, PositionInput } from "@/lib/options-lab/positionTypes";
import { normalizeStrike } from "@/lib/options-lab/listedStrikes";

export type LegEconomics = {
  strike: number;
  type: "call" | "put";
  side: "long" | "short";
  quantity: number;
  mid: number | null;
  bid: number | null;
  ask: number | null;
  /**
   * Contribution to **one** position: long → −unitQty·mid, short → +unitQty·mid.
   * Unit qty is this leg’s ratio after dividing out the common Qty scale.
   */
  contribMid: number | null;
  complete: boolean;
};

export type PackageEconomics = {
  /** Signed mid of **one** position (credit>0 debit<0) */
  signedMid: number | null;
  /** DEBIT | CREDIT | — */
  side: "DEBIT" | "CREDIT" | null;
  /** |signedMid| — per-position magnitude */
  absMid: number | null;
  /** Conservative fill bound for one position */
  signedNatural: number | null;
  /** How many positions: gcd(leg qty) × packages field */
  packages: number;
  /** packages × signedMid */
  totalSigned: number | null;
  /** |totalSigned| */
  totalAbs: number | null;
  legs: LegEconomics[];
  complete: boolean;
  missingMids: number;
};

function gcd2(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/** Common Qty scale on the legs (1 for a unit fly +1/−2/+1). */
export function packageUnitScale(
  legs: readonly { quantity: number }[],
): number {
  const qs = legs.map((l) => Math.max(1, Math.abs(Math.round(l.quantity)) || 1));
  if (!qs.length) return 1;
  return qs.reduce((g, q) => gcd2(g, q), qs[0]);
}

/** How many of this position: Packages field × common leg scale. */
export function positionQty(pos: {
  contracts?: number;
  legs: readonly { quantity: number }[];
}): number {
  const packs = Math.max(1, Math.floor(Number(pos.contracts) || 1));
  return packs * packageUnitScale(pos.legs);
}

/** Structure ratio after dividing out Qty (fly body stays 2). */
export function unitLegQuantity(quantity: number, scale: number): number {
  const s = Math.max(1, Math.round(scale) || 1);
  return Math.max(1, Math.round(Math.abs(quantity) / s) || 1);
}

/**
 * ToS @price / card debit is **per position**. Legs on the chart already
 * carry Qty. Total debit subtracted from the sheet is Qty × per-position.
 */
export function tradeTotalDebit(trade: {
  debit?: number | null;
  limit?: number | null;
  isCredit?: boolean;
  legs: readonly { quantity: number }[];
}): number {
  const per =
    trade.debit != null && Number.isFinite(trade.debit)
      ? trade.debit
      : trade.limit != null && Number.isFinite(trade.limit)
        ? trade.isCredit
          ? -Math.abs(trade.limit)
          : Math.abs(trade.limit)
        : 0;
  return per * packageUnitScale(trade.legs);
}

export function legContribution(
  side: "long" | "short",
  quantity: number,
  price: number | null | undefined,
): number | null {
  if (price == null || !Number.isFinite(price)) return null;
  const q = Math.abs(quantity) || 1;
  const sign = side === "long" ? -1 : 1;
  return sign * q * Number(price);
}

export function packageEconomicsFromLegs(
  legs: readonly LegInput[],
  getQuote: (
    expiration: string,
    strike: number,
    type: "call" | "put",
  ) => { mid: number | null; bid: number | null; ask: number | null } | undefined,
  frontExpiration: string,
  contracts = 1,
): PackageEconomics {
  const unitScale = packageUnitScale(legs);
  const packages = Math.max(1, Math.floor(contracts) || 1) * unitScale;
  const empty = (over: Partial<PackageEconomics> = {}): PackageEconomics => ({
    signedMid: null,
    side: null,
    absMid: null,
    signedNatural: null,
    packages,
    totalSigned: null,
    totalAbs: null,
    legs: [],
    complete: false,
    missingMids: 0,
    ...over,
  });

  const outLegs: LegEconomics[] = [];
  let missing = 0;
  let signedMid = 0;
  let signedNat = 0;
  let complete = true;

  for (const leg of legs) {
    const exp = (leg.expiration || frontExpiration).slice(0, 10);
    const strike = normalizeStrike(leg.strike);
    const q = getQuote(exp, strike, leg.type);
    const mid = q?.mid ?? (leg.entry_price > 0 ? leg.entry_price : null);
    const bid = q?.bid ?? null;
    const ask = q?.ask ?? null;
    const unitQty = (Math.abs(leg.quantity) || 1) / unitScale;
    const contribMid = legContribution(leg.side, unitQty, mid);
    // Natural: buy at ask, sell at bid
    const natPx =
      leg.side === "long"
        ? ask ?? mid
        : bid ?? mid;
    const contribNat = legContribution(leg.side, unitQty, natPx);

    const legComplete = contribMid != null;
    if (!legComplete) {
      complete = false;
      missing += 1;
    } else {
      signedMid += contribMid!;
      if (contribNat != null) signedNat += contribNat;
      else complete = false;
    }

    outLegs.push({
      strike,
      type: leg.type,
      side: leg.side,
      quantity: leg.quantity,
      mid,
      bid,
      ask,
      contribMid,
      complete: legComplete,
    });
  }

  const withTotals = (
    signed: number | null,
    nat: number | null,
    rest: Pick<PackageEconomics, "side" | "legs" | "complete" | "missingMids">,
  ): PackageEconomics => ({
    signedMid: signed,
    absMid: signed != null ? Math.abs(signed) : null,
    signedNatural: nat,
    packages,
    totalSigned: signed != null ? signed * packages : null,
    totalAbs: signed != null ? Math.abs(signed) * packages : null,
    ...rest,
  });

  if (!legs.length) {
    return empty({ legs: outLegs });
  }

  // Best-effort package always when any mid is known — never blank the strip
  // just because one wing is still hydrating. `complete` flags full coverage.
  const priced = outLegs.filter((l) => l.contribMid != null);
  if (priced.length === 0) {
    return empty({ legs: outLegs, missingMids: missing });
  }

  // Recompute from known contribs only when incomplete (partial sum)
  if (!complete) {
    let partial = 0;
    let partialNat = 0;
    let natOk = true;
    for (const leg of outLegs) {
      if (leg.contribMid == null) continue;
      partial += leg.contribMid;
    }
    // Natural only when complete enough for nat prices on priced legs
    for (const leg of legs) {
      const exp = (leg.expiration || frontExpiration).slice(0, 10);
      const q = getQuote(exp, normalizeStrike(leg.strike), leg.type);
      const mid = q?.mid ?? (leg.entry_price > 0 ? leg.entry_price : null);
      if (mid == null) {
        natOk = false;
        continue;
      }
      const natPx =
        leg.side === "long" ? q?.ask ?? mid : q?.bid ?? mid;
      const unitQty = (Math.abs(leg.quantity) || 1) / unitScale;
      const c = legContribution(leg.side, unitQty, natPx);
      if (c == null) natOk = false;
      else partialNat += c;
    }
    const side: "DEBIT" | "CREDIT" = partial >= 0 ? "CREDIT" : "DEBIT";
    return withTotals(partial, natOk && missing === 0 ? partialNat : null, {
      side,
      legs: outLegs,
      complete: false,
      missingMids: missing,
    });
  }

  const side: "DEBIT" | "CREDIT" =
    signedMid >= 0 ? "CREDIT" : "DEBIT";
  return withTotals(signedMid, signedNat, {
    side,
    legs: outLegs,
    complete: true,
    missingMids: 0,
  });
}

export function packageEconomics(
  pos: PositionInput,
  getQuote: (
    expiration: string,
    strike: number,
    type: "call" | "put",
  ) => { mid: number | null; bid: number | null; ask: number | null } | undefined,
): PackageEconomics {
  return packageEconomicsFromLegs(
    pos.legs,
    getQuote,
    pos.expiration,
    pos.contracts,
  );
}

export function formatPackageSide(
  eco: PackageEconomics,
): string {
  // Show best-effort whenever we have a signed mid (full or partial)
  if (eco.side == null || eco.absMid == null) return "—";
  return `${eco.side} ${eco.absMid.toFixed(2)}`;
}
