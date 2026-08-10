# Resolution Note — Campaign Charter Tiering (Required Core vs Advanced)

**Status:** Coach ruling 2026-08-09 — **folded into** [Campaign Phase Model v0.2.2](./Campaign-Phase-Model-v0_2.md) (§0 L-Adopt · §2.2–2.3)  
**Date:** 2026-08-09  
**Applies to:** Campaign Phase Model · Correlation Doctrine v0.2 (OD-CR-2)  
**Authority note:** Advisor draft of Coach's ruling. Lima logs on Coach approval.  
**Supersedes for §2.1:** earlier tiering notes without adopted-attributes bind.

**Coach's ruling (2026-08-09, paraphrase-faithful):** Some things — capital allocation,
max drawdown, and start date — are **required**, and displayed **big and easy** so the
trader sees that this is the minimal set they must fill out. The advanced material is
mostly **selectable to bring forward** — hidden or optional by default.

---

## 1. The Big Three (required tier)

| Field | Required means | Doctrine fit |
|-------|----------------|--------------|
| **Capital allocation** | Mode + amount (or wrap/proportion per Capital modes) declared before the charter signs | Ring 2 of the sizing model — allocation as declared intent from the pool |
| **Max drawdown** | Tolerated max DD for this campaign, declared | Ring 3 input — **with allocation, this makes solved size computable for every campaign**, not just the diligent ones |
| **Start date** | Window opens on a declared date | Window law L4; the stamp's eligibility begins |

**Why this is coherent, not just convenient:** the Big Three are exactly the inputs the
Capital & Position-Sizing Model needs to do its job. A campaign chartered with these
three can always answer "how big should this trade be?" — the platform's most
protective question. The required tier is the sizing model made mandatory-at-charter.

**Umpire check (passes):** requiring definitional minimums to *sign a charter* is form
completeness, not trade blocking. Undirected trading remains fully lawful with no
campaign at all — nothing about the member's ability to trade is gated. The umpire
governs the log path; the charter is a deliberate declared instrument and may have a
minimum definition.

**Flagged change:** Campaign Phase Model v0.1 §1 listed max DD target as *optional*.
This ruling flips it to **required**. Prominent because it alters signed-draft text —
it is Coach's own ruling, flagged per standing practice, not questioned.

**Not required (noted deliberately):** *end date*. Coach's list omitted it;
open-ended campaigns remain lawful until the conclusion act (Phase Model §3.3 holds).
If Coach intended end date required too, one word reverses this.

---

## 2. The tiers

```
┌─────────────────────────────────────────────────────┐
│  START A CAMPAIGN                                   │
│                                                     │
│  ██ Capital        ██ Max drawdown    ██ Starts     │
│  ██ allocation     ██                 ██            │
│     (big, unmissable, three fields, that's it)      │
│                                                     │
│  Same-bet answers (30 seconds, skippable)           │
│   What are you trading? · Leaning? · Calm or wild?  │
│   · What kills it?                                  │
│                                                     │
│  ▸ More options                                     │
│    (end date · goals · strategy list · retro link · │
│     allocation nuance · version display)            │
└─────────────────────────────────────────────────────┘
```

| Tier | Contents | Behavior |
|------|----------|----------|
| **1 — Required core** | Capital allocation · max drawdown · start date | Big typography, always visible, charter cannot sign without them |
| **2 — Visible, optional** | **Same-bet answers** (Correlation CR-10) | On the form, skippable, never behind disclosure — see §3 |
| **3 — Advanced, brought forward** | End date · goals · strategy allow-list · retro link · dynamic-allocation nuance · anything later | Collapsed behind one "More options" disclosure; selectable to bring forward |

Tier assignments beyond the Big Three are **advisor recommendations** — each is one
word to move.

### 2.1 Adopted attributes bind (Coach ruling, 2026-08-09)

**Coach's ruling (paraphrase-faithful):** Optional things become **actionable
attributes of the campaign** only when an advanced trader chooses to use them.

**Law (proposed):** *An optional attribute is dormant until adopted; adoption makes it
law.*

| State | Meaning |
|-------|---------|
| **Unadopted** | Zero effect. No ghost defaults, no silent behavior. The attribute does not exist on the charter — absence is the honest state, not a hidden default value. |
| **Adopted** | A signed charter term like any other: witnessed in reports, changed only by amendment, visible in the change log. |
| **Un-adopted later** | An amendment with a change-log entry — never a quiet clear. Removing a charter term is as much a decision as adopting it. |

