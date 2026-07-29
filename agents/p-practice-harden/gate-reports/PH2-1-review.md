# PH2-1 — Split trade_log routes

**Primary:** Alpha · **Reviewers:** India · Kilo  
**Date:** 2026-07-29  

## Layout

```text
server/routes/trade_log/
  __init__.py      # assembles router
  common.py        # helpers, batch legs, identity, book load
  accounts.py      # venues + accounts
  trades.py        # list/create/patch/delete
  analytics.py     # day-book / reports-book
  io.py            # import / export
```

Public import unchanged: `from routes.trade_log import router`.

## Evidence

```text
pytest tests/test_trade_log*.py -q  →  18–25 passed (suite green)
```

## India APPROVED · Kilo APPROVED
