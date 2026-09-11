/**
 * PC7 — chain-bound controls. AT-PC-05 named here per Coach.
 *
 *   npx --yes tsx lib/options-lab/chainControls.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  boundSelectValue,
  dteFromClock,
  ladderKind,
  ladderStatusLabel,
  listedInHorizon,
  offeredTemplates,
  proposeExpirationRoll,
  residualStillEditable,
  seedExpirations,
  stepListedStrike,
} from "./chainControls";
import {
  definedDebitSigned,
  lockLimit,
  lockNatural,
  positionFromInput,
  type AnalyzerPosition,
} from "./analyzerBook";
import type { TemplateType } from "./positionTypes";

const here = dirname(fileURLToPath(import.meta.url));
const ALL: TemplateType[] = [
  "single",
  "vertical",
  "butterfly",
  "bwb",
  "condor",
  "straddle",
  "strangle",
  "iron_fly",
  "iron_condor",
  "calendar",
  "diagonal",
];

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

test("AT-PC-05 lock gesture writes CardLockState; canvas debit is that lock", () => {
  const pos = positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    legs: [
      {
        strike: 770,
        type: "call",
        quantity: 1,
        side: "long",
        entry_price: 1,
        expiration: "2026-09-11",
      },
    ],
  });
  pos.lastNatSigned = 0.67;
  pos.livePackagePerShare = 0.67;
  const locked = lockNatural(pos);
  assert.equal(locked.lock.mode, "locked");
  if (locked.lock.mode === "locked") {
    assert.equal(locked.lock.packageDebitPerShare, 0.67);
    assert.equal(locked.lock.freezeIv, false);
    assert.equal(locked.lock.freezeMarks, false);
  }
  const canvasDebit = definedDebitSigned(locked);
  assert.equal(canvasDebit, 0.67);
  const limited = lockLimit(pos, 1.25, false);
  assert.equal(limited.lock.mode, "locked");
  assert.equal(definedDebitSigned(limited), 1.25);
});

test("AT-PC-09 / PC-CHAIN-3 strike stepper edge is a no-op", () => {
  const listed = [760, 770, 780];
  assert.equal(stepListedStrike(780, listed, "up"), 780);
  assert.equal(stepListedStrike(760, listed, "down"), 760);
  assert.equal(stepListedStrike(770, listed, "up"), 780);
});

test("AT-PC-10 one listed expiration hides calendar and diagonal", () => {
  const one = offeredTemplates(1, ALL);
  assert.ok(!one.includes("calendar"));
  assert.ok(!one.includes("diagonal"));
  const two = offeredTemplates(2, ALL);
  assert.ok(two.includes("calendar"));
});

test("AT-PC-11 empty ladder is loading, never unavailable", () => {
  assert.equal(ladderKind([]), "empty");
  assert.equal(ladderStatusLabel("empty"), "loading");
  assert.equal(ladderKind([1]), "singular");
  assert.notEqual(ladderStatusLabel("singular"), "loading");
});

test("AT-PC-12 DTE uses the supplied clock, not Date.now()", () => {
  const clock = new Date("2026-09-10T20:00:00-04:00");
  assert.equal(dteFromClock("2026-09-11", clock), 1);
  assert.equal(dteFromClock("2026-09-10", clock), 0);
});

test("AT-PC-17 missing value does not bind to options[0]", () => {
  const opts = ["2026-09-11", "2026-09-18"];
  const missing = boundSelectValue("2026-08-01", opts);
  assert.equal(missing.invalid, true);
  assert.equal(missing.value, "");
  assert.notEqual(missing.value, opts[0]);
  const ok = boundSelectValue("2026-09-11", opts);
  assert.equal(ok.invalid, false);
  assert.equal(ok.value, "2026-09-11");
});

test("AT-PC-18 roll is proposed, not applied", () => {
  const next = proposeExpirationRoll("2026-09-11", [
    "2026-09-11",
    "2026-09-18",
  ]);
  assert.equal(next, "2026-09-18");
});

test("AT-PC-38 residual before midnight ET stays editable", () => {
  assert.equal(
    residualStillEditable({ sessionEnded: true, expiredMidnightEt: false }),
    true,
  );
  assert.equal(
    residualStillEditable({ sessionEnded: true, expiredMidnightEt: true }),
    false,
  );
});

test("horizon seed is listed[0] / listed[1]", () => {
  const listed = listedInHorizon(
    ["2026-09-11", "2026-09-18", "2026-12-18"],
    new Date("2026-09-11T12:00:00-04:00"),
    10,
  );
  const seed = seedExpirations(listed);
  assert.equal(seed.front, "2026-09-11");
  assert.equal(seed.back, "2026-09-18");
});

test("builder: no type=date; selects use boundSelectValue; no options[0] fallback", () => {
  const src = readFileSync(
    join(here, "../../components/options-lab/PositionBuilder.tsx"),
    "utf8",
  );
  assert.doesNotMatch(src, /type="date"/);
  assert.match(src, /boundSelectValue/);
  assert.doesNotMatch(
    src,
    /chain\.expirations\[0\] \|\| position\.expiration/,
  );
  const list = readFileSync(
    join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
    "utf8",
  );
  assert.match(list, /boundSelectValue/);
});

test("D-PC-7 Edit dialog price path: override, not CardLockState", () => {
  const src = readFileSync(
    join(here, "../../components/options-lab/PositionBuilder.tsx"),
    "utf8",
  );
  assert.match(src, /overrideActive = position\.net_debit_override != null/);
  assert.match(src, /builder-live-package-price/);
  assert.match(
    src,
    /overrideActive && position\.net_debit_override != null\s*\n\s*\? Math\.abs\(position\.net_debit_override\)/,
  );
});

console.log(`chainControls.test.ts ${n} ok`);
