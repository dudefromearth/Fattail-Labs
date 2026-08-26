# TLAF3-2 — Kilo — help catalog + concierge

**Agent:** Kilo  
**Date:** 2026-08-25

## Commands

```
cd server && .venv/bin/python -m pytest tests/test_help_catalog.py tests/test_help_ai.py -q
→ 25 passed in 0.33s
```

Live (API :4000):

```
GET /api/help/guides → trade-log-autofilter in articles (n=10)
```

## Checks

| Check | Result |
|-------|--------|
| File on disk | `server/help_reference/trade-log-autofilter.md` |
| Catalog list includes id | **PASS** `test_trade_log_autofilter_published` |
| GET by id 200 published | **PASS** |
| Concierge headings (9) | **PASS** `test_search_trade_log_autofilter` |
| Search “trade log autofilter” | hits title bar / Trade history |
| Four columns search | Exec time, Campaign, Symbol, Status |
| Find and Badge Autofilter still hits | **PASS** existing `test_search_find_and_badge_and_autofilter` |
| Forbidden hunt copy | no “winning”, “show me the edge”, journal/records Autofilter |
