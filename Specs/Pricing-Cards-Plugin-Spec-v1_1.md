# Pricing Cards Plugin — Specification v1.1

**Project:** FatTail (fattail.ai)
**Author:** Coach
**As of:** 2026-09-26
**Status:** Draft for review — renders only states seated in Membership Lifecycle Law v1.0
**Supersedes:** Pricing-Cards-Plugin-Spec-v1_0.md

### What changed from v1.0

| Finding | Disposition |
| --- | --- |
| P0-1 two completion predicates | Removed from this spec. One predicate lives in Lifecycle Law v1.0 §3; the plugin displays `observer_week` only. |
| P0-2 §3 false (public table sells all tiers) | Lifecycle moved to Lifecycle Law v1.0 §6 with direct-purchase arrows (D2). |
| P0-3 no Labs write | Not a plugin concern; Lifecycle Law O3. Plugin copy references the floor only as text supplied in admin. |
| P0-4 "trial" copy | All trial wording removed. Internal field is `observer_week` with comment "calendar week of Observer term". |
| P0-5 comparison row missing from anatomy | Added to §3 with reserved height; content per Lifecycle Law L4. |
| P0-6 A/B excludes the audience | A/B runs on two surfaces: public table (cold-traffic hypothesis, Coach's) and the days 29–42 Observer table (anchor hypothesis, advisor's). §10. |
| P1 `variant` overloaded | Split into `ab_arm` and `layout`. §10, §11. |
| P1 REST-swap fallback is the flash the spec forbids | Removed. Server-side render with cache bypass only. §14. |
| P1 contenteditable on prices/URLs | In-place editing limited to copy; prices, URLs, IDs, dates are form fields. §11. |
| P1 Activator "Switch" shown during weeks 1–4 | Kept available per render matrix, labelled "Join Activator", never styled as primary. |
| Lifecycle, states, transitions, AC hand-off (old §2, §3, §9, §10, §16, §17) | Moved to Lifecycle Law v1.0. |
| Open questions 16.1–16.10 | Seated (D1–D6, L1–L4) or moved to Lifecycle Law §8. Plugin-only questions remain in §15. |
| "One hour to build, one hour to debug" | Kept as Coach's own estimate, labelled as such. |

---

## 1. Purpose and scope

A self-contained WordPress plugin that renders the FatTail three-tier pricing table, replacing the Flatsome pricing-card element. The plugin reads membership state; it never defines it. Every state and transition it renders is specified in **Membership Lifecycle Law v1.0** (§4 states, §7 render matrix), and this spec implements that render matrix exactly.

Built complete in one pass. Coach's own estimate: about one hour to build, one hour to debug.

In scope: layout, billing toggle, sale pricing, featured card and media pop-up, styling and motion, state-aware rendering per the render matrix, campaign display, A/B arms, admin with preview, analytics, JSON-LD, block/shortcode.

Out of scope: checkout (buttons link to WooCommerce product URLs), subscription writes, Discord roles (WooCord), email (ActiveCampaign), tools grants (Labs).

---

## 2. Cards and copy

Three cards: Observer, Activator, Navigator. Navigator is featured. All three are buyable by a logged-out visitor (Lifecycle Law D2).

Copy law:

- The word "trial" does not appear anywhere on the surface. Observer copy leads with the earned outcome: complete the six weeks and the course, keep the tools for life.
- The Observer card states the completion condition in words (both 42 days and the course, Lifecycle Law D1) and states that cancelling early keeps nothing but the email list (D3).
- Button text is per card and per state, from the render matrix. Defaults: "Start as Observer", "Join Activator", "Join Navigator".
- Badges are for sales only. No "Most Popular" ribbon.
- Every copy string is an admin field with these defaults; nothing is hardcoded.

---

## 3. Card anatomy and layout

Each card is a flex column: fixed-height bands on top, a flexible features area, then reserved bands, then the button pinned to the bottom. All three cards match in height; buttons align.

| Band | Content | Height |
| --- | --- | --- |
| Status chip | "Your plan", "Completed", "Upgrade", or empty — per render matrix | Fixed, reserved even when empty |
| Image | Per-card graphic with alt text; position option (above title or background); size property | Fixed |
| Title | Product name | Fixed |
| Description | One line; two-line clamp | Fixed |
| Price | Price, billing label; when a sale is active: struck original, sale price, badge, countdown | Fixed, sized for the sale state |
| Features | Two-tier list: category then items | Flexible |
| Button | Text and URL per state | Pinned bottom |

Comparison row (Lifecycle Law L4): a full-width row under the three cards listing coaching and coaching-adjacent items, with a check/dash per tier. Height reserved in the grid; rendered for every state except Active Navigator. Content is an admin field.

Login line: one small line under the comparison row for logged-out visitors only: "Already a member? Log in to see your options" → login URL with redirect back.

