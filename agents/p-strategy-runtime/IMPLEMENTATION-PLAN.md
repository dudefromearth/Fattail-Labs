# p-strategy-runtime — Implementation Plan (summary)

**Canonical full plan:**  
[`docs/Strategy-Lab-Process-Runtime-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Strategy-Lab-Process-Runtime-Full-Agent-Bench-Plan-v1.0.md)

**Canonical scope:**  
[`docs/Strategy-Lab-Process-Runtime-Implementation-Scope-v1.0.md`](../../docs/Strategy-Lab-Process-Runtime-Implementation-Scope-v1.0.md)

## Phase → Spec PR map

| Board phase | Spec | Intent |
|-------------|------|--------|
| SR0 | PR0 | Spec reviews + Coach GO; open external legal track |
| SR1 | PR1 | Instance + envelope + decision_log (no tick loop) |
| SR2 | PR2 | Arming + attestation |
| SR3 | PR3 | Deployment Pack export |
| SR4 | PR4 | Tradier paper open + O-* dedupe + reconcile |
| SR5 | PR5 | Broker-held exits matrix |
| SR6 | PR6 | Dry-run evaluator |
| SR7 | PR7 | User-local worker (M2) |
| SR8 | PR8 | Live (LEGAL-LIVE required) |
| SR9 | PR9 | Journal/Habit hooks (optional) |
| SR10 | PR10 | M3 + admin (Coach GO only) |
| CLOSE | — | As-built + program gate |

## Critical path (v1 vertical slice)

```text
SR0-G → SR1-G → (SR2 ‖ SR3 ‖ SR6) → SR4-G → SR5-G → [LEGAL-LIVE] → SR8-G
                 └→ SR7-G (after SR3)
```

## Sequencing law

> **No SR1+ code until SR0-G PASS.**  
> **No production live / attestation retention until Coach LEGAL-LIVE = GO.**  
> **No SR10 until explicit Coach M3 GO.**
