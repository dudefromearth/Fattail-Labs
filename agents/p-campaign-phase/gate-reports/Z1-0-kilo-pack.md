# Z1-0 — Kilo Spec §10 pack

**Status:** PASS  
**Date:** 2026-08-09  

| # | Case | Evidence |
|---|------|----------|
| 1 | Big Three 422; trade undirected ok | `test_big_three_required_on_activate` |
| 2 | Max DD percent only | `test_max_dd_percent_only` |
| 3 | End required to complete | `test_end_required_to_complete` |
| 4–5 | Strategy list unadopted/adopted | storage null vs list; witness path later |
| 6–7 | Same-bet adopt/un-adopt + version | `test_post_sign_adopt_unadopt_bumps_version` |
| 8–9 | Free cash / structure_risk_open | `test_phase_report_strip_and_p13` |
| 10 | No correlation strip | report payload + UI |
| 11 | No P&L prune rank | lifecycle toolbar only |
| 12 | Definition above radar | layout + definition block |
| 13 | P13 allocation denominator | unit + API |
| 14–15 | CR-12 create only | banner on create; G1-2 umpire |

```
pytest tests/test_campaign_phase_charter.py tests/test_practice_spine.py → green
```