Implementation: CSS grid with shared row heights for the fixed bands; features area `flex: 1`. Cards stack on mobile with the featured card first; the comparison row becomes a per-card list on mobile. Semantic markup (`article`, headings, `ul`, `button`/`a`), toggle as an accessible switch, modal with focus trap and Escape.

---

## 4. Billing toggle

One toggle flips Activator and Navigator between monthly and annual. Observer shows a fixed "6 weeks · one payment" label and is unaffected.

- Both billing states render in the HTML server-side; JS flips a class; CSS shows one set. Nothing is fabricated at runtime.
- Swaps per card: price, billing label, button URL.
- Optional annual-savings line, computed server-side.
- Toggle state persists in `localStorage` (try/catch); default is an admin setting.
- Currency field (default USD) drives formatting and JSON-LD.
- Fires a `toggle` analytics event.

---

## 5. Sale pricing

Optional per card, per billing period: sale price, sale checkout URL (may carry a coupon), badge label, sale end, countdown on/off.

Sale end has two modes:

- **Absolute** date/time — ordinary promotions.
- **Relative to Observer start** — used only for the campaign (§9); the plugin computes `observer_start + 42 days` per viewer.

Badge and countdown appear only while the sale is active and disappear with it. Expired sales fall back to the regular price with no layout shift because the price band is sized for the sale state.

---

## 6. Featured card and media pop-up

Navigator is featured by default; the flag alone switches on its color scheme and raised treatment.

- Own background tint, accent, and border via featured-specific custom properties.
- Raised: larger shadow with upward offset, slight scale bump. Base shadow strong enough that hover still registers.
- Button style consistent across all cards.
- Media pop-up on the featured card only (Lifecycle Law L1): lightbox with graphic or self-hosted video; backdrop, close, Escape, focus return.
- Video: HTML5 `<video>` with `autoplay`, `controls`, `playsinline`, poster; no other chrome. `src` injected on open, removed on close. 16:9 wrapper. Keep the file compressed.

---

## 7. Styling, hover, motion

All theming in CSS custom properties on the table root.

Properties: background, surface, text, muted, accent, border, shadow; font family and sizes per band; spacing scale; radius; featured background/accent/border/shadow/scale; sale strikethrough and badge colors; button colors; transition duration and easing.

Hover: card lift with larger shadow and accent-warmed border; featured card lifts further or glows so the change is visible; button hover background and lift; featured image slight zoom to hint it opens.

`@media (prefers-reduced-motion: reduce)` disables transforms and shortens transitions.

---

## 8. State-aware rendering

The plugin resolves the viewer's state using Lifecycle Law §4 (definitions and precedence) and renders Lifecycle Law §7 (render matrix) verbatim. It reads WooCommerce Subscriptions; it writes nothing.

Configuration: WooCommerce product/variation IDs for Observer, Activator monthly, Activator annual, Navigator monthly, Navigator annual; login URL.

Rules:

- `observer_week = min(6, floor(days_since_observer_start / 7) + 1)` — calendar week of the Observer term (Lifecycle Law §3). Displayed as "Your plan — week N of 6".
- Pending-cancel, on-hold, and failed-payment subscriptions render as their active tier until the period ends (D5). The plugin does not show a billing-repair prompt.
- Expired Observer is detected as: Observer subscription ended with `observer_complete` true, **or** any Navigator/Activator subscription ended (D4). The plugin reads `curriculum_complete` from the source named in Lifecycle Law O1; until O1 is answered it treats a day-42 Observer end as Expired Observer and logs a warning.
- Every state-specific render is server-side. There is no client-side personalisation step and no flash.
- JSON-LD always describes the public table.

If WooCommerce Subscriptions is inactive, the plugin renders the public table for everyone.

---

## 9. Campaign display (days 29–42)

For an Active Observer at `observer_week >= 5`, the Navigator card shows the campaign price and badge with a countdown to `observer_start + 42 days` (Lifecycle Law D6). Hard stop at day 42; Expired Observers see the regular price.

- One alternate Navigator price and URL pair (monthly, annual). Same discount for everyone; the URL may carry a coupon.
- Activator is never promoted in the campaign.
- `layout = "campaign"` (§11) renders a Navigator-only pitch with Activator further down, reusing the same card components. Used on the campaign page.
- Campaign renders carry `campaign = true` in analytics.

---

## 10. A/B arms

`ab_arm` is `A` (three cards) or `B` (Activator hidden). Two surfaces run it independently, each with its own on/off and split:

| Surface | Hypothesis | Who is in it |
| --- | --- | --- |
| Public table | Does the Activator anchor lift Navigator conversion among cold visitors? (Coach) | Visitor state only |
| Observer days 29–42 table | Does the anchor lift Navigator conversion at the campaign moment? (Advisor P0-6) | Active Observer at week ≥ 5 |

- Assignment random on first eligible view, stored in a cookie (public) or against the user ID (Observer) so it is sticky.
- Override: `?pc_arm=B` and an admin force setting.
- Every analytics event carries `ab_arm` and `surface`.
- Arm B on the public table also drops Activator from the comparison row and JSON-LD for that viewer.

