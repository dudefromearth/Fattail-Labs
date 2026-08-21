# ORCHESTRATOR — Analyzer 2D Viewport Drag & Scroll

**Juliet** owns this board. Specialists fire only from seeds. No peer-to-peer tasking.

**Review plan:** [`docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Full-Agent-Bench-Plan-v1.0.md)  
**Impl plan:** [`docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Implementation-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Implementation-Plan-v1.0.md)  
**Analysis:** [`docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Analysis-2026-08-19.md`](../../docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Analysis-2026-08-19.md)

W0 = review. W1+ = Packet A. **Do not fire W1 until W0-BA, or Coach stamps the impl plan and Lima logs a DL naming which W0 packets are bypassed.**

Silent if Coach fires without override: **VP-A1 Juliet default** (Show/Hide = draw only) unless Echo W0-3 overrules · **VP-A2** 3% wheel · **VP-B1** `PnLChart` only.

## DAG

```text
W0-0 … W0-BA          review
W1 Charlie Packet A
  ├── W2 Kilo
  └── W3 Lima  (∥ W2)
  └── W3-E Echo review (after W1)
W-G Delta
Packet B              after W-G · Echo grammar · not this fire
```

## Phase order

| Packet | Fire when | Board |
|--------|-----------|-------|
| W0-0 | Coach plan stamp | **STAMP** (`gate-reports/W0-0-coach-stamp.md`) |
| W0-1 | Lima hash | **PASS** (`gate-reports/W0-1-lima.md`) |
| W0-2 … W0-BA | Bypassed · **DL-457** | named |
| **W1-1** | Coach GO Packet A + DL-457 | **PASS** (`W1-G.md`) |
| W2-1 | W1-1 PASS | **PASS** (`W2-1-kilo.md`) |
| W3-1 Lima | W1-1 PASS | **PASS** (`W3-1-lima.md`) |
| W3-2 Echo (W3-E) | W1-1 PASS | **PASS** (`W3-2-echo.md`) |
| W-G | W2 + W3 + W3-E | **PASS** (`W-G.md`) |
| Packet B BA | After Packet A W-G · **own Coach stamp** | BLOCKED |
| WB-1 | After Packet B BA + Echo Packet B grammar | BLOCKED |

## Seed protocol

1. Copy seed → agent with analysis + **impl plan** + charter.  
2. PASS/FAIL/BLOCKED + evidence.  
3. Delta W-G before ship.  
4. Lima DL in W3, same body as code.

## Coordination

- What-If W2 closure is **India W0-2’s job** (artifact on that board). Packet A still must not touch `OpfRiskAnalyzer.tsx`.  
- Surface Autofit board stays closed.  
- AT-2D-AF-7 is this board’s `PnLChart` assertion, not a W2 reopen.

## Status (live)

| Packet | State |
|--------|--------|
| Analysis | Review-folded · VP-B1 stamped |
| This review plan | **W0-0 STAMP** · W0-1 PASS · **NEXT W0-2** |
| Impl plan v1.0 | **Landed · awaiting fire** |
| W0 | Bypassed **DL-457** |
| W1+ Packet A | **W-G PASS** |
| Packet B | Own BA (handles as-built; not this fire) |
