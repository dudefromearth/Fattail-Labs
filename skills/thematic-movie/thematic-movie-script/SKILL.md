---
name: thematic-movie-script
description: >
  Write the narrative screenplay for a thematic movie (cinematic doctrine
  essay, youtube_long card): three-act structure, scene table with VO +
  visual direction + b-roll cues, cold open, honest close. Use when a
  thematic movie card needs its script stage, or /thematic-movie-script.
---

# thematic-movie-script

**Type:** Thematic Movie component
**Owner:** Romeo
**Package stage:** `script`
**Board sub_stage:** `script`
**Consumes:** `research_pack` (Bravo) — claims inventory is mandatory input

---

## Purpose

Turn one doctrine theme plus a verified research pack into a **screenplay** —
not lesson VO. A movie script argues a single thesis through story: cold open
on the wound, escalate through evidence, land on the doctrine. The viewer
should finish *feeling* the fat-tail argument before they could recite it.

## Inputs

| Required | Source |
|---|---|
| Theme + thesis sentence | Card intent (Coach-seeded) |
| `research_pack` artifact | `course-research`; every factual claim traceable |
| Target length | Card intent; default 8–12 min (~1,300–1,900 words VO) |
| Cast assignment | `cast_id` on card (registry only) |

**Fail loud if:** no research pack; thesis missing or double-headed (one movie,
one thesis); any claim in the outline lacks a research-pack source.

## Output

Artifact stage `script` (markdown), structured as a **scene table**:

```markdown
# <Title> — screenplay v<N>
Thesis: <one sentence>
Length target: <min> · Cast: <NAME> · Act breaks at <~min/~min>

| # | Act | VO (paste-ready) | Visual direction | B-roll / graphic cue |
|---|-----|------------------|------------------|----------------------|
| 1 | I   | <cold open…>     | avatar, tight    | —                    |
| 2 | I   | …                | …                | cue phrase: "…"      |
```

Plus: title options (3), YouTube description draft, and a **claims ledger**
(claim → research-pack source) appended for Hotel's review.

## Structure doctrine

- **Act I — the wound** (≤90s): the viewer's lived pain, named plainly. No
  brand, no pitch. Cold open; "FatTail" not spoken before minute 2.
- **Act II — the mechanism**: why it happens — the unbounded loser, the fat
  tail, the false comfort of frequency. Evidence from the research pack only.
- **Act III — the doctrine**: survival first, convexity second. Ends on
  capacity-over-dependency, never on urgency.
- Cut points land on **cue phrases, not timecodes** (VO timing drifts in
  render). Every b-roll cue names its phrase.

## Invariants

1. Every factual claim maps to the claims ledger — no orphan claims.
2. No P&L, no implied returns, no "students made X" — ever.
3. CTA is one action, stated once, honest ("start with the flagship course").
4. VO cells are paste-ready plain text: no markdown, no stage directions
   inside VO, pronunciation-risky terms spelled for speech ("zero-D-T-E" if
   needed).

## Verify

- [ ] Word count within ±15% of target length at 155 wpm
- [ ] Claims ledger complete; spot-check 3 claims against research pack
- [ ] Act structure present; cold open contains no brand mention
- [ ] Read VO aloud once — flag any sentence you stumbled on
- [ ] Hotel flag requested (claims) · Tango flag requested (framing)

## Handoff

→ `thematic-movie-video` (Papa). Script is **plan-locked** on handoff; changes
after lock go through `revision_requested`, not silent edits.
