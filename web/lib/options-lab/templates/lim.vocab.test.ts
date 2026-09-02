/**
 * AT-LIM23 — rendered strings and label constants, not comments.
 *   npx --yes tsx lib/options-lab/templates/lim.vocab.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LIM_AT23_WORDS,
  LIM_AXIS_X,
  LIM_AXIS_Y,
  LIM_CHROME_1,
  LIM_CHROME_2,
  LIM_CHROME_3_HOLE,
  LIM_CHROME_4,
  LIM_MODE_LABEL,
  LIM_PICKER_LABEL,
  limChromeLine3,
  limChromeLines,
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
  return null;
}

const rendered: string[] = [
  LIM_PICKER_LABEL,
  LIM_MODE_LABEL,
  LIM_AXIS_X,
  LIM_AXIS_Y,
  LIM_CHROME_1,
  LIM_CHROME_2,
  LIM_CHROME_3_HOLE,
  LIM_CHROME_4,
  limChromeLine3(null),
  limChromeLine3("2026-09-01"),
  ...limChromeLines(null, "comfort"),
  ...limChromeLines("2026-09-01", "compact"),
  limStateLine({ expiration: "2026-09-04", wings: 25, crossingCount: 0 }, "comfort"),
  limStateLine({ expiration: "2026-09-04", wings: 25, crossingCount: 3 }, "comfort"),
];

const lim = HEATMAP_TEMPLATES.find((t) => t.id === "lim");
assert(lim, "lim registered");
rendered.push(lim!.label, lim!.description, ...lim!.valueModes.map((m) => m.label));

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
    if (f.endsWith("limChrome.ts") && lit === "LIM_AT23_WORDS") continue;
    if (LIM_AT23_WORDS.includes(lit as (typeof LIM_AT23_WORDS)[number])) {
      if (src.includes("LIM_AT23_WORDS")) continue;
    }
    const hit = hasBanned(lit);
    if (!hit) continue;
    if (f.endsWith("limChrome.ts") && src.includes("LIM_AT23_WORDS")) {
      const inList = new RegExp(`LIM_AT23_WORDS[\\s\\S]*${hit}`);
      if (inList.test(src) && lit === hit) continue;
    }
    throw new Error(`AT-LIM23 literal in ${f}: "${lit}" (${hit})`);
  }
}

console.log("lim.vocab.test.ts ok");
