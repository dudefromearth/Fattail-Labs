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
  fmtPackageDelta,
  groupPositionsBySymbol,
  moveSymbolInOrder,
  packageDelta,
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
  assert.match(list, /CARD_COLUMNS\.(?:flat)?Map/);
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
  const src = readFileSync(
    join(here, "../../components/options-lab/TosControls.tsx"),
    "utf8",
  );
  assert.doesNotMatch(src, /IconLock|IconUnlock/);
  assert.match(src, /data-lock-shackle=\{locked \? "over" : "side"\}/);
  assert.match(src, /data-lock-body=\{locked \? "solid" : "outlined"\}/);
  assert.match(src, /fill="none"/);
  assert.match(src, /data-locked=\{locked \? "1" : "0"\}/);
});

test("PC8-F padlock SVG is block so the shackle stays inside the 18px row", () => {
  const src = readFileSync(
    join(here, "../../components/options-lab/TosControls.tsx"),
    "utf8",
  );
  const glyph = src.slice(src.indexOf("function TosPadlockGlyph"));
  const svgOpen = glyph.slice(0, glyph.indexOf("</svg>"));
  assert.match(svgOpen, /className="block"/);
  assert.match(src, /leading-none/);
  assert.match(src, /viewBox=\{`0 0 \$\{PADLOCK_W\} \$\{PADLOCK_H\}`\}/);
  assert.equal((src.match(/const PADLOCK_W = 22/) || []).length, 1);
  assert.equal((src.match(/const PADLOCK_H = 18/) || []).length, 1);
  assert.doesNotMatch(src, /viewBox="0 0 22 2[0-9]"/);
});

test("PC8-E padlock footprint identical both states; one colour white", () => {
  const src = readFileSync(
    join(here, "../../components/options-lab/TosControls.tsx"),
    "utf8",
  );
  const footprints = [...src.matchAll(/data-padlock-footprint="([^"]+)"/g)].map(
    (m) => m[1],
  );
  assert.ok(footprints.length >= 2);
  assert.ok(footprints.every((f) => f === footprints[0]));
  assert.equal(footprints[0], "22x18");
  const widths = [...src.matchAll(/const PADLOCK_W = (\d+)/g)].map((m) => m[1]);
  const heights = [...src.matchAll(/const PADLOCK_H = (\d+)/g)].map((m) => m[1]);
  assert.deepEqual(widths, ["22"]);
  assert.deepEqual(heights, ["18"]);
  assert.match(src, /PADLOCK_PAINT = "#ffffff"/);
  assert.doesNotMatch(src, /#c8c8c8/i);
  assert.doesNotMatch(src, /opacity-90/);
  assert.doesNotMatch(src, /tone="light"/);
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.match(list, /analyzer-col-lock/);
  assert.match(list, /analyzer-pos-lock-cell-/);
  assert.match(list, /LOCK_RULE/);
  assert.match(list, /TosPadlock/);
});

