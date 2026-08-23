# W1-G — Wiki Spec v1.2 (plan v1.1)

**Date:** 2026-08-22  
**Delta:** **PASS** (publish path defect closed)  
**Law:** DL-544 · OD-WK2 stubs · OD-WK9 publish hook  
**Fix:** `326100c` — `on_board_published` upserts **one** `wiki_pages_idx` row. **Never** `wiki_store.reindex`.

## Criteria

| Check | Result |
|-------|--------|
| Declared surface list | `iki.wiki.entry`, `iki.wiki.article`, `iki.runner`, `iki.factory` |
| AT-WA3 capture | query/entity/screenshot stripped; `journal.*` refused |
| AT-WK11 same identity | second admin-point = same open row |
| AT-WA4 compile now | HTTP `compiling` then board card `product_line=wiki` |
| Help/both | 400 HELP_TARGET_DISABLED |
| AT-WA7 widen | refused |
| AT-WK13 wiki-only | one idx row; `wiki_store.reindex` monkeypatched to raise if called |
| Idx count on publish | `after == before + 1`; probe slug `zzwikicompile-*` deleted; count restored |
| Navigator | compile APIs 404 |
| Checkout index after tests | `SELECT COUNT(*) FROM wiki_pages_idx` = **86** (53 published, 33 draft). No `compiled-%` / `zzwikicompile-%` rows |

```
cd server && .venv/bin/python -m pytest tests/test_wiki_compile_w1.py -q
8 passed

cd server && .venv/bin/python -m pytest tests -q
5 failed, 1093 passed, 4 skipped
```

Failures are `tests/test_strategy_lab_curate.py` (`Phase 'development' is full (max 100)`). Frozen tree (DL-539). Not this packet. Wiki compile tests green.

W2 (help) and W3–W4 (watcher kinds) remain blocked on parents.
