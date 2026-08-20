# ORCHESTRATOR — Analyzer 2D Return vs Hard Refresh

**Juliet** owns this board. Specialists fire only from seeds.

**WHAT:** [`docs/Options-Lab-Analyzer-Viewport-Return-Hard-Refresh-Analysis-2026-08-19.md`](../../docs/Options-Lab-Analyzer-Viewport-Return-Hard-Refresh-Analysis-2026-08-19.md)  
**Plan:** [`docs/Options-Lab-Analyzer-Viewport-Return-Hard-Refresh-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Viewport-Return-Hard-Refresh-Full-Agent-Bench-Plan-v1.0.md) **v1.0.1** (RH-B1 · RH-A2)

Coach splitter: **hard refresh works · leave and return, drag and scroll do not.**

## DAG

```text
W0-0 Coach stamp
W0-1 Lima
W0-2 … W0-5     review (India names file lock or TBD)
W0-M Kilo FAIL  ∥ after W0-0
W0-G Delta
W0-BA Coach
W1 Charlie
W2 Kilo  ∥  W3 Lima  ·  W3-E Echo
W-G Delta
```

## Status (live)

| Packet | State |
|--------|--------|
| Analysis | **Landed** |
| This plan | **v1.0.1 · W0-0 STAMP** |
| W0-1 | **PASS** |
| W0-2 | **APPROVED** (lock handoff named) |
| W0-3…5 | **APPROVED** |
| W0-M | **in flight** |
| Product code | Forbidden until W0-M FAIL + W0-BA |

## Coordination

- Prior board `p-az-viewport-2d`: **W-G not filed** (`W1-G.md` pending; ORCHESTRATOR W-G BLOCKED). Packet B stays there. **RH-B1:** India names lock handoff; do not assume Packet A lock is over.  
- W0-M may run with W0 review. **W0-BA waits for W0-M FAIL** unless Coach DL names bypass.
