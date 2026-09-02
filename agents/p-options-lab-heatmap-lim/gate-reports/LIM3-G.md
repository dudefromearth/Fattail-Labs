# LIM3-G — Quadrant surface

**Gate:** LIM3-G  
**Delta · Echo · Tango** ternary  
**Date:** 2026-09-02  
**Plan:** v1.2 · Spec v0.4.3 BUILD AUTHORITY sha1 `01f638f590492520236b3607edde487b949d6016`  
**Token:** `OLLIM-W0.md` GO (DL-651 · DL-652)

## Verdict

| Seat | Verdict |
|------|---------|
| **Delta** | **PASS** |
| **Echo** | **PASS** — mapping LIM23, identity blue, Compact ring, 44pt density, no cell names |
| **Tango** | **PASS** — Appendix B verbatim, AT-LIM18/22/23/35 |

LIM4 (`gex.ts`) **not** started.

---

## Command evidence

```
cd /Users/ernie/Fattail-Labs/web
npx --yes tsx lib/options-lab/templates/limQuadrant.test.ts
limQuadrant.test.ts ok

npx --yes tsx lib/options-lab/templates/lim.vocab.test.ts
lim.vocab.test.ts ok

npx --yes tsx lib/options-lab/templates/lim.test.ts
lim.test.ts ok

npx --yes tsx lib/options-lab/templates/limTrail.test.ts
limTrail.test.ts ok

npx --yes tsx lib/options-lab/templates/chainContext.test.ts
chainContext GEX 10 tests passed

npx --yes tsx lib/options-lab/templates/widthFit.test.ts
widthFit.test.ts ok

npx --yes tsx lib/options-lab/templates/advancedFly.structure.test.ts
ok  advancedFly structure AT-AF1/5/16 + history pair

npx --yes tsx lib/options-lab/templates/widthFit.vocab.test.ts
widthFit.vocab.test.ts ok
```

**Regression:** frozen `gex` (chainContext GEX 10), Advanced Fly structure, Width Fit — green. LIM compute/trail unchanged.

**Zero Massive:** `HeatmapLimQuadrant.tsx` and `limChrome.ts` contain no `fetch` and no Massive client. `computeLim` is the only x/y/factor/proximity source.

---

## AT share this gate

| Id | Result |
|----|--------|
| AT-LIM10 | PASS — never-hydrated / empty / valid:false → (0, 50), opacity 1, no spinner |
| AT-LIM18 | PASS — state line has count, no crossing price |
| AT-LIM21 | PASS — `LIM_DOT_OPACITY === 1`; ring radius only; no proximity×opacity |
| AT-LIM22 | PASS — dated line 3 and hole form |
| AT-LIM23 | PASS — rendered strings + label constants |
| AT-LIM24 | PASS — Compact `ring: true`; chip/trail/magF false |
| AT-LIM27 | PASS — one `lim` ValueModeId; no `session-volume` |
| AT-LIM32 | PASS — F2 magF 80 and F4 magF 0, both y=40 |
| LIM35 | PASS — picker `GEX lean (window)` |
| LIM36 | PASS — axes Lean / Near-spot mix; no cell names |
| ≥44pt | PASS — kit SegmentedControl `min-h-[var(--hit-min)]` |

---

## Lima (not code)

Token + LIM6-0 seed: G1 session reset is UTC midnight = 20:00 ET (EDT) / 19:00 (EST). Accepted for v1.

## Does not

LIM4 · `gex.ts` glow · MiniTwo · member guide body (LIM6).
