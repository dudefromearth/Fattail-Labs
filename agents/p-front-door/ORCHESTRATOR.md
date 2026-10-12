# Front door — orchestrator

**Issue:** #13 Mobile checkout.
**Law:** `Specs/Observer-Navigator-Funnel-Spec-v1.0.1.md` §5–9 · `Specs/WP-Labs-Cutover-Design-v1.0.1.md` Phase 1–2.
**Plan:** `BUILD-PLAN-v0.1.md` (human approval steps dropped by DL-826).
**Token:** `agents/go/FD-W0.md`.
**Status:** built in this run. Not deployed. Traffic split default 0%.

## Board

| Phase | Gate | Result |
|---|---|---|
| FD-W0 reviews, REQ-030, GO | FD-G0 | PASS |
| FD-W1 config, member check, order form | FD-G1 | PASS |
| FD-W2 pages, routing, speed, nudge, evidence | FD-G2 | PASS |
| FD-W3 automated phone profiles | FD-G3 | PASS (Coach's own phone still open) |
| FD-W4 split mechanism | FD-G4 | PASS at 0%. Not pointed at live traffic |

## URLs (new)

| Entry | URL |
|---|---|
| Referrer router | `/front-door` |
| Sales | `/front-door/start` |
| Video | `/front-door/watch` |
| Order form | `/front-door/order` |
| Confirmation | `/front-door/confirm` |

No 301. No edit to an existing ranking URL.

## What is config

`server/front_door/offers.json`. Flip `enabled` on Activator, Quarterly, Monthly, or Monthly intro. Monthly intro stays off until it has a Woo id (the loader refuses otherwise). Operational overrides, unset means use the file: `FRONT_DOOR_TRAFFIC_PERCENT`, `FRONT_DOOR_KILL_SWITCH`, `FRONT_DOOR_ENABLED`. Handoff signing: `FRONT_DOOR_HANDOFF_SECRET` (16+ characters). Missing secret → handoff 503, the rest of Labs still boots.

## Tests

```bash
cd server && python -m pytest front_door/tests -q
cd web && npx tsx lib/frontDoor/frontDoor.test.ts
cd web && npx playwright test --config playwright.front-door.config.ts
```

The Labs characterization suite (`server/tests`) needs the dev database and was not run in this environment.

## Open for Coach

1. Lifetime dollar amount is not in the spec. The card says the amount is confirmed on Woo checkout.
2. Observer Woo id `1718` is the audit example. Annual `7864` and Lifetime `9816` are the plan's ids. Confirm before the percent leaves 0.
3. B6 stays open.
4. Membership FAQ still says finishers keep courses for a year. Not edited (existing page).
5. IKI Labs floor is not formulated. Copy says the floor exists and does not invent the offering.
6. A4 legal review of the coarse device reading. The notice is on the form. No fingerprint on page load.
7. Staging and Coach's phone. This run used Playwright iPhone 14, Pixel 7, and Pixel 7 at 500 kbps / 400 ms.
8. Track A on the live Woo theme was not done.
