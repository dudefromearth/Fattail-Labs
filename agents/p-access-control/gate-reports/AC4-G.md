# AC4-G — Apps data-bearing floor

**Date:** 2026-08-02  
**Verdict:** **PASS**

| Item | Status |
|------|--------|
| `app:trade-log` evaluate in tool gate | `trade_log/common.py` |
| List/read capability=read | trades/accounts GETs |
| Export capability=export | io export |
| Write default capability=write | POST/PUT paths |
| hard/hide write 422 | admin API tests |

Data floor: deny_plans → read_only_floor read/export.
