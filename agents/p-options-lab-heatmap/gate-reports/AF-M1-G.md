# AF-M1-G — Wave‑1 metrics

**Date:** 2026-08-12  
**Delta:** **PASS**

## Evidence

| Path | Role |
|------|------|
| `symFly.ts` | All Wave‑1 modes · Credit mag+CR · slope/curvature · time modes |
| `pricing.ts` | `symFlyDebit` side arg · `symFlyCpAsym` |
| `types.ts` | ValueModeId extended |
| `advancedFly.structure.test.ts` | AT-AF1 · AT-AF5 · AT-AF16 · history pair |

```text
npx --yes tsx lib/options-lab/templates/advancedFly.structure.test.ts
→ ok  advancedFly structure AT-AF1/5/16 + history pair
```

## Verdict

**PASS**
