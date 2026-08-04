/**
 * Symbol Resolver — backward-compat wrapper
 *
 * Delegates to symbolConfig.ts when the registry is loaded,
 * falls back to hardcoded INDEX_MAP otherwise.
 *
 * Consumers: RiskGraphPanel, useRiskGraphCalculations
 */
import { resolveSpotKey as configResolve, getRegistryCache } from './symbolConfig';

/** Hardcoded fallback for when registry hasn't loaded yet */
const INDEX_MAP: Record<string, string> = {
  'SPX': 'I:SPX',
  'SPXW': 'I:SPX',
  'NDXP': 'I:NDX',
  'NDX': 'I:NDX',
  'VIX': 'I:VIX',
  'RUT': 'I:RUT',
  'XSP': 'I:XSP',
};

export function resolveSpotKey(positionSymbol: string): string {
  const registry = getRegistryCache();
  if (registry) return configResolve(positionSymbol, registry);
  return INDEX_MAP[positionSymbol] || positionSymbol;
}

export function getSpotForSymbol(
  symbol: string,
  spotData: Record<string, { value: number }>,
  fallback: number
): number {
  return spotData[resolveSpotKey(symbol)]?.value || fallback;
}
