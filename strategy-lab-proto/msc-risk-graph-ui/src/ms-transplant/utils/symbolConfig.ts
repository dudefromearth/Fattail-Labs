/**
 * symbolConfig — Stub for transplant compilation
 */

export interface RegistryCache {
  symbols: Record<string, { spotKey: string }>;
}

let _cache: RegistryCache | null = null;

export function getRegistryCache(): RegistryCache | null {
  return _cache;
}

export function setRegistryCache(cache: RegistryCache): void {
  _cache = cache;
}

export function resolveSpotKey(positionSymbol: string, registry: RegistryCache): string {
  return registry.symbols[positionSymbol]?.spotKey || positionSymbol;
}
