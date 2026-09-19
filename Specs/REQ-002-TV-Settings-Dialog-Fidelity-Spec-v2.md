# REQ-002 v2 — Settings dialog fidelity (TradingView contract)

**Status:** OPEN (RL-1). Not BUILD AUTHORITY until Coach stamps.  
**Track:** VP / SA settings chrome  
**Captured:** 2026-09-19  
**Visual contract:** `artifacts/references/REQ-002-settings-dialog-reference.png`  
**Git blob (fidelity clause 1):** `bf9fa21ac600cfe0432f2651dcee9080d55258f4`  
**Measurement spec:** `artifacts/references/REQ-002-measurement-spec.md`  
**Parents:** A10 · A20 · A21 · A22 · REQ-002 v1 (inventory / right-click)

If that PNG is not on `main` at that blob, **the packet does not dispatch** — ask Coach; do not substitute another screenshot.

## Coach wording (RL-1)

> the same layout, the same control elements and components, the same sizes, everything the same as TV.

## Fidelity contract

The TV settings screenshot is the visual contract, not an inspiration:

1. **Measured spec first.** Implementer extracts a measurement spec from the reference — dialog proportions, sidebar width, row heights, control sizes, spacing, type scale — and files it with the report. The build is checked against that spec, not against memory. (Initial extract: `REQ-002-measurement-spec.md`; PNG blob above is law.)
2. **Same structure:** title top-left, close X top-right; left sidebar of icon+label sections with rounded selected state; right pane with small-caps gray group headers; label-left / control-right rows; footer with Template dropdown bottom-left, Cancel + primary Ok bottom-right.
3. **Same control inventory:** dropdowns, checkboxes, text inputs (incl. disabled state), single color swatches, paired color buttons — each of our settings uses the same control type TV uses for its equivalent.
4. **Same sizes and behaviors** at standard density, including live preview with Ok-commit / Cancel-revert.
5. Rendered in Labs' own font and color tokens where the difference is not visually load-bearing; white background, black text per Coach's ruling. If Coach rules for literal indistinguishability, this clause is void.
6. Unchanged from v1: context entry (right-click opens to that feature's section), our settings scope only, A22 persistence, inventory-before-build.

## Acceptance — AP-1 / PP-1

Artifacts include a side-by-side AND overlay comparison of our dialog against the reference screenshot, deviations enumerated with reasons (target: none beyond clause 5). Closure remains: verified in Coach's own browser on StudioTwo, opened by his right-click.

Screenshot comparison closes the fidelity *artifact* half. **AP-1** in Coach's browser closes the REQ.

## Dispatch gate

Packet dispatches only when `git cat-file -e origin/main:artifacts/references/REQ-002-settings-dialog-reference.png` succeeds and `git rev-parse origin/main:artifacts/references/REQ-002-settings-dialog-reference.png` equals `bf9fa21ac600cfe0432f2651dcee9080d55258f4`. Else stop and ask Coach.
