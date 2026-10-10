# Links — Attribution and Affiliates (LK Phase 3) — Spec v0.1 (DRAFT)

**Version:** v0.1 (DRAFT)
**Supersedes:** nothing — new document.
**Date:** 2026-10-10
**Machine:** Not yet dispatched to any machine. Specification only; files/trees touched by this document: NONE.
**Scope:** Attribute a WooCommerce order on `fattail.ai` back to the Links/QR link that drove it, so FatTail can see which placements and which people — **members and non-members alike** — actually widen the customer base, and lay the groundwork for paying non-member affiliates for that. Commission math, payout, and tax handling stay in WooCommerce, never in Labs (D8, carried from `LK-1.1`).
**Touches outside Links/QR (all of it new):** a **new WordPress/WooCommerce tree on `fattail.ai`** (order-meta capture, a storefront-side marker cookie or redirect param, and — for 3c — an affiliate plugin); a **new public-facing webhook endpoint on Labs** (reusing the existing HMAC-signed webhook pattern already in `server/webhook_security.py` / the WooCommerce membership-sync webhook, not inventing a new auth model); the `links` table's **`owner` field**, reserved and unused since Phase 1 (LK-L1), finally activated; a new lightweight non-member affiliate registry (new table). Every one of these is a genuine new tree or a genuine new trust boundary. **None of it is authorized by this document.**
**Status:** DRAFT. **BUILD AUTHORITY: none.**
**Canonical filename:** provisional — assigned the next free `Specs/` series ID at intake, same as the rest of the LK series.

**Parents (cited, not amended):**
- `Specs/LK-1.1.md` / `Specs/LK-1.2.md` — the link model this phase extends; `owner` was reserved exactly for this (LK-L1); D8 ("affiliate ledger stays in WooCommerce") is load-bearing here, not just cited.
- `docs/WooCommerce-SSO-Integration-Guide.md` §6 — the existing pattern for WordPress → Labs webhooks (HMAC-signed, shared secret with SSO, `LABS_WEBHOOK_MAX_AGE_SECONDS` replay window). This phase's order-attribution webhook should be *a sibling of* the existing membership-sync webhook, not a new auth model.
- `server/webhook_security.py` — the HMAC verification this phase's webhook should reuse.

**Framing:** this is explicitly **not** a candidate for the direct-iteration pattern `Specs/LK-1.2.md` §3 describes for the rest of this app. It moves toward real people's compensation, adds a public non-member-facing surface, and opens a new WordPress tree. It gets the fuller review the original LK-1.1 process was written for — Alpha/Charlie/Delta seats, Coach gates, Grok Advisor round — even though Phase 1 itself ended up skipping that for its own good reasons. The risk class is different here.

---

## §1 Purpose

Today, a link's `owner` field exists in the schema and does nothing. Every link is anonymous as far as attribution goes: FatTail can see *that* 47 people scanned a code, never *who sent them* in a way that ties to revenue. Coach wants two things from closing that gap:

1. **Know what's working.** Which placement, which partner page, which member's share actually produced an Observer order — not just a scan.
2. **Pay people for growing the business.** Members who refer other members, and non-members (partners, affiliates, influencers) who refer anyone — both should be able to hold a link that's *theirs*, see what it produced, and eventually get compensated for it. Labs' job stops at proving the attribution; WooCommerce (via a real affiliate plugin) does the money.

This is explicitly about **widening the customer base** — non-members are a first-class participant here, not an edge case. A referral program that only works for existing members misses the point.

---

## §2 Phases (this document scopes all three; none are authorized together)

| Sub-phase | Delivers | Risk | Authorized by |
|---|---|---|---|
| **3a — Attribution only** | A marker survives from a link scan/click through to a completed WooCommerce order; an "orders per link" report, admin-only, read-only. No referral links yet, no `owner`, no money. Proves the mechanism before anyone's compensation depends on it. | New webhook endpoint (public-facing, HMAC-verified); new WordPress-side marker capture. No PII beyond what WooCommerce orders already hold. | Its own stamp, after this draft is reviewed |
| **3b — Referral links and the affiliate registry** | `owner` activated: members get a referral link tied to their existing Labs identity automatically; non-member affiliates get a link after a lightweight, **Coach-approved** registry entry (name, email, a generated slug — no self-serve signup in 3b). Each owner sees their own orders-per-link. | Public non-member-facing surface for the first time in this app; a new registry table holding non-member PII (name, email) | Its own stamp, after 3a is live and proven |
| **3c — Affiliate ledger hooks** | Wire the attribution signal into a real WooCommerce affiliate plugin so commission, payout, and 1099/tax handling happen there. Labs supplies "this order, this owner, this link" and nothing else (D8). | Real money changing hands; legal/compliance surface (affiliate agreements, FTC disclosure, tax reporting) | Its own stamp, likely needs non-engineering (legal) sign-off before engineering starts |

A sub-phase here is not authorized until its own gate is stamped, same discipline as the parent spec's phases. 3a proves the plumbing with nothing at stake; 3b opens the public surface; 3c is where real compensation and real compliance obligations start, and should not move on engineering judgment alone.

