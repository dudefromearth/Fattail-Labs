/**
 *   npx --yes tsx lib/options-lab/templates/expectedMoveFence.test.ts
 */
import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import {
  expectedMoveFence,
  nearestListed,
  strikeAtExpectedMove,
} from "./expectedMoveFence";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

function row(side: "call" | "put", strike: number, mid: number): LadderRow {
  return { strike, side, mid };
}

function book(
  spot: number,
  mids: Array<[number, number, number]>,
): { spot: number; contracts: Map<string, LadderRow> } {
  const contracts = new Map<string, LadderRow>();
  for (const [k, c, p] of mids) {
    contracts.set(contractKey("call", k), row("call", k, c));
    contracts.set(contractKey("put", k), row("put", k, p));
  }
  return { spot, contracts };
}

assert(nearestListed([10, 20, 30], 21) === 20, "nearest");
assert(nearestListed([], 1) == null, "empty");

const strikes = [7700, 7720, 7740, 7760, 7780, 7800, 7820, 7840, 7860];
const ctx = book(7780, [
  [7780, 30, 30],
  [7700, 80, 2],
  [7720, 70, 4],
  [7740, 55, 8],
  [7760, 40, 15],
  [7800, 15, 40],
  [7820, 8, 55],
  [7840, 4, 70],
  [7860, 2, 80],
]);
const fence = expectedMoveFence(ctx, strikes);
assert(fence != null, "fence");
assert(fence!.em === 60, `em ${fence!.em}`);
assert(fence!.atmStrike === 7780, "atm");
assert(fence!.loStrike === 7720, `lo ${fence!.loStrike}`);
assert(fence!.hiStrike === 7840, `hi ${fence!.hiStrike}`);
assert(strikeAtExpectedMove(fence, 7720), "lo mark");
assert(strikeAtExpectedMove(fence, 7840), "hi mark");
assert(!strikeAtExpectedMove(fence, 7780), "spot is not the fence");

const noPut = book(7780, [[7780, 30, 0]]);
noPut.contracts.delete(contractKey("put", 7780));
assert(expectedMoveFence(noPut, [7780]) == null, "missing put → no fence");

const tiny = book(7780, [[7780, 0.25, 0.25]]);
assert(expectedMoveFence(tiny, [7775, 7780, 7785]) == null, "tiny EM collapses");

console.log("ok  expectedMoveFence");
