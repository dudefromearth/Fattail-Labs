# TLAB1-G — Delta

**Program:** Trade Log Autofilter Book universe  
**Spec:** v0.1 **BUILD AUTHORITY** · **GO SPEC DL-591** · **O1 = B DL-590** · **O2/O3 DL-591** · **GO TLAB1**  
**Date:** 2026-08-25  
**Verdict:** **PASS**

TLAB2 Help **not fired**.

---

| # | Result | Evidence |
|---|--------|----------|
| U1 | **PASS** | pytest: blotter distincts include `2022-09-06` and `2026-08-17` on a 2-row book with `limit=1` first page = 2026 only |
| U2 | **PASS** | `years=2022` and `days=2022-09-06` return the 2022 trade; `match_count=1` `book_count=2` |
| U3 | **PASS** | `PAGE_LIMIT = 80`; Autofilter fetch uses `limit: PAGE_LIMIT`; A (`full=1` as Autofilter universe) not used |
| U4 | **PASS** | list payload `match_count` / `book_count`; title `shown / total` = this page / match (filter on) or book (off) |
| U5 | **PASS** | Playwright: Journal / Reports / Retro / Playbook still show date+campaign chrome. Pages not rewritten |
| U6 | **PASS** | Default `GET /distincts` still has `months`/`sides`, no `statuses`. Find e2e 3 passed. `TradeFindTag` does not call `fetchBlotterDistincts` |
| U7 | **PASS** | `trade-log/page.tsx` has no `applyAutofilter(`; `autofilterToListQuery` + `years`/`statuses` on `fetchTrades` |

O2: shown = rows on this page of the filtered set; total = full-book match count. Unfiltered: page size / book count.

O3: Status is full-book. Alpha did not block. Over 10 000 → 422 named (`_STATUS_BUDGET_DETAIL`), client does not fall back to page-local Status menus.

## Live commands (this gate)

```
cd web && npx --yes tsx lib/autofilter/apply.test.ts
→ ok
cd web && npx --yes tsx lib/tradeLogAutofilter.test.ts
→ ok
cd web && npx --yes tsx lib/tradeLogAutofilter.tlf2.test.ts
→ ok
cd web && npx --yes tsx lib/tradeLogAutofilter.tlab1.test.ts
→ ok

cd server && .venv/bin/python -m pytest tests/test_blotter_autofilter_universe.py \
  tests/test_trade_log_domain.py::test_blotter_status_open_complete_orphan \
  tests/test_trade_log.py -q
→ 21 passed

npx playwright test e2e/trade-log-autofilter.spec.ts e2e/trade-log-find.spec.ts
→ 5 passed
```

Practice e2e identity book is one 2026 fill (curl `book_count=1`). Off-page 2022 is the pytest book, not that login.

## Isolation

Journal / Records not this stream. Find and Badge not rewritten. Help still describes the TLAF page universe until **TLAB2**.

## Stop

**TLAB1-G PASS.** Return to Coach. **Do not fire TLAB2 from this gate.**
