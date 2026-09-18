# T5 — ES continuous across the 09-18 roll (StudioOne)

**When:** 2026-09-18 16:40 ET. Raw prints unchanged. Derived `back-adjust-v1`.

| Check | Evidence |
|-------|----------|
| Roll | `ESU6 → ESZ6` on **2026-09-14** (volume leadership inside ROLL_DAYS of 09-18 last trade). Gap **67.75** |
| `contract_adjust` | ESZ6 0 · ESU6 +67.75 |
| /range 09-16…18 continuous | span **7575.00–7739.25 (164.25)** · 658 prices |
| /range same days raw mixed | span **7509.25–7739.25 (230.00)** · 921 prices |
| OHLC 5m 09-17 → 09-18 | last **7702.25** → first **7701.25** · seam **1.0** (not the 67.75 cliff) |
| Provenance | `{adjusted: true, method: "back-adjust", rolls: 1}` |

Published series is one ESZ6-frame terrain. Per-contract gzip remains SoR.
