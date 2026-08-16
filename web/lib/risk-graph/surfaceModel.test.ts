import assert from "node:assert/strict";
import {
  computeSurfaceSheet,
  evaluatePnlAtSpot,
  legsFromRelative,
  sampleSheet,
} from "./surfaceModel";
import { relativeShape, batmanDefaultShorts } from "../options-lab/designRelativeShape";

const iv = 0.2;
const tau = 3 / 365.25;
const spot = 100;

{
  const shape = relativeShape({
    strategy_template: "batman",
    wing_width: 4,
    short_gap: batmanDefaultShorts(4),
    trade_side: "buy",
    placement: "atm",
  });
  const legs = legsFromRelative(shape.legs, spot, tau, iv);
  const sheet = computeSurfaceSheet(legs, {
    spot,
    nx: 41,
    nt: 9,
    quality: "sticky_cli",
    ivSource: "cli",
  });
  const nowRow = sheet.pnlGrid[0];
  const mid = nowRow[Math.floor(nowRow.length / 2)];
  const left = nowRow[Math.floor(nowRow.length * 0.28)];
  const right = nowRow[Math.floor(nowRow.length * 0.72)];
  assert.ok(left > mid && right > mid, "batman now-slice has two ears");
  const atSpot = evaluatePnlAtSpot(legs, spot, tau);
  const sampled = sampleSheet(sheet, spot, tau);
  assert.ok(sampled != null);
  assert.ok(Math.abs(sampled! - atSpot) < 80, "sample matches evaluate");
}

{
  const shape = relativeShape({
    strategy_template: "butterfly",
    placement: "atm",
    wing_width: 4,
    trade_side: "buy",
  });
  const legs = legsFromRelative(shape.legs, spot, tau, iv);
  const z = evaluatePnlAtSpot(legs, spot, tau);
  assert.ok(Math.abs(z) < 50, "T+0 P&L near zero when premium = mark");
}

console.log("surfaceModel.test.ts ok");
