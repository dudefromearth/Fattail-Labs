/**
 * REQ-003 picker helpers — SYM3 characterization.
 *
 *   npx --yes tsx lib/symbology/picker.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CLASS_CHIPS,
  CONTINUITY_CAPTION,
  SYM_ROLES_OPTIONS,
  SYM_ROLES_VP,
} from "./types";
import type { SymbologyRow, UniverseGroup } from "./types";
import {
  continuityCaptionFor,
  familyChildren,
  groupMatchesChip,
  isRestChild,
  pairBadgesFromUniverse,
  rowBindable,
  rowIsGray,
  sortFamilyChildren,
} from "./picker";

const here = dirname(fileURLToPath(import.meta.url));

function row(
  partial: Partial<SymbologyRow> & Pick<SymbologyRow, "symbol" | "type" | "root">,
): SymbologyRow {
  return {
    roles: ["price-structure"],
    state: null,
    member_visible: true,
    has_chains: false,
    may_be_active: false,
    metadata_ref: null,
    gray: null,
    ...partial,
  };
}

const esGroup: UniverseGroup = {
  root: "ES",
  rows: [
    row({ type: "root", symbol: "ES", root: "ES" }),
    row({ type: "continuity-alias", symbol: "ES1!", root: "ES" }),
    row({ type: "continuity-alias", symbol: "ES2!", root: "ES" }),
    row({ type: "continuity-alias", symbol: "/ES", root: "ES" }),
    row({ type: "continuity-alias", symbol: "@ES", root: "ES" }),
    row({
      type: "contract",
      symbol: "ES-front",
      root: "ES",
      state: "COMING",
      may_be_active: true,
      gray: { reason_code: "path-not-yet-verified", copy: "path not yet verified" },
    }),
  ],
};

const spxGroup: UniverseGroup = {
  root: "SPX",
  rows: [
    row({
      type: "index",
      symbol: "SPX",
      root: "SPX",
      roles: ["options"],
      state: "COMING",
      may_be_active: true,
      gray: { reason_code: "path-not-yet-verified", copy: "path not yet verified" },
    }),
  ],
};

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

test("Labs chips are All / Futures / Stocks / Indices only", () => {
  assert.deepEqual(
    CLASS_CHIPS.map((c) => c.label),
    ["All", "Futures", "Stocks", "Indices"],
  );
  assert.equal(CLASS_CHIPS.length, 4);
});

test("VP roles include options + price-structure; options apps omit futures role", () => {
  assert.deepEqual([...SYM_ROLES_VP].sort(), ["options", "price-structure"]);
  assert.deepEqual([...SYM_ROLES_OPTIONS], ["options"]);
});

test("at rest, family children are bang aliases then contracts; slash/at dialects hidden", () => {
  const kids = familyChildren(esGroup);
  assert.deepEqual(
    kids.map((k) => k.symbol),
    ["ES1!", "ES2!", "ES-front"],
  );
  assert.equal(isRestChild(esGroup.rows.find((r) => r.symbol === "/ES")!), false);
  assert.equal(isRestChild(esGroup.rows.find((r) => r.symbol === "@ES")!), false);
});

test("sort keeps 1! before 2! before dated rows even if shuffled", () => {
  const shuffled = sortFamilyChildren([
    esGroup.rows[5],
    esGroup.rows[2],
    esGroup.rows[1],
  ]);
  assert.deepEqual(
    shuffled.map((r) => r.symbol),
    ["ES1!", "ES2!", "ES-front"],
  );
});

test("dated children keep API strip order", () => {
  const rows = [
    row({ type: "contract", symbol: "C-second", root: "ES" }),
    row({ type: "continuity-alias", symbol: "ES1!", root: "ES" }),
    row({ type: "contract", symbol: "C-first", root: "ES" }),
  ];
  assert.deepEqual(
    sortFamilyChildren(rows).map((r) => r.symbol),
    ["ES1!", "C-second", "C-first"],
  );
});

test("front dialects carry the interim continuity caption; 2! does not", () => {
  assert.equal(
    continuityCaptionFor(esGroup.rows.find((r) => r.symbol === "ES1!")!),
    CONTINUITY_CAPTION,
  );
  assert.equal(
    continuityCaptionFor(esGroup.rows.find((r) => r.symbol === "/ES")!),
    CONTINUITY_CAPTION,
  );
  assert.equal(
    continuityCaptionFor(esGroup.rows.find((r) => r.symbol === "@ES")!),
    CONTINUITY_CAPTION,
  );
  assert.equal(
    continuityCaptionFor(esGroup.rows.find((r) => r.symbol === "ES2!")!),
    "",
  );
  assert.equal(continuityCaptionFor(esGroup.rows[5]), "");
});

test("root is not bindable; aliases and contracts are", () => {
  assert.equal(rowBindable(esGroup.rows[0]), false);
  assert.equal(rowBindable(esGroup.rows[1]), true);
  assert.equal(rowBindable(esGroup.rows[5]), true);
  assert.equal(rowBindable(spxGroup.rows[0]), true);
});

test("COMING rows are gray with API copy", () => {
  assert.equal(rowIsGray(esGroup.rows[5]), true);
  assert.equal(esGroup.rows[5].gray?.copy, "path not yet verified");
  assert.equal(rowIsGray(esGroup.rows[1]), false);
});

test("class chips: futures vs indices vs stocks", () => {
  assert.equal(groupMatchesChip(esGroup, "all"), true);
  assert.equal(groupMatchesChip(esGroup, "futures"), true);
  assert.equal(groupMatchesChip(esGroup, "indices"), false);
  assert.equal(groupMatchesChip(esGroup, "stocks"), false);
  assert.equal(groupMatchesChip(spxGroup, "indices"), true);
  assert.equal(groupMatchesChip(spxGroup, "futures"), false);
});

test("pair badge ES → SPX only when both groups are in the payload; dark while COMING", () => {
  const both = pairBadgesFromUniverse([spxGroup, esGroup]);
  assert.equal(both.length, 1);
  assert.equal(both[0].label, "ES → SPX");
  assert.equal(both[0].active, false);
  assert.equal(both[0].state, "COMING");
  const esOnly = pairBadgesFromUniverse([esGroup]);
  assert.equal(esOnly.length, 0);
  const spxOnly = pairBadgesFromUniverse([spxGroup]);
  assert.equal(spxOnly.length, 0);
});

test("production picker sources do not contain the tagged-picker token or a month-code table", () => {
  const files = ["picker.ts", "api.ts", "types.ts"].map((name) =>
    readFileSync(join(here, name), "utf8"),
  );
  for (const text of files) {
    assert.equal(/\bFIXTURE\b/.test(text), false);
    assert.equal(text.includes("FGHJKMNQUVXZ"), false);
  }
});

console.log(`\n${n} passed`);
