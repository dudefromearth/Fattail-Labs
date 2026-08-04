/**
 * Position recognition and formatting utilities
 * Transplanted from @market-swarm/core position/recognition.ts + formatting.ts
 */

import type { PositionLeg, PositionType, PositionDirection } from './useRiskGraphCalculations';

// ============================================================
// Labels
// ============================================================

export const POSITION_TYPE_LABELS: Record<PositionType, string> = {
  single: 'Single',
  vertical: 'Vertical',
  calendar: 'Calendar',
  diagonal: 'Diagonal',
  butterfly: 'Butterfly',
  bwb: 'BWB',
  condor: 'Condor',
  straddle: 'Straddle',
  strangle: 'Strangle',
  iron_fly: 'Iron Fly',
  iron_condor: 'Iron Condor',
  custom: 'Custom',
};

// ============================================================
// Position Recognition
// ============================================================

export interface PositionRecognitionResult {
  type: PositionType;
  direction: PositionDirection;
  isSymmetric?: boolean;
}

export function recognizePositionType(legs: PositionLeg[]): PositionRecognitionResult {
  const n = legs.length;
  if (n === 0) return { type: 'custom', direction: 'long' };

  const sorted = [...legs].sort((a, b) => a.strike - b.strike);
  const expirations = new Set(legs.map(l => l.expiration));
  const allSameExp = expirations.size === 1;
  const rights = new Set(legs.map(l => l.right));
  const allSameRight = rights.size === 1;

  const getStrike = (idx: number): number => sorted[idx]?.strike ?? 0;
  const getQty = (idx: number): number => sorted[idx]?.quantity ?? 0;

  // Singles
  if (n === 1) {
    return { type: 'single', direction: getQty(0) > 0 ? 'long' : 'short' };
  }

  // 2-leg structures
  if (n === 2) {
    const q0 = getQty(0);
    const s0 = getStrike(0);
    const s1 = getStrike(1);

    if (allSameExp && allSameRight) {
      return { type: 'vertical', direction: q0 > 0 ? 'long' : 'short' };
    }
    if (!allSameExp && allSameRight) {
      if (s0 === s1) {
        const byExp = [...legs].sort((a, b) =>
          new Date(a.expiration).getTime() - new Date(b.expiration).getTime()
        );
        const farLeg = byExp[1];
        return { type: 'calendar', direction: farLeg && farLeg.quantity > 0 ? 'long' : 'short' };
      } else {
        const byExp = [...legs].sort((a, b) =>
          new Date(a.expiration).getTime() - new Date(b.expiration).getTime()
        );
        const farLeg = byExp[1];
        return { type: 'diagonal', direction: farLeg && farLeg.quantity > 0 ? 'long' : 'short' };
      }
    }
    if (allSameExp && !allSameRight) {
      if (s0 === s1) {
        return { type: 'straddle', direction: q0 > 0 ? 'long' : 'short' };
      } else {
        return { type: 'strangle', direction: q0 > 0 ? 'long' : 'short' };
      }
    }
  }

  // 3-leg: butterfly (1-2-1)
  if (n === 3 && allSameExp && allSameRight) {
    const q0 = getQty(0), q1 = getQty(1), q2 = getQty(2);
    const isButterfly = (
      Math.abs(q0) === 1 && Math.abs(q1) === 2 && Math.abs(q2) === 1 &&
      q0 * q2 > 0 && q0 * q1 < 0
    );
    if (isButterfly) {
      const s0 = getStrike(0), s1 = getStrike(1), s2 = getStrike(2);
      const isSymmetric = Math.abs((s1 - s0) - (s2 - s1)) < 0.01;
      return { type: isSymmetric ? 'butterfly' : 'bwb', direction: q0 > 0 ? 'long' : 'short', isSymmetric };
    }
  }

  // 4-leg structures
  if (n === 4 && allSameExp) {
    const q0 = getQty(0), q1 = getQty(1), q2 = getQty(2), q3 = getQty(3);
    const allQtyOne = [q0, q1, q2, q3].every(q => Math.abs(q) === 1);

    if (allSameRight && allQtyOne) {
      if (q0 * q3 > 0 && q1 * q2 > 0 && q0 * q1 < 0) {
        return { type: 'condor', direction: q0 > 0 ? 'long' : 'short' };
      }
    }

    if (!allSameRight && allQtyOne) {
      const puts = sorted.filter(l => l.right === 'put');
      const calls = sorted.filter(l => l.right === 'call');
      if (puts.length === 2 && calls.length === 2) {
        const putStrikes = puts.map(l => l.strike).sort((a, b) => a - b);
        const callStrikes = calls.map(l => l.strike).sort((a, b) => a - b);
        if (Math.abs((putStrikes[1] ?? 0) - (callStrikes[0] ?? 0)) < 0.01) {
          const longWingPut = puts.find(p => p.strike === putStrikes[0]);
          return { type: 'iron_fly', direction: longWingPut && longWingPut.quantity > 0 ? 'long' : 'short' };
        } else {
          const longWingPut = puts.find(p => p.strike === putStrikes[0]);
          return { type: 'iron_condor', direction: longWingPut && longWingPut.quantity > 0 ? 'long' : 'short' };
        }
      }
    }
  }

  return { type: 'custom', direction: 'long' };
}

