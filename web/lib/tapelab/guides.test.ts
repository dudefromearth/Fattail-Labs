import assert from "node:assert/strict";
import { TAPELAB_TOOLS } from "./catalog";
import { readTapeGuide, TAPE_GUIDE_IDS, tapeGuideId } from "./guides";

for (const id of TAPE_GUIDE_IDS) {
  const md = readTapeGuide(id);
  assert.equal(md.startsWith("# "), true, `${id} starts with a title`);
  assert.equal(md.includes("\n| --- |"), true, `${id} has a table`);
  assert.equal(md.includes("[^"), true, `${id} has a footnote`);
  assert.equal(tapeGuideId(id), id);
  assert.equal(tapeGuideId(`${id}.md`), id);
}

assert.deepEqual(
  TAPELAB_TOOLS.map((tool) => tool.id),
  [...TAPE_GUIDE_IDS],
);
assert.equal(tapeGuideId("../secrets"), null);
assert.equal(tapeGuideId("studies"), null);
assert.equal(tapeGuideId("health/../../.env"), null);
assert.equal(tapeGuideId(""), null);

console.log("tapelab guides: ok");
