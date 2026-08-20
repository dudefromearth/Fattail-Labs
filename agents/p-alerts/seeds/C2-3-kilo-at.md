# Seed C2-3 — Kilo AT-ALB (canvas)

**Project:** p-alerts  
**Agent:** Kilo  
**Phase:** C2  
**Depends:** C2-1  
**Gate it feeds:** C2-G

## ATs this packet

| AT | Criterion |
|----|-----------|
| AT-ALB-2 | Right-click blank plot → Canvas menu → item opens Builder with that price + condition |
| AT-ALB-3 | Right-click tent → Position list (Shown, strike labels) → Builder bound |
| AT-ALB-4 | Save Price → holder card + vertical line; Active/Idle follows spot |
| AT-ALB-8 | Left-drag pan unaffected by right-click alerts |
| **AT-ALB-15** | Menu rows ≥44pt; no invented keyboard nav; **+** is a11y; token chrome |

Plus characterization for `resolveAlertMenuKind` (blank vs 8px tent).

**HIG lint (FP14):** lint pass over C2 files for raw hex / magic px / `zinc-*` in **chrome** (menu, not plot geometry). `CURVE_HIT_DISTANCE = 8` is MSC hit geometry, not a chrome token — do not fail the lint on that constant.

## Out of scope

AT-ALB-9. Autofit tests unless a regression is found — then FAIL C2, do not “fix Autofit” in this packet (re-seed viewport).

## Done when

`gate-reports/C2-3-kilo.md` command + output per AT.
