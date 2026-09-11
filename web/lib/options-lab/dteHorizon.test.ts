/**
 *   npx --yes tsx lib/options-lab/dteHorizon.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { OPF_ACTIVE_DTE_HORIZON } from "./dteHorizon";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");

assert.equal(OPF_ACTIVE_DTE_HORIZON, 10);

const decl =
  /export const OPF_ACTIVE_DTE_HORIZON = (\d+)/g;
const ts = readFileSync(join(here, "dteHorizon.ts"), "utf8");
const hits = [...ts.matchAll(decl)];
assert.equal(hits.length, 1, "exactly one TS declaration");

const py = readFileSync(
  join(root, "server/routes/chain_ladder.py"),
  "utf8",
);
assert.match(py, /dteHorizon\.ts/);
assert.doesNotMatch(py, /^OPF_ACTIVE_DTE_HORIZON = \d+/m);

const proof = readFileSync(
  join(here, "templates/advancedFly.opf.live.proof.ts"),
  "utf8",
);
assert.doesNotMatch(proof, /max_dte=14/);
assert.match(proof, /max_dte=10/);

const api = readFileSync(join(here, "../chainLadderApi.ts"), "utf8");
assert.match(api, /from "\.\/options-lab\/dteHorizon"/);
assert.doesNotMatch(api, /export const OPF_ACTIVE_DTE_HORIZON = 10/);

console.log("dteHorizon.test.ts ok");
