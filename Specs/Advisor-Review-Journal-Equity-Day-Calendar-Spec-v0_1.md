# Advisor Review — Journal Equity Day Calendar Spec v0.1

**Reviewer:** Advisor layer (Claude) · **Date:** 2026-08-09
**Verdict: WELL-BUILT, ONE DOCTRINAL DECISION ONLY COACH CAN MAKE.** The spec is faithful to Coach's stated direction, the engineering discipline is right (derived-at-read, no P&L fork, no second store, empty ≠ zero, timezone law, sum law, accessibility law), and the CJ-6 tension is honestly named rather than hidden. But it contains a valence inversion against law landed *today*, and a conceptual conflation in the tone model that should be resolved before JED-2 paints anything. Findings below.

---

## JE-1 — ⚠️ DOCTRINAL (Coach only): The valence inversion

Today's Positions View spec (v0.2, register rules) and the standing blotter law both forbid red/green valence on money figures — *"gains and losses in standard text color; facts in one voice"* — on the **capital and positions surfaces**. This spec paints the **Journal calendar** — the process surface, the heart of process-not-P&L — in a red↔green money gradient with deep-color scaling.

That is an inversion: the money surfaces stay neutral while the *reflection* surface becomes the win/loss heatmap. A member who opens their Journal to process a hard week meets a wall of graded red before they type a word. Tango's standing question applies with full force: would a bleeding trader, short on trust, feel respected and taught by a month of deep-red cells above their reflection space?

**This is not a veto — Coach explicitly dictated gradients of red and green, and the product is Coach's.** But the contradiction between same-day specs cannot land silently. Three resolutions, any of which is lawful once *stated*:

1. **Ratify the exception:** amend the register law to scope it — "no valence on capital/position surfaces; the Journal equity map is the sanctioned equity-awareness instrument." Lima logs the carve-out and its rationale.
2. **Single-hue intensity:** keep the map, drop the red/green — one neutral hue scaled by |net|, sign carried by the amount text (which E9 already mandates). Preserves scannability, kills valence. My recommendation if asked.
3. **Spec's own dials (§10):** amounts without gradient, or tone without amounts.

Whichever lands, the two specs must cite each other so the boundary is doctrine, not accident.

## JE-2 — SUBSTANTIVE: Two different maps are conflated in one color channel

E3/§4.2 lets a **member declaration override the tone** while the amount stays derived. Look at what that actually creates: the *derived* gradient is a **money map** (system-computed fact); the *declared* tone is a **member-authored judgment** — and the spec never says judgment *of what*. If a member marks a −$400 day "positive," they are almost certainly saying *the process was good* — took the stop, followed the plan, the loss was designed. That is a **process map**, and it's the doctrinally beautiful half of this spec: trader-authored reflection, exactly the "reflection belongs to the trader" law, and arguably the map a *Journal* should carry.

So the spec holds two instruments in one channel: a money heatmap (system valence — the JE-1 risk) and a process-tone map (member-authored — doctrine-clean, Journal-native). Recommend deciding which instrument this surface *is*, or explicitly rendering them as two channels (e.g., fill = declared process tone, amount text = money fact) rather than letting declaration silently repaint a money map. Note the irony worth savoring: the *declared* red/green is doctrinally safer than the *derived* red/green, because the trader authored it.

## JE-3 — SUBSTANTIVE: Post-amendment vocabulary in campaign scoping

Open decision #3 offers "exact stamp only vs **default-book whole-account rule**" — pre-amendment vocabulary. Post-amendment there is no default book: account scope = all outcomes in the account (directed + undirected); campaign scope = stamped outcomes only; an "Undirected" scope is also now a lawful filter per the Positions View chip row. Restate the decision in those terms. Also add the redirect consequence as an acceptance case: a badge redirect **re-buckets past days** under campaign scope (derived-at-read means the map's history lawfully changes when stamps move) — T-case it so nobody files it as a bug.

## JE-4 — MINOR: "Equity day" is now a colliding name

As of today, *equity* has a precise capital-layer meaning (positions + cash; the decomposition line). This surface maps **realized day net** — which excludes unrealized and movements, i.e., it is explicitly *not* equity change. Suggest "Day Net Calendar" / "P&L day map" internally; keeps the capital vocabulary clean before both ship.

## JE-5 — MINOR: Period-relative intensity makes quiet months look loud

Normalization option 1 scales to the period max, so a month of ±$30 days paints as dramatically as a month of ±$3k days. That's a perceptual lie at low stakes. Fixed buckets (option 3) are stable across periods and cheapest; capital-relative (option 2) is most honest but inherits the starting-balance dependency. Recommend buckets for v0.1; revisit after OD-MC/OD-SV mature the capital denominators.

## JE-6 — MINOR: Mobile density on month cells

Day number + amount + gradient + activity marks in a month cell on a phone is tight; Echo should prototype before JED-2 commits, with a stated fallback (tone + day number only, amount on tap) so density pressure doesn't silently delete E9's amount-text mandate.

## Notes without findings

- E2/E4's reuse mandate (analytics day buckets, no Journal-side P&L fork) is exactly right and should survive any resolution of JE-1.
- E6 (empty ≠ zero), E7 (ET day law), E8 (sum law), E9 (never color alone) are all correct and Kilo-able as written.
- §10's honest handling of CJ-6 — including pre-authorized fallback dials — is the right way to carry a tension into review rather than around it.
- v0.1a-before-v0.1b sequencing is right regardless of JE-2's resolution.

## Summary for Coach

Ship-shaped spec; the engineering can start on JED-1 (the API) under any resolution. Before JED-2 paints a single cell, two words from you: **the valence question** (ratify the exception, go single-hue, or use a §10 dial — my opinion, labeled as opinion: single-hue intensity with signed amounts gives you the scannable equity map without teaching the Journal to shout win/loss), and **which map this is** (money, process, or explicitly both channels). Everything else is small and fixable in flight.