Per-attribute activation (illustrative):

| Attribute | Unadopted | Adopted |
|-----------|-----------|---------|
| Strategy allow-list | Stamping ungoverned by any list (not "all allowed by default rule" — the rule doesn't exist) | "Stamped outside your list" witness activates |
| End date | Window open until conclusion act | Window-close behavior binds |
| Same-bet answers | Campaign shows "not answered" (CR-7) | Participates in rollup + stamping prompt (CR-11/12) |
| Goals | No goal chrome | Goals appear on page; retro may reference |

This is the charter-level echo of **config-driven, no silent defaults**: the platform
never behaves as if an undeclared term had been declared.

---

## 3. The one tension in the ruling, surfaced honestly

The north star (correlation) and the ease ruling both belong to Coach; this ruling's
"advanced stuff mostly hidden" could be read as burying the Same-bet answers in Tier 3.
**Advisor recommendation: don't.** Reasoning:

1. The account-level Same-bet check and the stamping-moment prompt (CR-11/CR-12) are
   only as good as the declarations feeding them. A hidden declaration starves the
   north-star readout — the platform would witness an empty room.
2. CR-10 made the declaration cost ≤30 seconds of taps precisely so it could live in
   the open without weighing the form down. Hiding it wastes the ease work.
3. Tier 2 keeps both rulings whole: *required stays tiny* (Coach's minimal core is
   untouched — three fields), and *the north star stays visible* (skippable, but seen).
   CR-7 already handles the skip honestly: "not answered" is a witnessed state.

This also **closes OD-CR-2** (declaration required vs optional): **optional**, per this
ruling's spirit — Tier 2 placement, never required, never hidden. Reverts on Coach's
word.

---

## 4. Fold deltas

**Campaign Phase Model v0.1 → v0.2 (hand to Grok, cumulative with the CP-1 delta in
Correlation Doctrine v0.2 §9):**

1. §1 Definition row: split Examples into **Required — capital allocation (mode +
   amount) · max DD (required, was optional) · start date** and **Optional — title
   beyond default, goals, end date, strategy allow-list, retro link, Same-bet answers**.
2. §2 Layout law, definition strip: annotate `1–3 Definition strip` with
   `(Big Three rendered large; Same-bet answers inline-optional; remainder behind
   "More options" disclosure)`.
3. §3.2 Capital allocation: add `Allocation mode + amount are charter-required (Tiering
   Ruling 2026-08-09).`
4. §6 Implementation order, item 3: reword to `Definition: required Big Three with
   prominent rendering + disclosure tier for advanced fields; …`
5. §1 Doctrine anchors: add `- Optional attributes are dormant until adopted; adoption
   makes them charter law (Tiering Ruling §2.1). No ghost defaults; un-adoption is an
   amendment.`

**Correlation Doctrine v0.2 → v0.2.1 (advisor holds until next version):**

- OD-CR-2 → **Closed:** optional, Tier-2 visible placement per Tiering Ruling.

---

## 5. Open words for Coach — **CLOSED 2026-08-09** (Coach + Phase Model v0.2.1/v0.2.2)

| # | Question | Coach lock |
|---|----------|------------|
| 1 | **End date** | Not required to start/sign; remains; **required to complete/archive**. Dormant-until-set until conclusion. |
| 2 | **Same-bet Tier 2** | Confirm. Optional; **actionable when adopted** (L-Adopt). |
| 3 | **Max DD form** | Always **% of allocation**. |
| 4 | Tier-3 moves | Residual one-word overrides. |

---

## 6. Document history

| Date | Note |
|------|------|
| 2026-08-09 | v1.0 — Tiering ruling captured; Big Three required; tier table; OD-CR-2 closure; fold deltas |
| 2026-08-09 | v1.1 — §2.1 Adopted attributes bind: dormant-until-adopted law; activation table; un-adoption = amendment; fold delta 5 |
| 2026-08-09 | Folded into Campaign Phase Model v0.2.2; §5 closed with Coach L-End / L-T2 / L-DD / L-Adopt |

---

*The minimum is three fields, rendered big. Everything else earns its place on the
form by being asked for — except the four questions that feed the north star, which
stay in the light.*
