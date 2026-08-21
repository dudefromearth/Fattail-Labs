/**
 * AT-WF8 / AT-WF9
 *   npx --yes tsx lib/options-lab/templates/widthFit.vocab.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FORBIDDEN_WIDTH_FIT_COPY,
  WIDTH_FIT_LEGEND,
  WIDTH_FIT_STATE_LABEL,
} from "./widthFit";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

assert(WIDTH_FIT_STATE_LABEL.no_reliable_fit === "No reliable fit yet", "AT-WF9");
assert(WIDTH_FIT_STATE_LABEL.unstable_surface === "Unstable Surface", "AT-WF9");
assert(WIDTH_FIT_LEGEND.includes("not directional signals"), "legend framing");
assert(!WIDTH_FIT_LEGEND.toLowerCase().includes("recommend a trade"), "no rec");

const here = dirname(fileURLToPath(import.meta.url));
const files = [
  join(here, "widthFit.ts"),
  join(here, "../../../components/options-lab/HeatmapChainPanel.tsx"),
  join(here, "../../../components/options-lab/HeatmapControlsColumn.tsx"),
];
for (const f of files) {
  let text = "";
  try {
    text = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  for (const bad of FORBIDDEN_WIDTH_FIT_COPY) {
    if (bad === "Opportunity" && text.includes("FORBIDDEN")) continue;
    const asCopy = text.includes(`"${bad}"`) || text.includes(`'${bad}'`);
    if (f.endsWith("widthFit.ts") && text.includes(bad)) {
      assert(
        text.includes("FORBIDDEN_WIDTH_FIT_COPY"),
        "forbidden list lives in the module",
      );
      continue;
    }
    if (asCopy && !f.endsWith("widthFit.ts")) {
      throw new Error(`FAIL: forbidden copy "${bad}" in ${f}`);
    }
  }
  if (f.endsWith("HeatmapChainPanel.tsx") || f.endsWith("HeatmapControlsColumn.tsx")) {
    if (text.includes("width_fit") || text.includes("Width Fit")) {
      assert(!/\bbest\b/i.test(text.match(/widthFit|Width Fit[\s\S]{0,400}/)?.[0] ?? ""), "no best");
    }
  }
}

console.log("widthFit.vocab.test.ts ok");
