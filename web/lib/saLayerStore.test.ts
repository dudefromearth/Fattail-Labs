/**
 *   npx --yes tsx lib/saLayerStore.test.ts
 */
import assert from "node:assert/strict";
import { sectionForPart, SETTINGS_FIRST_SECTION, SETTINGS_SECTIONS } from "./saSettingsSections";
import {
  applyMode,
  defaultPrefs,
  houseDefaults,
  LAYER_REGISTRY,
  lawfulFields,
  partFromPointer,
  resetMode,
  resetPartToHouse,
  saveObjectDefault,
  prefsFromServerDoc,
  SA_SURFACE_SCHEMA,
  spanChipText,
  surfaceDoc,
} from "./saLayerStore";

const p = defaultPrefs();
assert.equal(p.mode, "morning");
assert.equal(p.visible.L3, false);
assert.equal(p.firstRunSeen, false);
assert.equal(LAYER_REGISTRY.find((L) => L.id === "LP")?.inDevelopment, true);
assert.equal(houseDefaults("entry").visible.L3, true);
assert.equal(houseDefaults("management").priceTf, "1h");
const entry = applyMode(p, "entry");
assert.equal(entry.visible.L3, true);
const reset = resetMode(entry);
assert.equal(reset.visible.L3, true);
assert.equal(
  spanChipText({ floor: "2026-09-17", ceiling: "2026-09-18" }),
  "since Sep 17",
);
assert.equal(
  spanChipText({ floor: "2026-09-17", truncated: true }),
  "since Sep 17 (truncated)",
);
assert.equal(p.priceTf, "5m");
assert.equal(p.priceLookbackDays, 1);
assert.deepEqual(lawfulFields("range"), ["priceLookbackDays"]);
assert.deepEqual(lawfulFields("axis"), [
  "axis",
  "lastPriceOn",
  "lastPriceColor",
  "hiLoOn",
  "hiColor",
  "loColor",
]);
assert.ok(lawfulFields("L0").includes("axisFont"));
assert.ok(lawfulFields("L0").includes("vertGridOn"));
assert.ok(lawfulFields("L1").includes("candleUp"));
assert.ok(lawfulFields("L1").includes("colorByPrevClose"));
assert.equal(p.canvasBg, "#131722");
assert.equal(p.gridColor, "#ffffff");
assert.equal(p.gridOpacity, 0.08);
assert.equal(partFromPointer({ x: 400, y: 200, w: 800, h: 400, axis: "left" }), "L0");
assert.equal(p.profileWidthFrac, 0.62);
assert.equal(p.profileOpacity, 0.42);
assert.ok(lawfulFields("sessions").includes("sessionLinesOn"));
assert.ok(lawfulFields("sessions").includes("chartTimeZone"));
assert.equal(lawfulFields("L0").includes("sessionLinesOn"), false);
assert.equal(p.sessionLinesOn, true);
assert.equal(p.chartTimeZone, "exchange");
assert.deepEqual(lawfulFields("L2"), [
  "visible.L2",
  "orientation",
  "profileWidthFrac",
  "profileOpacity",
  "profileColor",
  "profileRowsLayout",
  "profileRowSize",
]);
assert.equal(p.profileRowsLayout, "number-of-rows");
assert.equal(p.profileRowSize, 24);
assert.equal(p.profileColor, "#2962ff");
assert.deepEqual(lawfulFields("LP"), []);
assert.equal(SA_SURFACE_SCHEMA, 1);
assert.equal(surfaceDoc(p).schema, 1);
assert.equal(surfaceDoc(p).prefs.mode, "morning");
const saved = saveObjectDefault({ ...p, axis: "right" }, "axis");
assert.equal(saved.objectDefaults.axis?.axis, "right");
const house = resetPartToHouse(saved, "axis");
assert.equal(house.axis, "left");
assert.equal(partFromPointer({ x: 10, y: 10, w: 800, h: 400, axis: "left" }), "axis");
assert.equal(
  partFromPointer({ x: 10, y: 10, w: 800, h: 400, axis: "left", profileHit: true }),
  "L2",
);
assert.equal(partFromPointer({ x: 400, y: 390, w: 800, h: 400, axis: "left" }), "range");
assert.equal(SETTINGS_FIRST_SECTION, "L0");
assert.equal(sectionForPart("axis"), "axis");
assert.equal(sectionForPart("L2"), "L2");
assert.equal(sectionForPart("grid"), "L0");
assert.equal(sectionForPart("chips"), "legend");
assert.equal(sectionForPart("mode"), "L0");
assert.ok(SETTINGS_SECTIONS.some((s) => s.id === "axis" && s.label === "Scales and lines"));
assert.equal(SETTINGS_SECTIONS.find((s) => s.id === "L0")?.icon, "canvas");
assert.equal(SETTINGS_SECTIONS.find((s) => s.id === "axis")?.icon, "axis");
assert.equal(SETTINGS_SECTIONS.find((s) => s.id === "legend")?.icon, "legend");
assert.ok(SETTINGS_SECTIONS.every((s) => s.icon && s.label));
assert.equal(
  SETTINGS_SECTIONS.find((s) => s.id === "sessions")?.label,
  "Time zones and sessions",
);
assert.equal(sectionForPart("sessions"), "sessions");
const restored = prefsFromServerDoc(
  surfaceDoc({
    ...p,
    axis: "right",
    overrides: { morning: { axis: "right" } },
  }),
);
assert.equal(restored?.axis, "right");
assert.equal(prefsFromServerDoc({ schema: 1, prefs: null }), null);
console.log("saLayerStore.test.ts 1 ok");
