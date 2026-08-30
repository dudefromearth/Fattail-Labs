# Skill Definition (DRAFT) — `idea-research`

**Status:** DRAFT for Coach. Advisor-produced from session direction 2026-08-23/24.
**Feeds:** IKI Factory Research lane (IF-2). Registered, versioned; unregistered versions rejected.
**Front end:** `chain-idea-view` (existing, `.grok/skills/chain-idea-view/`).

---

## 0. Scope

| Field | Value |
|---|---|
| Active program | IKI Factory |
| Trees touched | Skill definition only |
| Reads (not writes) | Heatmap template registry · `market_symbol_universe` · Massive entitlement catalog |
| Touches outside program | **NONE** — read-only references |

---

## 1. Job

Given an Idea, search external venues, extract source text, assess what it contains, and
emit ranked findings that the Factory can turn into Template Specifications.

**It does not decide what gets built.** It produces candidates. A human advances them.

---

## 2. The two-stage shape

### Stage 0 — grounding (front end, `chain-idea-view`)

The Idea is first bound to what Labs can actually paint: the measurement, the template
that renders it (or "not in registry"), the symbol and snapshot shape, and the honesty
constraints.

**This is what makes the search bounded.** Without it, research returns things that are
interesting and unbuildable. The view card is the anchor: findings are assessed against a
measurement Labs can produce, not against general interest.

Grounding output that carries forward: measurement definition · template path or gap ·
honesty constraints · non-claim line.

### Stage 1 — search, extract, assess (this skill)

| Step | What happens |
|---|---|
| **Search** | Query configured venues for material on the grounded topic |
| **Extract** | Pull actual source text — transcript for video, article body for written |
| **Assess** | Read extracted text against the grounding. Does this contain a specific, buildable idea? |
| **Accumulate** | Hold findings. Do not emit as they arrive. |
| **Rank** | Order the accumulated set once searching completes |
| **Emit** | Fan out ranked findings as child cards |

---

## 3. The assessment filter — the load-bearing part

Searching is commodity. **The criterion is the skill.**

### 3.1 What qualifies as a finding

A finding must be **all** of:

1. **Specific** — a named, buildable thing, not a theme. "Gamma-weighted OI by strike with
   sign convention X" qualifies. "GEX is useful" does not.
2. **Reproducible from data held** — computable from the Massive entitlement and the
   existing snapshot infrastructure. Anything requiring a feed not held is not a finding;
   it is a note.
3. **Mechanism, not claim** — see §3.2.
4. **Traceable** — a specific source, locatable within it. Not "a video said so."

### 3.2 Mechanism versus claim — BINDING

Source material mixes two things and the skill must not conflate them.

| | Definition | Disposition |
|---|---|---|
| **Mechanism** | How something works, structurally. *Dealers short gamma hedge with the move, amplifying it.* Follows from the structure. | **May become a finding.** |
| **Claim** | An assertion about what to do or what will happen. *Fade the edges in positive GEX. Expect a pin into the close.* | **May be cited as "source X asserts Y." May never become a finding.** |

**A claim is never promoted to a finding, regardless of source authority, view count, or
how many sources repeat it.** Repetition across vendors is not evidence.

This is the line between the Factory producing research and producing repackaged internet.

### 3.3 High-value ranking

Rank by, in order:

1. **Reproducible from data already held** — buildable tomorrow, no purchase
2. **Gated behind an expensive product** — the incumbents sell it; a free version is a
   position, not a feature
3. **Legible** — a trader understands what they are looking at without a course first
4. **Not already built** — checked against the Heatmap template registry

---

## 4. Output — one card per finding

Hotel shape (`hotel-research-finding-shape.md`), extended with provenance:

| Field | Meaning |
|---|---|
| `title` | The specific buildable thing |
| `rank` | Position in the emitted set |
| `reason` | Why it ranks there, against §3.3 |
| `sources` | Specific locations — URL plus timestamp or section |
| `source_type` | **`mechanism` or `claim-cited`.** A card built on cited claims is marked as such. |
| `measurement` | What would be computed, carried from grounding |
| `template_gap` | Existing template path, or what is missing |
| `data_required` | Fields needed, and whether the entitlement covers them |

