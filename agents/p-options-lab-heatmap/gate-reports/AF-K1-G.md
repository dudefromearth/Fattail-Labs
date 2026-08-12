# AF-K1-G — AT pack

**Date:** 2026-08-12  
**Delta:** **PASS** (unit / structure evidence)

## AT coverage

| AT | Evidence |
|----|----------|
| AT-AF1 | advancedFly.structure.test debit golden |
| AT-AF3 / AF4 / AF17 | flySurfaceHistory.test 0.3s tick vs vel · max-gap · non-monotonic |
| AT-AF5 | slope edge invalid · mid valid · curvature path |
| AT-AF10 | id sym-fly · label Advanced flies · default debit |
| AT-AF12 | pct_change tick path in computeCell (not column-neighbor) |
| AT-AF16 | Credit display mag+CR · value = −D |
| AT-AF7 | Mode switch: no new fetch in template code (pure compute) |

```text
npx tsc --noEmit  → exit 0
```

## Verdict

**PASS** — residual Playwright e2e AT-HM parent pack not re-run this gate (unit law green).
