# FatTail Labs — Wiki Quick Links by Venue Spec v0.1

**Status:** DRAFT for Juliet. Advisor-produced. Not implementation instruction.
**Author:** Advisor (Claude), from Coach's direction in session 2026-08-23.
**Parent authority:** FatTail-Labs-Wiki-Agent-Spec-v0.1 (D5 session contract).
**Unverified citation — Coach should confirm the parent filename and version.**
**Sibling:** FatTail-Labs-Wiki-Source-Contract-Spec-v0.1 (how content enters; this
document is how it is found).

---

## 0. Scope statement

| Field | Value |
|---|---|
| Active program | Wiki |
| Trees touched | Wiki search component; quick-link configuration; venue lane definitions |
| Touches outside program | **IKI Lab shop surface** — §4 specifies a Wiki component embedded in the store. **Coach-directed in session; raised here rather than assumed.** Confirm before Juliet seeds. |

Out of scope, stated explicitly: pricing, subscription caps, fee structure, checkout, and
anything touching commerce. Those belong to the commerce spec under the WooCommerce
entry-point ruling. This document routes to them and stops. See §7.

---

## 1. The governing insight

There is no global quick-links list.

**Coach's ruling (2026-08-23):** the quick links a visitor sees depend on the venue in
which the Wiki search is placed. The same component, embedded in three different places,
serves three different intents — and serving the wrong intent wastes the placement.

The mechanism already exists. **D5's session contract carries `{surface, route, entity}`.**
The same context that scopes the agent's answer scopes the link set. This is not new
plumbing; it is a second consumer of plumbing already specified.

**Consequence:** adding a venue later is a configuration entry, not new code.

---

## 2. The three audiences

Coach named these in order, then corrected their weighting.

| # | Audience | Where they are | What they want |
|---|---|---|---|
| **A1** | **Practitioners — in house** | Inside FatTail Labs, signed in | Information that advances their trader knowledge and practice |
| **A2** | **Knowledge seekers — out of house** | Public surfaces | To discover what the service is about |
| **A3** | **IKI seekers** | The store | Knowledge-tier content, obtained |

**Weighting ruling (Coach):** *"The list that will actually generate future revenue is the
IKI."* A3 is not one lane of three equal lanes. It is the lane with a commercial ladder
behind it, and it is weighted accordingly. A1 and A2 are served on their own surfaces; A3
gets the store, specified separately in §4 because it behaves differently.

---

## 3. Venue lanes

### 3.1 The component

One search component. One rendering. Link sets are **configuration**, resolved from the
session context at request time. No forked components per venue.

| Element | Behavior |
|---|---|
| Search input | Identical across venues — the primary affordance |
| Quick links | Venue-resolved set, rendered beneath the input |
| Resolution | From `{surface, route, entity}` on the session contract |
| Unknown venue | Falls back to the default lane, silently and completely (§5) |

### 3.2 Lane A1 — practitioner, in house

| Aspect | Ruling |
|---|---|
| Placement | Wiki surfaces inside Labs; app surfaces where the search is embedded |
| Content bias | Material that advances trading knowledge and practice |
| Entity awareness | Where `entity` is present on the session contract, links bias toward that entity's subject matter — a member searching from inside a Journal surface is not asking the same question as one searching from the hub |
| Commercial content | Not the purpose of this lane. Store links are not promoted here. |
| Curation | Admin-set (OD-3) |

### 3.3 Lane A2 — knowledge seeker, out of house

| Aspect | Ruling |
|---|---|
| Placement | Public surfaces — FAQ, general pages, the public Wiki front door |
| Content bias | Methods, strategy, how we think about the work — discovery content |
| Purpose | Let a stranger understand what the service is about without a sales pitch |
| Commercial content | Present but not primary. This lane makes the paid rungs *visible*, it does not sell them. |
| Curation | Admin-set (OD-3) |

**Conflict flagged.** `FatTail-Labs-Member-Wiki-Spec-v0.1` §2 states the Wiki is
member-gated in v1 with no public or SEO surface. Coach's subsequent ruling is that Wiki
contents are wide open to the public by default and the Wiki is the free front door.
**Lane A2 cannot exist under the older spec.** This is a version conflict requiring a
decision-log entry naming the current truth, not a quiet pick in configuration. **OD-1.**

