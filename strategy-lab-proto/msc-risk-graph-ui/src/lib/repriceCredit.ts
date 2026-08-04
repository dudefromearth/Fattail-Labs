/**
 * Reprice short-structure credit when strikes move vs spot.
 *
 * MSC formula (RiskGraphPanel naturalPricesOverride):
 *   price = Σ leg.quantity × mid
 *   card  = Math.abs(price)
 *
 * Labs has no chain mids → use BS mid as the same algebra.
 * Do NOT invent ATM-decay / extrinsic strip — those inverted max-loss
 * (far OTM looked riskier). Raw package mid matches MSC:
 * short iron fly OTM → credit ↑ toward wing → max loss ↓.
 */
import { bsPrice } from "./blackScholes";
import type { PositionLeg } from "../ms-transplant/types/riskGraph";

export function repriceShortCredit(args: {
  legs: PositionLeg[];
  spot: number;
  wing: number;
  dte?: number;
  iv?: number;
}): number {
  const { legs, spot, wing } = args;
  const dte = Math.max(0, args.dte ?? 0);
  const iv = args.iv ?? (dte <= 0 ? 0.22 : dte === 1 ? 0.18 : 0.16);
  const T =
    dte <= 0
      ? Math.max(0.25, 0.4) / 365
      : (dte + 0.4) / 365;
  if (!(spot > 0) || !(wing > 0) || !legs.length) {
    return Math.min(wing * 0.35, Math.max(0.1, wing * 0.25));
  }

  // MSC: signed sum qty × mid (debit positive / credit negative for shorts)
  let price = 0;
  for (const leg of legs) {
    price +=
      leg.quantity *
      bsPrice(spot, leg.strike, T, 0, iv, leg.right === "call");
  }
  // Card shows absolute package mid; defined-risk credit capped at ~wing
  const absMid = Math.abs(price);
  return Math.min(wing * 0.95, Math.max(0.05, absMid));
}
