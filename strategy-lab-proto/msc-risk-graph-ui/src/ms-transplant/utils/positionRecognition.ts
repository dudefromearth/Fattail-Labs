/**
 * positionRecognition.ts — Re-exports from transplanted positionUtils
 */
export {
  type PositionRecognitionResult,
  recognizePositionType,
  strategyToLegs,
} from '../../lib/positionUtils';

export type {
  PositionLeg,
  PositionType,
  PositionDirection,
} from '../../lib/useRiskGraphCalculations';

// Stub helper functions used by MS components
export function getCenterStrike(legs: { strike: number }[]): number {
  if (legs.length === 0) return 0;
  const strikes = legs.map(l => l.strike).sort((a, b) => a - b);
  return strikes[Math.floor(strikes.length / 2)];
}

export function getWidth(legs: { strike: number }[]): number {
  if (legs.length < 2) return 0;
  const strikes = legs.map(l => l.strike).sort((a, b) => a - b);
  return strikes[1] - strikes[0];
}

export function getPrimaryExpiration(legs: { expiration: string }[]): string {
  return legs[0]?.expiration ?? '';
}

export function getDominantSide(legs: { right: string }[]): 'call' | 'put' {
  const calls = legs.filter(l => l.right === 'call').length;
  return calls >= legs.length / 2 ? 'call' : 'put';
}

export function hasSameExpiration(legs: { expiration: string }[]): boolean {
  if (legs.length === 0) return true;
  return new Set(legs.map(l => l.expiration)).size === 1;
}

export function hasSameRight(legs: { right: string }[]): boolean {
  if (legs.length === 0) return true;
  return new Set(legs.map(l => l.right)).size === 1;
}
