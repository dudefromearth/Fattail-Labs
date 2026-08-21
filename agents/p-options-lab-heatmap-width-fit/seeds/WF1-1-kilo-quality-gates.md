# WF1-1 — Quality-gate fixtures

**Project:** Options Lab Heatmap Width Fit  
**Agent:** Kilo  
**Depends:** WF1-0  
**Feeds:** WF1-G

## In scope

| File | Touch |
|------|--------|
| `web/lib/options-lab/templates/widthFit.test.ts` | **New** — AT-WF2 · AT-WF11 |

Fixtures: missing wing, null mid, **one** \(D\le 0\) path (aliases existing `r2r` / Templates §5.2.1 — **do not** write a second fixture for the same law), crossed bid/ask, extreme spread, null greek. None of these yield `valid` high-fit.

## Out of scope

Neighborhood (WF2). Vocab scan (WF3/WF4). Playwright unless already in heatmap e2e harness.

## WF1-G (this seed’s share)

Command evidence: `npx --yes tsx lib/options-lab/templates/widthFit.test.ts`
