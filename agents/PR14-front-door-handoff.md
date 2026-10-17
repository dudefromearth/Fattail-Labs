# Handoff: FatTail Labs front door (mobile product page + checkout), 2026-10-12, 8:50 PM ET

## Repo and PR
- Repo: dudefromearth/Fattail-Labs. Issue #13. Draft PR #14: https://github.com/dudefromearth/Fattail-Labs/pull/14
- Branch: cursor/front-door-mobile-checkout-395f
- Commits:
  - 65e19e28 (7:22 PM ET): original build.
  - dc178049 (8:24 PM ET): Coach's batch. The cloud build agent that made it (bc-53667ad8-062b-5c66-92f3-5d08b56a395f) was still running desktop Playwright tests and may push again.
- Rules:
  - Do NOT merge. The traffic split (FRONT_DOOR_TRAFFIC_PERCENT) stays at 0.
  - Never deploy to production or MiniTwo.
  - Commit by explicit path only. No push unless asked.
- Gates FD-G0 to G4 passed on 65e19e28. pytest 15 passed. Playwright 5 passed, 4 skipped. The full server suite needs MySQL and was not run.

## What dc178049 is supposed to contain (verify each item)
- Styling: warmer, higher contrast; shadows on all major elements; selected plan raised; buttons sink on press.
- One main panel holding the product cards, email, first name, last name and the terms row.
- Terms row: about 48pt tall, about 28pt checkbox, the whole row tappable, and it changes color when checked.
- Floating labels on the email, first-name and last-name fields.
- Removed: the text between the cards and the terms row (the agent was told to flag any spec-required disclosure instead of silently dropping it); the "we check membership on this email" line at the top. The membership check itself still runs.
- FatTail Labs logo (an existing repo asset) on the right of the header line, header text on the left.
- Card copy:
  - Observer's small line reads "Cancel any time. No refunds." and $17/week stays in the title.
  - "No refunds" is removed from Navigator Annual and Navigator Lifetime.
- Terms and privacy links go to https://fattail.ai/terms/ and https://fattail.ai/privacy-policy/, set in config so they can be swapped later.
- Form persistence:
  - per tab, in sessionStorage;
  - restored when the visitor comes back;
  - cleared after the payment handoff;
  - never stores payment details.
- Fallbacks in the PR code for crypto.randomUUID and crypto.subtle, which browsers only provide over HTTPS. Over plain http both are missing, and that caused the reload loop and the error at Continue.
- Checkout logic and pricing are unchanged.
- Pending: the agent was asked for iPhone 14 screenshots (fd-iphone-<n>.png in its artifacts folder) of the form, each plan, a pressed button and the confirm page.

## StudioTwo preview (updated 2026-10-12, takeover)
- Worktree /Users/ernie/FatTail-Labs-preview-fd is detached at 38ef9300 (PR tip: terms and privacy links). Preview-only extras stay in /Users/ernie/FatTail-Labs-preview-fd-sim/. Nothing preview-only goes in the repo.
- Production rebuild of web/ succeeded (Next 16.2.10, 85 pages). Preview job ai.fattail.fd-preview was stopped, then started again on 127.0.0.1:3314. Mock API was restarted so it loads the new offers.
- Walk on http://127.0.0.1:3311/front-door/order, Chromium desktop and WebKit iPhone 14: the order URL stayed put for 60 seconds with no further navigation. Form draft restored after reload. Observer selected, terms checked, Continue landed on /front-door/confirm?preview=1&order_id=PREVIEW. The form draft was cleared. No page errors.
- The confirm sentence still says WooCommerce took the payment. That is the confirm-page copy. The mock never calls the live store.
- launchctl jobs:
  - ai.fattail.fd-proxy on :3311: injects polyfill.js (randomUUID plus a JS SHA-256 subtle.digest).
  - ai.fattail.fd-preview on 127.0.0.1:3314: Next production build. No dev mode, which caused the blinking.
  - ai.fattail.fd-sim on :3312: device simulator page (iPhone 14, SE, Pixel 7, iPad, desktop).
  - ai.fattail.fd-mockapi on 127.0.0.1:3313: answers as a new visitor with can_buy true. The handoff goes to /front-door/confirm?preview=1&order_id=PREVIEW, never to the live store.
  - Preview env: FRONT_DOOR_TRAFFIC_PERCENT=100.
- To update:
  1. cd /Users/ernie/FatTail-Labs-preview-fd
  2. git fetch && git checkout dc178049 (or the newest commit on the branch).
  3. Rebuild the web app in production mode.
  4. Restart the jobs.
  5. Check for 60 seconds in Chromium and WebKit, and walk the flow through to /front-door/confirm.
- Stop all jobs: for j in fd-proxy fd-preview fd-sim fd-mockapi; do launchctl remove ai.fattail.$j; done
- URLs: http://StudioTwo.local:3312 (simulator) and :3311 (page). Also 192.168.1.112 and Tailscale 100.83.63.113.

## Grok Bot connection problem (blocked the rebuild)
- From about 8:14 PM ET, StudioTwo.local and Ernies-MacBook-Pro.local both show as disconnected. Commands fail instantly with: "Your local machine isn't connected right now (the Grok Bot desktop app must be open and online to run commands on it)." Chat and voice still work.
- Connect Apps shows "could not load the marketplace." The marketplace service answered fine from the bot side. No VPN or firewall is running.
- Tried: refreshing settings, and signing out and back in (about 8:30 PM). The user could not find a Local execution row on the Computer tab.
- The bug report to the Grok Bot team was NOT sent: the approval was interrupted. To file it, use Help > Send Feedback.

## Open decisions for Coach
- Lifetime price.
- Confirm the WooCommerce product ids (Observer 1718, Annual 7864, Lifetime 9816).
- The FAQ "one year" copy.
- A legal look at the evidence data.
- A phone walk-through on staging.
- Labs-owned terms and privacy pages.
- Track A quick fixes.
- D2, edge routing.
- B6, moving billing off WooCommerce. The draft is Architecture/B6-decision-draft.md. Open questions:
  - PayPal or Stripe-only. Research finding: a PayPal popup is possible only as a separate PayPal billing system next to Stripe, because Stripe's PayPal is Europe-only. The recommendation is Stripe-only.
  - Lifetime price.
  - Discord bot timing.
  - Who sends receipts.
  - The legal look.
- Follow-up for Coach: add no-refunds language to the Terms of Service and the privacy policy on fattail.ai, and later to Labs' own copies.

## Uncommitted on StudioTwo (/Users/ernie/FatTail-Labs, branch runner-data-plane; do not commit unless Coach asks)
- Architecture/00-decision-log.md:
  - DL-827: the front door is served from MiniTwo (labs.fattail.ai), not WordPress.
  - DL-828: no new WordPress or WooCommerce ties.
  - DL-829: ship with the thin WooCommerce handoff, B6 in parallel, swap only the handoff later.
- AGENTS.md: sacred invariant 8.
- Architecture/B6-decision-draft.md (new).
- Specs/WP-Labs-Cutover-Design-v1.0.1.md: the venue bullet.

## Standing rules
- Never a 301 redirect.
- Invariant 7: three successive Coach OKs before touching existing working code or the live site.
- Don't read .env files or secrets. Database access is read-only aggregates only.
- No changes on MiniTwo.
