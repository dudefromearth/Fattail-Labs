# Links / QR — Membership Use Cases

A reference menu of ways the Links/QR app's trackable-link infrastructure
(marker → owner → event, built across LK Phase 1 and the Phase 3
attribution/credit work — see `Specs/LK-1.2.md` and
`Specs/Links-Attribution-Affiliates-Spec-v0_2.md`) could be applied beyond
the member-referral-credit use case it was first built for. Several of
these don't touch money or the affiliate registry at all — they reuse the
same marker/owner mechanism to feed signals that already exist elsewhere
in Labs (`journey_scores.py`'s Leaderboard pillars, attendance, course
completion).

Not a build plan. Nothing here is scoped, gated, or authorized — it's the
list to pick from.

---

## Growth / acquisition

1. **Member referral credits** (built) — refer a friend, earn credit
   toward your own upgrade.
2. **Two-sided referral** — give the new person something too, not just
   the referrer. Not built; AF-L10 currently rewards the referrer only.
3. **Partner/creator co-marketing links** — a known trading educator or
   newsletter gets a trackable link on different terms than member
   credits (cash, free membership), since they have no existing stake.
4. **Per-channel marketing attribution** — which flyer, conference booth,
   podcast appearance, or printed material actually produces a paying
   Observer. The original spec's own example: "decks, show overlays,
   flyers, the Tradier breakout page."
5. **"Bring a friend to a Live session"** — a one-time guest-pass link a
   member shares, giving a non-member a taste before joining.

## Retention / engagement

6. **Live-session attendance check-in** — a QR scanned on arrival feeds
   `attendance_streak`, an existing Journey pillar nothing currently
   automates.
7. **Win-back / re-engagement links** for lapsed members — the *click*
   itself (not a purchase) is the signal worth tracking.
8. **Course/module completion QR** — on a certificate or the last page of
   a module, feeding `personal_growth` / `contribution`.
9. **Streak or milestone unlock links** — e.g. a 30-day journal streak
   unlocks a bonus resource, and you learn whether the unlock actually
   gets used.
10. **Community/Discord invite links per member** — measuring who's
    actually driving the community, ahead of the Discord bridge already
    spec'd elsewhere.

## Tier progression / upsell

11. **Observer→Navigator nudges** — a personalized tracked link in a
    transactional email or in-app banner, measuring which nudges
    actually convert.
12. **Annual→Lifetime campaigns** — same mechanism, targeted at the
    specific billing-term population that can actually make that
    upgrade.
13. **"Refer N, unlock early"** — early access to a feature (Strategy Lab
    Deploy, a new course) gated by referral count instead of cash.

## Content attribution

14. **Per-video tracked links** — which specific video actually drives
    signups, not just views or clicks.
15. **Campaign-level (not person-level) tracked links** for newsletter vs.
    social vs. YouTube description — already partially supported by
    Phase 1's `source` / `medium` / `campaign` fields.
16. **A/B testing offers or packaging** by routing to different QR codes
    and comparing conversion.

## Compliance / trust

Worth calling out given the industry — a trading-education business has
real compliance stakes around members actually understanding risk, not
just having been emailed about it.

17. **Proof-of-disclosure links** — a tracked link in risk-disclosure
    material, so there's an actual record a member opened it before
    accessing a feature.
18. **Affiliate-terms acknowledgment links**, tied to the FTC-disclosure
    concern already flagged in `Specs/Links-Attribution-Affiliates-Spec-v0_1.md` §8 (Q7).

## Operational

19. **Physical-world attribution** — merch, conference badges, a physical
    desk or booth — knowing which printed thing actually gets scanned.

## Top-of-funnel / social acquisition (YouTube, X, Instagram, Facebook)

Everything in Growth/acquisition above assumes someone already found
FatTail. These are specifically for the step before that — a stranger
scrolling a feed, with no relationship to the brand yet. Almost all of
these reuse Phase 1's slug/QR/label/`source`+`medium`+`campaign` fields
exactly as built; the "build" is a naming/placement discipline, not new
code. The one real gap is called out at the end (#30).

20. **Per-video tracked link (YouTube description)** — every upload gets
    its own short link instead of one evergreen channel link, so a
    specific video's conversion is measurable, not just "YouTube"
    in aggregate. Uses existing infra — no new build.
21. **On-screen QR during the video itself** (YouTube, Reels, livestream
    overlay) — rendered directly in the frame at a specific moment, so a
    viewer with their phone in hand can scan mid-video without pausing to
    find the description. This is the literal original use case the
    labeled-QR feature (W3) was built for.
22. **Pinned-comment vs. description link A/B** — two tracked links for
    the same video testing which placement actually gets clicked (a
    YouTube-specific case of #16). Uses existing infra — no new build.
23. **YouTube's other native clickable/typeable surfaces** — video
    cards (the mid-video overlay prompt), the end-screen intro/outro
    element, the channel banner's link, and Community posts are four
    more distinct, separately-trackable placements YouTube already
    supports a link on. A different tracked link per surface (not just
    per video) tells you whether a mid-video card, the outro, the
    always-on banner, or a Community post is actually the thing that
    converts — same mechanism, four more data points per upload/channel.
    Uses existing infra — no new build.
24. **Livestream chat-drop links** — a link posted in chat at a specific
    moment tied to what's being said on screen, so a content moment can
    be correlated to a conversion, not just "this stream" as a whole.
25. **X.com thread/tweet-level links** — a distinct tracked link per
    thread or pinned tweet rather than one bio link, since X's algorithm
    often suppresses reach on tweets that contain a link — "link in the
    tweet" vs. "link in the first reply" becomes directly measurable
    instead of a guess.
26. **Instagram Story link stickers** — Stories support a native
    clickable link with a natural 24-hour attribution window; a link per
    Story keeps performance from being smeared into one bio-link bucket.
27. **Paid-ad click-through links** (Instagram/Facebook/X ad placements)
    — a separate tracked link per PAID campaign, distinct from organic
    posts on the same platform, so ad spend ROI isn't conflated with
    organic reach. Genuinely different from the rest of this list: this
    measures CAC per paid campaign, not "did this post convert."
28. **Facebook group/page post links** — the same per-post
    tracked-link discipline applied to Group posts and Page posts, where
    a lot of trading-education word-of-mouth already happens organically.
29. **"Link in bio" rotation with per-post correlation** — Instagram (and
    X, for accounts without Story-style links) typically allow only one
    clickable bio link. Rotating/versioning it per campaign push and
    timestamping the change lets a spike in bio-link clicks be
    attributed back to whichever post window preceded it.
30. **Short, speakable/typeable codes for non-clickable surfaces** —
    Instagram captions, a spoken call-to-action in a video, and X replies
    where a link is suppressed all need something a viewer can *type*,
    not click. Phase 1's random 6-char slug (`labs.fattail.ai/q/x7k2mq`)
    is fence-safe but not memorable — a vanity-slug option (e.g.
    `/yt-oct`, `/ig-launch`) would need a small, deliberate carve-out from
    the collision-safe random-alphabet design. The one item in this
    section that is an actual gap, not just a usage pattern — not built.

---

*Reference list only. See `Specs/Links-Attribution-Affiliates-Spec-v0_2.md`
for what's actually built (3a) vs. designed-not-built (3b) vs. retired
(3c, the cash-commission framing).*
