/**
 *   npx --yes tsx lib/options-lab/tmChainAtT.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  marksFromChain,
  snapToChainContext,
} from "./tmChainAtT";

const ctx = snapToChainContext(
  {
    captured_at: "2026-08-26T13:30:00-04:00",
    expiration: "2026-08-26",
    generation: {
      spot: 6400,
      as_of: "2026-08-26T13:30:00-04:00",
      content_hash: "g1",
      rows: [
        {
          strike: 6400,
          call: { iv: 0.14, delta: 0.5, mid: 12 },
          put: { iv: 0.15, delta: -0.5, mid: 11 },
        },
      ],
    } as never,
  },
  { symbol: "SPX", viewSide: "call", wings: 25 },
);
assert.ok(ctx);
assert.equal(ctx?.spot, 6400);
assert.equal(ctx?.contracts.get("call:6400")?.iv, 0.14);
const marks = marksFromChain(ctx!, "2026-08-26");
assert.equal(marks[0]?.iv_source, "generation");
assert.ok(Number(marks[0]?.iv) > 0);

const here = dirname(fileURLToPath(import.meta.url));
const heatmap = readFileSync(
  join(here, "../../components/options-lab/HeatmapControlsColumn.tsx"),
  "utf8",
);
assert.match(heatmap, /id: "replay"/);
assert.match(heatmap, /id: "average"/);
assert.doesNotMatch(
  heatmap,
  /id: "replay".*Average|Average.*collapsed/,
);
const panel = readFileSync(
  join(here, "../../components/options-lab/HeatmapChainPanel.tsx"),
  "utf8",
);
assert.match(panel, /wfTime === "replay"/);
assert.match(panel, /wfTime !== "average"/);
assert.match(panel, /TimeMachineChrome/);
assert.doesNotMatch(panel, /new WebSocket/);
const surface = readFileSync(
  join(here, "../../components/options-lab/surface/SurfaceApp.tsx"),
  "utf8",
);
assert.match(surface, /useChainAtPlayhead/);
assert.match(surface, /marksFromChain/);
assert.match(surface, /TimeMachineChrome/);
assert.doesNotMatch(surface, /new WebSocket/);
assert.doesNotMatch(surface, /massive\.com/i);

const host = readFileSync(join(here, "tmHost.ts"), "utf8");
assert.doesNotMatch(host, /\bheldDay\s*[:=]/);

console.log("tmChainAtT.test.ts ok");
