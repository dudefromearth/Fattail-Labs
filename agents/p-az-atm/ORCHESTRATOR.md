# ORCHESTRATOR — Analyzer Time Machine

**Juliet** owns this board. Specialists fire only from seeds. No peer-to-peer tasking.

**Plan:** [`docs/Options-Lab-Analyzer-Time-Machine-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Time-Machine-Full-Agent-Bench-Plan-v1.0.md) **v1.0**  
**Law:** AZ-ATM Spec **v0.1.5** · **DL-486** · **DL-487** · **DL-489** · **DL-491** · **DL-492**

**W0-0 STAMP · W0-BA GO** (Coach finish-line). W1-G PASS. W2 Basic chrome landed.

## DAG

```text
W0-0 … W0-BA          review
W1 math/data          after W0-BA   ← no HostPnLChart
  └── W2-0 → W2 Basic chrome        ← after queue
        └── W3 Enhanced
W4 TPO                after W1-G
W5 Kilo · W6 Lima
W-G Delta
```

## Phase order

| Packet | Fire when | Board |
|--------|-----------|-------|
| W0-0 | Coach plan stamp | **STAMP** |
| W0-1 … W0-5 | After W0-0 / W0-2 | — |
| W0-G | After W0-2…5 | — |
| W0-BA | After W0-G | **GO** |
| W1-1 · W1-2 · W1-G | After W0-BA | **PASS** |
| W2-0 | After W1-G **and** queue | **GO** (queue cleared) |
| W2-1 … W2-G | After W2-0 APPROVED | **PASS** |
| W3 | After W2-G | — |
| W4 | After W1-G | — |
| W5 · W6 | After W2-G | — |
| W-G | After W5 + W6 | — |

## Seed protocol

1. Copy seed → agent with **AZ-ATM spec v0.1.1** + this plan + charter.  
2. PASS/FAIL/BLOCKED + evidence.  
3. Delta phase gate before the next packet.  
4. Lima DL same body as code.

## Coordination

- `p-az-viewport-2d`: Packet A W-G **first** on `HostPnLChart`.  
- `p-az-algo`: W4-G **second**; Demo may consume playhead.  
- `p-alerts`: C2 **third**.  
- Landing snapshot (2026-08-20): Packet A W-G unfiled · algo W4 HOLD · C2 BLOCKED → **W2 chrome HOLD**.

## Status (live)

| Packet | State |
|--------|--------|
| Spec | v0.1.5 **DRAFT** · **DL-486** · **DL-487** · **DL-491** **ATM-O1** · **DL-492** **ATM-A1** (add fly after the day, then Algo) |
| This plan | v1.0 · **DL-489** |
| W0-0 | **STAMP** |
| W1+ | **W1-G PASS** |
| W2 chrome | **W2-G PASS** (Basic) |
