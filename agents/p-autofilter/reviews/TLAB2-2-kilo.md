# TLAB2-2 — Kilo

```
cd server && .venv/bin/python -m pytest tests/test_help_catalog.py tests/test_help_ai.py -q
→ 25 passed

GET /api/help/guides/trade-log-autofilter → published; body has account book;
shown = this page, total = book match; Status full-book.
No “already loaded on the page” / “already in the loaded book”.
```

App areas Trade Log / Find and Badge: account book; no “loaded blotter” / “already loaded”.
