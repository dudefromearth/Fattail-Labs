# Orchestrator notes — p-campaign-structured-practice

## Sequencing (summary)

```text
W0-G → M1-G → M2-G → M3-G → B1-G → B2/B3 → U* → X1-G → Z-G
```

Critical path and parallel rules: **bench plan §7**.

## Rules

1. No product work before **W0-0 Coach GO** + **W0-G** (seeds on disk, §13 dispositions written).  
2. Coordination only via Coach / Juliet.  
3. Delta never PASS without Kilo evidence on implementation phases.  
4. Declare exact files before touch.  
5. Guide changes only in feature PRs (F1).  

## Gate reports

Write PASS/FAIL/BLOCKED under `gate-reports/` with evidence paths.
