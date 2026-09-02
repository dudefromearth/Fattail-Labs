/**
 * LIM4 glow/annotation hooks — opt-in. Frozen path must not feel them.
 *   npx --yes tsx lib/options-lab/templates/gex.limLink.test.ts
 */
import {
  gexAnnotationMarks,
  gexSpotGlowCss,
  gexSpotLineTopPct,
} from "./gex";

function assert(c: unknown, m: string): void {
  if (!c) throw new Error(`FAIL: ${m}`);
}

assert(gexSpotGlowCss(undefined) == null, "absent link → no glow");
assert(gexSpotGlowCss(null) == null, "null link → no glow");
assert(gexSpotGlowCss({}) == null, "empty link → no glow");
assert(gexSpotGlowCss({ spotGlow: false }) == null, "spotGlow false → no glow");
const on = gexSpotGlowCss({ spotGlow: true });
assert(on != null && on.color === "#0a84ff", "LIM composition glow identity");

assert(gexAnnotationMarks(undefined).ticks.length === 0, "ann absent");
assert(gexAnnotationMarks({}).cog == null, "ann default off");
assert(gexAnnotationMarks({ showAnnotations: false }).ticks.length === 0, "flag false");

const ann = gexAnnotationMarks({
  showAnnotations: true,
  spotPrice: 5000,
  centrePts: 5,
  crossings: [
    { lo: 4990, hi: 5010 },
    { lo: 5050, hi: 5060 },
  ],
});
assert(ann.cog === 5005, "COG = spot + centrePts");
assert(ann.ticks.join(",") === "4990,5010,5050,5060", "ticks at lo and hi");
assert(!ann.ticks.includes(5000), "AT-LIM20 no midpoint 5000");
assert(!ann.ticks.includes((4990 + 5010) / 2), "AT-LIM20 no (lo+hi)/2");

const top = gexSpotLineTopPct(5000, [5100, 5000, 4900]);
assert(top === 50, "spot glides to 50% on this ladder");
const above = gexSpotLineTopPct(5050, [5100, 5000, 4900]);
assert(above != null && above < 50, "higher price is toward the top (desc strikes)");
const a = gexSpotLineTopPct(5001, [5020, 5000, 4980]);
const b = gexSpotLineTopPct(5000, [5020, 5000, 4980]);
assert(a != null && b != null && a !== b, "spot line glides; 5001 ≠ 5000");

console.log("gex.limLink.test.ts ok");
