/** Shared USD formatting for Strategy Lab surfaces. */

export function formatUsd(
  n: number | null | undefined,
  fractionDigits = 0,
): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: fractionDigits,
  });
}
