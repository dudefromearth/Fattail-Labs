# WF2-1 — Sequential palette + sticky

**Project:** Options Lab Heatmap Width Fit  
**Agent:** Echo · Charlie  
**Depends:** WF2-0  
**Feeds:** WF2-G

## In scope

| File | Touch |
|------|--------|
| `web/lib/options-lab/templates/color.ts` | **New helper** teal→amber sequential; sticky 25% (§5.2.2). Do **not** call `debitColor`. |
| `web/lib/options-lab/templates/widthFit.ts` | Opacity from quality+stability; outline only if high-fit ∧ stable ∧ good-quality |

## Out of scope

Heatmap debit RoC slider. Traffic-light. GEX diverging palette.

## WF2-G (this seed’s share)

AT-WF7 path exists. Visual rec in `echo-labels.md` matches code tokens.
