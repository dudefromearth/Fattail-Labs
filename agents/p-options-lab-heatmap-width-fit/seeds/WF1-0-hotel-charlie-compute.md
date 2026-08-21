# WF1-0 — Pure computeCell

**Project:** Options Lab Heatmap Width Fit  
**Agent:** Hotel · Charlie  
**Depends:** WF0-G · WF0-0  
**Feeds:** WF1-G

## In scope (files — nothing else)

| File | Touch |
|------|--------|
| `web/lib/options-lab/templates/widthFit.ts` | **New** — components, gates, raw map |
| `web/lib/options-lab/templates/types.ts` | `width_fit` id; weights/params; optional `components` / `qualityFlag` |
| `web/lib/options-lab/templates/symFly.ts` | `valueModes` entry; `computeCell` **delegate** only |
| `web/lib/options-lab/templates/pricing.ts` | Reuse `symFlyDebit` only — no formula change |

## Out of scope

`assignColors` (WF2). Panel footer (WF3). `color.ts` debit path. GEX. AF-X. MiniTwo. Default Debit change.

## Law

- Raw components in `computeCell` **only** — no weighted sum, no pre-stability composite (B2 · L8)  
- No `flySurfaceHistory` (A2 · NX14)  
- Invalid: missing listed \(K\pm w\), null mid, null required greek, \(D\le 0\) (same as `r2r` / §5.2.1), crossed, extreme spread  
- Cell `display` and composite `value` null by default for `width_fit`  
- Equal \(1/7\) (OD-W6 a) or Coach-stamped tilt — no silent third preset  
- Existing Advanced Fly `computeCell` paths **byte-identical** on fixture (A5)

## WF1-G (this seed’s share)

`npx tsx` tests for AT-WF2 · AT-WF11 (with WF1-1). AF Wave‑1 fixture unchanged. Diff stays in the table.
