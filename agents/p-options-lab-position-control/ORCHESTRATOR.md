# Orchestrator notes — Position Control

**Juliet** owns seed materialization and phase sequencing.  
**Coach** owns GO / ship.  
**Delta** owns phase gates.

**Plan:** `docs/Options-Lab-Position-Control-Full-Agent-Bench-Plan-v1.1.md`  
**Spec:** `Specs/FatTail-Labs-Options-Lab-Position-Control-Spec-v1_2.md`  
**Token:** `agents/go/PC-W0.md`

**MACHINE: COACH'S MACBOOK (dev).** No Mini Two. No staging.

Phase DAG: `W0 → PC0 ∥ PC1 → PC4 → PC2 → PC3 → PC5 → PC6 → PC7 → PC8` with **PC9a** off PC3 and **PC9b** off PC6 → PCZ

**OD-PC-P1 (b):** PC0 runs first — do not hold it behind remaining W0 paperwork.  
**OD-PC-P2 (a):** Hotel classifier confirm same day as GO; not a gate on starting.

Critical path for the three litmus tests: **PC4 → PC2 → PC3 → PC5 → PC6**.

No OMS, no deploy, no MSC seeds.

Do not reopen `p-options-lab-position-builder` as a second SoR.
