# PPL3-0 — API close gates + delete 409

**Project:** Practice Position Lifecycle  
**Agent:** Alpha  
**Depends:** PPL2-G  
**Feeds:** PPL3-G

## Intent

| Path | Behavior |
|------|----------|
| POST `/api/me/trade-log/trades` close | Four gates. 422 without override. Overrides in **payload**, not cookie |
| PATCH `/trades/{id}` that becomes / re-keys a close | Same gates |
| DELETE `/trades/{id}` of TO_OPEN with any non-synthetic `closes[]` slice | **409**, names blocking close id |
| Import commit | **Do not implement** unless OD-25 Override on the token |

Domain validators live so omitting the sheet cannot skip a **gated** path.

## Files in scope

- `server/routes/trade_log/trades.py`
- `server/trade_log_domain/` (new validator module OK; **not** FIFO rewrite)
- Tests AT-PPL-6, 7, 12 invert

## Out of scope

Import commit (OD-25). Soft-trash (OD-19). Client kit (PPL3-1). Frozen trees.

**Depends also:** **PPL3-4** (caller audit) **before** inverting AT-PPL-6.

## Done when

Pytest: unguarded violating close → 422; paired/partial open DELETE → 409; unmatched open DELETE still 200; AT-PPL-1 green. **PPL3-4 inventory cited.** Do not invert AT-PPL-6 until every TO_CLOSE writer is classified.
