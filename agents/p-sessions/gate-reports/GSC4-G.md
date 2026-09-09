# GSC4-G — chart · controls · copy · hatch

**Delta** · 2026-09-09 · Ernies-MacBook-Pro.local  
**Verdict:** **PASS**

OD-S4 **(c)**. Contract: `evidence/echo-visual-contract.md`. Spec v0.2.

## Geometry

`evidence/gsc4/walk.json` + shots: 2026-09-08 open + ribbon; 2026-11-27 early + truncated Afternoon, no Closing, warning times; 2026-11-26 hatch / no ribbon / no RTH; 2026-09-05 weekend hatch; 2026-10-12 Toronto open. Sticky gutter true after scroll. Fit shot on disk.

## Purity

Components render `sessionView`. No `marketCalendar` import in the view tree. No `statusFor`. No pan via `scroll`. No `next/dynamic`. No storage / XHR / WS. Labels from the view-model (`etLabel` / segment labels).

## Allowlist

`web/components/resources/sessions/{SessionMap,SessionControls,StatusBanner,ClosuresList}.tsx` · `web/app/resource/sessions/page.tsx`.

## BLOCKERS

*(empty)*

## NOTES

`closures` comes from sessionView (GSC2.5 note). Tango §11 strings include clock facts (CME halt, 12:30) as disclosures, not ES range labels.
