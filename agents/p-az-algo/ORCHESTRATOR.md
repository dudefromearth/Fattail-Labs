# ORCHESTRATOR — Analyzer Algo Alert

**Juliet** owns this board. Specialists fire only from seeds. No peer-to-peer tasking.

**Plan:** [`docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md) **v1.0.3** (OD-LLM · Demo `mode` · W4-0 re-sweep)  
**Law:** AZ-ALGO Spec **v2.2.1 DRAFT** · sha1 `6f491ee8f240aa06418b8e813fdb3152ed60deb5` · **DL-661**. v2.0 SUPERSEDED. v2.1/v2.2 never landed. **Not BUILD AUTHORITY** until Appendix B goldens + OD-ALGO-1. Prior: **DL-660** · **DL-472** · **DL-473** · **DL-482** · **DL-484** · **DL-485** · **DL-488**

**W0-BA GO · DL-479.** **W1–W3 stand (PASS).** W3-R additive (Reason / `engine`). **W4 HOLD** — 2026-08-20 re-sweep: Packet A W-G unfiled; C2 BLOCKED; return board product-code Forbidden.

Silent remaining: **OD-VP omit · OD-W4 HOLD while Packet A/C2 live on HostPnLChart**. OD-DEMO and OD-LLM **opened**.

## DAG

```text
W0-0 … W0-BA          review
W1 math               after W0-BA     **EXECUTED**
  ├── W2 Builder      **EXECUTED**
  │     └── W3 narrative **EXECUTED**
  │           └── W3-R Reason / engine
  └── W4-0 re-sweep → W4 canvas     **HOLD**
W5 Kilo · W6 Lima
W-G Delta
```

## Phase order

| Packet | Fire when | Board |
|--------|-----------|-------|
| W0-0 … W0-BA | Executed · **DL-479** | **GO** |
| W1-1 · W1-G | Executed | **PASS** |
| W2-1 … W2-G | Executed | **PASS** |
| W3-1 … W3-G | Executed | **PASS** |
| W3-R | After W3-G | **READY** |
| W4-0 | Re-sweep before W4-1 | **APPROVE paint-only** |
| W4-1 … W4-G | After W4-0 APPROVED | **PASS** |
| W5 · W6 | After W2-G + W3-G + W4-G | Blocked |
| W-G | After W5 + W6 | Blocked |

## Seed protocol

1. Copy seed → agent with **AZ-ALGO spec v1.0.2** + plan **v1.0.3** + charter.  
2. PASS/FAIL/BLOCKED + evidence.  
3. Delta phase gate before the next packet.  
4. Lima DL same body as code (W0-1 = DL-474 plan cite already filed if this landing is the body).

## Coordination

- `p-alerts`: C1 PASS. C2 = threshold apply, **not** this W4.  
- `p-az-viewport-2d` / `p-az-viewport-return`: do not steal pan/handles.  
- Demo / Reason: **in** (DL-485 / DL-484). W-G must show `engine` + `mode`.  
- `p-az-atm`: Time Machine chrome **behind** this W4.

## Status (live)

| Packet | State |
|--------|--------|
| Spec | **v2.2.1 DRAFT** · **DL-661** · sha1 `6f491ee8…` (not BA). ALGO-B goldens in `evidence/` |
| This plan | **v1.0.3** |
| W0-BA | **GO** |
| W1-G | **PASS** (executed · parameterized knobs) |
| W2-G | **PASS** (executed) |
| W3-G | **PASS** (executed) |
| W3-R | **READY** (additive · Tango before Bob) |
| W4-0 | **APPROVE paint-only** (Packet A W-G PASS) |
| W4-G | **PASS** |
| W5–W-G | Remaining |
