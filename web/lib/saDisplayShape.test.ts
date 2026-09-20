/**
 *   npx --yes tsx lib/saDisplayShape.test.ts
 */
import assert from "node:assert/strict";
import { formatByShape, snapByShape } from "./saDisplayShape";
import type { DisplayShape } from "./symbology/types";

const zb: DisplayShape = {
  kind: "fractional",
  precision: 0,
  fraction: { denominator: 32, separator: "'", width: 2 },
};
assert.equal(formatByShape(115.5, zb, 0.03125), "115'16");
assert.equal(snapByShape(115.5, zb, 0.03125), 115.5);

const es: DisplayShape = { kind: "decimal", precision: 2 };
assert.equal(formatByShape(7687.11, es, 0.25), "7687.00");
assert.equal(snapByShape(7687.11, es, 0.25), 7687);

console.log("saDisplayShape.test.ts ok");