---

## §3 Mechanism (proposed; every numbered choice below is a Q in §8, not a law yet)

The shape that fits what already exists in this codebase:

1. **At the redirect (`/q/<slug>`):** when a link has `source`/`campaign`/`owner` set, append a short marker to the destination URL as a query parameter (e.g. `?ftm=<marker>`) rather than setting a cookie from the Links side — the destination is frequently `fattail.ai` but is not guaranteed to be, and RD-L1/RD-L5's law (no open redirect, destination is exactly what's stored) does not change: the marker rides *with* the stored destination, it is never a second destination.
2. **On `fattail.ai` (new WordPress tree, Phase 3a):** a small snippet reads `?ftm=` on landing and sets a first-party marketing cookie (distinct from any Labs session cookie — this never touches Labs auth) for the ruled lifetime (Q7). At checkout, WooCommerce writes that cookie's value as order meta.
3. **Attribution reaches Labs, not the other way around:** WooCommerce fires a webhook to a new Labs endpoint on order completion, HMAC-signed the same way the existing membership-sync webhook is (`docs/WooCommerce-SSO-Integration-Guide.md` §6), carrying the marker and order total. Labs never reaches into WordPress's database directly — same trust direction as the pattern that already exists.
4. **Labs records the attribution** as its own event type (not `link_events` — that table's law is scoped to RD-L2's exact Phase-1 columns and should not grow order/money fields) and reports orders-per-link/owner to the admin.

This keeps every existing Phase 1 law untouched: the redirect still only forwards to a stored destination (RD-L5), still never sets a Labs session (RD-L1), still logs nothing it wasn't already logging. The new surface is additive, not a rewrite.

---

## §4 Law catalogue (draft — numbered for review, not yet binding)

**AF-L1 — Marker carried as a destination query parameter, not a cookie set by Labs.** The redirect route appends `?ftm=<marker>` to the stored destination when the link has attribution fields set; it does not set any cookie itself. RD-L1 (no Labs session set on the redirect) is unchanged and unaffected — this is a different cookie, on a different domain, set by a different system (WordPress), not Labs.

