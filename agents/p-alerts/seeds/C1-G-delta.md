# Seed C1-G — Delta Builder/holder gate

**Project:** p-alerts  
**Agent:** Delta  
**Phase:** C1  
**Depends:** C1-2 + C1-3 + C1-4  
**Gate it feeds:** Packet S (with M-G) · C2 may proceed independently once C2-0+BA

## Evidence

AT-ALB-1, 5, 6, 7, 10 **and 11…14**. Echo C1-2 HIG section ticks **H1–H7 by id** (cite it). Kilo lint PASS (command + empty hit list). **FAIL** if `AlertBuilderDialog` still has `bg-[#2c2c2e]` or close-dot `h-3 w-3`. Lima C1-4: Analyzer Spec §1.14 cites AZ-ALB. **No `HostPnLChart` / `hostAlertMenu` in the C1 diff.** Drafts include `suite` + `severity`. Empty holder still empty. Missing Echo HIG ticks or lint → **FAIL**, not a note.

Ternary. Never waive.

## Deliverable

`gate-reports/C1-G.md`
