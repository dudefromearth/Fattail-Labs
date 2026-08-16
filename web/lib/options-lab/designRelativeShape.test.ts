/**
 * Drag-drop relative shape must match the selected strategy.
 * Batman with gap === width is a condor — that default is forbidden.
 */

import assert from "node:assert/strict";
import { expirationPnLDollars } from "./riskPayoff";
import {
  batmanDefaultShorts,
  relativeShape,
  type RelativeShape,
} from "./designRelativeShape";
import type { StrategyConfig } from "@/lib/strategyPacks";

function pnl(shape: RelativeShape, x: number): number {
  return expirationPnLDollars(x, shape.legs, shape.debit);
}

function localMaxima(shape: RelativeShape, xs: number[]): number[] {
  const ys = xs.map((x) => pnl(shape, x));
  const peaks: number[] = [];
  for (let i = 1; i < xs.length - 1; i++) {
    if (ys[i] > ys[i - 1] && ys[i] > ys[i + 1]) peaks.push(xs[i]);
  }
  return peaks;
}

function plateau(shape: RelativeShape, a: number, b: number, step = 5): boolean {
  const y0 = pnl(shape, a);
  for (let x = a; x <= b; x += step) {
    if (Math.abs(pnl(shape, x) - y0) > 1) return false;
  }
  return true;
}

{
  const w = 4;
  assert.equal(batmanDefaultShorts(w), 8);
  const bat = relativeShape({
    strategy_template: "batman",
    wing_width: w,
    short_gap: batmanDefaultShorts(w),
    trade_side: "buy",
    placement: "atm",
  } as StrategyConfig);
  const condor = relativeShape({
    strategy_template: "condor",
    wing_width: w,
    short_gap: w,
    option_right: "call",
    trade_side: "buy",
  } as StrategyConfig);
  const peaks = localMaxima(bat, [60, 70, 80, 90, 100, 110, 120, 130, 140]);
  assert.deepEqual(peaks, [80, 120], `batman peaks ${peaks}`);
  assert.ok(pnl(bat, 100) < pnl(bat, 80), "batman valley at ATM");
  assert.ok(plateau(condor, 90, 110), "condor plateau");
  assert.notEqual(Math.round(pnl(bat, 100)), Math.round(pnl(condor, 100)));
}

{
  const collapsed = relativeShape({
    strategy_template: "batman",
    wing_width: 4,
    short_gap: 4,
    trade_side: "buy",
  } as StrategyConfig);
  const condor = relativeShape({
    strategy_template: "condor",
    wing_width: 4,
    short_gap: 4,
    option_right: "call",
    trade_side: "buy",
  } as StrategyConfig);
  assert.equal(
    Math.round(pnl(collapsed, 100)),
    Math.round(pnl(condor, 100)),
    "gap===width batman still equals condor — default must not use that gap",
  );
}

{
  const fly = relativeShape({
    strategy_template: "butterfly",
    placement: "atm",
    wing_width: 4,
    trade_side: "buy",
  } as StrategyConfig);
  assert.deepEqual(localMaxima(fly, [70, 80, 90, 100, 110, 120, 130]), [100]);
}

{
  const call = relativeShape({
    strategy_template: "butterfly",
    placement: "otm",
    option_right: "call",
    wing_width: 4,
    trade_side: "buy",
  } as StrategyConfig);
  const put = relativeShape({
    strategy_template: "butterfly",
    placement: "otm",
    option_right: "put",
    wing_width: 4,
    trade_side: "buy",
  } as StrategyConfig);
  assert.ok(localMaxima(call, [80, 90, 100, 110, 120, 130, 140])[0] > 100);
  assert.ok(localMaxima(put, [60, 70, 80, 90, 100, 110, 120])[0] < 100);
}

{
  const vert = relativeShape({
    strategy_template: "vertical",
    option_right: "call",
    wing_width: 4,
    trade_side: "buy",
  } as StrategyConfig);
  assert.ok(pnl(vert, 130) > pnl(vert, 100), "long call vertical rises");
}

{
  const smile = relativeShape({
    strategy_template: "straddle",
    trade_side: "buy",
  } as StrategyConfig);
  assert.ok(pnl(smile, 100) < pnl(smile, 70));
  assert.ok(pnl(smile, 100) < pnl(smile, 130));
}

{
  const ic = relativeShape({
    strategy_template: "iron_condor",
    wing_width: 4,
    short_gap: 4,
    trade_side: "buy",
  } as StrategyConfig);
  assert.ok(plateau(ic, 90, 110));
}

console.log("designRelativeShape.test.ts ok");
