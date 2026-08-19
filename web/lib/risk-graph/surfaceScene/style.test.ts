import assert from "node:assert/strict";
import { surfaceFillEnabled } from "./style";

assert.equal(surfaceFillEnabled("solid"), true);
assert.equal(surfaceFillEnabled("ghost"), false, "expired ghost has no fill");

console.log("surfaceScene/style.test.ts ok");
