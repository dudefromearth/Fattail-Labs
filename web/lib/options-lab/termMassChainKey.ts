/** Parse listed expiration from a Market Bus chain interest key. */

export function termMassExpFromChainKey(
  key: string,
  symbol: string,
  wings: number,
): string | null {
  const prefix = `chain:${symbol}:`;
  const suffix = `:w${wings}`;
  if (!key.startsWith(prefix) || !key.includes(suffix)) return null;
  const mid = key.slice(prefix.length);
  const exp = mid.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(exp) ? exp : null;
}
