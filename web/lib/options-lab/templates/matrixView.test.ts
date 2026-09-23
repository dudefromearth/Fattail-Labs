/**
 *   npx --yes tsx lib/options-lab/templates/matrixView.test.ts
 */
import {
  horizontalColumnHoverClass,
  parseMatrixView,
  strikesLeftToRight,
  supportsMatrixView,
} from "./matrixView";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

assert(supportsMatrixView("sym-fly"), "AF");
assert(supportsMatrixView("bw-fly"), "bw");
assert(supportsMatrixView("vertical"), "vertical");
assert(!supportsMatrixView("width-fit"), "not width-fit");
assert(!supportsMatrixView("lim"), "not lim");
assert(parseMatrixView("horizontal") === "horizontal", "horiz");
assert(parseMatrixView("vertical") === "vertical", "vert");
assert(parseMatrixView("sideways") === "vertical", "bad → vertical");
{
  const asc = strikesLeftToRight([{ strike: 7800 }, { strike: 7700 }, { strike: 7750 }]);
  assert(asc.map((r) => r.strike).join(",") === "7700,7750,7800", "L→R increasing");
}
assert(
  horizontalColumnHoverClass(true, "head").includes("scale-[1.08]"),
  "hover scale",
);
assert(
  horizontalColumnHoverClass(true, "cell").includes("px-[5px]"),
  "hover pad",
);
assert(
  horizontalColumnHoverClass(true, "head").includes("5ch+10px"),
  "hover box fits strike + pad",
);
assert(
  horizontalColumnHoverClass(true, "head").includes("whitespace-nowrap"),
  "strike does not wrap",
);
assert(
  !horizontalColumnHoverClass(false, "cell").includes("scale-[1.08]"),
  "idle no scale",
);

console.log("ok  matrixView");
