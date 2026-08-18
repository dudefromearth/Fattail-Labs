import assert from "node:assert/strict";
import { DEFAULT_TAPE_PREFS, parseTapePrefs } from "./timeOrthoTapePrefs";

{
  const d = parseTapePrefs({});
  assert.equal(d.axisSide, "right");
  assert.equal(d.axisContent, "both");
  assert.equal(d.candleKind, "hloc");
  assert.equal(d.labelAlign, "middle");
  assert.equal(d.noonMin, 12 * 60);
  assert.equal(d.closeSplitMin, 14 * 60 + 30);
}

{
  const p = parseTapePrefs({
    axisSide: "both",
    axisContent: "strikes",
    candleKind: "line_close",
    labelAlign: "top",
  });
  assert.equal(p.axisSide, "both");
  assert.equal(p.axisContent, "strikes");
  assert.equal(p.candleKind, "line_close");
  assert.equal(p.labelAlign, "top");
  assert.equal(p.noonMin, DEFAULT_TAPE_PREFS.noonMin);
}
