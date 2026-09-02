# LIM5 coverage map — AT-LIM1…32

**Law:** Spec v0.4.3 §10.  
**Date:** 2026-09-02.  
**Rule:** one row per id; the line is an `assert(…)` not a comment name.  
**FLAG:** the named assertion is live, but a sibling line is hollow (constant≡constant, tautology, or always-true). Hollow lines were **not** quietly rewritten.

Paths are under `web/lib/options-lab/templates/` unless noted.

| AT id | test file | line | the assertion text | PASS/FAIL |
|-------|-----------|-----:|--------------------|-----------|
| **AT-LIM1** | `lim.test.ts` | 116 | `assert(r.x > 0, "AT-LIM1 mass above → x > 0")` | **PASS** |
| **AT-LIM2** | `lim.test.ts` | 198 | `assert(r.x < 0, "AT-LIM2 mass below → x < 0")` | **PASS** |
| **AT-LIM3** | `lim.test.ts` | 154 | `assert(flipped.x === 0, "AT-LIM3 sign-flip x stays 0")` | **PASS** |
| **AT-LIM4** | `lim.test.ts` | 117 | `assert(r.y > 50, "AT-LIM4 all-positive near spot → y > 50")` | **PASS** |
| **AT-LIM5** | `lim.test.ts` | 137 | `assert(r.y < 50, "AT-LIM5 negative near spot (this geometry) → y < 50")` | **PASS** |
| **AT-LIM6** | `lim.test.ts` | 136 | `assert(r.x > 0 && r.y < 50, "AT-LIM6 x > 0 and y < 50")` | **PASS** |
| **AT-LIM7** | `lim.test.ts` | 230 | `assert(r.crossingProximity === 0, "AT-LIM7 proximity 0")` | **PASS** |
| **AT-LIM8** | `lim.test.ts` | 280 | `assert(far.crossingProximity === 1, "AT-LIM8 proximity 1")` | **PASS** |
| **AT-LIM9** | `lim.test.ts` | 180 | `assert(zeros.y === 50, "AT-LIM9 LIM8 overrides blend (not 0)")` | **PASS** |
| **AT-LIM10** | `limQuadrant.test.ts` | 87 | `assert(neverH.x === 0 && neverH.y === 50, "AT-LIM10 never-hydrated centre")` | **PASS** |
| **AT-LIM11** | `lim.test.ts` | 199 | `assert(r.crossings.length === 3, "AT-LIM11 count 3")` | **PASS** |
| **AT-LIM12** | `lim.test.ts` | 207 | `assert(new Set(steep).size === 3, "AT-LIM12 cliff vs smear steepness differs")` | **PASS** |
| **AT-LIM13** | `lim.test.ts` | 245 | `assert(r.xUnclamped !== r.x, "AT-LIM13 xUnclamped ≠ x")` | **PASS** |
| **AT-LIM14** | `limTrail.test.ts` | 154 | `assert(spacing(g) === 0, "AT-LIM14 cluster spacing 0")` | **PASS** |
| **AT-LIM15** | `limTrail.test.ts` | 168 | `assert(spacing(g) === 20, "AT-LIM15 spread spacing 20")` | **PASS** |
| **AT-LIM16** | `lim.test.ts` | 121 | `assert(almost(r.y, recombine(r)), "AT-LIM16 F1 recombine")` | **PASS** |
| **AT-LIM17** | `lim.test.ts` | 349 | `assert(threw, "AT-LIM17 missing key aborts")` | **PASS** |
| **AT-LIM17b** | `lim.test.ts` | 364 | `assert(threw, "AT-LIM17b W sum ≠ 1.0 aborts")` | **PASS** |
| **AT-LIM18** | `limQuadrant.test.ts` | 145 | `assert(!s.includes("4970") && !s.includes("mid"), "AT-LIM18 no crossing price")` | **PASS** |
| **AT-LIM19** | `lim.test.ts` | 287 | `assert(r.x === 0 && r.xUnclamped === 0, "AT-LIM19 no fallback scale (would be x=10)")` | **PASS** |
| **AT-LIM20** | `limQuadrant.test.ts` | 164 | `assert(!chrome.includes(mid), "AT-LIM20 chrome has no (lo+hi)/2 of F7 interval")` | **PASS** |
| **AT-LIM21** | `limQuadrant.test.ts` | 121 | `assert(LIM_DOT_OPACITY === 1, "AT-LIM21 dot opacity constant")` · ring gone (LIM7) | **PASS** |
| **AT-LIM22** | `limQuadrant.test.ts` | 206 | `html.includes("Open interest as-of date unavailable")` line 3 visible; 1/2/4 via info (LIM7 E24) | **PASS** |
| **AT-LIM23** | `lim.vocab.test.ts` | 68 | `assert(!hit, \`AT-LIM23 rendered "${s}" contains ${hit}\`)` · 11 words kept + 5 MSC phrases (LIM7 E23) | **PASS** |
| **AT-LIM24** | `limQuadrant.test.ts` | 136 | `assert(narrow.chip === true, "AT-LIM24 narrow chip survives")` width, not a mode (LIM7 E21) | **PASS** |
| **AT-LIM25** | `limTrail.test.ts` | 215 | `assert(g.length === 0, "AT-LIM25 expiration: first frame empty")` | **PASS** |
| **AT-LIM26** | `lim.test.ts` | 422 | `assert(!/clamp\s*\(/.test(mixAssign[0]), "AT-LIM26 nearSpotMix assignment contains no clamp(")` | **PASS** |
| **AT-LIM27** | `limQuadrant.test.ts` | 123 | `assert(lims.length === 1, "AT-LIM27 one lim template")` | **PASS** |
| **AT-LIM28** | `lim.test.ts` | 411 | `assert(!text.includes(banned), \`AT-LIM28 ${f} has retired prefix\`)` | **PASS** |
| **AT-LIM29** | `lim.test.ts` | 260 | `assert(r.crossingProximity > 0 && r.crossingProximity < 1, "AT-LIM29 strictly interior")` | **PASS** |
| **AT-LIM30** | `lim.test.ts` | 233 | `assert(r.crossings[0].steepness === 1, "AT-LIM30 steepness uses (hi−lo)=20, not step 10")` | **PASS** |
| **AT-LIM31** | `lim.test.ts` | 235 | `assert(r.spotBelowNearestCrossing === false, "AT-LIM31 inside is not below")` | **PASS** |
| **AT-LIM32** | `limQuadrant.test.ts` | 175 | `assert(ra === "magF 80", "AT-LIM32 F2 magF visible")` | **PASS** |

