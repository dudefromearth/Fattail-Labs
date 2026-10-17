# FatTail Labs — Offer Cards Spec v2.0

**Status:** DRAFT for Coach ruling.
**Replaces, for Labs:** `Specs/Pricing-Cards-Plugin-Spec-v1_1.md` (the WordPress plugin
`fattail-pricing-cards` v0.28.1, which stays as-is on fattail.ai until that site retires).
**Depends on:** `Specs/FatTail-Labs-Native-Billing-Spec-v2.0.md` §8.1 (`billing.catalog`).

**Named "Offer Cards", not "Pricing Cards".** `server/routes/pricing.py` already exists and
is the *options* pricing engine — strikes, packages, quotes. A second thing called pricing in
the same codebase is a trap for every future reader.

---

## 1. The one rule this spec exists for

> **A price has exactly ONE home: `billing.catalog`. A card never stores a price, and never
> renders one it was given. It renders the price the member would actually be charged.**

### Why this is the whole design

Today the same number lives in at least four places:

| Where | Form |
|---|---|
| WooCommerce product `_price` | $1,997 |
| `wp_options` → `ftpc_settings` | editable number in the card admin |
| `web/lib/frontDoor/offers.json` | editable number in the front-end |
| Labs `plans.display_json` | **free text**: `"$17/wk or $102 × 6 weeks"` |

They already disagree. Labs' `/membership` page advertises **Navigator Annual at $2,997**
while WooCommerce charges **$1,997** — verified 2026-10-16. Nobody did anything wrong; four
copies of a number cannot stay equal.

Under this spec a card declares `product_id: "navigator-annual"` and nothing else about
money. The renderer asks `billing.catalog`, which is the same module `checkout.start()`
charges from. **Displayed price and charged price cannot differ, because they are one
lookup.**

A test asserts it on every build (§8).

---

## 2. What is editable, and by whom

The split is deliberate: **content is editable in the card admin; commerce is not.**

| Editable in Offer Cards admin | Editable ONLY in billing admin | Not editable |
|---|---|---|
| title, tagline, description | price | the charged amount |
| feature list (grouped, as today) | regular/strike price | plan → role mapping |
| badge text, button text | billing interval, term | |
| media (image/video, position) | discounts and their codes | |
| ordering, featured flag | | |
| visibility rules | | |

Prices are changed once, in one screen, by someone who understands that changing it changes
what members are charged. A marketer editing copy cannot alter a price by accident — the
field is not there.

---

## 3. Data model

Two tables. Content only; no money.

