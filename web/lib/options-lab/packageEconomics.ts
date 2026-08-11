/**
 * Package debit/credit economics from live chain mids (Builder display).
 *
 * Sign convention (aligns with positionNetPremium / OPF D_nat UI):
 *   credit > 0  ·  debit < 0  ·  incomplete → null
 *
 * Per-share package (×1), not ×100 multiplier — same as OPF package_debit_per_share.
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
  /** Contribution to package: long → −qty·mid, short → +qty·mid */
  contribMid: number | null;
  complete: boolean;
};

export type PackageEconomics = {
  /** Signed natural mid package (credit>0 debit<0); null if any leg incomplete */
  signedMid: number | null;
  /** DEBIT | CREDIT | — */
  side: "DEBIT" | "CREDIT" | null;
  /** Absolute magnitude for display */
  absMid: number | null;
  /** Conservative fill bound (longs at ask, shorts at bid) — null if incomplete */
  signedNatural: number | null;
  legs: LegEconomics[];
  complete: boolean;
  missingMids: number;
};

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
): PackageEconomics {
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
    const contribMid = legContribution(leg.side, leg.quantity, mid);
    // Natural: buy at ask, sell at bid
    const natPx =
      leg.side === "long"
        ? ask ?? mid
        : bid ?? mid;
    const contribNat = legContribution(leg.side, leg.quantity, natPx);

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

  if (!legs.length) {
    return {
      signedMid: null,
      side: null,
      absMid: null,
      signedNatural: null,
      legs: outLegs,
      complete: false,
      missingMids: 0,
    };
  }

  if (!complete) {
    return {
      signedMid: null,
      side: null,
      absMid: null,
      signedNatural: null,
      legs: outLegs,
      complete: false,
      missingMids: missing,
    };
  }

  const side: "DEBIT" | "CREDIT" =
    signedMid >= 0 ? "CREDIT" : "DEBIT";
  return {
    signedMid,
    side,
    absMid: Math.abs(signedMid),
    signedNatural: signedNat,
    legs: outLegs,
    complete: true,
    missingMids: 0,
  };
}

export function packageEconomics(
  pos: PositionInput,
  getQuote: (
    expiration: string,
    strike: number,
    type: "call" | "put",
  ) => { mid: number | null; bid: number | null; ask: number | null } | undefined,
): PackageEconomics {
  return packageEconomicsFromLegs(pos.legs, getQuote, pos.expiration);
}

export function formatPackageSide(
  eco: PackageEconomics,
): string {
  if (!eco.complete || eco.side == null || eco.absMid == null) return "—";
  return `${eco.side} ${eco.absMid.toFixed(2)}`;
}
