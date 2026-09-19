# REQ-002 measurement spec — extracted from the reference PNG

**Reference:** `artifacts/references/REQ-002-settings-dialog-reference.png`  
**Git blob:** `bf9fa21ac600cfe0432f2651dcee9080d55258f4`  
**Pixels:** 1506 × 2210 (RGBA PNG)  
**Fidelity:** clause 1 — the build is checked against this file, not memory.

## Frame
| Measure | px (reference) | Notes |
|---------|----------------|--------|
| Dialog | 1506 × 2210 | Full-bleed white panel |
| Title row | ~88 px tall | “Settings” top-left; close × top-right |
| Footer | ~96 px tall | Hairline above; Template left; Cancel + Ok right |
| Content | remainder | Sidebar + pane |

## Sidebar (left)
| Measure | px (reference) |
|---------|----------------|
| Width | ~300 px (~20% of 1506) |
| Item height | ~48 px |
| Selected | light gray rounded pill, full sidebar width minus inset |
| Icon + label | icon ~20 px, 12 px gap, 15–16 px label |

## Right pane
| Measure | px (reference) |
|---------|----------------|
| Group header | small-caps, gray, ~12 px, extra space above |
| Row height | ~44–52 px |
| Label | left; control | right |
| Dropdown | ~36–40 px tall, rounded, chevron |
| Checkbox | ~18 px square |
| Disabled text field | gray fill, no edit |
| Color swatch | ~32 px square, 1 px border |
| Paired colors | two swatches, ~8 px gap |
| Swatch + line preview | swatch + short style line in one control |

## Footer
| Control | Notes |
|---------|--------|
| Template | dropdown, bottom-left, same height as Cancel |
| Cancel | outline / secondary |
| Ok | filled black, primary, rightmost |

## Type / color (clause 5)
White background, black text (Coach ruling). Labs tokens only where the difference is not load-bearing. Clause 5 is void if Coach later requires literal indistinguishability.

Implementer re-measures from the blob if any number here is disputed; the PNG wins.
