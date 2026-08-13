# P2-3 Condition inclusion vs Massive daily (OPEN — bin gate)

**Not frozen.** All-prints tape vs Massive daily bar `v`.

| Symbol | Day | Tape prints | Tape size sum | Massive daily `v` | Relative error |
|--------|-----|-------------|---------------|-------------------|----------------|
| SPY | 2024-06-03 | 468,425 | 51,189,810 | 46,835,702 | **+9.30%** |

All conditions included. Sample JSON: `p2-conditions-sample.json`.

Coach must choose include/exclude list (odd lots, average-price, derivatively priced, form-T, etc.) and record the achieved tolerance into `algo_version` changelog. **No production bin writes until C-0.**