test("AT-PC-67 / AT-PC-68 stepper grows on hover/focus; exclusive z-index", () => {
  const src = readFileSync(
    join(here, "../../components/options-lab/TosControls.tsx"),
    "utf8",
  );
  assert.doesNotMatch(src, /\.split\s*\(/);
  assert.doesNotMatch(src, /\bGROWN\b/);
  assert.match(src, /group-hover\/step:min-h-\[var\(--hit-min\)\]/);
  assert.match(src, /group-focus-within\/step:min-h-\[var\(--hit-min\)\]/);
  assert.match(src, /hover:z-20/);
  assert.match(src, /focus-within:z-20/);
  assert.match(src, /tos-stepper/);
  assert.match(src, /data-resting-h="18"/);
  assert.doesNotMatch(src, /▲|▼/);
  for (const line of src.split("\n")) {
    if (!line.includes("min-h-[var(--hit-min)]")) continue;
    assert.match(
      line,
      /group-hover\/step:|group-focus-within\/step:/,
      `--hit-min must be grown-only: ${line.trim()}`,
    );
  }
});

test("PC8-E.3 grown stepper is out of flow; resting slot is the layout box", () => {
  const src = readFileSync(
    join(here, "../../components/options-lab/TosControls.tsx"),
    "utf8",
  );
  assert.match(src, /data-tos-stepper-slot/);
  assert.match(src, /absolute left-1\/2 top-1\/2/);
  assert.match(src, /-translate-x-1\/2 -translate-y-1\/2/);
  assert.match(src, /inline-flex \$\{REST_H\} \$\{REST_W\}/);
});

test("PC8-E.4 no POS tooltip; title only on real buttons", () => {
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.doesNotMatch(list, /title=\{isTop \? `POS \$\{pkgQty\}`/);
  assert.doesNotMatch(list, /title="Roll to listed expiration"/);
  assert.doesNotMatch(list, /title="Flip structure/);
  assert.match(list, /Log is closed while Time Machine is active/);
  assert.match(list, /aria-label="POS"/);
});

test("PC8-E.5 card scale is a token: data 14px chrome 13px", () => {
  const tokens = readFileSync(
    join(here, "../../styles/tokens.css"),
    "utf8",
  );
  assert.match(tokens, /--ol-card-data:\s*14px/);
  assert.match(tokens, /--ol-card-chrome:\s*13px/);
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.match(list, /--ol-card-data/);
  assert.match(list, /--ol-card-chrome/);
  assert.doesNotMatch(list, /const td = "px-1 text-\[11px\]/);
});

test("PC8-E.7 menu triangle is corner-nested; QTY caret is untouched", () => {
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.match(list, /CardMenuField/);
  assert.doesNotMatch(list, /bg-\[right_3px_center\]/);
  const src = readFileSync(
    join(here, "../../components/options-lab/TosControls.tsx"),
    "utf8",
  );
  assert.match(src, /data-menu-triangle="1"/);
  assert.match(src, /points="6,6 0,6 6,0"/);
  assert.match(src, /pointer-events-none absolute bottom-0 right-0/);
  assert.match(src, /export function CardMenuField/);
  assert.match(src, /function CaretDown/);
  assert.match(src, /TosQtyControl/);
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
  assert.match(list, /TosQtyControl/);
  assert.doesNotMatch(list, /TosQtyQuickPick/);
  assert.match(list, /onScalePos/);
  const src = readFileSync(
    join(here, "../../components/options-lab/TosControls.tsx"),
    "utf8",
  );
  assert.match(src, /export function TosQtyControl/);
  assert.doesNotMatch(src, /TosQtyQuickPick/);
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
  assert.match(list, /uppercase tracking-wide/);
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
  assert.doesNotMatch(builder, /builder-entry-at/);
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

test("PC8-G dialog shares TosControls; no forked stepper/padlock/triangle", () => {
  const builder = readFileSync(
    join(here, "../../components/options-lab/PositionBuilder.tsx"),
    "utf8",
  );
  assert.match(builder, /TosStepper/);
  assert.match(builder, /TosQtyControl/);
  assert.match(builder, /TosPadlock/);
  assert.match(builder, /CardMenuField/);
  assert.doesNotMatch(builder, /function TosStepper/);
  assert.doesNotMatch(builder, /function CardMenuField/);
  assert.doesNotMatch(builder, /data-menu-triangle/);
  assert.doesNotMatch(builder, /type="number"/);
  assert.doesNotMatch(builder, /type="time"/);
  assert.doesNotMatch(builder, /type="date"/);
  assert.match(builder, /builder-leg-qty-step-/);
  assert.match(builder, /Math\.abs\(leg\.quantity\) \+ 1/);
  assert.doesNotMatch(builder, /builder-entry-at/);
  assert.match(builder, /Copy ToS script/);
  assert.match(builder, /builder-pos-step/);
  assert.match(builder, /builder-live-package-price/);
});

test("PC8-E VOL per leg and package DELTA; a miss does not null the rest", () => {
  const a = fly();
  assert.equal(packageDelta(a.position.legs, 770), null);
  assert.equal(fmtPackageDelta(null), "—");
  const priced = a.position.legs.map((l, i) =>
    i === 2 ? l : { ...l, volatility: 0.12 },
  );
  const d = packageDelta(priced, 770, Date.parse("2026-09-11T14:00:00Z"));
  assert.ok(d != null && Number.isFinite(d));
  assert.notEqual(fmtPackageDelta(d), "—");
  assert.equal(priced[2].volatility, undefined);
  const quotes = readFileSync(
    join(here, "./usePackageQuotes.ts"),
    "utf8",
  );
  assert.match(quotes, /iv: row\.iv/);
  assert.match(quotes, /getContract:/);
  const finish = readFileSync(
    join(here, "./packageQuoteFinish.ts"),
    "utf8",
  );
  assert.match(finish, /applyLegVolatilityFromChain/);
});

console.log(`tosCard.test.ts ${n} ok`);
