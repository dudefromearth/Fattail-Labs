# Orchestrator notes — OPF

**Juliet** owns seed materialization and phase sequencing.  
**Coach** owns GO / ship.  
**Delta** owns phase gates.

Phase DAG: `W0 → T → G → R → P → D → O → B → A → K → Z`  
(R may run after T in parallel with G start; P requires G+R.)

No L5 app seeds in this program.
