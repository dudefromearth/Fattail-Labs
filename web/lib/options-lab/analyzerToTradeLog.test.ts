import assert from "node:assert/strict";
import type { AnalyzerPosition } from "./analyzerBook";
import {
  analyzerPositionToOpenTrade,
  strategyCodeFromPosition,
} from "./analyzerToTradeLog";

const pos = {
  id: "p1",
  label: "SPY short put vertical",
  notation: "-1 500P / +1 490P",
  status: "ANALYSIS",
  livePackagePerShare: null,
  lastNatSigned: null,
  priceSide: "credit",
  visible: true,
  lock: { mode: "unlocked" },
  liveState: "live",
  displayAsOf: null,
  contentHashes: {},
  maxSkewMs: null,
  epochQuality: null,
  createdAt: 1,
  updatedAt: 1,
  position: {
    underlying: "SPY",
    expiration: "2026-08-21",
    contracts: 2,
    direction: "sell",
    legs: [
      {
        strike: 500,
        type: "put",
        quantity: 2,
        side: "short",
        entry_price: 1.2,
      },
      {
        strike: 490,
        type: "put",
        quantity: 2,
        side: "long",
        entry_price: 0.4,
      },
    ],
  },
} as AnalyzerPosition;

assert.equal(strategyCodeFromPosition(pos), "VERTICAL");
const draft = analyzerPositionToOpenTrade(pos, new Date("2026-08-18T14:00:00Z"));
assert.equal(draft.legs.length, 2);
assert.equal(draft.legs[0].side, "SELL");
assert.equal(draft.legs[0].pos_effect, "TO_OPEN");
assert.equal(draft.legs[0].quantity, 2);
assert.equal(draft.legs[0].right, "PUT");
assert.equal(draft.legs[1].side, "BUY");
assert.ok(draft.setup_md.includes("simulation"));
assert.equal(draft.entry_source, "manual");