**No advice. No profit claims. No forecasts.** Inherited from Hotel's shape and invariant 8.

---

## 5. Laws

| # | Law |
|---|---|
| **R1** | **No expiry.** Time in the lane is not a failure condition. A search may run all day. *(Coach ruling.)* |
| **R2** | **No-results bound only.** A search that finds nothing may stop and report that. Finding nothing is a legitimate reported outcome, distinct from still working. *(Coach ruling.)* |
| **R3** | **Honest count.** N findings produce N cards. Never padded to a target. *(Coach ruling; enforced in IF-2.)* |
| **R4** | **Rank before emit.** Accumulate, rank, then fan out. No card appears at hour one and ranks eighth by hour six. *(Coach ruling.)* |
| **R5** | **No invention.** Every finding traces to extracted source text. If extraction failed, there is no finding. |
| **R6** | **Claims stay claims.** §3.2. Binding. |
| **R7** | **Running is visible.** A card searching for six hours is distinguishable from a card that is stuck. |
| **R8** | **Versioned.** Registered by name and version. A material change is a new version, not a silent edit. |

---

## 6. Modes

| Mode | Trigger | Entry |
|---|---|---|
| **Directed** | An Idea is deposited | Grounded by `chain-idea-view`, then searched |
| **Exploratory** | Continuous background | No Idea to ground. The skill surveys for what is worth building at all, and **deposits into Ideas** like any other feeder. *(Coach: ideas come from humans or research; research seeds ideas in the background.)* |

Exploratory findings enter the same lane through the same door. The card shows which
feeder produced it — not to treat it differently, but so Coach knows whether he is looking
at his own thinking or something found.

---

## 7. Open decisions — Coach rules, advisor does not default

| ID | Decision |
|---|---|
| **RS-1** | **Venue list.** YouTube and financial blogs are named. What else — vendor documentation, academic, forums, product pages? Is the list configurable per run or fixed at registration? |
| **RS-2** | **The no-results bound (R2).** What actually bounds it — elapsed time, venues exhausted, candidates assessed? |
| **RS-3** | **Emission cap.** IF-2 fans out to 10 with remainder on the parent. Is 10 the cap for this skill, or does it emit fewer by design? |
| **RS-4** | **Source credibility.** Are venues tiered, or is every source equal until assessed? |
| **RS-5** | **Paywalled material.** Does the skill read what it cannot legitimately access? Advisor position: no. |
| **RS-6** | **Exploratory cadence.** Continuous, daily, or invoked? And does it need a topic boundary, or does it roam the entitlement? |
| **RS-7** | **Dedup.** Against existing templates, prior findings, and prior Ideas — what is checked before emitting? |
| **RS-8** | **One skill or two.** Directed and exploratory share the assessment filter but differ at entry. Same registered skill with a mode, or two registrations? |
| **RS-9** | **Adaptation source.** `/video-idea-finder` is structurally close (search, rank, return). Adapt it, search the marketplaces, or author fresh? |

---

## 8. Advisor notes

**On the front-end claim.** Grounding-first is right and does real work: it bounds the
search and gives the assessment something to measure against. Worth noting it also
constrains — an idea with no current template grounds as a gap rather than a match, and the
skill must treat "not in registry" as a valid anchor rather than a dead end. Otherwise
research only ever finds extensions of what already exists.

**On why the criterion matters more than the search.** A continuous search that finds
*interesting* things fills the lane with work that never converts. A search that finds
*reproducible, gated, legible, unbuilt* things pays for itself. §3.3 is the difference, and
it is the part that should get the most scrutiny before this is registered.

**On what was observed 2026-08-24.** A plain search on "how to use GEX" returned mechanism
and claims mixed together in the same result set, from vendors selling GEX products. That
is the normal condition of this material, not an edge case. §3.2 exists because of it.

---

**End of draft.**
