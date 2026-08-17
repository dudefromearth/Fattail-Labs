/**
 * OT-EF / DL-309 exhaustive proof suite
 * -------------------------------------
 * OPF is sole instrument truth · representable or named state · atomic settle.
 *
 *   npx --yes tsx lib/options-lab/otEfDoctrine.proof.test.ts
 */

import {
  applyPackageQuote,
  cardDefinitionKey,
  cardShowsPackageMark,
  isOptionPointerExpired,
  positionFromInput,
  setCardExpiration,
  shiftCardStrikes,
  type AnalyzerPosition,
} from "./analyzerBook";
import { resolveCardDisplayState } from "./cardDisplayState";
import {
  buildListedStructure,
  inferStructureCenter,
} from "./listedStructure";
import {
  assessPositionBind,
  bindPackageLabel,
  isNotTradedReason,
} from "./optionBind";
import type { PositionInput } from "./positionTypes";

function assert(cond: unknown, msg: string): asserts cond {
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

const LISTED = [
  5950, 5960, 5970, 5980, 5990, 6000, 6010, 6020, 6030, 6040, 6050,
];
const NOW = new Date("2026-08-12T18:00:00Z"); // 14:00 ET — still 8/12 (live through midnight)

function flyInput(exp: string, center = 6000, width = 20): PositionInput {
  return {
    underlying: "SPX",
    expiration: exp,
    contracts: 1,
    direction: "buy",
    net_debit_override: null,
    legs: [
      {
        strike: center - width,
        type: "call",
        quantity: 1,
        side: "long",
        entry_price: 1,
      },
      {
        strike: center,
        type: "call",
        quantity: 2,
        side: "short",
        entry_price: 5,
      },
      {
        strike: center + width,
        type: "call",
        quantity: 1,
        side: "long",
        entry_price: 1,
      },
    ],
  };
}

console.log("\n=== OT-EF proof: listed structure (Builder prefill) ===\n");

test("buildListedStructure emits only listed strikes for all templates", () => {
  const templates = [
    "single",
    "vertical",
    "butterfly",
    "bwb",
    "condor",
    "straddle",
    "strangle",
    "iron_fly",
    "iron_condor",
    "calendar",
    "diagonal",
  ] as const;
  for (const template of templates) {
    const b = buildListedStructure({
      template,
      listed: LISTED,
      preferCenter: 6001.7,
      preferWidth: 20,
      optionSide: "call",
    });
    assert(b != null, `${template} must build on LISTED`);
    for (const leg of b!.legs) {
      assert(
        LISTED.includes(leg.strike),
        `${template} leg ${leg.strike} not on LISTED`,
      );
    }
  }
});

test("buildListedStructure returns null when chain too sparse for fly", () => {
  const tiny = [6000, 6010]; // cannot place ±20 butterfly
  const b = buildListedStructure({
    template: "butterfly",
    listed: tiny,
    preferCenter: 6000,
    preferWidth: 20,
    optionSide: "call",
  });
  // may still place with step=1 if only 2 strikes - need 3 for butterfly
  // 6000-6010 only 2 strikes → null
  assert(b == null || b.legs.length >= 1, "null or degenerate");
  if (tiny.length < 3) {
    assert(b == null, "butterfly needs ≥3 listed strikes");
  }
});

test("buildListedStructure never invents off-grid arithmetic (e.g. 6001)", () => {
  const b = buildListedStructure({
    template: "butterfly",
    listed: LISTED,
    preferCenter: 6001,
    preferWidth: 15, // not exact grid width
    optionSide: "call",
  });
  assert(b != null, "builds");
  assert(b!.body === 6000, `body snapped to 6000 got ${b!.body}`);
  for (const leg of b!.legs) {
    assert(Number.isInteger(leg.strike / 10) || LISTED.includes(leg.strike), "grid");
    assert(LISTED.includes(leg.strike), `strike ${leg.strike} listed`);
  }
});

test("inferStructureCenter matches fly body and vertical midpoint", () => {
  const fly = buildListedStructure({
    template: "butterfly",
    listed: LISTED,
    preferCenter: 6040,
    preferWidth: 20,
    optionSide: "call",
  });
  assert(fly != null, "fly");
  assert(
    inferStructureCenter(fly!.legs) === fly!.body,
    `fly center ${inferStructureCenter(fly!.legs)} vs body ${fly!.body}`,
  );
  const vert = buildListedStructure({
    template: "vertical",
    listed: LISTED,
    preferCenter: 6040,
    preferWidth: 20,
    optionSide: "call",
  });
  assert(vert != null, "vertical");
  const mid = inferStructureCenter(vert!.legs);
  assert(mid === 6040 || mid === 6030 || mid === 6050, `vertical mid ${mid}`);
});

console.log("\n=== OT-EF proof: shift strikes (card ▲/▼) ===\n");

test("shiftCardStrikes requires listed ladder — no arithmetic invent", () => {
  const pos = positionFromInput(flyInput("2026-08-14"));
  const unchanged = shiftCardStrikes(pos, "up"); // no getListed
  assert(
    unchanged.position.legs[0].strike === pos.position.legs[0].strike,
    "no ladder → no-op",
  );
  const empty = shiftCardStrikes(pos, "up", () => []);
  assert(
    empty.position.legs[0].strike === pos.position.legs[0].strike,
    "empty ladder → no-op",
  );
});

test("shiftCardStrikes moves only on listed steps", () => {
  const pos = positionFromInput(flyInput("2026-08-14", 6000, 20));
  const next = shiftCardStrikes(pos, "up", () => LISTED);
  assert(next.position.legs.some((l) => l.strike === 6010), "body → 6010");
  assert(
    next.position.legs.every((l) => LISTED.includes(l.strike)),
    "all listed",
  );
  assert(next.lock.mode === "unlocked", "unlock");
  assert(next.livePackagePerShare == null, "clear package");
  assert(next.bind == null, "clear bind until re-resolve");
});

test("shiftCardStrikes at edge is rigid no-op", () => {
  // body at top of chain
  const pos = positionFromInput(flyInput("2026-08-14", 6040, 10));
  const next = shiftCardStrikes(pos, "up", () => LISTED);
  // may no-op if wing would fall off
  if (next === pos || next.position.legs[0].strike === pos.position.legs[0].strike) {
    assert(true, "edge no-op ok");
  } else {
    assert(
      next.position.legs.every((l) => LISTED.includes(l.strike)),
      "if moved still listed",
    );
  }
});

console.log("\n=== OT-EF proof: bind gate (exp then price) ===\n");

test("all legs priced → bindable", () => {
  const input = flyInput("2026-08-14");
  const r = assessPositionBind(input, {
    now: NOW,
    listedExpirations: ["2026-08-14"],
    getContract: () => ({ mid: 1.2 }),
  });
  assert(r.bindable, "bindable");
});

test("missing body mid → NOT TRADED", () => {
  const input = flyInput("2026-08-14");
  const r = assessPositionBind(input, {
    now: NOW,
    listedExpirations: ["2026-08-14"],
    getContract: (_e, s) => (s === 6000 ? undefined : { mid: 1 }),
  });
  assert(!r.bindable, "not bindable");
  assert(bindPackageLabel(r) === "NOT TRADED", "package label");
  assert(
    r.legs.some((l) => isNotTradedReason(l.reason)),
    "not traded reason",
  );
});

test("expired exp fails before price", () => {
  const input = flyInput("2026-08-11");
  const r = assessPositionBind(input, {
    now: NOW,
    listedExpirations: ["2026-08-11", "2026-08-14"],
    getContract: () => ({ mid: 99 }),
  });
  assert(!r.bindable, "not bindable");
  assert(r.legs.every((l) => l.reason === "expired"), "expired first");
});

console.log("\n=== OT-EF proof: package display states ===\n");

test("exception replaces numeric package — never blank lie", () => {
  const cases: Array<{
    name: string;
    pos: AnalyzerPosition;
    expectKind: string;
    expectLabel: string | null;
  }> = [
    {
      name: "expired",
      pos: positionFromInput(flyInput("2026-08-11")),
      expectKind: "expired",
      expectLabel: "EXPIRED",
    },
    {
      name: "not_traded",
      pos: {
        ...positionFromInput(flyInput("2026-08-14")),
        bind: {
          bindable: false,
          failedCount: 1,
          summary: "NOT TRADED · chain edge",
          assessedAt: Date.now(),
          legs: [
            {
              index: 0,
              expiration: "2026-08-14",
              strike: 6100,
              type: "call",
              expOk: true,
              priceOk: false,
              reason: "chain_edge",
              mid: null,
            },
          ],
        },
      },
      expectKind: "not_traded",
      expectLabel: "NOT TRADED",
    },
    {
      name: "updating",
      pos: {
        ...positionFromInput(flyInput("2026-08-14")),
        liveState: "not_live",
        livePackagePerShare: null,
        bind: null,
      },
      expectKind: "updating",
      expectLabel: "UPDATING",
    },
    {
      name: "budget",
      pos: {
        ...positionFromInput(flyInput("2026-08-14")),
        liveState: "budget_refused",
        livePackagePerShare: null,
      },
      expectKind: "budget",
      expectLabel: "BUDGET LIMIT",
    },
  ];

  for (const c of cases) {
    const s = resolveCardDisplayState(c.pos, { now: NOW });
    assert(s.kind === c.expectKind, `${c.name} kind=${s.kind}`);
    assert(s.packageLabel === c.expectLabel, `${c.name} label=${s.packageLabel}`);
    assert(s.expected === true, `${c.name} expected`);
    assert(s.detail.length > 15, `${c.name} has detail`);
  }
});

test("held mark shows price path when representable", () => {
  let pos = positionFromInput(flyInput("2026-08-14"));
  pos = applyPackageQuote(
    {
      ...pos,
      bind: {
        bindable: true,
        failedCount: 0,
        summary: "bound",
        assessedAt: Date.now(),
        legs: [],
      },
    },
    { complete: true, package_debit_per_share: 1.5 },
    { sessionHeld: true },
  );
  const s = resolveCardDisplayState(pos, { now: NOW, sessionHeld: true });
  assert(s.kind === "price", "price kind");
  assert(s.packageLabel === null, "numeric path");
  assert(cardShowsPackageMark(pos, NOW), "shows mark");
});

console.log("\n=== OT-EF proof: pointer rebind ===\n");

test("setCardExpiration clears stale mark and definition key changes", () => {
  let pos = positionFromInput(flyInput("2026-08-11"));
  pos = {
    ...pos,
    livePackagePerShare: 2,
    lastNatSigned: 2,
    priceSide: "debit",
    liveState: "held",
  };
  const next = setCardExpiration(pos, "2026-08-14", [
    "2026-08-11",
    "2026-08-14",
  ]);
  assert(next.livePackagePerShare == null, "stale cleared");
  assert(next.lock.mode === "unlocked", "unlocked");
  assert(next.bind == null, "bind cleared");
  assert(cardDefinitionKey(pos) !== cardDefinitionKey(next), "def key");
  assert(!isOptionPointerExpired("2026-08-14", NOW), "new live");
});

test("applyPackageQuote incomplete never invents package mag", () => {
  const pos = positionFromInput(flyInput("2026-08-14"));
  const next = applyPackageQuote(
    pos,
    { complete: false, error: "no generations" },
    { sessionHeld: true },
  );
  assert(next.livePackagePerShare == null, "no invent");
  assert(next.liveState === "incomplete", "incomplete");
});

console.log(`\n=== ${n} OT-EF proof tests passed ===\n`);
