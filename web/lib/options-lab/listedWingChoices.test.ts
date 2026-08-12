/**
 *   npx --yes tsx lib/options-lab/listedWingChoices.test.ts
 */

import {
  listedWingChoices,
  snapWidthToListed,
} from "./listedStrikes";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    n += 1;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

console.log("listedWingChoices OPF/symbol-aware");

test("SPX 5-pt grid → only multiples of 5, never 21/22", () => {
  const listed: number[] = [];
  for (let s = 7600; s <= 7900; s += 5) listed.push(s);
  const choices = listedWingChoices(7730, listed, 20);
  assert(choices.length > 0, "has choices");
  assert(choices.includes(5), "5");
  assert(choices.includes(20), "20");
  assert(!choices.includes(21), "no 21");
  assert(!choices.includes(22), "no 22");
  assert(
    choices.every((w) => Math.abs(w / 5 - Math.round(w / 5)) < 1e-9),
    "all multiples of 5",
  );
});

test("2.50-pt product grid", () => {
  const listed: number[] = [];
  for (let s = 100; s <= 200; s += 2.5) listed.push(s);
  const choices = listedWingChoices(150, listed, 12);
  assert(choices.includes(2.5), "2.5");
  assert(choices.includes(5), "5");
  assert(choices.includes(7.5), "7.5");
  assert(!choices.includes(3), "no 3");
});

test("snapWidthToListed refuses non-grid prefer", () => {
  const listed: number[] = [];
  for (let s = 7600; s <= 7900; s += 5) listed.push(s);
  assert(snapWidthToListed(20, 7730, listed) === 20, "exact 20");
  assert(snapWidthToListed(21, 7730, listed) === 25, "21→25");
  assert(snapWidthToListed(22, 7730, listed) === 25, "22→25");
  assert(snapWidthToListed(18, 7730, listed) === 20, "18→20");
});

console.log(`\n${n} tests passed`);
