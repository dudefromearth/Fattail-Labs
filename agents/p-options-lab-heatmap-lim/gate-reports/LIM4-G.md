# LIM4-G — GEX link

**Gate:** LIM4-G  
**Delta · Echo** ternary  
**Date:** 2026-09-02  
**Plan:** v1.2 · Spec v0.4.3 LIM28–32  
**Token:** `OLLIM-W0.md` GO  
**HEAD before edit:** `e1c1ef1`

## Verdict

| Seat | Verdict |
|------|---------|
| **Delta** | **PASS** |
| **Echo** | **PASS** — spot **line** (price, not bucket); one glow relationship; bars ordinary; annotations default off |

LIM5 **not** started.

---

## Load-bearing evidence — frozen `gex` render vs e1c1ef1

Captured **before** any LIM4 edit. Recomputed after. Empty diff.

```
$ diff -u agents/p-options-lab-heatmap-lim/evidence/lim4-frozen-gex/SHA1-e1c1ef1-BEFORE.txt \
         agents/p-options-lab-heatmap-lim/evidence/lim4-frozen-gex/SHA1.txt
(no output)
$ echo $?
0
```

| Slice | sha1 (before = after) |
|-------|------------------------|
| Frozen profile JSX (`data-testid="heatmap-gex-profile"` … end of that branch) | `8476169f89bfd159894a35f3018827ab8410a6e4` |
| `gex.ts` through `gexTemplate` (frozen API) | `c5395a14c7c4bdd64efd4306126cee8e1235b905` |
| Fixture `buildGexProfile` / scale / fmt / plotY | `d0f323b888c100f0d09f927316521245493a2210` |

Command:

```
cd web && npx --yes tsx lib/options-lab/templates/gex.frozenSnapshot.ts
frozen gex snapshot written
panelBlock 8476169f89bfd159894a35f3018827ab8410a6e4
gexFrozenSrc c5395a14c7c4bdd64efd4306126cee8e1235b905
fixture d0f323b888c100f0d09f927316521245493a2210
diff vs e1c1ef1 BEFORE: empty
```

Glow/annotation helpers are **appended after** `gexTemplate`. They are not in the frozen source slice. `gexSpotGlowCss(undefined)` / `gexAnnotationMarks(undefined)` return empty. The frozen panel branch does not pass a `GexLimLink`.

---

## Other commands

```
npx --yes tsx lib/options-lab/templates/gex.limLink.test.ts
gex.limLink.test.ts ok

npx --yes tsx lib/options-lab/templates/chainContext.test.ts
chainContext GEX 10 tests passed

npx --yes tsx lib/options-lab/templates/widthFit.test.ts
widthFit.test.ts ok

npx --yes tsx lib/options-lab/templates/advancedFly.structure.test.ts
ok  advancedFly structure AT-AF1/5/16 + history pair
```

---

## LIM28–32

- Spot **line** at interpolated price (`gexSpotLineTopPct`). 5001 ≠ 5000 (glides).
- Glow CSS only when `spotGlow: true` (LIM composition). Frozen: no call.
- Annotations: `showAnnotations` false → no COG, no ticks. Compact forces off. Ticks are `lo` and `hi`, never midpoint.
- Default companion: spot glow only (LIM31).
- Bars are ordinary white; no concentration highlight.
- LIM quadrant and companion share **one** `buildGexProfile(ctx, "gex_net")`.

## Does not

LIM5 · rewrite `gex_v1` · glow on bars or ticks · MiniTwo.
