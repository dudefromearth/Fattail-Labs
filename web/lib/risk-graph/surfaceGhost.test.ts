import assert from "node:assert/strict";
import { computeExpiredGhostSheet, GHOST_DISPLAY_TAU } from "./surfaceGhost";
import type { ParsedTosTrade } from "@/lib/options-lab/tosParser";

function longCall(exp: string, strike: number, debit: number): ParsedTosTrade {
  return {
    action: "BUY",
    structure: "single",
    symbol: "SPX",
    expiration: exp,
    right: "call",
    limit: debit,
    debit,
    isCredit: false,
    strikes: [strike],
    width: null,
    body: strike,
    raw: "test",
    legs: [{ strike, quantity: 1, right: "call", expiration: exp }],
  };
}

{
  const sheet = computeExpiredGhostSheet(
    [longCall("2026-08-18", 6400, 2)],
    { spot: 6410, sMin: 6300, sMax: 6500 },
  );
  assert.equal(sheet.ivSource, "ghost");
  const mid = sheet.spotAxis.findIndex((s) => Math.abs(s - 6410) < 2);
  const atm = mid >= 0 ? mid : Math.floor(sheet.spotAxis.length / 2);
  const itm = sheet.pnlGrid[0][atm];
  assert.ok(itm > 0, "ITM expired long call residual is positive");
  const first = sheet.pnlGrid[0];
  const last = sheet.pnlGrid[sheet.pnlGrid.length - 1];
  assert.deepEqual(first, last, "ghost is flat in time (at-expiry residual)");
  assert.ok(sheet.maxTau <= GHOST_DISPLAY_TAU + 1e-12);
}

{
  assert.throws(
    () =>
      computeExpiredGhostSheet([], {
        spot: 100,
        sMin: 90,
        sMax: 110,
      }),
    /no expired trades/,
  );
}

console.log("surfaceGhost.test.ts ok");
