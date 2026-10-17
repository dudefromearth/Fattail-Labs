# FD-G4 — Traffic split mechanism

**Verdict:** PASS
**Date:** 2026-10-12
**Law:** Cutover Phase 2 mechanism only. Committed split stays 0%. Not pointed at live traffic.

## Evidence

`test_traffic_split_and_kill` and the API split case in `test_api_five_states_handoff_evidence_and_split` (15 passed, 0.38s):

- Bucket is `int(sha256(visitor_key).hexdigest()[:8], 16) % 100`. `visitor-stable-key` buckets to 80.
- Admitted only when the flag is on, the kill switch is off, and (`percent >= 100` or the bucket is under the percent).
- `traffic_percent` 0 admits nobody.
- A partial percent with no visitor key fails closed (`needs_visitor`).
- Kill switch admits nobody.
- Invalid `FRONT_DOOR_TRAFFIC_PERCENT` / kill / enabled values raise. Unset uses the file. Prices are not env-overridden.
- Closed door renders `fd-closed` and does not redirect.

Committed `server/front_door/offers.json`: `feature_flag` true, `traffic_percent` 0, `kill_switch` false. Playwright sets `FRONT_DOOR_TRAFFIC_PERCENT=100` on its Next process only.

Wrong-state buy buttons: `can_buy` false (covered, lifetime, finished Observer, lapsed annual, sign-in, unchecked) yields no purchasable products. Playwright confirms zero `fd-submit` on the covered view.

## Not claimed

A live 10% split was not turned on. No deploy, no MiniTwo, no production nginx. Issue #13 is ready for Coach to close after a look at the screenshots; this run does not close it.

Rollback remains: flag off or percent 0. Old URLs were not changed, so there is no redirect to undo.
