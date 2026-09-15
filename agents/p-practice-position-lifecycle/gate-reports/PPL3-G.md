# PPL3-G — W2 write integrity + kit confirm

**Delta** · 2026-09-14 · StudioTwo · parent HEAD `186a74ff` · **landed** `9e7659e9` `origin/main`  
**FIFO matcher:** not edited (`matching.py` diff empty).  
**Inventory:** [`ppl3-close-writers.md`](./ppl3-close-writers.md) cited before AT-PPL-6 invert.

## Verdict

**PASS** for the PPL3 lock + trade-log cluster.

B1 product code remains **illegal** until PPL4-G also PASSes. PPL4 is **blocked** on OD-9, OD-22, FI-PPL-1.

## AT invert

| AT | After PPL3 |
|----|------------|
| **AT-PPL-1** | Keep green |
| **AT-PPL-2…5** | Stay inverted from PPL2. Partial 1-of-5 POST now sends `allow_partial_units`. DELETE of that open is **409** |
| **AT-PPL-6** | Ungated orphan POST → **422** `orphan_close`. `allow_orphan_close` → 200 |
| **AT-PPL-7** | DELETE fully paired open → **409** naming close id. After deleting the close, open DELETE → 200 |
| **AT-PPL-8/9** | Untouched (PPL4) |
| **AT-PPL-11** | No `window.confirm` in TradeSheet or blotter page. Both `useConfirm` |
| **AT-PPL-12** | PATCH re-key without override → **422** |

Mike: `test_ppl3_409_does_not_leak_other_identity` — peer DELETE → **404**, not 409.

## pytest

```
cd server && .venv/bin/python -m pytest tests/test_trade_log_domain.py tests/test_trade_log.py tests/test_capital_positions.py tests/test_csrf_m6.py tests/test_trade_log_analytics.py tests/test_trade_log_import.py -q
........................................................................ [ 97%]
..                                                                       [100%]
74 passed in 3.75s
```

Inverted ATs re-run: **6 passed** (AT-PPL-6, 7, 11, 12, isolation, int/float strike).

Full `pytest tests` not re-run (pre-existing live-xAI hang, same as PPL2-G).

## Kit

TradeSheet in-drawer `trashConfirm` + `TRASH_REASONS` chips **removed**. Sheet and blotter bulk use kit `useConfirm` → `AlertDialog`. Import Manager untouched. Echo note: `reviews/ECHO-PPL3-kit-confirm.md`. Live SSO walk of the dialog was not available in this packet; control is the existing ConfirmProvider.

## Isolation FAIL list

Empty. No `AnalyzerPositionsList.tsx`. No LIM / QFRIC / XS files. Matcher FIFO untouched.

## Parents

Trade Log Spec v1.1 §16.5/§16.7 honesty: gates are **API**, not sheet-only. DELETE 409. **DL-703**. Arch 15 §4.3/§4.4/§7.

## Next

PPL4 does **not** start because PPL3 passed. Coach must dispose OD-9, OD-22, FI-PPL-1 on the token. B1 (`PPL5-W0`) stays unstamped.