### 3.4 Lane resolution table

| Surface class | Lane | Default when ambiguous |
|---|---|---|
| Signed-in Labs app surfaces | A1 | A1 |
| Public marketing, FAQ, public Wiki | A2 | A2 |
| Store | Store venue (§4) | — |
| Unrecognized | Default lane | OD-2 |

---

## 4. The store venue — special case

The store is not a fourth lane. It behaves differently enough to be specified separately.

### 4.1 What it is

**Coach's correction, recorded:** *templates are the transport mechanism. Knowledge and
Intelligence are the levels of information that the transport conveys.* A template is a
vessel; the tier describes what is inside it.

**Consequent ruling:** Intelligence is contractual and is **not a store item**. It gets a
sales page and an inquiry route — a small number of high-value conversations, not a
funnel. **The store is the Knowledge storefront.** One thing on offer, one path to obtain
it.

### 4.2 The scale problem

The IKI Factory is projected to produce **up to ten templates per day**. Browsing does not
survive that catalog size — nobody scrolls thousands of entries.

**Therefore: quick links on the store are not navigation. They are the access path.**
Declared intent becomes the index.

### 4.3 The interview

| Aspect | Ruling |
|---|---|
| Form | Short, click-based. What are your interests — click, click, click. No typing. |
| Timing | Runs at the same moment as the existing email-and-intent gate on Knowledge |
| Output | Narrows the catalog to a relevant set; that set becomes the quick links |
| Nature | **Declared** intent, not inferred behavior. The visitor says what they want. Nothing is being watched. |
| Question set | **OD-4** — not specified here |

**Why declared and not inferred:** it is a lighter privacy posture, it is more accurate
than behavioral inference at low sample sizes, and it fits the exchange already happening
at the gate. The visitor gives intent; they get relevance.

### 4.4 Ranking within the declared set

| Layer | Ruling |
|---|---|
| **Aggregate popularity** | Views, clicks, and conversions **across all visitors**. Catalog-level signal. This ranks the catalog, not the person — no individual profile is built. Popular templates move toward the front over time. |
| **Curated default** | Where aggregate data does not yet exist, admin-curated by clearest use case. Not by traffic — there is no traffic yet. |
| **Individual personalization** | **Deferred.** See §4.6. |

### 4.5 Ratings

Coach's direction: star rankings on templates, to make popularity legible.

| Aspect | Ruling |
|---|---|
| Subject | **Usefulness of the template.** Never outcomes. |
| Prompt | The review prompt asks about usefulness, not results. People largely answer the question they are asked — the prompt does most of the enforcement. |
| Moderation | Flag-and-remove where something egregious surfaces. Coach's position: not his job to police every comment, but reasonable moderation is legitimate and makes the surface honest. |
| Doctrine | A member's review is not a claim by FatTail. But L8 (process outcomes only) still governs everything FatTail authors around it. |
| Who may rate | Open — Intelligence sits behind contracts and has a far smaller pool. **OD-5.** |
| Ships in v1? | **OD-6** |

### 4.6 Personalization — deferred behind a gate

Where identity exists, the store *could* rank toward templates a member has not seen, or
adjacent to prior selections.

**This is deferred, and it is deferred deliberately.** It crosses from context-driven
configuration into behavioral data on identified users, on a commercial surface, steering
purchase behavior. Two separate concerns:

| Reviewer | Concern |
|---|---|
| **Mike** | What is stored, for how long, and whether ranking signals accumulate into a shadow profile |
| **Tango** | Capacity over dependency. Ranking toward what genuinely serves someone and ranking toward conversion are not always the same thing. The store should not be optimizing to keep people clicking. |

No personalization ships before both have reviewed. **OD-7.**

### 4.7 The quality invariant

**Coach's ruling, recorded verbatim in substance:** *quality is never the lever.*

Everything in the free tier is live and real. There is no degraded tier, no end-of-day
fallback, no stale data. The stated positioning is that a visitor should look at what
FatTail gives away and at a thirty-dollar-a-month competitor and find the comparison
absurd.

