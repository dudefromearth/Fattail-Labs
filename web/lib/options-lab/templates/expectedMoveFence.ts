/**
 * Expected-move fence on a listed chain.
 *
 * EM = ATM call mid + ATM put mid (the listed straddle). Then the
 * nearest listed strikes to spot ± EM. Honest listed facts only — no
 * invented IV path, no 0.85 fudge.
 */

import { contractKey, type LadderRow } from "@/lib/chainLadderApi";

export type ExpectedMoveFence = {
  em: number;
  atmStrike: number;
  loStrike: number;
  hiStrike: number;
};

export type EmContracts = {
  spot: number | null;
  contracts: Map<string, LadderRow>;
};

function midAt(
  contracts: Map<string, LadderRow>,
  side: "call" | "put",
  strike: number,
): number | null {
  const row = contracts.get(contractKey(side, strike));
  if (!row || row.mid == null || Number.isNaN(Number(row.mid))) return null;
  const n = Number(row.mid);
  return n > 0 && Number.isFinite(n) ? n : null;
}

export function nearestListed(
  strikes: readonly number[],
  target: number,
): number | null {
  if (!strikes.length || !Number.isFinite(target)) return null;
  let best = strikes[0];
  let bestD = Math.abs(strikes[0] - target);
  for (let i = 1; i < strikes.length; i++) {
    const d = Math.abs(strikes[i] - target);
    if (d < bestD) {
      best = strikes[i];
      bestD = d;
    }
  }
  return best;
}

export function expectedMoveFence(
  ctx: EmContracts,
  listedStrikes: readonly number[],
): ExpectedMoveFence | null {
  const spot = ctx.spot;
  if (!(spot != null && spot > 0) || !listedStrikes.length) return null;
  const unique = [...new Set(listedStrikes.filter((k) => Number.isFinite(k)))].sort(
    (a, b) => a - b,
  );
  if (!unique.length) return null;
  const atm = nearestListed(unique, spot);
  if (atm == null) return null;
  const call = midAt(ctx.contracts, "call", atm);
  const put = midAt(ctx.contracts, "put", atm);
  if (call == null || put == null) return null;
  const em = call + put;
  if (!(em > 0) || !Number.isFinite(em)) return null;
  const lo = nearestListed(unique, spot - em);
  const hi = nearestListed(unique, spot + em);
  if (lo == null || hi == null) return null;
  if (lo >= atm || hi <= atm) return null;
  if (lo === hi) return null;
  return { em, atmStrike: atm, loStrike: lo, hiStrike: hi };
}

export function strikeAtExpectedMove(
  fence: ExpectedMoveFence | null,
  strike: number,
): boolean {
  if (!fence) return false;
  return strike === fence.loStrike || strike === fence.hiStrike;
}
