/**
 * AT-LIM23 — rendered strings and label constants, not comments.
 *   npx --yes tsx lib/options-lab/templates/lim.vocab.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LIM_AT23_PHRASES,
  LIM_AT23_WORDS,
  LIM_AT23_ALLOWED,
  LIM_AXIS_X,
  LIM_AXIS_Y,
  LIM_LABEL_COMPRESSION,
  LIM_LABEL_EXPANSION,
  LIM_LABEL_WEIGHT_ABOVE,
  LIM_LABEL_WEIGHT_BELOW,
  LIM_CHROME_1,
  LIM_CHROME_2,
  LIM_CHROME_3_HOLE,
  LIM_CHROME_4,
  LIM_MODE_LABEL,
  LIM_PICKER_LABEL,
  limChromeInfoLines,
  limChromeLine3,
  limNoScaleMessage,
  limNumericHeader,
  limStateLine,
} from "./limChrome";
import { HEATMAP_TEMPLATES } from "./registry";

function assert(c: unknown, m: string): void {
  if (!c) throw new Error(`FAIL: ${m}`);
}

function stringLiterals(src: string): string[] {
  const out: string[] = [];
  const re = /(["'`])(?:\\.|(?!\1)[\s\S])*?\1/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) out.push(m[0].slice(1, -1));
  return out;
}

function hasBanned(s: string): string | null {
  const lower = s.toLowerCase();
  for (const w of LIM_AT23_WORDS) {
    const re = new RegExp(`\\b${w}\\b`, "i");
    if (re.test(lower)) return w;
  }
  for (const p of LIM_AT23_PHRASES) {
    if (lower.includes(p)) return p;
  }
  return null;
}

const rendered: string[] = [
  LIM_PICKER_LABEL,
  LIM_MODE_LABEL,
  LIM_AXIS_X,
  LIM_AXIS_Y,
  LIM_LABEL_EXPANSION,
  LIM_LABEL_COMPRESSION,
  LIM_LABEL_WEIGHT_BELOW,
  LIM_LABEL_WEIGHT_ABOVE,
  LIM_CHROME_1,
  LIM_CHROME_2,
  LIM_CHROME_3_HOLE,
  LIM_CHROME_4,
  limChromeLine3(null),
  limChromeLine3("2026-09-01"),
  ...limChromeInfoLines(),
  limStateLine({ expiration: "2026-09-04", wings: 25, crossingCount: 0 }),
  limStateLine({ expiration: "2026-09-04", wings: 25, crossingCount: 3 }),
  limNumericHeader({
    x: -12.4,
    y: 61,
    magF: 80,
    crossingCount: 2,
    crossingProximity: 0.5,
  }),
  limNoScaleMessage("SPX"),
];

const lim = HEATMAP_TEMPLATES.find((t) => t.id === "lim");
assert(lim, "lim registered");
rendered.push(lim!.label, lim!.description, ...lim!.valueModes.map((m) => m.label));

assert(LIM_AT23_WORDS.length === 11, "AT-LIM23 no words dropped from v0.4.3 list");
assert(LIM_AT23_PHRASES.length === 5, "AT-LIM23 MSC outcome phrases present");
assert(LIM_AT23_ALLOWED.includes("expansion"), "AT-LIM23 expansion allowed");
assert(LIM_AT23_ALLOWED.includes("compression"), "AT-LIM23 compression allowed");

for (const s of rendered) {
  const hit = hasBanned(s);
  assert(!hit, `AT-LIM23 rendered "${s}" contains ${hit}`);
}

assert(!/intent|friction/i.test(LIM_PICKER_LABEL), "LIM35 picker");

const here = dirname(fileURLToPath(import.meta.url));
const files = [
  join(here, "limChrome.ts"),
  join(here, "lim.ts"),
  join(here, "../../../components/options-lab/HeatmapLimQuadrant.tsx"),
];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const lit of stringLiterals(src)) {
    if (f.endsWith("limChrome.ts") && (lit === "LIM_AT23_WORDS" || lit === "LIM_AT23_PHRASES")) {
      continue;
    }
    const hit = hasBanned(lit);
    if (!hit) continue;
    if (f.endsWith("limChrome.ts") && src.includes("LIM_AT23_WORDS")) {
      const inList = new RegExp(`LIM_AT23_(WORDS|PHRASES)[\\s\\S]*${hit}`);
      if (inList.test(src) && (lit === hit || LIM_AT23_PHRASES.includes(lit as (typeof LIM_AT23_PHRASES)[number]))) {
        continue;
      }
    }
    throw new Error(`AT-LIM23 literal in ${f}: "${lit}" (${hit})`);
  }
}

console.log("lim.vocab.test.ts ok");
