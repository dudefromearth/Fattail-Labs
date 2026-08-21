# WF1-2 — Formulas match Spec §4

**Project:** Options Lab Heatmap Width Fit  
**Agent:** Hotel  
**Depends:** WF1-0  
**Feeds:** WF1-G

## In scope

Read `widthFit.ts` against `hotel-pin.md` and Spec §4. No invented smile. \(D\) only from `symFlyDebit`. Division by \(D\le 0\) is invalid, not Inf. **B2:** FAIL if `computeCell` emits a weighted or pre-stability composite. **OD-W6:** FAIL if stability is a member-zeroable weight inside `computeCell`.

## Out of scope

Code edits except a labeled Hotel note if Charlie drifted — then FAIL WF1-G, do not silently “fix” a different formula.

## WF1-G (this seed’s share)

Written sign-off in `gate-reports/` or `hotel-pin.md` appendix: formulas match Spec.