**AT-LIM25** also: symbol L233, session L257 — three separate first-frame empties, not one combined case.

**AT-LIM13** trail: `limTrail.test.ts` L134 records `xUnclamped 300` (Hotel F8), not clamped 100.

**AT-LIM16** recombines F1–F4, F6–F9; F5 waived (LIM8).

---

## FLAGS (hollow sibling — not rewritten)

| AT | Hollow line | Why it does not exercise the named thing | Live proof instead |
|----|-------------|------------------------------------------|--------------------|
| **AT-LIM8** | `lim.test.ts:279` `(80 / 5000) * 100 === 1.6` | Constant compared to itself | L280 `far.crossingProximity === 1` on dist 80 |
| **AT-LIM10** | `limQuadrant.test.ts:94` `LIM_DOT_OPACITY === 1` | Constant compared to itself | L87 never-hydrated (0,50); L93 pixel centre 100,100 |
| **AT-LIM20** | `lim.test.ts:214` `c.lo !== mid && c.hi !== mid` | Tautology for any `lo ≠ hi` interval (E1-shaped) | L164 chrome omits F7 midpoint 5000; L420 grep; `gex.limLink.test.ts:38` ticks |
| **AT-LIM21** | `limQuadrant.test.ts:99` `LIM_DOT_OPACITY === 1` | Constant compared to itself | L102 ring radius grows; L193 no proximity×opacity in renderer |
| **AT-LIM24** | `limQuadrant.test.ts:111` `c.ring === true` | `limSurfaceFlags("compact").ring` is `true` by construction | Renderer mounts `data-testid="lim-ring"` **outside** the Comfort-only branch |
| **AT-LIM26** | `lim.test.ts:103` `r.y >= 0 && r.y <= 100` | Holds for any clamped or unclamped blend in range | **K1 (LIM5-G closure):** L416 identifier grep (E8 field) **and** L422 `nearSpotMix` assignment contains no `clamp(` (clamp half). Range check kept. |

None of the FLAGS is a missing row. None was patched by editing the hollow assert.

---

## C2 (deliverable 2) — not an AT-LIM id

`lim.c2.test.ts`: one key `LABS_LIM_BAND_CLOSE_PCT` absent → LIM `LimConfigError` names that key, no `process.env` dump; frozen GEX profile still computes (5 points); Advanced Fly `buildGrid` still builds (5 rows); Width Fit cell still computes; LIM unavailable HTML contains the key and not `lim-dot`.
