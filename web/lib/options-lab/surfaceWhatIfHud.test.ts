/**
 *   npx --yes tsx lib/options-lab/surfaceWhatIfHud.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

const here = dirname(fileURLToPath(import.meta.url));
const hud = readFileSync(
  join(here, "../../components/options-lab/surface/TimeHud.tsx"),
  "utf8",
);
const app = readFileSync(
  join(here, "../../components/options-lab/surface/SurfaceApp.tsx"),
  "utf8",
);

console.log("surfaceWhatIfHud");

test("AT-TM-11 HUD is What-if, not Time machine", () => {
  assert(!/Time machine/.test(hud), "TimeHud copy");
  assert(!/Time machine/.test(app), "SurfaceApp copy");
  assert(hud.includes(">What-if<"), "block title");
  assert(hud.includes("Implied vol"), "vol label");
  assert(hud.includes("Last trade"), "time end");
  assert(!/\bpts\b/.test(hud), "no member pts");
});

test("AT-TM-14 mesh τ uses W1 1-minute helper", () => {
  assert(app.includes("tauYearsWhatIf"), "now τ");
  assert(app.includes("tauYearsWhatIfAfterElapsed"), "elapsed τ");
  assert(!app.includes("fractionalT"), "not 1-hour floor");
  assert(app.includes("WHATIF_SESSION_KEY") || app.includes("saveWhatIfSession"), "session share");
});

console.log(`\n${n} tests passed`);
