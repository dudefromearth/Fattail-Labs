# ORCHESTRATOR — Analyzer What-If Time & Measured Vol

**Juliet** owns this board. Specialists fire only from seeds. No peer-to-peer tasking.

**Review plan:** [`docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Full-Agent-Bench-Plan-v1.0.md)  
**Impl plan:** [`docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Implementation-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Implementation-Plan-v1.0.md)

W0 = spec review. W1+ = implementation. **Do not fire W1 until W0-BA, or Coach stamps the impl plan and Lima logs a DL naming which W0 packets are bypassed.**

Silent ODs if Coach fires without override: **OD-1 B · OD-2 A · OD-3 B**.

## DAG

```text
W0-0 … W0-BA          review (optional if Coach fires impl directly)
W1 Charlie helpers
  ├── W2 Analyzer inspector
  └── W3 Surface What-if HUD
        └── W4 Kilo
W5 Lima  (∥ W4 after W2+W3)
W-G Delta
```

## Phase order

| Packet | Fire when | Board |
|--------|-----------|-------|
| W0-0 … W0-BA | Review gauntlet | Landed, not required if Coach stamps impl plan |
| **W1-1** | Coach fire impl plan | **PASS** (`67c50aa`) |
| **W2-1** | W1-1 PASS | **PASS** (`23c2f83`) |
| **W3-1** | W1-1 PASS (∥ W2) | **in flight** |
| W4-1 | W2 + W3 | BLOCKED |
| W5-1 | W2 + W3 | BLOCKED |
| W-G | W4 + W5 | BLOCKED |

## Seed protocol

1. Copy seed → agent with Spec + **impl plan** + charter.  
2. PASS/FAIL/BLOCKED + evidence.  
3. Delta W-G before ship.  
4. Lima DL in W5, same body as code.

## Coordination

- Analyzer residual / Surface first-ship stay on their boards.  
- This program does not amend OPF τ or `/resolve`.  
- Ratio vol (OD-1 A) is an OPF delta — not W1–W3.

## Status (live)

| Packet | State |
|--------|--------|
| Spec v0.1 India fold | DRAFT |
| W0 review board | Landed |
| Impl plan v1.0 | **GO** · DL-451 named W0 bypass |
| W1 helpers | **PASS** `67c50aa` |
| W2 Analyzer | **PASS** `23c2f83` |
| W3 Surface HUD | in flight |
