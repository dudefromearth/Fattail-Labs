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
  aliasAgainst,
  attachStripPointers,
  continuityCaptionFor,
  familyChildren,
  groupMatchesChip,
  groupSearchRank,
  isRestChild,
  pairBadgesFromUniverse,
  rankSearchGroups,
  rowBindable,
  rowIsGray,
  searchChildren,
  sortFamilyChildren,
  splitHighlight,
  stripRoleFor,
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
  front: "ES-front",
  forward: "ES-forward",
  rows: [
    row({
      type: "root",
      symbol: "ES",
      root: "ES",
      display_name: "E-mini S&P 500 Futures",
    }),
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
      display_name: "E-mini S&P 500 Futures Front",
      gray: { reason_code: "path-not-yet-verified", copy: "path not yet verified" },
    }),
    row({
      type: "contract",
      symbol: "ES-forward",
      root: "ES",
      display_name: "E-mini S&P 500 Futures Forward",
    }),
    row({ type: "contract", symbol: "ES-back", root: "ES" }),
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

test("at rest, family children are front, forward, then remaining strip; bang aliases are chrome", () => {
  const kids = familyChildren(esGroup);
  assert.deepEqual(
    kids.map((k) => k.symbol),
    ["ES-front", "ES-forward", "ES-back"],
  );
  assert.equal(isRestChild(esGroup.rows.find((r) => r.symbol === "ES1!")!), false);
  assert.equal(isRestChild(esGroup.rows.find((r) => r.symbol === "/ES")!), false);
  assert.equal(isRestChild(esGroup.rows.find((r) => r.symbol === "@ES")!), false);
  const front = kids[0];
  const forward = kids[1];
  assert.equal(stripRoleFor(front, esGroup), "front");
  assert.equal(stripRoleFor(forward, esGroup), "forward");
  assert.equal(aliasAgainst(front, esGroup), "ES1!");
  assert.equal(aliasAgainst(forward, esGroup), "ES2!");
  assert.equal(aliasAgainst(kids[2], esGroup), null);
});

test("sort uses payload front/forward even if contracts are shuffled", () => {
  const shuffled = sortFamilyChildren(
    [
      esGroup.rows.find((r) => r.symbol === "ES-back")!,
      esGroup.rows.find((r) => r.symbol === "ES-forward")!,
      esGroup.rows.find((r) => r.symbol === "ES-front")!,
    ],
    esGroup,
  );
  assert.deepEqual(
    shuffled.map((r) => r.symbol),
    ["ES-front", "ES-forward", "ES-back"],
  );
});

test("dated children keep API strip order after front/forward", () => {
  const group = {
    front: "C-first",
    forward: "C-second",
  };
  const rows = [
    row({ type: "contract", symbol: "C-third", root: "ES" }),
    row({ type: "continuity-alias", symbol: "ES1!", root: "ES" }),
    row({ type: "contract", symbol: "C-first", root: "ES" }),
    row({ type: "contract", symbol: "C-second", root: "ES" }),
  ];
  assert.deepEqual(
    sortFamilyChildren(rows, group).map((r) => r.symbol),
    ["C-first", "C-second", "C-third"],
  );
});

test("front dialects carry the interim continuity caption; 2! does not; front contract does", () => {
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
  assert.equal(
    continuityCaptionFor(esGroup.rows.find((r) => r.symbol === "ES-front")!, esGroup),
    CONTINUITY_CAPTION,
  );
  assert.equal(
    continuityCaptionFor(esGroup.rows.find((r) => r.symbol === "ES-forward")!, esGroup),
    "",
  );
});

test("root is not bindable; aliases and contracts are", () => {
  assert.equal(rowBindable(esGroup.rows[0]), false);
  assert.equal(rowBindable(esGroup.rows[1]), true);
  assert.equal(rowBindable(esGroup.rows.find((r) => r.symbol === "ES-front")!), true);
  assert.equal(rowBindable(spxGroup.rows[0]), true);
});

test("COMING rows are gray with API copy", () => {
  const front = esGroup.rows.find((r) => r.symbol === "ES-front")!;
  assert.equal(rowIsGray(front), true);
  assert.equal(front.gray?.copy, "path not yet verified");
  assert.equal(rowIsGray(esGroup.rows[1]), false);
});

test("search children keep strip order; slash/at only when the query is that dialect", () => {
  assert.deepEqual(
    searchChildren(esGroup, "es").map((r) => r.symbol),
    ["ES-front", "ES-forward", "ES-back"],
  );
  assert.deepEqual(
    searchChildren(esGroup, "/ES").map((r) => r.symbol),
    ["ES-front", "ES-forward", "ES-back", "/ES"],
  );
});

test("ticker-prefix groups rank above name-only groups", () => {
  const mes: UniverseGroup = {
    root: "MES",
    rows: [
      row({
        type: "root",
        symbol: "MES",
        root: "MES",
        display_name: "Micro E-mini S&P 500 Futures",
      }),
    ],
  };
  const ranked = rankSearchGroups([mes, esGroup], "es");
  assert.equal(ranked[0].root, "ES");
  assert.equal(groupSearchRank(esGroup, "es"), 0);
  assert.equal(groupSearchRank(mes, "es"), 1);
});

test("highlight splits matched substrings in ticker and name", () => {
  const parts = splitHighlight("E-mini S&P 500 Futures", "500");
  assert.deepEqual(
    parts.filter((p) => p.hit).map((p) => p.text),
    ["500"],
  );
  const ticker = splitHighlight("ESZ-front", "es");
  assert.equal(ticker[0].hit, true);
  assert.equal(ticker[0].text.toLowerCase(), "es");
});

test("attachStripPointers copies front/forward from the universe payload", () => {
  const search: UniverseGroup = {
    root: "ES",
    rows: [row({ type: "contract", symbol: "ES-front", root: "ES" })],
  };
  const [got] = attachStripPointers([search], { groups: [esGroup] });
  assert.equal(got.front, "ES-front");
  assert.equal(got.forward, "ES-forward");
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

test("SPEC-13: no client title map on ROOT_CHROME", () => {
  const src = readFileSync(join(here, "picker.ts"), "utf8");
  assert.equal(src.includes('title: "E-mini S&P 500 Futures"'), false);
  assert.equal(src.includes("ROOT_CHROME.title"), false);
  assert.match(src, /Titles come from registry display_name/);
});

test("production picker sources do not contain the tagged-picker token or a month-code table", () => {
  const files = ["picker.ts", "api.ts", "types.ts"].map((name) =>
    readFileSync(join(here, name), "utf8"),
  );
  const dialog = readFileSync(
    join(here, "../../components/symbology/SymbolSearchDialog.tsx"),
    "utf8",
  );
  for (const text of [...files, dialog]) {
    assert.equal(/\bFIXTURE\b/.test(text), false);
    assert.equal(text.includes("FGHJKMNQUVXZ"), false);
    assert.equal(/ESZ2026|ESH2027/.test(text), false);
  }
});

console.log(`\n${n} passed`);
