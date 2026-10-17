# FD-G2 — Pages, routing, speed, nudge, evidence

**Verdict:** PASS
**Date:** 2026-10-12
**Law:** Funnel spec §6–§9 · cutover hard rule (never a 301)

## Commands

Playwright, 2026-10-12 23:17–23:21 UTC:

```
cd web && npx playwright test --config playwright.front-door.config.ts
  ✓  [iphone] checkout completes on this device (9.8s)
  ✓  [pixel] checkout completes on this device (5.1s)
  ✓  [pixel] member states, links, and referrer routing (5.4s)
  ✓  [pixel-slow-3g] checkout completes on this device (2.4m)
  ✓  [pixel-slow-3g] slow connection keeps the video off and still reaches checkout (1.2m)
  4 skipped
  5 passed (4.0m)
exit_code: 0
```

Slow project: CDP 500 kbps, 400 ms latency, CPU 4×, and `/front-door/ping` aborted so a failed probe lands in the slow bucket.

Pytest evidence cases are in the same 15-pass run as FD-G1 (`test_referrer_matrix`, `test_evidence_moments_retention_and_stale_usage`, `test_past_due_keeps_access_and_nudge`, `test_dropoff_summary`).

## Criteria

| Check | Evidence |
|---|---|
| Referrer matrix | YouTube referrer → `[data-entry=watch]`. Google referrer → `[data-entry=start]`. Direct `/front-door/order` ignores referrer. Pytest covers email, empty, and unknown → order. Rendered in place; no HTTP redirect |
| No dead ends | Sales page shows `fd-link-order` and `fd-sales-cta` (height ≥44). Order page shows links to start and watch |
| Slow checkout | Pixel slow-3G reaches `fd-success` with order `FD-1001` and `[data-speed=slow]` |
| Video off when slow | `/front-door/watch` shows `fd-no-video`. Config `vsl_url` is empty, so no `<video>` is emitted |
| Failed payment | Navigator annual fixture with a nudge: `fd-covered`, `fd-nudge` ("Your payment didn't go through" / "Update your card"), zero `fd-submit`. Card link is Woo My Account from config |
| Evidence | Page load rejects a fingerprint. Terms require the checkbox and matching versions; coarse fingerprint only on that moment. Payment stores `woo_order_id`, `charge_id` null, `charge_source` `woo_handoff`. `retain_until` is two calendar years. Usage `{ok:false}` assembles as stale with a freshness footer, not "member did nothing" |
| Privacy notice | Order form renders `data-testid=fd-privacy` |
| SEO | Front-door layout is `noindex`. Sales page emits FAQ JSON-LD from config disclosures. No existing ranking URL edited. No 301 |

Screenshots: `pixel-slow-3g-order.png`, `pixel-slow-3g-woo.png`, `pixel-slow-3g-confirm.png`, `pixel-slow-3g-watch.png`, `pixel-covered.png`.

## Not claimed

Audit baseline (pricing LCP 23.9s, 76 requests, 1.4 MB) was not re-measured on the live site. This run did not add a Lighthouse budget assertion. The slow path is "bare form, no video, checkout still completes," which is the spec's two-bar rule.

Stripe test-card declines on Woo staging were not run. B6 stays open and this environment does not call live Woo. The nudge is the member-facing failed-payment state.

Evidence rows were proven on `MemoryStore`. Migration `155_front_door.sql` is in the tree and was not applied (no database). A missing table returns HTTP 503 rather than a fake success.
