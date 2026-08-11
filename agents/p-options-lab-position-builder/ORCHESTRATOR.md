# Orchestrator notes — Position Builder & Book

**Juliet** owns seed materialization and phase sequencing.  
**Coach** owns GO / ship.  
**Delta** owns phase gates.

Phase DAG: `W0 → D → P → I → L → S → C → U → M → A → K → Z`  
(I/L/S after P with care; C needs I+L+S.)

Critical path for litmus: **P → S → C → K (R1a)**.

No OMS or full replay UX seeds (NX1 · NX3).
