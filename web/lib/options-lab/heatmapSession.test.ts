/**
 *   npx --yes tsx lib/options-lab/heatmapSession.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HEATMAP_SESSION_KEY,
  parseHeatmapSession,
  readHeatmapSession,
  writeHeatmapSession,
} from "./heatmapSession";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

const mem = new Map<string, string>();
const store = {
  getItem(k: string) {
    return mem.get(k) ?? null;
  },
  setItem(k: string, v: string) {
    mem.set(k, v);
  },
};

assert(parseHeatmapSession(null) == null, "null");
assert(parseHeatmapSession({ symbol: "SPX" }) == null, "needs template");
const ok = parseHeatmapSession({
  symbol: "spy",
  expiration: "2026-08-28",
  side: "put",
  wings: 25,
  templateId: "width-fit",
  valueMode: "width_fit",
  rocSensitivity: 40,
  bwStrikeCount: 3,
  bwWingSide: "furthest",
  widthFitWeights: { debit_efficiency: 1 },
  widthFitExpanded: true,
  wfIface: "ranking",
  wfTime: "average",
  wfWindow: 50,
  cacheBudgetMib: 16,
});
assert(ok?.symbol === "SPY", "symbol upper");
assert(ok?.templateId === "width-fit", "tpl");
assert(ok?.wfIface === "ranking" && ok.wfTime === "average", "wf");
const replaySess = parseHeatmapSession({
  symbol: "SPX",
  templateId: "width-fit",
  valueMode: "width_fit",
  wfTime: "replay",
});
assert(replaySess?.wfTime === "replay", "Width Fit Replay is its own time mode");
assert(ok?.wfWindow === 50 && ok.cacheBudgetMib === 16, "stops");
assert(ok?.side === "put" && ok.bwWingSide === "furthest", "side/bw");
const vert = parseHeatmapSession({
  symbol: "SPX",
  templateId: "vertical",
  valueMode: "pct_change",
  verticalKind: "credit",
});
assert(vert?.verticalKind === "credit", "vertical kind with %");
assert(vert?.valueMode === "pct_change", "vertical %");

writeHeatmapSession(ok!, store);
const round = readHeatmapSession(store);
assert(round?.expiration === "2026-08-28", "roundtrip exp");
assert(store.getItem(HEATMAP_SESSION_KEY)?.includes("width-fit"), "key");

const badMode = parseHeatmapSession({
  symbol: "SPX",
  templateId: "gex",
  valueMode: "debit",
});
assert(badMode?.valueMode === "gex_all", "invalid mode → template default");

const controls = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../components/options-lab/HeatmapControlsColumn.tsx",
  ),
  "utf8",
);
assert(!controls.includes("runner-cache-budget"), "Cache slider is gone");
assert(controls.includes("heatmap-tm-hold"), "horizon readout is present");
assert(!/Instant Replay/i.test(controls), "member copy is Time Machine");
assert(!/from the open/.test(controls), "hold line is not an open-bell story");

console.log("ok  heatmapSession");
