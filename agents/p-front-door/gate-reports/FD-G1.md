# FD-G1 — Config, member check, order form

**Verdict:** PASS
**Date:** 2026-10-12
**Law:** Funnel spec §5–§6.3 · issue #13 tap and field rules · audit targets (one screen, no postal address, ≥44px)

## Commands

```
cd server && /tmp/fd-venv/bin/python -m pytest front_door/tests -q --tb=no
...............
15 passed in 0.38s

cd web && npx tsx lib/frontDoor/frontDoor.test.ts
front-door unit checks ok
```

`server/tests` (full characterization) was not run. This environment has no Labs `.env` and no MySQL.

## Criteria

| Check | Evidence |
|---|---|
| Core lineup in config | `test_committed_config_matches_spec`: Observer $17/wk × 6, Annual $1,997, Lifetime `price_mode=confirmed_at_checkout` with `price_cents` null. Activator, Quarterly, Monthly, Monthly intro exist and are off |
| Option flip needs no code change | `test_optional_flip_needs_no_code_change`, `test_reload_reads_flag_without_a_new_process`. Enabling a product with no Woo id raises `OfferConfigError` |
| Five states | `test_five_states_and_floor_views` plus API `test_api_five_states_handoff_evidence_and_split`. Finished Observer and lapsed annual keep membership and do not offer Observer again. Covered / lifetime have `can_buy` false |
| Woo read failure | Missing email → `unchecked`. Woo down → `sign_in_to_check`, no buy button. Client-supplied `state` → 422 |
| Handoff | URL is `https://fattail.ai/checkout/?add-to-cart={id}` only. Signature stays in JSON. Client `price_cents` / `woo_product_id` / `state` rejected |
| Order form reaches a checkout | Playwright iPhone 14 (WebKit) 9.8s and Pixel 7 (Chromium) 5.1s: form → `https://fattail.test/checkout/?add-to-cart=1718` (mocked) → confirm `FD-1001` |
| No address, ≥44px, 16px input | Same tests: no street/city/postcode inputs; submit height and width ≥44; terms row ≥44; email computed font-size `16px`; overflow ≤1px |
| Copy | `test_copy_does_not_promise_profit_or_a_trial` on member copy, nudge, offers, `FrontDoor.tsx`, `copy.ts` |

Screenshots: `gate-reports/screenshots/iphone-order.png`, `pixel-order.png`, `iphone-woo.png`, `pixel-woo.png`.

## Not claimed

Physical iPhone and Pixel were not in this environment. Device profiles stand in for that walk. Observer Woo id `1718` is the audit example and must be confirmed before `traffic_percent` leaves 0. Lifetime has no dollar amount in the spec; the card does not invent one.
