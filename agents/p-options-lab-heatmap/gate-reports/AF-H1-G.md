# AF-H1-G — History + AF17 + open seam

**Date:** 2026-08-12  
**Delta:** **PASS**

## Evidence

| Path | Role |
|------|------|
| `web/lib/options-lab/templates/flySurfaceHistory.ts` | Ring buffer · seam · tickPairHonest / velocityPairHonest · non-monotonic reject |
| `web/lib/options-lab/templates/flySurfaceHistory.test.ts` | AT-AF17 · P-B2 0.3s tick/vel · max-gap · mixed clock |
| `HeatmapChainPanel.tsx` | Push once per generation · seam on symbol/exp/wings · Held→Live |

```text
npx --yes tsx lib/options-lab/templates/flySurfaceHistory.test.ts
→ ok  flySurfaceHistory AT-AF17 / P-B2 / AF10 helpers
```

## Verdict

**PASS**
