/**
 * REQ-003 dialog source — chips, clause 5, live API, no tagged picker.
 *
 *   npx --yes tsx lib/symbology/dialog.source.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, "../..");

function read(rel: string): string {
  return readFileSync(join(web, rel), "utf8");
}

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

const dialog = read("components/symbology/SymbolSearchDialog.tsx");
const tile = read("components/symbology/SymbolSearchTile.tsx");
const surface = read("components/options-lab/VolumeProfileSaSurface.tsx");
const api = read("lib/symbology/api.ts");
const proxy = read("app/api/symbology/v1/[...path]/route.ts");

test("dialog title and clause 5 white/black", () => {
  assert.match(dialog, /Symbol search/);
  assert.match(dialog, /data-clause5="white-black"/);
  assert.match(dialog, /bg-white text-black/);
});

test("Labs chips only — All / Futures / Stocks / Indices", () => {
  assert.match(dialog, /symbol-search-chip-\$\{c\.id\}/);
  assert.match(dialog, /CLASS_CHIPS/);
  assert.doesNotMatch(dialog, /Forex|Crypto|Bonds|Economy|Funds/);
  assert.doesNotMatch(dialog, /All countries|All categories|ISIN|CUSIP/);
});

test("consumes live universe + resolve; no tagged picker", () => {
  assert.match(api, /const BASE = "\/api\/symbology\/v1"/);
  assert.match(api, /\$\{BASE\}\/universe/);
  assert.match(api, /\$\{BASE\}\/resolve/);
  assert.match(api, /\$\{BASE\}\/spec\//);
  assert.match(proxy, /\/symbology\/v1\//);
  assert.doesNotMatch(api, /\bFIXTURE\b/);
  assert.doesNotMatch(dialog, /\bFIXTURE\b/);
  assert.doesNotMatch(tile, /\bFIXTURE\b/);
  assert.doesNotMatch(surface, /\bFIXTURE\b/);
  assert.doesNotMatch(proxy, /\bFIXTURE\b/);
  assert.doesNotMatch(dialog, /req-003-picker/);
  assert.doesNotMatch(api, /req-003-picker/);
});

test("VP member surface mounts the tile with VP roles", () => {
  assert.match(surface, /SymbolSearchTile/);
  assert.match(surface, /SYM_ROLES_VP/);
  assert.match(tile, /roles = SYM_ROLES_VP/);
});

test("options-app roles exist so later mounts can gray futures", () => {
  const types = read("lib/symbology/types.ts");
  assert.match(types, /SYM_ROLES_OPTIONS/);
  assert.match(types, /SYM_ROLES_VP/);
});

test("continuity caption and pair badge hooks exist", () => {
  const types = read("lib/symbology/types.ts");
  assert.match(types, /opens front contract · continuous coming/);
  assert.match(dialog, /continuityCaptionFor/);
  assert.match(dialog, /symbol-search-continuity-label/);
  assert.match(dialog, /symbol-search-pair-badge/);
  assert.match(dialog, /symbol-search-miss/);
});

test("REQ-009 spec card is one click from the picker", () => {
  assert.match(dialog, /symbol-search-spec-\$\{row\.symbol\}/);
  assert.match(dialog, /ContractSpecCard/);
  const card = read("components/symbology/ContractSpecCard.tsx");
  assert.match(card, /Sessions pending/);
  assert.match(card, /contract-spec-bpv/);
  assert.doesNotMatch(card, /session_summary is/);
});

test("F1 highlight mark and alias-against chrome exist; no month-code table", () => {
  assert.match(dialog, /symbol-search-highlight/);
  assert.match(dialog, /symbol-search-alias-against/);
  assert.match(dialog, /data-clause5="white-black"/);
  assert.doesNotMatch(dialog, /FGHJKMNQUVXZ/);
  assert.doesNotMatch(dialog, /ESZ2026|ESH2027/);
});

console.log(`\n${n} passed`);
