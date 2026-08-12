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

  // Best-effort package always when any mid is known — never blank the strip
  // just because one wing is still hydrating. `complete` flags full coverage.
  const priced = outLegs.filter((l) => l.contribMid != null);
  if (priced.length === 0) {
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
      const c = legContribution(leg.side, leg.quantity, natPx);
      if (c == null) natOk = false;
      else partialNat += c;
    }
    const side: "DEBIT" | "CREDIT" = partial >= 0 ? "CREDIT" : "DEBIT";
    return {
      signedMid: partial,
      side,
      absMid: Math.abs(partial),
      signedNatural: natOk && missing === 0 ? partialNat : null,
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
  // Show best-effort whenever we have a signed mid (full or partial)
  if (eco.side == null || eco.absMid == null) return "—";
  return `${eco.side} ${eco.absMid.toFixed(2)}`;
}
