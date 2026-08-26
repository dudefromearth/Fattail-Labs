# TLAB1-3 — Kilo

**Date:** 2026-08-25

```
cd web && npx --yes tsx lib/autofilter/apply.test.ts
→ autofilter apply.test.ts ok
cd web && npx --yes tsx lib/tradeLogAutofilter.test.ts
→ tradeLogAutofilter.test.ts ok  (autofilterToListQuery + statuses)
cd web && npx --yes tsx lib/tradeLogAutofilter.tlf2.test.ts
→ tradeLogAutofilter.tlf2.test.ts ok  (no page applyAutofilter membership)
cd web && npx --yes tsx lib/tradeLogAutofilter.tlab1.test.ts
→ tradeLogAutofilter.tlab1.test.ts ok  (U1–U7 source)

cd server && .venv/bin/python -m pytest tests/test_blotter_autofilter_universe.py tests/test_trade_log_domain.py::test_blotter_status_open_complete_orphan tests/test_trade_log.py -q
→ 21 passed

npx playwright test e2e/trade-log-autofilter.spec.ts e2e/trade-log-find.spec.ts
→ 5 passed  (U5 Journal/Reports/Retro/Playbook chrome; U6 Find and Badge)
```

U1/U2 (2022 off first page) — pytest identity with 2022 + 2026 fills: `years=2022` and `days=2022-09-06` return the 2022 row; blotter distincts include both days; Status=Open is the live 2026 expiry (2022 expired → Complete). Practice e2e login book is one 2026 fill — not a 2022 demo.

O3: `blotter_status_by_id` + list `statuses=` + distincts `statuses`. No page-local Status path on the Trade Log page.
