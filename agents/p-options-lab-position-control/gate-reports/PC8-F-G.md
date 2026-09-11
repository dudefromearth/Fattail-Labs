# PC8-F-G

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Verdict:** **PASS**  
**Escapes:** PC8-E item 6 at `40f1188`. PC8-E is closed; not amended.

Nothing deploys. Glyph shape, paint, footprint `22×18`, and column position unchanged. `CardLockState` untouched.

## Cause (measured)

The diagnosis in the packet was the mechanism.

An inline SVG on the text baseline laid out taller than the `h-[18px]` button. The shackle sat in that overflow. The column header is `sticky top-0 z-[1] bg-[#0a0a0e]` — opaque, stacked above — so the overflow was painted over. That is "chopped off by the header bar."

The viewBox was never the problem. Topmost locked ink is y≈4.93 of 18; unlocked ≈2.08 of 18.

## Fix

`className="block"` on the padlock SVG. `leading-none` on the button. No viewBox change, no shrink.

## Measurement at 100% zoom (CSS px)

First data row sits under the SPX group bar (`group.bottom` = 540.5).

| | SVG top | SVG bottom | SVG h×w | button h×w | row top–bottom | inside button | inside row | below thead | below group |
|--|---------|------------|---------|------------|----------------|---------------|------------|-------------|-------------|
| Unlocked | 541.5 | 559.5 | **18×22** | **18×22** | 540.5–564 | **true** | **true** | true | **true** |
| Locked | 607 | 625 | **18×22** | **18×22** | 606–629.5 | **true** | **true** | true | **true** |

Unlocked SVG top 541.5 vs group bottom 540.5 — 1px of air, not overlap. SVG height equals the button in both states (the inline-baseline excess is gone).

Raw: `gate-reports/pc8-f/measure.txt`

## Screenshots vs reference (100% zoom)

| State | Reference | Ours |
|-------|-----------|------|
| Locked | `docs/reference/tos/tos-padlock-locked.png` | `gate-reports/pc8-f/card-locked.png` · `locked-cell.png` |
| Unlocked | `docs/reference/tos/tos-padlock-unlocked.png` | `gate-reports/pc8-f/card-unlocked.png` · `unlocked-cell.png` |

Closed shackle on a solid body when locked. Open shackle clear of an outlined body when unlocked. Neither is flat-topped under the SPX bar.

## Tests

```
tosCard.test.ts 25 ok
  ok  PC8-F padlock SVG is block so the shackle stays inside the 18px row
```

Rendered-box (Playwright): `web/e2e/pc8-f-padlock-box.spec.ts` — SVG 18×22, fully inside the button and the data row, both states.

## Files

- `web/components/options-lab/TosControls.tsx`
- `web/lib/options-lab/tosCard.test.ts`
- `web/e2e/pc8-f-padlock-box.spec.ts`
- `agents/p-options-lab-position-control/gate-reports/PC8-F-G.md`
- `agents/p-options-lab-position-control/gate-reports/pc8-f/`