**AF-L2 — Marker format.** Opaque, unguessable, length and alphabet TBD (Q-equivalent of LK-L2's slug law) — almost certainly reusing `links.slug.ALPHABET` for consistency, but sized for the lower collision tolerance of a value that may determine a payout.

**AF-L3 — `owner` activation (3b only).** `owner` stores either a Labs `identity_id` (member) or a new `affiliate_id` (non-member registry), never both, never free text. No link is ownable until 3b is stamped; Phase 1's "present and not settable" (LK-L1) stays true until then.

**AF-L4 — Non-member affiliate registry (3b only).** A new table: name, email, slug, status (`pending`/`approved`/`revoked`), created/approved timestamps, approved-by. **No self-serve signup in 3b** — every row starts `pending` and only an admin action moves it to `approved`; a `pending` or `revoked` affiliate owns no live links. (Whether 3c ever opens self-serve signup is explicitly out of scope here — see §9.)

**AF-L5 — Attribution webhook.** New endpoint, HMAC-verified using the existing `webhook_security.py` pattern and the same shared-secret discipline as the membership-sync webhook (`LABS_WEBHOOK_MAX_AGE_SECONDS` replay window, signature over the raw body). Records marker, order id, order total, timestamp. Never writes to `link_events`. Failure to verify → 401, nothing recorded, matches the existing webhook law.

**AF-L6 — No commission, no payout, no ledger in Labs, ever (D8, carried forward verbatim).** Labs' attribution report shows orders and totals per link/owner for FatTail's own visibility. It never calculates a commission, never records a payout, never generates a tax document. 3c wires the *signal* into a WooCommerce affiliate plugin; the plugin, not Labs, is the ledger.

**AF-L7 — Self-referral.** An order attributed to a marker whose owning member/affiliate is also the purchaser is flagged, not silently counted the same as any other attributed order. Exact rule (block credit entirely vs. flag-and-let-a-human-decide) is Q6.

**AF-L8 — Honesty about what a marker proves.** Exactly like LK-L5's "no number without a basis": the attribution report labels itself by the attribution rule in force (first-touch or last-touch, per Q3) and never claims causation beyond "this order's checkout carried this marker."

---

## §5 Component inventory (draft)

| Component | Kind | Notes |
|---|---|---|
| D1 Marker generator | Server function, Labs | AF-L2 |
| D2 Redirect amendment | Existing route, Labs | AF-L1 — the one change to already-shipped Phase 1 code this phase makes |
| D3 WordPress marker-capture snippet | New tree, `fattail.ai` | reads `?ftm=`, sets first-party cookie, writes order meta |
| D4 Attribution webhook | New route, Labs | AF-L5, reuses `webhook_security.py` |
| D5 Attribution event store | New table, Labs | separate from `link_events` |
| D6 Affiliate registry | New table, Labs (3b) | AF-L4 |
| D7 Owner activation + per-owner reporting | Admin UI, Labs (3b) | AF-L3 |
| D8 WooCommerce affiliate plugin wiring | New tree, `fattail.ai` (3c) | plugin choice is Q5 |

---

## §6 Work packets (scoping only — nothing here dispatches from this document)

**W0 — Census.** Read-only. Names: the actual WooCommerce checkout flow and where a cookie/param could realistically be read without a WordPress plugin rewrite; the existing webhook endpoint's exact code path to confirm D4 can be a true sibling of it; whether `fattail.ai`'s current theme/plugin stack has an existing mechanism this duplicates (many WooCommerce affiliate plugins ship their own marker-cookie logic already — worth knowing before building one).
**W1 (3a) — Marker + webhook + attribution store + orders-per-link report.** Requires Q1–Q3 ruled.
**W2 (3b) — Registry + owner activation + per-owner view.** Requires Q4 ruled, W1 live and proven for at least one full attribution window (Q2's lifetime).
**W3 (3c) — Plugin wiring.** Requires Q5 ruled and, per the framing note above, is the one place in this entire app's history to date that should get legal review before engineering starts, not after.

---

## §7 Acceptance tests (draft)

**AT-1** A scan carrying `?ftm=` lands on the destination with the parameter intact; a scan on a link with no attribution fields set carries nothing.
**AT-2** A WooCommerce order placed after landing with a live marker cookie produces one attribution-store row with the correct marker, order id, and total.
**AT-3** A forged or expired webhook signature is rejected 401, nothing recorded — mirrors the existing membership webhook's own test.
**AT-4** Self-referral (AF-L7) is correctly flagged on a fixture order.
**AT-5 (3b)** A `pending` affiliate's link is inert — scannable, but owns nothing until `approved`.
**AT-6** No attribution-store row, report column, or export ever contains a commission figure, payout status, or tax field (AF-L6).

---

## §8 Open decisions requiring Coach (no defaults — this list is the actual point of circulating this draft)

**Q1 — Marker carrier confirmation.** Query param + WordPress-side cookie (§3), or does `fattail.ai`'s stack already have a better place to hook this (W0 may answer this before Coach needs to rule on it).
**Q2 — Marker lifetime.** Industry-typical affiliate cookie windows run 30–90 days; FatTail's buying cycle (course/membership decision) may argue for longer. No default.
**Q3 — Attribution rule.** First-touch (the link that first brought them) or last-touch (the link right before checkout) gets credit. These give very different answers to "what's working" and must be picked deliberately, not defaulted.
**Q4 — Affiliate eligibility.** Coach-approved only (as drafted in AF-L4), indefinitely, or does 3c ever open a self-serve application flow? Affects how much registry/moderation tooling 3b actually needs to build now vs. later.
**Q5 — Which WooCommerce affiliate plugin.** D8 says the ledger lives in WooCommerce; it doesn't say which plugin. This is a real vendor/cost decision, not an engineering one.
**Q6 — Self-referral handling.** Block the credit outright, or flag it and let a human decide case by case (e.g. a member legitimately re-ordering through their own link isn't necessarily fraud).
**Q7 — Compliance posture.** At minimum: does a US non-member affiliate earning above the IRS 1099 threshold need tax-form handling (almost certainly yes, and almost certainly a WooCommerce-plugin or accounting-system concern, not Labs') and does any public page describing the program need FTC-style affiliate disclosure language. **Flagging this explicitly as needing real legal input, not an engineering guess**, before 3c's W3 opens.
**Q8 — Does a referral link get the same QR/reporting treatment as any other link?** Working assumption: yes, it's still a row in `links`, inherits everything Phase 1 already built for free. Flagged here only so Coach can override if referral links need something visibly different (e.g. a partner-facing read-only view of their own link's numbers, which is a new surface, not just a filter).

---

## §9 Explicitly out of scope (this version)

Self-serve affiliate signup (unless Q4 rules otherwise later); any change to `link_events` or Phase 1's redirect laws beyond AF-L1; any commission/payout/tax computation anywhere in Labs; any new Labs session or entitlement granted by affiliate status; multi-touch/weighted attribution models (first- or last-touch only, per Q3); any public marketing page about the program (content, not engineering — produced once Q7 is answered).

---

## §10 Risk note to Coach

Everything built in `Specs/LK-1.2.md` §3–§6 shipped fast because the blast radius of a mistake was small: a broken chart, a stale cache, worst case a wrong country on a scan. Nothing here is that small. A marker bug either over- or under-pays someone, or does both to different people. A webhook auth bug is a public-facing hole on a path that already proves itself by the existing SSO/membership webhook being worth HMAC-signing. This is the one place in this app's short history where "build it, test it live, ship it" is the wrong pattern — recommend the fuller seat/gate process `LK-1.1` originally specified, genuinely run this time, starting from W0.

---

*v0.1 DRAFT. BUILD AUTHORITY: none. Nothing in this document authorizes touching `fattail.ai`, WooCommerce, or any new Labs webhook.*
