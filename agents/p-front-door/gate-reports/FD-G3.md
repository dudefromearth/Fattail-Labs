# FD-G3 — Issue #13 acceptance

**Verdict:** PASS
**Date:** 2026-10-12
**Law:** GitHub issue #13 (mobile checkout) · DL-826 (automated gate; Coach's phone is an open item, not a waived check)

Playwright profiles: iPhone 14 / WebKit, Pixel 7 / Chromium, Pixel 7 with slow-3G emulation. Same run as FD-G2 (`5 passed`, exit 0).

| #13 box | Evidence |
|---|---|
| Checkout completes on iOS Safari and Android Chrome | WebKit iPhone 14 and Chromium Pixel 7 both reach Woo mock then `fd-success` / order `FD-1001` |
| No horizontal scrolling or clipped fields | `scrollWidth - clientWidth ≤ 1` on the order form before submit, both profiles and the slow profile |
| Payment step works without desktop-only interactions | Submit and the mocked Pay control are taps. No hover-only control |
| Error and success states are clear on a small screen | Success: heading "Payment handed off", status text names the Woo order id. Covered member: "You're already covered" plus the card nudge, and the buy button is absent. Confirm without an order id renders "Payment is not confirmed" (`fd-error`); that branch is in `Confirm` and was not a separate Playwright navigation |
| End-to-end test recorded | `gate-reports/screenshots/` — order, Woo handoff, and confirm for iPhone, Pixel, and Pixel slow-3G, plus the covered state and the slow watch page |

Audit assertions in the same checkout test: one screen (email, first name, last name, product, terms); no postal address fields; PayPal and Stripe strings absent from the front-door HTML; tap targets ≥44px.

## Not claimed

Coach has not signed off on a physical phone. Staging (`labs-stage`) was not deployed. These stay open for Coach. They do not fail the automated boxes above.

Issue #13 is not closed by this gate.
