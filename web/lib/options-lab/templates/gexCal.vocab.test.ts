/**
 * AT-GC7 — no vendor string in Term Mass sources.
 *   npx --yes tsx lib/options-lab/templates/gexCal.vocab.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const here = dirname(fileURLToPath(import.meta.url));
const files = [
  join(here, "gexCal.ts"),
  join(here, "registry.ts"),
  join(here, "../../../components/options-lab/HeatmapGexCalendar.tsx"),
];

for (const f of files) {
  let src = "";
  try {
    src = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  assert(!/ITMatrix/i.test(src), `AT-GC7 ${f}`);
}

console.log("gexCal.vocab.test.ts PASS");
