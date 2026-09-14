# PPL1-G — W0 characterization lock

**Delta** · 2026-09-14 · StudioTwo · HEAD `87ab8748`  
**Kilo** · tests-only · no product code

## Verdict

**PASS** (lock green on current main; invert later — do not start PPL2 in this packet)

## pytest

```
cd server && .venv/bin/python -m pytest tests/test_trade_log_domain.py tests/test_capital_positions.py tests/test_trade_log.py -q
............................................                             [100%]
44 passed in 2.09s
```

## Diff (tests-only)

```
 server/tests/test_capital_positions.py |  58 ++++++++
 server/tests/test_trade_log.py         | 233 +++++++++++++++++++++++++++++++++
 server/tests/test_trade_log_domain.py  |  80 +++++++++++
 3 files changed, 371 insertions(+)
```

No `server/trade_log_domain/` FIFO, no `AnalyzerPositionsList.tsx`, no LIM/QFRIC/XS/Market Bus/OPF.

## AT map

| AT | Lock (today) | Invert |
|----|--------------|--------|
| **AT-PPL-1** | `test_partial_close_leaves_remaining_units_open` — `close is None`, `open_units==5`, `closed_units==1` | **Never** (matcher freeze) |
| **AT-PPL-2** | blotter: close **Orphan**, open **Open** | PPL2 |
| **AT-PPL-3** | `open_qty_and_avg_cost` qty **5** | PPL2 |
| **AT-PPL-4** | GET `/opens` lists the 5-unit open | PPL2 |
| **AT-PPL-5** | DELETE that open while 1-unit close exists → **200** (server equivalent of `canDeleteTrade` ok:true; TS in PPL2) | PPL2 |
| **AT-PPL-6** | orphan TO_CLOSE POST → **200** | PPL3 |
| **AT-PPL-7** | DELETE fully-paired open → **200**, no 409 | PPL3 |
| **AT-PPL-8** | `member_trade_log_imports` has no from/to | PPL4 |
| **AT-PPL-9** | day-book empty at +31d; blotter still Open | PPL4 |

## AT-PPL-1

Untouched Keep. Existing `test_partial_close_leaves_remaining_units_open` still in the 44-pass set. Not duplicated.

## Next

PPL2 (read models). Do not start until Coach/Juliet fires it. PPL1 does not authorize product edits.
