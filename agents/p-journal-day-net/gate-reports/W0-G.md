# W0-G — Program lock

**Verdict:** PASS  
**Date:** 2026-08-09  
**Coach GO:** Received (session) with plan defaults — toggle ON · buckets $50/$250/$1k/$5k · R:R when density allows · JED-4 deferred

## Evidence

| Item | Status |
|------|--------|
| Spec v0.2 + Claude SOUND notes C1/C2 | Landed |
| Hotel W0-2 aggregation sentence | **Locked in code** `trade_log_domain/day_net_calendar.py` module docstring |
| Lima W0-4 | Ratified for build (decision in Spec + Resolution; not “shipped”) |
| Implementation started same body of work | JED-1 / 1b / 2 / 3 in progress |

### Hotel C1 (aggregation)

> Day R:R is the **unweighted arithmetic mean** of `entry_r2r(open)` for each matched structure whose **close realizes** on calendar day D (ET). Opens with undefined entry R:R are excluded; `day_r2r_sample_n` counts only included opens.
