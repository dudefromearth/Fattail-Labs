import assert from "node:assert/strict";
import {
  captureCaption,
  captureFilename,
  journalDateYmd,
  shouldExitTimeOrtho,
} from "./timeOrthoEgg";
import { nyWallToUtcMs } from "./timeOrthoSession";

assert.equal(shouldExitTimeOrtho(false, 0), false);
assert.equal(shouldExitTimeOrtho(true, 1), false);
assert.equal(shouldExitTimeOrtho(true, 0), true);
assert.equal(shouldExitTimeOrtho(false, 2), false);

{
  const noon = nyWallToUtcMs(2026, 8, 18, 12, 0);
  assert.equal(journalDateYmd(noon), "2026-08-18");
}

assert.equal(captureFilename("SPX", "2026-08-18"), "t-ortho-spx-2026-08-18.png");

{
  const text = captureCaption({
    symbol: "SPX",
    dateYmd: "2026-08-18",
    positions: [{ label: "SPX short put vertical", notation: "-1 5600P / +1 5550P" }],
    note: "Trading day — a mark, not a forecast.",
  });
  assert.match(text, /T Ortho · SPX · 2026-08-18/);
  assert.match(text, /On the book: SPX short put vertical/);
  assert.doesNotMatch(text, /\bstrateg(?:y|ies)\b/i);
}

{
  const empty = captureCaption({
    symbol: "QQQ",
    dateYmd: "2026-08-18",
    positions: [],
  });
  assert.match(empty, /No position on the book/);
  assert.doesNotMatch(empty, /\bstrateg(?:y|ies)\b/i);
}

{
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const panel = fs.readFileSync(
    path.join(__dirname, "../../components/options-lab/surface/TimeOrthoEggPanel.tsx"),
    "utf8",
  );
  assert.match(panel, /surface-time-ortho-ai/);
  assert.doesNotMatch(panel, /Position List/);
  assert.doesNotMatch(panel, /This is your position sitting/);
  assert.doesNotMatch(panel, /surface-time-ortho-capture/);
}

console.log("timeOrthoEgg.test.ts ok");
