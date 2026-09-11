/**
 * PC8 — ToS card. AT-PC-05 named in PC7; D-PC-7 dialog path closed here.
 *
 *   npx --yes tsx lib/options-lab/tosCard.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CARD_COLUMNS,
  QTY_QUICK_PICK,
  cardFieldExposure,
  catalogToTemplate,
  groupPositionsBySymbol,
  moveSymbolInOrder,
  patchCardLeg,
  rebuildCardFromTemplate,
  setCardRight,
  stepCardPrice,
} from "./tosCard";
import {
  lockLimit,
  positionFromInput,
  scaleCardPos,
  type AnalyzerPosition,
} from "./analyzerBook";
import { catalogName } from "./structureClassifier";

const here = dirname(fileURLToPath(import.meta.url));

let n = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    n += 1;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

function fly(): AnalyzerPosition {
  const pos = positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    legs: [
      { strike: 760, type: "call", quantity: 1, side: "long", entry_price: 1, expiration: "2026-09-11" },
      { strike: 770, type: "call", quantity: 2, side: "short", entry_price: 1, expiration: "2026-09-11" },
      { strike: 780, type: "call", quantity: 1, side: "long", entry_price: 1, expiration: "2026-09-11" },
    ],
  });
  pos.lastNatSigned = 0.67;
  pos.livePackagePerShare = 0.67;
  return pos;
}

function calendar(): AnalyzerPosition {
  return positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    legs: [
      { strike: 770, type: "call", quantity: 1, side: "short", entry_price: 1, expiration: "2026-09-11" },
      { strike: 770, type: "call", quantity: 1, side: "long", entry_price: 1, expiration: "2026-09-18" },
    ],
  });
}

function listed(): number[] {
  const out: number[] = [];
  for (let s = 740; s <= 800; s += 1) out.push(s);
  return out;
}

test("AT-PC-61 card columns are exactly the ten of PC-VOCAB-7", () => {
  assert.deepEqual([...CARD_COLUMNS], [
    "SPREAD",
    "SIDE",
    "QTY",
    "SYMBOL",
    "EXP",
    "STRIKE",
    "TYPE",
    "PRICE",
    "VOL",
    "DELTA",
  ]);
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.match(list, /CARD_COLUMNS\.map/);
  assert.doesNotMatch(list, /Yield/);
  assert.doesNotMatch(list, /Vol Adj/);
  assert.doesNotMatch(list, /BP Effect/);
  assert.doesNotMatch(list, />Pkg</);
});

test("AT-PC-62 DELTA is row 1 only; legs render em dash", () => {
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.match(list, /analyzer-pos-delta-/);
  assert.match(list, /isTop \? fmtPackageDelta/);
  assert.match(list, /: "—"/);
});

test("AT-PC-63 seven fields: exposure by strategy", () => {
  const flyX = cardFieldExposure("Butterfly");
  assert.equal(flyX.spread, "row1");
  assert.equal(flyX.strike, "per-leg");
  assert.equal(flyX.type, "row1");
  assert.equal(flyX.expiration, "row1");
  assert.equal(flyX.price, "row1");
  const cal = cardFieldExposure("Calendar");
  assert.equal(cal.expiration, "per-leg");
  const iron = cardFieldExposure("Iron Fly");
  assert.equal(iron.type, "inert");
  const custom = cardFieldExposure("CUSTOM");
  assert.equal(custom.expiration, "per-leg");
  assert.equal(custom.type, "per-leg");
  assert.equal(custom.strike, "per-leg");
});

test("AT-PC-32 / AT-PC-64 card Spread rebuilds legs and CHECK PRICE", () => {
  const a = lockLimit(fly(), 1.2, false);
  const next = rebuildCardFromTemplate(a, "vertical", listed());
  assert.equal(catalogName(next.position.legs), "Vertical");
  assert.equal(next.position.legs.length, 2);
  assert.equal(next.lock.mode, "locked");
  if (next.lock.mode === "locked") {
    assert.equal(next.lock.checkPrice, true);
    assert.equal(next.lock.packageDebitPerShare, 1.2);
  }
});

test("AT-PC-65 Calendar per-leg exp/strike re-derives the name", () => {
  const a = calendar();
  assert.equal(catalogName(a.position.legs), "Calendar");
  const moved = patchCardLeg(a, 1, { strike: 775 });
  assert.equal(catalogName(moved.position.legs), "Diagonal");
  const sameStrike = patchCardLeg(moved, 1, { strike: 770 });
  assert.equal(catalogName(sameStrike.position.legs), "Calendar");
});

test("AT-PC-66 padlock pair: shackle carries state, unlocked is outlined", () => {
  const icons = readFileSync(
    join(here, "../../components/ui/icons.tsx"),
    "utf8",
  );
  assert.match(icons, /data-lock-shackle="over"/);
  assert.match(icons, /data-lock-shackle="side"/);
  assert.match(icons, /data-lock-body="solid"/);
  assert.match(icons, /data-lock-body="outlined"/);
  assert.match(icons, /fill="none"/);
});

test("AT-PC-67 / AT-PC-68 stepper grows on hover/focus; exclusive z-index", () => {
  const src = readFileSync(
    join(here, "../../components/options-lab/TosControls.tsx"),
    "utf8",
  );
  assert.match(src, /min-h-\[var\(--hit-min\)\]/);
  assert.match(src, /hover:z-20/);
  assert.match(src, /focus-within:z-20/);
  assert.match(src, /tos-stepper/);
  assert.doesNotMatch(src, /▲|▼/);
});

test("AT-PC-69 QTY quick-pick is POS and leaves lock standing", () => {
  assert.deepEqual([...QTY_QUICK_PICK], [1, 2, 5, 10, 20]);
  const a = lockLimit(fly(), 1.2, false);
  const scaled = scaleCardPos(a, 5);
  assert.equal(scaled.position.legs[0].quantity, 5);
  assert.equal(scaled.position.legs[1].quantity, 10);
  assert.equal(scaled.lock.mode, "locked");
  if (scaled.lock.mode === "locked") {
    assert.equal(scaled.lock.checkPrice, undefined);
    assert.equal(scaled.lock.packageDebitPerShare, 1.2);
  }
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.match(list, /TosQtyQuickPick/);
  assert.match(list, /onScalePos/);
});

test("AT-PC-70 no chevron-style nudge remains on the card", () => {
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.doesNotMatch(list, /analyzer-pos-strike-up-/);
  assert.doesNotMatch(list, /analyzer-pos-strike-nudge-/);
  assert.match(list, /TosStepper/);
  assert.doesNotMatch(list, /Shift all strikes/);
});

test("AT-PC-15 / AT-PC-58 symbol groups: select ≠ expand; order is chrome", () => {
  const a = fly();
  const b: AnalyzerPosition = {
    ...positionFromInput({
      underlying: "SPX",
      expiration: "2026-09-11",
      contracts: 1,
      direction: "buy",
      legs: a.position.legs,
    }),
    id: "spx-1",
  };
  const groups = groupPositionsBySymbol([a, b], ["SPX", "XSP"]);
  assert.equal(groups[0].symbol, "SPX");
  assert.equal(groups[1].symbol, "XSP");
  const moved = moveSymbolInOrder(["SPX", "XSP"], "SPX", "down");
  assert.deepEqual(moved, ["XSP", "SPX"]);
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.match(list, /analyzer-symbol-group-/);
  assert.match(list, /onSelectSymbolGroup/);
  assert.match(list, /data-group-selected/);
});

test("AT-PC-20 no profit-claim or ranking language on the card", () => {
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.doesNotMatch(list, /profit/i);
  assert.doesNotMatch(list, /ranking/i);
  assert.doesNotMatch(list, /best (?:fly|spread)/i);
});

test("AT-PC-33 delete is confirmed and names the position", () => {
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.match(list, /analyzer-pos-delete-confirm-/);
  assert.match(list, /pendingDelete/);
  assert.match(list, /Cancel/);
});

test("AT-PC-49 STRATEGY cell is perceptible; column headers keep ToS uppercase", () => {
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.match(list, /analyzer-pos-spread-/);
  assert.match(list, /text-\[10px\] font-normal uppercase tracking-wide/);
});

test("PC8-D ✕ deletes and Close closes; no entry-time on the card", () => {
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.match(list, /analyzer-pos-delete-/);
  assert.match(list, /onAskDelete/);
  assert.match(list, /analyzer-pos-close-/);
  assert.match(list, /onClosePosition/);
  assert.doesNotMatch(list, /type="time"/);
  const builder = readFileSync(
    join(here, "../../components/options-lab/PositionBuilder.tsx"),
    "utf8",
  );
  assert.match(builder, /builder-entry-at/);
});

test("D-PC-7 Edit dialog displayed price reads CardLockState, not override", () => {
  const builder = readFileSync(
    join(here, "../../components/options-lab/PositionBuilder.tsx"),
    "utf8",
  );
  assert.match(builder, /cardLock/);
  assert.match(builder, /cardLock\?\.mode === "locked"/);
  assert.match(builder, /packageDebitPerShare/);
  assert.match(builder, /builder-live-package-price/);
});

test("row-1 Type flip rebuilds rights; CUSTOM type is per-leg", () => {
  const a = fly();
  const put = setCardRight(a, "put");
  assert.ok(put.position.legs.every((l) => l.type === "put"));
  assert.equal(catalogName(put.position.legs), "Butterfly");
});

test("price steps by the product tick (PC-HIG-10)", () => {
  assert.equal(stepCardPrice("XSP", 0.67, "up"), 0.68);
  assert.equal(stepCardPrice("XSP", 0.67, "down"), 0.66);
});

test("catalogToTemplate never offers CUSTOM", () => {
  assert.equal(catalogToTemplate("CUSTOM"), null);
  assert.equal(catalogToTemplate("Butterfly"), "butterfly");
});

console.log(`tosCard.test.ts ${n} ok`);
