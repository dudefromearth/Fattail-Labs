# PPL3-4 — Enumerate TO_CLOSE writers (Advisor Adv-3)

**Project:** Practice Position Lifecycle  
**Agent:** Alpha (Kilo cites the inventory at PPL3-G)  
**Depends:** PPL2-G · **before** inverting AT-PPL-6  
**Feeds:** PPL3-G

## Intent

PPL3 422 on ungated closes will break any current writer that posts a `TO_CLOSE` without an override. Import commit is the named exemption (OD-25 silent default). **Everything else must be listed.**

Enumerate every writer of a `TO_CLOSE` fill. For each: **override in payload** · **exempted** · **test that inverts** · or **must change in this packet**.

Starting list (not exhaustive — grep is the job):

| Writer | First guess |
|--------|-------------|
| `POST /api/me/trade-log/trades` (TradeSheet) | Gated — this packet |
| `PATCH /trades/{id}` | Gated — this packet |
| `POST .../import/commit` | OD-25 exempt (default) |
| `server/seed_trade_log_demo.py` | Inventory: override, skip, or fix |
| `server/seed_clone_trade_log.py` | Inventory |
| `server/import_0dte_xlsx.py` | Inventory (not member POST; still a writer) |
| `server/tests/test_trade_log*.py` | Invert or fixture override |
| Duplicate-as-new (if it ever posts TO_CLOSE) | Inventory |

Grep `TO_CLOSE` / `pos_effect` writes in `server/` and `web/`. Frozen trees stay frozen — if a writer lives in LIM/QFRIC/XS, **name it and do not edit**; raise to Coach.

## Files in scope

- Gate-report inventory markdown under `gate-reports/ppl3-close-writers.md`
- Test/seed files **only** if a writer must be fixed to keep demo/tests honest
- Do **not** expand PPL3 into Import Manager restyle

## Out of scope

Matcher. Client kit (PPL3-1). Soft-trash. Frozen product trees.

## Done when

Inventory exists. Every row classified. PPL3-G can cite it. AT-PPL-6 is **not** inverted until this seed is done.
