# Links/QR Use Cases — Ranked by Acquisition & Conversion Value

Ranks every item in `docs/Links-QR-Membership-Use-Cases.md` (#1–30)
specifically against two questions: does it bring in people who weren't
already members (**acquisition**), and does it move an existing
person toward paying or paying more (**conversion**)? Retention,
compliance, and purely-operational items score low here on purpose —
they're real, just not what this document is ranking for.

Each item also gets a **proposed implementation** sized against what's
already built (Phase 1 slug/QR/label/`source`+`medium`+`campaign`,
Phase 3a markers/attribution, Phase 3b owner/credits/affiliate
registry) so value and effort can be weighed together, not just value
alone.

Not a build plan. Nothing here is scoped, gated, or authorized.

---

## Tier S — zero/near-zero build, start this week

These need no new code. The infrastructure to do them shipped in
Phase 1/3a/3b; what's missing is someone creating the links and
running the campaign.

### #12 — Annual→Lifetime campaigns
**Why it ranks here:** Highest-ARPU lever available today. Pure
upsell on an already-paying, already-trusting population.
**Proposed implementation:** Mint a tracked link/QR per campaign
variant (`campaign=lifetime-upsell-oct`), target the Annual-term
Navigator segment in ActiveCampaign, read results off the existing
admin detail page's breakdown panels. No code.

### #11 — Observer→Navigator nudges
**Why it ranks here:** Directly measures the one conversion that
matters most — trial/free to paying. Reuses the marker mechanism
exactly as built.
**Proposed implementation:** Same as above, targeted at Observer
segment, one link per nudge variant/email so you can tell which
message actually converts.

### #4 / #15 / #14 — Per-channel, per-campaign, per-video attribution
**Why it ranks here:** Not acquisition itself — it's the measurement
layer that tells you which acquisition spend to double down on or
kill. Already fully supported by the `source`/`medium`/`campaign`
fields and the breakdown dashboards built in Phase 1.
**Proposed implementation:** Adopt a naming convention
(`source=youtube, medium=description, campaign=<video-slug>`) and
start tagging every link that goes out the door. No code — discipline
only.

### #20 / #22 — YouTube description link + pinned-comment A/B
**Why it ranks here:** Same reasoning as above, specific to the
channel most likely to be the primary acquisition surface right now.
**Proposed implementation:** One tracked link in the description, a
second in the pinned comment, same video, different `placement`
value. Compare in the breakdown panel.

---

## Tier A — real acquisition/conversion leverage, needs a small-to-moderate build

### #3 — Partner/creator co-marketing links
**Why it ranks here:** The *only* item on the entire 30-item list that
reaches audiences with no existing relationship to FatTail at all.
Referral, nudges, and upsell all recirculate people who already know
the brand; this is the one with a ceiling above the current member
count.
**Proposed implementation:** A `partners` concept parallel to (not
reusing) the store-credit `affiliates` registry — different terms
(cash or free membership, not credit-toward-own-renewal), same
marker/attribution plumbing underneath. New admin table + a couple of
new fields; the hard part is deciding terms, not the code.

### #21 / #23 — On-screen QR + YouTube's other native surfaces (cards, end-screen, banner, Community posts)
**Why it ranks here:** Converts passive viewers (phone in hand, not
reading a description) and tests four more placements per
video/channel most creators never separately measure. The QR-with-
label feature exists specifically for this.
**Proposed implementation:** No backend work — render the existing
`qr-card.png` into the video asset / end-screen graphic / banner
image, one link per surface via `placement`.

### #2 — Two-sided referral
**Why it ranks here:** Referral conversion is usually bottlenecked by
the *referred* person's hesitation, not the referrer's incentive. This
directly attacks the actual drop-off point.
**Proposed implementation:** Extend `links/credits.py` (or a sibling
module) with a discount/credit path keyed to the *referred* person's
first checkout, reusing `link_attributions` to know who referred them.
Small — the award-on-referral pattern already exists in `billing.py`'s
`_award_referral_credit`; this adds a second beneficiary.

### #26 / #27 — Paid-ad click-through attribution (Instagram/Facebook/X)
**Why it ranks here:** Not optional once real ad dollars are spent —
without it, ad ROI is conflated with organic reach and you can't tell
if a channel is actually profitable. Table stakes for scaling paid
acquisition at all.
**Proposed implementation:** No new code — a `medium=paid-ad` tagging
convention plus one tracked link per ad creative/campaign. The
leverage here is entirely in the discipline of never running a paid
placement without its own link.

---

## Tier B — good value, moderate build or narrower reach

### #13 — "Refer N, unlock early"
**Why it ranks here:** Expands who the referral program motivates —
Lifetime members have nothing left to upgrade to, so store credit
means nothing to them; feature-gated early access gives them a reason
to refer anyway.
**Proposed implementation:** Small — gate a feature flag on a
`COUNT(*) FROM link_attributions WHERE slug = owner's link`, no new
table.

### #5 — "Bring a friend to a Live session"
**Why it ranks here:** Lowest-friction top-of-funnel offer — a taste
before a purchase decision, good pairing with #3's partner links.
**Proposed implementation:** A scoped/short-lived link variant (reuse
`static` or add an `expires_at`), no attribution/credit logic needed.

### #24 — Livestream chat-drop links
**Why it ranks here:** Correlates a specific content *moment* to a
conversion, not just "this stream" in aggregate — useful but a narrower
audience than on-demand video.
**Proposed implementation:** No code — manual link-drop in chat at a
scripted moment, tagged `medium=live-chat`.

### #25 — X.com thread/tweet-level links
**Why it ranks here:** X's algorithm often suppresses link reach, so
"link in tweet" vs. "link in first reply" is a real, testable question
— but X is a smaller funnel than YouTube for this audience today.
**Proposed implementation:** No code — two links, two placements,
compare.

### #29 — "Link in bio" rotation with per-post correlation
**Why it ranks here:** Works around Instagram/X's one-bio-link
limit, but attribution is inherently fuzzier (time-window correlation,
not a direct per-post link) than everything above it.
**Proposed implementation:** No code — rotate the bio link per
campaign push, log the swap timestamp somewhere (even a spreadsheet)
to correlate against the click/signup timeline in the admin dashboard.

### #26 — Instagram Story link stickers
**Why it ranks here:** Clean, native, time-boxed attribution — but
Stories are 24-hour and typically reach existing followers more than
new audiences, so it's more mid-funnel than top-of-funnel.
**Proposed implementation:** No code — one link per Story.

### #28 — Facebook group/page post links
**Why it ranks here:** Real word-of-mouth already happens in trading
groups organically; Facebook is a smaller slice of this audience than
YouTube/X but not negligible.
**Proposed implementation:** No code.

### #16 — A/B testing offers/packaging
**Why it ranks here:** Valuable but it's a generic testing *method*,
not a specific acquisition surface — ranked by how it's applied
elsewhere on this list (e.g., #22).
**Proposed implementation:** No code — two destination links, same
traffic source, compare conversion.

---

## Tier C — infrastructure gap, unlocks other items rather than converting directly

### #30 — Vanity/typeable short codes
**Why it ranks here:** Doesn't convert anyone by itself, but several
Tier A/B items (Instagram captions, a spoken call-to-action in video,
X replies with suppressed links) are weaker without it — right now the
only option is a random 6-character slug nobody can type from memory.
**Proposed implementation:** A real decision, not a trivial one — a
second, human-chosen slug namespace alongside the collision-safe
random-alphabet generator (`links/slug.py`), with its own validation
(reserved words, uniqueness, probably admin-only to mint). Worth doing
once Tier A/B adoption shows it's actually the bottleneck, not before.

---

## Not ranked for acquisition/conversion (real, but a different lens)

**Retention/engagement** (#6–10), **compliance/trust** (#17–18), and
**operational** (#19) — attendance, win-back, completion QR, streak
unlocks, Discord invites, disclosure acknowledgment, physical merch.
These protect LTV, reduce churn, or manage compliance risk, which
matters, but none of them bring in a new customer or move an existing
one to a higher tier, which is what this document ranks for.

---

## Recommended sequence

1. **This week, no code:** Tier S — tag every outgoing link with
   `source`/`medium`/`campaign`, run the Annual→Lifetime push, start an
   Observer→Navigator nudge test, put a second tracked link in the next
   video's pinned comment.
2. **First real build:** #3 (partner/creator links) — it's the only
   item with a ceiling above the current member base.
3. **Second build:** #2 (two-sided referral) — small, directly lowers
   the referred person's conversion friction.
4. **Then, as paid spend starts:** #26/#27 tagging discipline before
   a single paid dollar goes out, not after.
5. **Revisit #30 (vanity slugs)** once Tier A/B adoption on
   Instagram/X actually shows typed links are the bottleneck.
