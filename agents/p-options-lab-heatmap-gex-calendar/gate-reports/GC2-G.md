# GC2-G — compute

**Delta** · 2026-09-18 · **PASS**

`web/lib/options-lab/templates/gexCal.ts` calls `gexSide` / `gexNet` / `gexAbs` only.

| AT | Hotel golden | Test |
|----|--------------|------|
| AT-GC2 | NET 0/0, bar 88000 / −88000, peak 95 (tie lowest) | PASS |
| AT-GC4 | sign t stays negative when scale doubles | PASS |
| AT-GC5 / AT-GC10 | missing put → invalid, blank, NET omits | PASS |
| AT-GC13 | `$0` vs blank | PASS |

Command: `cd web && npx --yes tsx lib/options-lab/templates/gexCal.test.ts` → `gexCal.test.ts PASS`
