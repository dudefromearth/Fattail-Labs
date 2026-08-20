# Seed C2-2 — Echo canvas grammar review

**Project:** p-alerts  
**Agent:** Echo  
**Phase:** C2  
**Depends:** C2-1  
**Gate it feeds:** C2-G

## Intent

Right-click alerts do not steal pan or handle drag. Menu HIG. 44pt rows. No left-click menu. **Do not invent keyboard nav for the canvas context menu** — header **+** is the a11y path (AZ-ALB §3.3).

## Named section (required)

**HIG / tokens-and-primitives** — tick plan **§8.5 H9** by id. Menu 44pt; token chrome; **+** is a11y; **do not** invent keyboard nav. “HIG looks fine” without H9 → **RETURNED**. Delta C2-G cites this section.

## Files in scope

C2-1 paths **read**.

## Done when

`gate-reports/C2-2-echo.md` APPROVED or RETURNED **with the named HIG section**.
