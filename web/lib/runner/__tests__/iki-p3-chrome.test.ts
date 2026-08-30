/**
 * IKI-P3 — chrome characterization (B3 Yes).
 *   npx --yes tsx lib/runner/__tests__/iki-p3-chrome.test.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { get, tilesHash } from "../registry";
import { run } from "../run";
import {
  HEATMAP_TEMPLATE_ID,
  HEATMAP_TEMPLATE_VERSION,
} from "../templates/heatmap";
import { RECORDED_GENERATIONS } from "./fixtures";

const root = join(import.meta.dirname, "../../..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

const page = read("app/app/iki/runner/page.tsx");
const rail = read("app/app/iki/runner/IkiRunnerRail.tsx");
const host = read("lib/runner/sinks/render.ts");
const chrome = read("components/iki/IkiSuiteChrome.tsx");
const factory = read("app/app/iki/factory/page.tsx");

if (!page.includes("IkiRunnerRail")) {
  throw new Error("IKI runner page must compose IkiRunnerRail");
}
if (!page.includes("workspace")) {
  throw new Error("IKI runner page must use IkiSuiteChrome workspace");
}
if (!page.includes("HeatmapRenderHost")) {
  throw new Error("IKI runner page must still mount HeatmapRenderHost");
}
if (page.includes("runner-template-selector")) {
  throw new Error("page must not bring back the ad-hoc selector");
}
if (host.includes("runner-template-selector")) {
  throw new Error("HeatmapRenderHost must not render runner-template-selector");
}
if (!host.includes("hover:ring-1")) {
  throw new Error("tiles must have hover chrome");
}
if (!host.includes("bg-[#16161c]") && !host.includes("sticky left-0")) {
  throw new Error("strike column must be a visible sticky panel");
}
if (!rail.includes('data-testid="iki-runner-rail"')) {
  throw new Error("rail testid missing");
}
if (!rail.includes("@/components/options-lab/inspectorChrome")) {
  throw new Error("rail must import inspectorChrome as-is");
}
if (!chrome.includes("workspace")) {
  throw new Error("IkiSuiteChrome must offer workspace");
}
if (factory.includes("workspace")) {
  throw new Error("Factory must not enable workspace");
}

const tpl = get(HEATMAP_TEMPLATE_ID, HEATMAP_TEMPLATE_VERSION);
const ctx = RECORDED_GENERATIONS[0].ctx;
const a = tilesHash(
  run(tpl, { chain: ctx, content_hash: ctx.contentHash }, {}),
);
const b = tilesHash(
  run(tpl, { chain: ctx, content_hash: ctx.contentHash }, {}),
);
if (a !== b) throw new Error("through-run tilesHash changed");

console.log("ok  IKI-P3 chrome: rail + workspace; selector gone; hashes stable");
console.log("ok  through-run", a);
