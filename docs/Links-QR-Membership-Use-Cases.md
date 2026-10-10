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

---

*Reference list only. See `Specs/Links-Attribution-Affiliates-Spec-v0_2.md`
for what's actually built (3a) vs. designed-not-built (3b) vs. retired
(3c, the cash-commission framing).*
