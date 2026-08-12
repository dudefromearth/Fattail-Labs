/**
 *   npx --yes tsx lib/options-lab/builderCreateDefault.test.ts
 */

import {
  MAX_USER_PRESETS,
  clearCreateDefault,
  factoryCreateDefault,
  isLabDefaultsActive,
  labDefaultForStrategy,
  loadCreateDefaultsStore,
  resolveCreateSeed,
  resetToLabDefaults,
  saveShapeAsUserPreset,
  setActiveCreateDefault,
} from "./builderCreateDefault";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, String(v));
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => store.clear(),
  key: () => null,
  get length() {
    return store.size;
  },
};

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

console.log("builderCreateDefault v2");

test("lab butterfly is create-open factory", () => {
  store.clear();
  const f = factoryCreateDefault("SPX");
  assert(f.template === "butterfly", "template");
  assert(f.direction === "buy", "dir");
  assert(f.centerOffsetPts === 0, "atm");
  const lab = labDefaultForStrategy("butterfly", "SPX");
  assert(lab.wingWidth === f.wingWidth, "wing match");
});

test("lab iron_fly is short credit", () => {
  const lab = labDefaultForStrategy("iron_fly", "SPX");
  assert(lab.direction === "sell", "sell");
  assert(lab.template === "iron_fly", "if");
});

test("wave-1 Lab recipes: butterfly vertical condor calendar", () => {
  const fly = labDefaultForStrategy("butterfly", "SPX");
  assert(fly.direction === "buy" && fly.optionSide === "call", "fly buy call");
  assert(fly.centerOffsetPts === 0, "fly ATM");
  assert(/fly|ATM/i.test(fly.blurb), "fly blurb");

  const vert = labDefaultForStrategy("vertical", "SPX");
  assert(vert.direction === "buy" && vert.optionSide === "call", "vert");
  assert(vert.wingWidth === fly.wingWidth, "same product wing");

  const cond = labDefaultForStrategy("condor", "SPX");
  assert(cond.template === "condor" && cond.direction === "buy", "condor");

  const cal = labDefaultForStrategy("calendar", "SPX");
  assert(cal.template === "calendar" && cal.direction === "buy", "cal");
  assert(/multi-expiration|front|back/i.test(cal.blurb), "calendar multi-exp blurb");
});

test("lab defaults active when empty store", () => {
  store.clear();
  assert(isLabDefaultsActive(), "lab");
  const s = resolveCreateSeed("SPX");
  assert(s.template === "butterfly", "seed butterfly");
});

test("save up to three presets; one active", () => {
  store.clear();
  const a = saveShapeAsUserPreset(
    {
      template: "vertical",
      direction: "buy",
      optionSide: "put",
      wingWidth: 10,
      centerOffsetPts: 0,
      contracts: 1,
    },
    "SPX",
    "Put vertical",
  );
  assert(a.presets.length === 1, "1");
  assert(a.activeId === a.presets[0].id, "active a");
  assert(!isLabDefaultsActive(), "user active");

  const b = saveShapeAsUserPreset(
    {
      template: "iron_condor",
      direction: "sell",
      optionSide: "call",
      wingWidth: 40,
      centerOffsetPts: 0,
      contracts: 1,
    },
    "SPX",
    "IC",
  );
  // active was A, so second save overwrites A (same active slot)
  assert(b.presets.length === 1, "overwrite active slot");
  assert(b.presets[0].template === "iron_condor", "became IC");

  // Activate lab, then save new slots
  resetToLabDefaults();
  saveShapeAsUserPreset(
    {
      template: "straddle",
      direction: "buy",
      optionSide: "call",
      wingWidth: 20,
      centerOffsetPts: 0,
      contracts: 1,
    },
    "SPX",
    "Straddle",
  );
  resetToLabDefaults();
  saveShapeAsUserPreset(
    {
      template: "calendar",
      direction: "buy",
      optionSide: "call",
      wingWidth: 20,
      centerOffsetPts: 0,
      contracts: 1,
    },
    "SPX",
    "Cal",
  );
  resetToLabDefaults();
  const full = saveShapeAsUserPreset(
    {
      template: "single",
      direction: "buy",
      optionSide: "call",
      wingWidth: 20,
      centerOffsetPts: 0,
      contracts: 1,
    },
    "SPX",
    "Single",
  );
  assert(full.presets.length === MAX_USER_PRESETS, "max 3");
  assert(full.activeId != null, "active");
});

test("setActive + resolveCreateSeed", () => {
  store.clear();
  resetToLabDefaults();
  const s1 = saveShapeAsUserPreset(
    {
      template: "condor",
      direction: "buy",
      optionSide: "call",
      wingWidth: 30,
      centerOffsetPts: -10,
      contracts: 2,
    },
    "SPX",
    "Condor",
  );
  const id = s1.presets[0].id;
  resetToLabDefaults();
  assert(resolveCreateSeed("SPX").template === "butterfly", "lab seed");
  setActiveCreateDefault(id);
  const seed = resolveCreateSeed("SPX");
  assert(seed.template === "condor", "user seed");
  assert(seed.centerOffsetPts === -10, "offset");
  assert(seed.contracts === 2, "contracts");
});

test("reset keeps presets, activates lab", () => {
  const before = loadCreateDefaultsStore();
  assert(before.presets.length >= 1, "has presets");
  resetToLabDefaults();
  assert(isLabDefaultsActive(), "lab");
  assert(loadCreateDefaultsStore().presets.length === before.presets.length, "kept");
  clearCreateDefault(); // alias
  assert(isLabDefaultsActive(), "still lab");
});

console.log(`\n${n} tests passed`);
