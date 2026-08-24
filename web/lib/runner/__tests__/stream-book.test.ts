/**
 *   npx --yes tsx lib/runner/__tests__/stream-book.test.ts
 */
import type { LadderRow } from "../../chainLadderApi";
import {
  DEFAULT_BUDGET_MIB,
  MIB,
  StreamBook,
  applyAverageColorT,
  clampBudgetMib,
  clampWindow,
  contractsFromMap,
  interestKey,
  measureSlotBytes,
  weightsFingerprint,
  type StreamSlot,
} from "../streamBook";
import { DEFAULT_WIDTH_FIT_WEIGHTS } from "../../options-lab/templates/widthFit";
import type { GridCell } from "../../options-lab/templates/types";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

function row(k: number): LadderRow {
  return {
    strike: k,
    side: "call",
    mid: 1.2,
    bid: 1.1,
    ask: 1.3,
    delta: 0.5,
    gamma: 0.02,
    theta: -0.1,
    vega: 0.05,
    iv: 0.16,
    open_interest: 100,
    volume: 10,
  };
}

function syntheticSpxWeekly(): Map<string, LadderRow> {
  const m = new Map<string, LadderRow>();
  for (let k = 5000; k <= 6000; k += 5) {
    m.set(`call:${k}`, { ...row(k), side: "call" });
    m.set(`put:${k}`, { ...row(k), side: "put" });
  }
  return m;
}

function slot(
  hash: string,
  receivedAt: number,
  extra?: Partial<StreamSlot>,
): Omit<StreamSlot, "bytes"> {
  const contracts = extra?.contracts ?? [
    { key: "call:100", row: row(100) },
  ];
  return {
    contentHash: hash,
    asOf: extra?.asOf ?? null,
    receivedAt,
    epochQuality: extra?.epochQuality ?? "ok",
    stale: extra?.stale ?? false,
    contracts,
    spot: extra?.spot ?? 100,
    strikeStep: extra?.strikeStep ?? 5,
    wings: extra?.wings ?? 25,
    memo: extra?.memo ?? null,
  };
}

{
  assert(clampBudgetMib(8) === 8, "budget 8");
  assert(clampBudgetMib(7) === 8, "nearest 8");
  assert(clampBudgetMib(3) === 4, "floor stop");
  assert(clampBudgetMib(40) === 32, "ceiling stop");
  assert(clampWindow(20) === 20, "window 20");
  assert(clampWindow(15) === 10, "window nearest 10");
  assert(clampWindow(90) === 100, "window 100");
  assert(interestKey("spx", "2026-08-24T00:00:00Z") === "SPX|2026-08-24", "key");
}

{
  const b = new StreamBook();
  const k = interestKey("SPX", "2026-08-24");
  b.push(k, slot("h1", 1000));
  b.push(k, slot("h1", 1001, { spot: 101 }));
  assert(b.size(k) === 1, "AT-SB1 same hash no extra slot");
}

{
  const b = new StreamBook();
  b.setBudgetMib(4);
  const k = interestKey("SPX", "2026-08-24");
  const fat = contractsFromMap(syntheticSpxWeekly());
  for (let i = 0; i < 80; i++) {
    b.push(k, slot(`h${i}`, 1000 + i, { contracts: fat }));
  }
  assert(b.bytesUsed() <= 4 * MIB, `AT-SB2 under 4 MiB (${b.bytesUsed()})`);
}

{
  const b = new StreamBook();
  const k = interestKey("SPX", "2026-08-24");
  const fat = contractsFromMap(syntheticSpxWeekly());
  b.setBudgetMib(16);
  for (let i = 0; i < 200; i++) {
    b.push(k, slot(`h${i}`, 1000 + i, { contracts: fat }));
  }
  const before = b.bytesUsed();
  assert(before > 4 * MIB, `prefill over 4 MiB (${before})`);
  b.setBudgetMib(4);
  assert(b.bytesUsed() <= 4 * MIB, "AT-SB3 lower 16→4");
  assert(b.bytesUsed() < before, "evicted");
}

{
  const b = new StreamBook();
  b.setBudgetMib(32);
  assert(b.budgetBytes === 32 * MIB, "AT-SB5 ceiling 32");
  assert(DEFAULT_BUDGET_MIB === 8, "default 8");
}

{
  const b = new StreamBook();
  const k = interestKey("SPX", "2026-08-24");
  for (let i = 0; i < 4; i++) b.push(k, slot(`h${i}`, 1000 + i));
  assert(b.window(k, 10).length === 4, "AT-SB6 window 10 with 4");
}

{
  const fp = weightsFingerprint(DEFAULT_WIDTH_FIT_WEIGHTS);
  const b = new StreamBook();
  const k = interestKey("SPX", "2026-08-24");
  b.push(
    k,
    slot("a", 1, {
      memo: {
        weightsFp: fp,
        colorT: [[0.2, 0.4]],
        widthPts: [10, 20],
        median: [0.2, null],
        stability: [0.8, null],
        n: [5, 0],
      },
    }),
  );
  b.push(
    k,
    slot("b", 2, {
      memo: {
        weightsFp: fp,
        colorT: [[0.4, null]],
        widthPts: [10, 20],
        median: [0.4, null],
        stability: [0.6, null],
        n: [5, 0],
      },
    }),
  );
  const avg = b.averageColorT(k, 10, fp);
  assert(avg.used === 2, "used 2");
  assert(avg.grid[0][0] != null && Math.abs(avg.grid[0][0]! - 0.3) < 1e-9, "mean 0.3");
  assert(avg.grid[0][1] != null && Math.abs(avg.grid[0][1]! - 0.4) < 1e-9, "skip null");
  const stats = b.averageWidthStats(k, 10, fp);
  assert(stats.nGens[1] === 0, "AT-SB8b all-null width n=0");
  assert(stats.meanMedian[0] != null && Math.abs(stats.meanMedian[0]! - 0.3) < 1e-9, "median mean");
}

{
  const cells: GridCell[][] = [
    [
      {
        display: null,
        value: 0.5,
        colorT: 0.5,
        valid: true,
        bgCss: "#111",
      },
    ],
  ];
  const painted = applyAverageColorT(cells, [[null]]);
  assert(painted[0][0].colorT == null, "AT-SB8a all-null dark");
  assert(painted[0][0].bgCss === "#1a1a1a", "dark fill");
}

{
  const fat = contractsFromMap(syntheticSpxWeekly());
  const bytes = measureSlotBytes(
    slot("x", 1, { contracts: fat }),
  );
  const fit8 = Math.floor((8 * MIB) / bytes);
  const fit32 = Math.floor((32 * MIB) / bytes);
  console.log(
    `byte-measure SPX weekly dual-side ~${bytes} B/gen · 8 MiB≈${fit8} gens · 32 MiB≈${fit32} gens · 100 window ${fit8 >= 100 ? "fits in 8" : fit32 >= 100 ? "needs up to 32" : "n of 100 at ceiling"}`,
  );
}

console.log("ok  stream-book TR14");
