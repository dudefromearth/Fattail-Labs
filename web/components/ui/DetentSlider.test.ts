/**
 *   npx --yes tsx components/ui/DetentSlider.test.ts
 */
import { stopIndex } from "./DetentSlider";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

assert(stopIndex([4, 8, 16, 32], 8) === 1, "8");
assert(stopIndex([10, 20, 50, 100], 100) === 3, "100");
assert(stopIndex([10, 20, 50, 100], 15) === 0, "nearest 10");
assert(stopIndex([4, 8, 16, 32], 40) === 3, "clamp high");

console.log("ok  DetentSlider stops");
