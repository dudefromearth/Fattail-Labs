/**
 * Frozen `gex` template snapshot — LIM4 invariant 16.
 *   npx --yes tsx lib/options-lab/templates/gex.frozenSnapshot.ts
 *
 * Captures: (1) HeatmapChainPanel frozen profile JSX block
 *           (2) gex.ts frozen API surface (through gexTemplate)
 *           (3) fixture profile JSON
 * Does not render LIM. Does not import glow hooks.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contractKey, type LadderFull } from "@/lib/chainLadderApi";
import { chainContextFromLadder } from "./chainContext";
import {
  buildGexProfile,
  fmtGexAxis,
  fmtGexProfile,
  gexHorizonExpiration,
  gexProfileScale,
  gexSidePeaks,
  gexTemplate,
  gexValueToPlotY,
} from "./gex";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "../../../..");
const outDir = join(
  repo,
  "agents/p-options-lab-heatmap-lim/evidence/lim4-frozen-gex",
);

function sha1(s: string): string {
  return createHash("sha1").update(s).digest("hex");
}

function extractPanelFrozenBlock(src: string): string {
  const start = src.indexOf('data-testid="heatmap-gex-profile"');
  if (start < 0) throw new Error("frozen gex profile testid missing");
  const end = src.indexOf(') : tpl.layout === "quadrant"');
  if (end < 0) throw new Error("frozen gex block end marker missing");
  return src.slice(start, end);
}

function extractGexFrozenSource(src: string): string {
  const end = src.indexOf("export const gexTemplate");
  if (end < 0) throw new Error("gexTemplate missing");
  const after = src.indexOf("};", end);
  return src.slice(0, after + 2);
}

const panelSrc = readFileSync(
  join(here, "../../../components/options-lab/HeatmapChainPanel.tsx"),
  "utf8",
);
const gexSrc = readFileSync(join(here, "gex.ts"), "utf8");
const panelBlock = extractPanelFrozenBlock(panelSrc);
const gexFrozenSrc = extractGexFrozenSource(gexSrc);

const ladder: LadderFull = {
  underlier: "SPX",
  expiration: "2026-12-18",
  side: "both",
  dual_side: true,
  spot: 7700,
  wings: 50,
  strike_step: 5,
  fields: [],
  row_count: 4,
  content_hash: "h1",
  rows: [
    { strike: 7700, side: "call", gamma: 0.001, open_interest: 1000, is_spot: true },
    { strike: 7700, side: "put", gamma: 0.001, open_interest: 800, is_spot: true },
    { strike: 7710, side: "call", gamma: 0.0008, open_interest: 500 },
    { strike: 7710, side: "put", gamma: 0.0009, open_interest: 400 },
  ],
};
const ctx = chainContextFromLadder("SPX", ladder);

const fixture = {
  gex_all: buildGexProfile(ctx, "gex_all"),
  gex_net: buildGexProfile(ctx, "gex_net"),
  gex_abs: buildGexProfile(ctx, "gex_abs"),
  scale_all: gexProfileScale(buildGexProfile(ctx, "gex_all"), "gex_all"),
  scale_net: gexProfileScale(buildGexProfile(ctx, "gex_net"), "gex_net"),
  peaks: gexSidePeaks(buildGexProfile(ctx, "gex_all")),
  fmt: fmtGexProfile(1.25e9),
  axis: fmtGexAxis(-2.5e9),
  plotY: [
    gexValueToPlotY(0, 100, 40, 200),
    gexValueToPlotY(100, 100, 40, 200),
    gexValueToPlotY(-100, 100, 40, 200),
  ],
  horizon: gexHorizonExpiration({
    tradeExpiration: "2026-12-18",
    listedExpirations: ["2026-12-18"],
  }),
  template: {
    id: gexTemplate.id,
    label: gexTemplate.label,
    layout: gexTemplate.layout,
    valueModes: gexTemplate.valueModes,
    defaultValueMode: gexTemplate.defaultValueMode,
  },
  keys: Object.keys(contractKey("call", 7700)),
};

const snapshot = {
  commitHint: "e1c1ef1",
  panelBlockSha1: sha1(panelBlock),
  gexFrozenSrcSha1: sha1(gexFrozenSrc),
  fixtureSha1: sha1(JSON.stringify(fixture)),
  panelBlock,
  gexFrozenSrc,
  fixture,
};

mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "snapshot.json");
writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + "\n");
writeFileSync(join(outDir, "panel-block.tsx.txt"), panelBlock);
writeFileSync(join(outDir, "gex-frozen.ts.txt"), gexFrozenSrc);
writeFileSync(join(outDir, "fixture.json"), JSON.stringify(fixture, null, 2) + "\n");
writeFileSync(
  join(outDir, "SHA1.txt"),
  [
    `panelBlock ${snapshot.panelBlockSha1}`,
    `gexFrozenSrc ${snapshot.gexFrozenSrcSha1}`,
    `fixture ${snapshot.fixtureSha1}`,
  ].join("\n") + "\n",
);

const goldPath = join(outDir, "SHA1-e1c1ef1-BEFORE.txt");
let gold = "";
try {
  gold = readFileSync(goldPath, "utf8").trim();
} catch {
  gold = "";
}
const now = [
  `panelBlock ${snapshot.panelBlockSha1}`,
  `gexFrozenSrc ${snapshot.gexFrozenSrcSha1}`,
  `fixture ${snapshot.fixtureSha1}`,
].join("\n");
if (gold && gold !== now) {
  console.error("FROZEN GEX DIFF (expected empty):\n--- before ---\n" + gold + "\n--- after ---\n" + now);
  process.exit(1);
}
console.log("frozen gex snapshot written");
console.log(now);
if (gold) console.log("diff vs e1c1ef1 BEFORE: empty");
