/**
 *   npx --yes tsx lib/options-lab/analyzerPip.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_PIP,
  PIP_SIZE_PX,
  asSize,
  pipCornerClass,
} from "./analyzerPip";

assert.equal(DEFAULT_PIP.corner, "ur");
assert.equal(DEFAULT_PIP.on, false);
assert.equal(DEFAULT_PIP.size, "md");
assert.equal(PIP_SIZE_PX.sm.w, 336);
assert.equal(PIP_SIZE_PX.sm.h, 252);
assert.equal(PIP_SIZE_PX.md.w, Math.round(PIP_SIZE_PX.sm.w * 1.5));
assert.equal(PIP_SIZE_PX.md.h, Math.round(PIP_SIZE_PX.sm.h * 1.5));
assert.equal(PIP_SIZE_PX.lg.w, PIP_SIZE_PX.sm.w * 2);
assert.equal(PIP_SIZE_PX.lg.h, PIP_SIZE_PX.sm.h * 2);
assert.equal(asSize("lg"), "lg");
assert.equal(asSize("nope"), "md");
assert.match(pipCornerClass("ur"), /right-2/);
assert.match(pipCornerClass("ul"), /left-2/);

const here = dirname(fileURLToPath(import.meta.url));
const analyzer = readFileSync(
  join(here, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
  "utf8",
);
assert.match(analyzer, /analyzer-pip-toggle/, "PiP toggle next to Autofit");
assert.match(analyzer, /AnalyzerSurfacePip/, "ISO PiP mounted");

const pip = readFileSync(
  join(here, "../../components/options-lab/AnalyzerSurfacePip.tsx"),
  "utf8",
);
assert.match(pip, /applyFactoryView\("iso"\)/, "ISO pose");
assert.match(pip, /windowLift:\s*false/, "frame ISO in the PiP, not the window");
assert.match(pip, /setSurfaceLocked\(false\)/, "drag and scroll");
assert.match(pip, /analyzer-pip-dock-\$\{c\}/, "corner squares on the PiP");
assert.match(pip, /#ef4444/, "active corner red");
assert.match(pip, /#ffffff/, "idle corners white");
assert.match(pip, /surfaceAutofitWindow/, "same Surface Autofit window");
assert.match(pip, /SURFACE_PAD_FRAC/, "same Autofit pad as Surface");
assert.match(pip, /strike:\s*\{\s*visible:\s*false/, "no strike plane");
assert.match(pip, /SURFACE_VALUE_PLANE_OPACITY_DEFAULT/, "$0 plane");
assert.doesNotMatch(pip, /Auto-fit/, "no Autofit on the PiP");

console.log("analyzerPip.test.ts ok");
