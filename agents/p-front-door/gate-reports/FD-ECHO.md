# FD-ECHO — styling pass

**Verdict:** PASS
**Date:** 2026-10-12
**Commit:** follows `dc178049` (styling and copy). Screenshots in this folder are the after shots from the same tree.
**Law:** Coach Echo notes 2026-10-12. Traffic split stays 0. No Woo change. No checkout-price change.

## What the screenshots show

Before: `screenshots/before-iphone.png`, `before-pixel.png`, `before-desktop.png` (flat canvas).
After: `screenshots/after-iphone.png`, `after-pixel.png`, `after-desktop.png`. The order shots in this folder were recaptured with the dispute paragraph off the form and the acceptance row inside the product card.

Header text stays on the left. The logo on the right is the existing file `web/public/brand/fattail-labs-logo.jpg` (the same asset `SiteHeader` uses), alt text "FatTail Labs", displayed at `clamp(32px, 10vw, 40px)` with `object-fit: contain`.

## Checks

| Check | Result |
|---|---|
| `pytest front_door/tests` | 15 passed |
| `npx tsx lib/frontDoor/frontDoor.test.ts` | ok, SHA-256 fallback matches Node |
| Playwright Pixel checkout | passed (5.4s) on this UI |
| Playwright Pixel slow-3G checkout and video-off | passed (2.4m, 1.2m) |
| Playwright iPhone 14 checkout | passed (1.2m) after a screenshot-close retry |
| Playwright desktop checkout | passed (1.1m) |

iPhone and desktop had previously reached the mocked Woo page and then thrown `EAGAIN` while closing a screenshot. The spec retries that close. The passing runs are the ones above.

## Disclosure that is not on the form

The inline dispute-evidence paragraph (`PRIVACY_NOTICE` in `web/lib/frontDoor/copy.ts`) used to sit between the plans and the terms. Coach asked for that text to come off. It is not rendered, and nothing else sits between the product cards and the acceptance row. The acceptance row (checkbox and “I accept the terms and the privacy notice”) is inside the same `.fd-card` as the email, first name, last name, and product cards. Price stays on each card (`Observer · $17/week × 6`, `Navigator Annual · $1,997/year`, Lifetime “One-time · amount confirmed at checkout”). Renewal and refund language stays on the Observer card only (“Cancel any time. No refunds.”). The handoff to checkout stays the Continue button, which assigns the signed Woo URL. The paragraph is not that price, renewal, or handoff line, and no gate asserts it on the form, so it was not moved. The string remains in `copy.ts` and is unused by the form. The acceptance row and the front-door footer link the words “terms” and “privacy notice” to `https://fattail.ai/terms/` and `https://fattail.ai/privacy-policy/`. Both URLs were fetched and returned 200 (page titles “Terms - FatTail” and “Privacy Policy - FatTail”). The repo has no terms or privacy route of its own. The links open in a new tab. They sit inside the row and stop the tap from reaching the checkbox, so a tap on either word does not flip the box. Both settings live in `offers.json` and the loader refuses to boot if either URL is missing. The coarse device reading is still stored only after the checkbox. Switched-off products still carry their old disclosure strings in config and are not shown.