**Therefore the constraint is volume or duration — how many, or for how long. Never how
good.**

This is a positioning weapon, not generosity. A volume cap reads as reasonable when what
is inside the cap is better than what is sold elsewhere.

### 4.8 Purpose of the store

The primary purpose is **lead capture.** The template is the reason to hand over an email.

| Metric | Note |
|---|---|
| **Cost per email** | Measurable from day one. Acquisition is expected in the pennies under organic growth — the real cost sits in *serving*, not acquiring. A free subscriber running templates for a year costs more than the email did. |
| **Revenue per email** | Requires a cohort to reveal itself. Instrument from day one; measure later. |

The spread between them determines the free-tier ceiling. **That number is not set here.
Coach's position: wait and see.**

---

## 5. Fallback law

Where the venue is unrecognized, the interview is unanswered, aggregate data is absent, or
identity is missing — the component **falls back to the admin-curated default set,
silently and completely.**

No empty state, no degraded rendering, no error surfaced to the visitor. A fallback that
announces itself is a defect.

---

## 6. Doctrine notes

1. **Process outcomes only.** No profit claims on any template card, any quick link label,
   or any preview copy. Process framing throughout.
2. **Ranking serves the stated need, not engagement.** Capacity over dependency applies to
   the store as much as to Practice.
3. **No gamification of reading.** Ratings measure usefulness of a purchasable artifact.
   They are not read streaks, completion percentages, or social proof on Wiki surfaces.
4. **Configuration, not code.** A new venue is a configuration entry. If adding a venue
   requires a deploy, the design has failed.

---

## 7. Explicitly out of scope — routed elsewhere

| Item | Routed to |
|---|---|
| Free subscription cap (three? five?) | Commerce spec. Coach: wait and see. |
| Fee for additional subscriptions | Commerce spec, WooCommerce entry point |
| Checkout, subscription mechanics | Commerce spec |
| Intelligence contracting | Separate sales-page and inquiry spec |
| The Knowledge grid page itself (preview, subscribe) | Store surface spec — this document covers the **quick links component** placed on it, not the page |

This document specifies where a visitor is pointed. It does not specify what happens when
they arrive at a paid boundary.

---

## 8. Open decisions

Advisor raises; Coach rules; Lima logs. **No proposal below is a default.**

| ID | Decision | Note |
|---|---|---|
| **OD-1** | **Public Wiki conflict.** Member-Wiki-Spec-v0.1 says member-gated, no public surface. Coach's later ruling says wide open by default. Lane A2 depends on the resolution. | **Blocking for A2.** Needs a DL entry naming current truth. |
| **OD-2** | Default lane when the venue is unrecognized | Coach rules |
| **OD-3** | How many quick links per lane, and who curates each | Coach rules |
| **OD-4** | The interview question set, and how many clicks it may take | Coach rules |
| **OD-5** | Who may rate — all visitors, email-gated, or subscribers only | Coach rules |
| **OD-6** | Do ratings ship in v1 or follow | Coach rules |
| **OD-7** | Individual personalization on the store — Mike and Tango review before any spec | Coach rules on sequencing |
| **OD-8** | Whether A1 quick links may vary by `entity`, or only by `surface` | §3.2 proposes entity-aware; Coach rules |
| **OD-9** | Whether aggregate popularity counts require any disclosure to visitors | Mike input likely |

---

## 9. Review routing

| Reviewer | Concern |
|---|---|
| **Mike** | Aggregate signal collection (§4.4); the deferred personalization boundary (§4.6); OD-9 |
| **Tango** | Store framing; ratings prompt language; capacity-over-dependency on a commercial surface |
| **Echo** | One component, several configurations — the visual contract across venues |
| **Sierra** | Lane A2 discovery content, pending OD-1 |
| **India** | That venue resolution consumes the existing D5 session contract rather than inventing a parallel context mechanism |

---

## 10. Content hash footer

`Wiki-Quick-Links-by-Venue-Spec-v0.1` — first issue, no prior version. Content hash to be
stamped by Lima on landing.
