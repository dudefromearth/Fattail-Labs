/* intentAdapters — lossless converters from RegistryEntry to consumer shapes.
   No data loss. intent_id preserved as strategy.id. */

import type { RegistryEntry, PositionIntent, IntentLeg } from '../types/position-intent';
import type { PositionLeg, PositionType, PositionDirection } from '../ms-transplant/types/riskGraph';

/** The shape RiskGraphPanel expects (from its props). */
export interface RiskGraphStrategy {
  id: string;
  strategy: 'butterfly' | 'vertical' | 'single';
  side: 'call' | 'put';
  strike: number;
  width: number;
  dte: number;
  expiration: string;
  debit: number | null;
  symbol: string;
  addedAt: number;
  visible: boolean;
  legs: PositionLeg[];
  positionType: PositionType;
  direction: PositionDirection;
  costBasis: number | null;
  costBasisType: 'debit' | 'credit';
  quantity?: number;
}

function intentLegsToPositionLegs(legs: readonly IntentLeg[]): PositionLeg[] {
  return legs.map(l => ({
    strike: l.strike,
    expiration: l.expiration,
    right: l.option_type,
    quantity: l.quantity,
    ...(l.implied_volatility != null ? { implied_volatility: l.implied_volatility } : {}),
  }));
}

function deriveLegacyStrategy(topology: string): 'butterfly' | 'vertical' | 'single' {
  switch (topology) {
    case 'butterfly':
    case 'bwb':
    case 'condor':
    case 'iron_condor':
    case 'iron_fly':
      return 'butterfly';
    case 'vertical':
    case 'calendar':
    case 'diagonal':
    case 'straddle':
    case 'strangle':
      return 'vertical';
    default:
      return 'single';
  }
}

/**
 * deriveCenterAndWidth — extract the topology-aware center strike and wing width
 * from a set of canonical IntentLegs.
 *
 * Exported so that PriceTimeChart and other consumers can compute the current
 * center of a position without duplicating topology logic.
 */
export function deriveCenterAndWidth(
  legs: readonly IntentLeg[],
  topology: string,
): { strike: number; width: number } {
  const strikes = [...legs].map(l => l.strike).sort((a, b) => a - b);

  if (strikes.length === 0) return { strike: 0, width: 0 };
  if (strikes.length === 1) return { strike: strikes[0], width: 0 };

  switch (topology) {
    case 'butterfly':
    case 'bwb':
      if (strikes.length >= 3) {
        return { strike: strikes[1], width: strikes[1] - strikes[0] };
      }
      return { strike: strikes[0], width: strikes[1] - strikes[0] };
    case 'vertical':
    case 'diagonal':
      return { strike: strikes[0], width: strikes[1] - strikes[0] };
    case 'condor':
    case 'iron_condor':
    case 'iron_fly':
      if (strikes.length >= 4) {
        return {
          strike: Math.round((strikes[1] + strikes[2]) / 2),
          width: Math.round((strikes[2] - strikes[1]) / 2),
        };
      }
      return { strike: strikes[0], width: 0 };
    case 'straddle':
      return { strike: strikes[0], width: 0 };
    case 'strangle':
      return {
        strike: Math.round((strikes[0] + strikes[1]) / 2),
        width: Math.round((strikes[1] - strikes[0]) / 2),
      };
    default:
      return { strike: strikes[0], width: 0 };
  }
}

/** Convert RegistryEntry → RiskGraphStrategy for the transplanted chart panel. Lossless. */
export function toRiskGraphStrategy(entry: RegistryEntry): RiskGraphStrategy {
  const { intent } = entry;
  const positionLegs = intentLegsToPositionLegs(intent.legs);
  const { strike, width } = deriveCenterAndWidth(intent.legs, intent.topology);

  return {
    id: intent.intent_id,
    strategy: deriveLegacyStrategy(intent.topology),
    side: intent.legs[0]?.option_type ?? 'call',
    strike,
    width,
    dte: intent.dte,
    expiration: intent.legs[0]?.expiration ?? '',
    debit: intent.target_price,
    symbol: intent.symbol,
    addedAt: new Date(intent.created_at).getTime(),
    visible: entry.visible,
    legs: positionLegs,
    positionType: intent.topology as PositionType,
    direction: intent.direction,
    costBasis: intent.target_price,
    costBasisType: intent.price_side,
    quantity: intent.quantity,
  };
}

/**
 * deriveNewLegsFromReposition — compute new leg strikes by applying a uniform
 * delta to every leg in the position.
 *
 * The delta is: newCenterStrike - currentCenter (topology-derived via
 * deriveCenterAndWidth). All legs shift by this delta, preserving relative
 * widths exactly. All non-strike leg fields are unchanged.
 *
 * This is the canonical reposition operation. entry_price is NOT re-priced here
 * — that happens asynchronously when chain data is available.
 *
 * Returns a copy of intent.legs (never mutates) with updated strikes.
 */
export function deriveNewLegsFromReposition(
  intent: PositionIntent,
  newCenterStrike: number,
): IntentLeg[] {
  const { strike: currentCenter } = deriveCenterAndWidth(intent.legs, intent.topology);
  const delta = newCenterStrike - currentCenter;
  if (delta === 0) return [...intent.legs];
  return intent.legs.map(leg => ({ ...leg, strike: leg.strike + delta }));
}

/** Build order payload from PositionIntent for brokerage submission. */
export function toOrderPayload(intent: PositionIntent, options: { simulation?: boolean } = {}) {
  return {
    symbol: intent.symbol,
    intent_id: intent.intent_id,
    order_type: intent.target_price != null ? 'LIMIT' : 'MARKET',
    limit_price: intent.target_price,
    action: 'OPEN',
    strategy_type: intent.topology,
    simulation: options.simulation ?? true,
    legs: intent.legs.map(leg => ({
      contract_id: leg.contract_id ?? `${intent.symbol}_${leg.strike}${leg.option_type === 'call' ? 'C' : 'P'}_${leg.expiration}`,
      quantity: leg.quantity,
      strike: leg.strike,
      option_type: leg.option_type,
      expiration: leg.expiration,
      side: leg.quantity > 0 ? 'buy' : 'sell',
    })),
  };
}