---

## 11. Admin

The admin screen shows the live table as the preview. Copy is edited in place; everything else is a form field.

In place (content-editable on the preview): title, description, feature categories and items, button text, badge label, comparison-row items, floor note, login line.

Form fields (never content-editable): prices, sale prices, all URLs, product/variation IDs, sale end dates and mode, featured flag, image/video/poster (media picker), image position and size, currency, toggle default, campaign start week, `ab_arm` settings per surface, retention days, uninstall behaviour, every custom property (color pickers, font selectors).

Preview controls: billing toggle; state selector (every row of the render matrix, with a day-of-term input for Observer); `ab_arm` selector; `layout` selector.

Save model: explicit Save; unsaved changes flagged; Revert to last saved; settings stored as one versioned JSON option with migration on version change. All in-place text is sanitised on save (`wp_kses_post`), and prices/URLs are validated by type.

Placement: Gutenberg block and shortcode `[fattail_pricing layout="full|two_card|campaign"]`. `layout` is a rendering choice; `ab_arm` is an experiment assignment. They are separate parameters.

---

## 12. Analytics

Custom table `wp_fattail_pricing_events` with a dashboard and CSV export.

| Event | Fired when | Payload |
| --- | --- | --- |
| `table_view` | Table enters viewport (once per load) | page, layout, ab_arm, surface, state |
| `card_view` | Card ≥ 50% visible for 1 s | tier, layout, ab_arm, surface, state |
| `toggle` | Billing toggle flipped | from, to |
| `media_open` | Featured pop-up opened | media type |
| `button_click` | Any card button | tier, billing, sale_active, campaign, ab_arm, surface, state, destination |
| `login_click` | Login line clicked | ab_arm |

Columns: id, event, tier, billing, layout, ab_arm, surface, state, campaign, page, session_hash, user_id (nullable), created_at. Session hash is a salted first-party cookie hash, not an IP. Events posted to a nonce-protected REST endpoint via `sendBeacon`. Buttons carry `data-tier` and `data-billing` for external tools. Retention purge after N days. Dashboard: date range, funnel by tier, split by ab_arm/surface/state, toggle usage, export.

---

## 13. Structured data

JSON-LD generated server-side from saved settings, always the public table: one `Product` per tier with an `Offer` per billing period (`price`, `priceCurrency`, `url`, `availability`, billing duration where applicable); active absolute-dated sales carry `priceValidUntil`. Both billing states exist in the initial HTML; prices are never injected purely by JS. Semantic markup throughout; the coaching distinction spelled out in text.

---

## 14. Architecture, caching, delivery

Single plugin `fattail-pricing-cards` on the fattail.ai WordPress host, independent of Flatsome.

| Component | Responsibility |
| --- | --- |
| `fattail-pricing-cards.php` | Bootstrap, activation (events table, defaults), uninstall hook |
| `includes/class-settings.php` | Options schema, versioning, migration, sanitisation |
| `includes/class-state.php` | Resolves viewer state per Lifecycle Law §4; computes `observer_week` and campaign window |
| `includes/class-renderer.php` | Server-side render per render matrix, layout, ab_arm; emits JSON-LD |
| `includes/class-experiments.php` | `ab_arm` assignment per surface, cookie/user storage, override |
| `includes/class-analytics.php` | REST endpoint, writes, dashboard queries, export, purge |
| `admin/` | Preview, in-place copy editing, form fields |
| `assets/css/pricing.css` | Custom properties, layout, hover, motion, responsive |
| `assets/js/pricing.js` | Toggle, localStorage, modal, IntersectionObserver, beacons |
| `blocks/` | Block registration; shortcode |

Caching: pages rendering the table for a logged-in viewer are marked uncacheable (`DONOTCACHEPAGE`, no-cache headers). There is no client-side swap fallback; the personalised table is server-rendered or not rendered. Confirm the bypass against the host's page cache (open question P2).

Dependencies: WordPress core; WooCommerce Subscriptions (soft — degrades to public table). Assets enqueued only where the table renders. Uninstall drops the events table and options only if the admin setting says so (default: keep).

---

## 15. Plugin-only open questions

- [ ] P1 Does the campaign page's `layout="campaign"` need the comparison row, or is the Navigator pitch enough? (Coach)
- [ ] P2 Which page cache does the host run, to confirm `DONOTCACHEPAGE` is honoured? (Coach / host)
- [ ] P3 Until Lifecycle Law O1 is answered, is "day-42 end = Expired Observer, with a logged warning" an acceptable interim, or should the plugin refuse to render Expired Observer state? (Coach)

---

## Change log

| Version | Date | Change |
| --- | --- | --- |
| v1.0 | 2026-09-26 | First numbered version. |
| v1.1 | 2026-09-26 | Advisor review dispositions (table at top). Lifecycle, states, transitions, and AC hand-off split out to Membership Lifecycle Law v1.0. Renders only seated states. |