// ============================================================
// Strategy → Legs conversion (legacy format)
// ============================================================

export function strategyToLegs(
  strategy: 'single' | 'vertical' | 'butterfly',
  side: 'call' | 'put',
  strike: number,
  width: number,
  expiration: string,
): PositionLeg[] {
  switch (strategy) {
    case 'single':
      return [{ strike, expiration, right: side, quantity: 1 }];
    case 'vertical':
      if (side === 'call') {
        return [
          { strike, expiration, right: 'call', quantity: 1 },
          { strike: strike + width, expiration, right: 'call', quantity: -1 },
        ];
      } else {
        return [
          { strike: strike - width, expiration, right: 'put', quantity: -1 },
          { strike, expiration, right: 'put', quantity: 1 },
        ];
      }
    case 'butterfly':
      return [
        { strike: strike - width, expiration, right: side, quantity: 1 },
        { strike, expiration, right: side, quantity: -2 },
        { strike: strike + width, expiration, right: side, quantity: 1 },
      ];
    default:
      return [];
  }
}

// ============================================================
// Formatting
// ============================================================

export function formatLeg(leg: PositionLeg): string {
  const sign = leg.quantity > 0 ? '+' : '';
  const side = leg.right === 'call' ? 'C' : 'P';
  return `${sign}${leg.quantity} ${leg.strike}${side}`;
}

export function formatLegsDisplay(legs: PositionLeg[]): string {
  if (legs.length === 0) return '';
  const sorted = [...legs].sort((a, b) => a.strike - b.strike);
  const puts = sorted.filter(l => l.right === 'put');
  const calls = sorted.filter(l => l.right === 'call');
  if (puts.length >= 2 && calls.length >= 2) {
    return `${puts.map(formatLeg).join(' / ')} | ${calls.map(formatLeg).join(' / ')}`;
  }
  return sorted.map(formatLeg).join(' / ');
}

export function formatPositionLabel(
  positionType: PositionType,
  direction: PositionDirection,
  legs: PositionLeg[],
): string {
  const dirLabel = direction === 'long' ? 'Long' : 'Short';
  const typeLabel = POSITION_TYPE_LABELS[positionType];
  const singleTypePositions: PositionType[] = [
    'single', 'vertical', 'calendar', 'diagonal', 'butterfly', 'bwb', 'condor',
  ];
  if (singleTypePositions.includes(positionType)) {
    const rights = new Set(legs.map(l => l.right));
    const firstLeg = legs[0];
    if (rights.size === 1 && firstLeg) {
      const sideLabel = firstLeg.right === 'call' ? 'Call' : 'Put';
      return `${dirLabel} ${sideLabel} ${typeLabel}`;
    }
  }
  return `${dirLabel} ${typeLabel}`;
}
