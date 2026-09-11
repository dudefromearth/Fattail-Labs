# PC8-E item 6 — Padlock form and placement

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Released** from "HELD, do not attempt." Defect remediation of PC8 padlock form. Not a packet reopen.

Coach rejected the general-purpose `IconLock` / `IconUnlock` twice: hairline body in both states, locked not filled. The PC8 report already described the right form; the defect was the glyph.

Coach follow-up: both states are **white** (`#ffffff`), not the grey in the reference photos. One colour. State is fill and shackle, never tint or opacity.

## Form (matches `docs/reference/tos/tos-padlock-*.png` at 100% zoom)

Dedicated local SVG in `TosPadlock`. Does not reuse `@/components/ui/icons`.

| State | Body | Shackle | Paint |
|-------|------|---------|-------|
| Locked | solid filled rounded rect, ~1.4 : 1 | thick closed semicircle, narrower than body, centred | `#ffffff` |
| Unlocked | same body, outline only (row shows through) | open, swung clear of the right shoulder, same stroke | `#ffffff` |

Footprint **22×18 both states**. Button 22×18. Nothing around the icon moves when it toggles. `data-locked` flips `0`/`1`.

Measured: `gate-reports/pc8-e/footprint.txt`

## Placement

Own column to the right of the price stepper, separated by a vertical grid rule (`LOCK_RULE`). Not butted against the stepper. Chrome, not an 11th PC-VOCAB-7 column. `CARD_COLUMNS` still the ten.

## Evidence for Echo / Tango

| Reference | Ours |
|-----------|------|
| `docs/reference/tos/tos-padlock-locked.png` | `gate-reports/pc8-e/locked-cell.png` · `card-locked.png` |
| `docs/reference/tos/tos-padlock-unlocked.png` | `gate-reports/pc8-e/unlocked-cell.png` · `card-unlocked.png` |

## Semantics — unchanged

`CardLockState` remains the only lock. `lockNatural` / `lockLimit` / `unlockCard` unchanged. CHECK PRICE unchanged. Ten-column contract unchanged. No pricing path change.

## Tests

- AT-PC-66: shackle carries state; unlocked outlined; no `IconLock`/`IconUnlock` in `TosControls`
- PC8-E: footprint identical; `PADLOCK_PAINT = "#ffffff"`; `data-locked` flips
- tosCard 19 · chainControls 11 · lock.pc6 9

Nothing deploys. No backend, no migration.
