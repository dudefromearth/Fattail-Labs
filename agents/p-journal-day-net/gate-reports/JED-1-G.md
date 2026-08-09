# JED-1-G — Day net calendar API

**Verdict:** PASS  
**Evidence:** `server/trade_log_domain/day_net_calendar.py` · `GET /api/me/journal/day-net-calendar` · `tests/test_day_net_calendar.py` (5 passed)

- Fixed intensity buckets  
- Period sum = Σ day nets  
- Scope: account loader + campaign/undirected filters  
- Hotel aggregation implemented as documented  
