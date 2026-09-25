# F5 — OHLC host (candles / time axis). VP waits.

**Agent:** Alpha (one-line server) then AP-1 Coach  
**Depends on:** F5 diagnose `gate-reports/F5-diagnose-2026-09-20.md`  
**Out of scope:** any VP fetch, `profileMode`, `/window`, `/range`, `SaPriceChart` paint

## Law

Coach F5 amendment: candle/time-axis first. Interval broken in every mode because bars never arrived.

## Files

- `server/sa_dev/futures_history.py` — `_print_tail` returns `[]` (Massive is the host; tail is a later packet)
- `server/tests/test_futures_history.py` — `test_print_tail_cannot_take_down_host`

## Done when

1. `pytest tests/test_futures_history.py` passes  
2. `GET /history/v1/ohlc/ES?tf=5m` 200 with bars (ms `t`)  
3. Same via Labs `/api/app/vp/v1/ohlc/ES?tf=5m`  
4. Commit is on the history sidecar tree, not only a live overlay  
5. Coach AP-1: candles + date axis at default 5m. **Stop.** Do not start CL-1.