```sql
CREATE TABLE IF NOT EXISTS offer_cards (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug          VARCHAR(64)  NOT NULL,       -- stable id used by shortcodes
  product_id    VARCHAR(64)  NOT NULL,       -- -> billing.catalog. THE ONLY MONEY LINK
  title         VARCHAR(128) NOT NULL,
  tagline       VARCHAR(255) NOT NULL DEFAULT '',
  description   TEXT,
  badge         VARCHAR(64)  NOT NULL DEFAULT '',
  button_text   VARCHAR(64)  NOT NULL DEFAULT '',
  features_json JSON NULL,                   -- [{category, items[]}]
  media_json    JSON NULL,                   -- {type,url,poster,position,height,alt}
  featured      TINYINT(1) NOT NULL DEFAULT 0,
  sort_order    INT NOT NULL DEFAULT 0,
  status        VARCHAR(16) NOT NULL DEFAULT 'draft',   -- draft | live | archived
  updated_by    VARCHAR(255) NOT NULL DEFAULT '',
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_card_slug (slug),
  KEY ix_card_status (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Who sees what. One row per (card, viewer state) — the render matrix as DATA,
-- exactly as the WordPress version does it, so it can be diffed against the Law
-- rather than traced through conditionals.
CREATE TABLE IF NOT EXISTS offer_card_visibility (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  card_id     BIGINT UNSIGNED NOT NULL,
  viewer_state VARCHAR(32) NOT NULL,   -- visitor | free | observer | activator
                                       -- | navigator | lifetime | alumni | lapsed
  mode        VARCHAR(16) NOT NULL,    -- public | current | completed | hidden
  cta_override VARCHAR(64) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE KEY uq_vis (card_id, viewer_state),
  CONSTRAINT fk_vis_card FOREIGN KEY (card_id)
    REFERENCES offer_cards (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**No price column anywhere.** That is the point, and a reviewer should reject any migration
that adds one.

`status='draft'` is how a card is built without being visible — the "hide parts" requirement
at card level. §4 covers hiding at placement level.

---

## 4. Placement — shortcodes, and the same renderer in two hosts

### The shortcode
```
[offer_cards]                                     every live card, default layout
[offer_cards slug="navigator-annual"]             one card
[offer_cards group="navigator"]                   a named set
[offer_cards layout="full|two|compact|single"]
[offer_cards hide="features,badge,media"]         hide parts, per placement
[offer_cards state="visitor"]                     force a state (preview/marketing only)
```

`hide` is the "hide parts" requirement: the same card renders full on the pricing page and
stripped-down in a blog sidebar, **without a second copy of the card existing**. Duplicating
a card to make a short version is how copies drift.

### Two hosts, one renderer

| Host | How |
|---|---|
| **Labs** (Next.js) | React component calling `GET /api/offer-cards/render` |
| **WordPress**, while fattail.ai lives | a thin shortcode that server-side fetches `GET /api/offer-cards/embed` and prints the returned HTML |

The embed endpoint returns **self-contained, server-rendered HTML with inlined critical CSS**
and no client-side price injection. One renderer, one price source, two placements.

⚠️ **The WordPress bridge is deliberately dumb** — fetch and print. Any logic there is a
second implementation, and a second implementation is a second set of prices.

---

## 5. State-aware rendering

Labs already knows the viewer, which WordPress had to work out from WooCommerce:

| Source | Gives |
|---|---|
| `identity.derive_role()` | the member's effective role |
| `identity.feature_role()` | entitlement with overrides applied |
| `billing_subscriptions` | what they are actually paying for, and the term |
| `memberships` | status including `grace` |

Modes, unchanged from v1_1 because they are right: `public` · `current` (their plan — no
price, no CTA) · `completed` (alumni note, no CTA) · `hidden`.

**Fail closed:** an unknown viewer state renders the **visitor** table. A bug must show the
public price list, never someone else's.

---

## 6. What this fixes from the WordPress version

| Problem there | Here |
|---|---|
| Price in four places | One. `billing.catalog` |
| Sale price derived from a live coupon that can expire | Catalog carries `regular_amount_minor` as a display anchor; the charged price is `amount_minor`. A coupon expiring cannot change either |
| `offers.json` is front-end, so the server cannot see prices | Server-side only |
| Hiding a section means a duplicate card | `hide=` per placement |
| Settings are one giant JSON option | Rows, with per-card audit (`updated_by`, `updated_at`) |
| A/B arms, analytics, experiments in the same plugin | **Out of scope v2.0.** §9 |
| 84 files, 9 classes, 20+ dev test scripts | One module, two tables, one renderer |

---

## 7. Admin

`/admin/offers` — list, edit, preview, publish. Behind `require_admin`, like all billing
admin (§14.2 of the billing spec).

- **Live preview** with a state selector — every row of the visibility matrix, so "what does
  a lapsed Observer see" is one click, not a guess.
- **Prices are shown, greyed, with a link** to the billing admin. Visible for context,
  uneditable here.
- **Draft/live/archived.** A card is never deleted; archiving keeps the audit trail.
- **Explicit Save**, unsaved-changes warning, and copy sanitised on save.

---

## 8. The tests that make "zero mistakes" structural

Not optional, and not aspirational:

| Test | Asserts |
|---|---|
| **Price identity** | For every live card: rendered price **==** `catalog.resolve(product_id).amount_minor` **==** what `checkout.start()` would charge. The $2,997/$1,997 class of bug cannot survive this |
| Orphan product | Every card's `product_id` resolves in the catalog. A renamed product fails the build, it does not render a broken card |
| Every state renders | Each card × each viewer state produces valid output. No state falls through to a blank |
| Unknown state | Falls back to `visitor`, never to a member's view |
| No price in storage | Schema assertion: no column matching `%price%` or `%amount%` in `offer_cards`. Guards the one rule |
| Hide does not duplicate | `hide=` output is a subset of full output, same prices |
| Embed is self-contained | No external asset host, no client-side price injection |

---

## 9. Deliberately out of scope for v2.0

**A/B arms, analytics events, the events table, the funnel dashboard, JSON-LD.**

The WordPress plugin carries all of it, and that is why it is 84 files. Ship the cards
correctly first. Each of these is additive later, and none changes the data model. JSON-LD in
particular is easy to add once prices come from one place — and dangerous before, because it
would publish a price that disagrees with checkout.

---

## 10. Open questions

1. **Does the WordPress bridge get built at all?** Only needed while fattail.ai sells. If the
   Front Door replaces it, this is dead work — worth deciding before building it.
2. **Viewer states**: is the list in §3 the right one, and does it match Lifecycle Law §7?
   The WordPress matrix transcribes that Law verbatim; this must too.
3. **`plans.display_json`** currently holds taglines and features for `observer-trial` and
   `iki-lab`, with prices as free text. Migrate into `offer_cards` and drop the price strings,
   or leave it for `/membership` and have two card systems? **Recommendation: migrate, and
   make `display_json` prices an error.**
4. Per-card media hosting — Labs uploads, or external URLs only?
