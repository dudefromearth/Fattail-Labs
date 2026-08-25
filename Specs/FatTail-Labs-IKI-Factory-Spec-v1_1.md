# IKI Factory — Specification v1.1

**Named by Coach, 2026-08-25.**

| | |
|---|---|
| Status | **BUILD AUTHORITY** |
| Supersedes | v1.0 (BUILD AUTHORITY, 2026-08-24) |
| Relationship to `IKI Factory Spec v0.1.5` | **AMENDS.** v0.1.5 remains law for anything this document does not cover |
| Charter | `agents/bench/gemba.md` — invariant 9 superseded per **DL-580** |

**Scope statement.** Active program: IKI Factory — the board, the work item, the
lanes, and the transitions between them. Touches outside program: **the Wiki**, at
§7 only. Flagged, not written past.

---

## 0. Review history

### 0.1 Coach rulings, 2026-08-25 (this revision)

| Ruling | Effect |
|---|---|
| **The wiki page leaves Gemba's scope.** Reverses part of DL-580 | §7.3 — four artifacts, not five |
| **Help guide and help wiki page are two artifacts**, previously collapsed | §7.3 table |
| **A wiki page is not a Live precondition.** Product publishes, then goes noisy until one exists | §7.6 rewritten |
| **Notify Oscar on publication**, exactly as a course or help guide does | §7.8 |
| **The derivation rule is general**, not Factory-specific | §7.8 |
| Consequence: the Wiki publish-path blocker dissolves | §8.10 |

**§7.6 as previously written made Live unreachable.** It required a wiki page before
Live, and the Factory does not produce one. IF-8's build surfaced this as its largest
open disposition; Coach's ruling resolved it from the other direction.

**Needs a decision-log entry** reversing DL-580's wiki-page grant to Gemba — not a
quiet edit. Same discipline as the invariant 9 catch.

**Charter edit required**: `agents/bench/gemba.md`, Staged scope and workflow 7.

### 0.1b Naming, ruled 2026-08-25

**"Template" is retired. The thing the Factory produces is a Knowledge app.** Coined
by Coach this session — "template" undersells it; a template sounds like a starting
point you fill in, a Knowledge app is a thing someone uses.

**Intelligence apps are the tier above, and evolve from similar zygotes** — same
origin, further along. An Intelligence app is not a different species from a
Knowledge app.

Consequence, not yet worked: if what a thing becomes is a matter of how far it
developed, the Factory produces **one kind of thing** and the level is not a category
assigned at intake. This is consistent with cutting `level` and `use-mode` from the
work item (§2.2). The entity model — Information, Knowledge, Intelligence as
entities — is **deferred**.

**Reach:** this term is platform-wide, not Factory-only. It appears in the IKI
hierarchy documents, the store, and the pricing structure, none of which are changed
by this spec.

**Document renamed** from "IKI Factory — Pipeline Specification" — "Pipeline" existed
only to distinguish it from `IKI Factory Spec v0.1.5`, which this amends.

### 0.2 Phase 3 / Phase 4 findings folded (v0.8)

Hotel H-1 (claim-type gate), Echo E-1/E-2 (side-panel precedent), Tango T-1
(register), Mike M-1/M-2 (admin enforcement, create endpoint). All folded at v0.8;
unchanged by this revision.

### 0.3 Dispositions folded from Coach's interview, 2026-08-24

| Was open | Ruled | Effect |
|---|---|---|
| Where raw ideas get worked up | **No lane.** A create-backlog function plus an API endpoint | §2.1 |
| Opening an item | **Side panel**, Apple HIG, consistent with Practice | §2.5 |
| Priority as rank or ordered list | **Priority cut entirely** | §4 removed |
| Size as optional label | **Stays out** | §2.2 |
| Supersede or amend v0.1.5 | **Amend** | header |
| Admin-only floor | **Confirmed.** Never member-visible | §1.2 |
| Staged cohort labeling | **No label.** The staging server is the label | §7.2 |
| Level / use-mode fields | **Deferred.** Intelligence ships under contract, but these are IKI **entities**, not card fields | §2.2 |
| "Sell" vs usage + intent + paid | **Dissolved** — the question was about a priority signal that no longer exists | — |

**Two things dissolved rather than answered.** Cutting priority removed the ranking
signal Grok's question was about. Level and use-mode turned out to belong to the
entity model, not the item schema.

**Also closed since v0.6:** DL-580 records the invariant 9 supersession. Gate SC-0-G's
PASS stands as history; its quoted evidence is superseded, not invalidated.

---

## 1. Purpose and the governing distinction

1.1 The Factory turns an idea into something that can be sold or handed to a member.
A production pipeline, not a place traders work.

1.2 **Admin floor only.** The **board** is never member-visible; the suite pill is
operator chrome. Enforcement is server-side, not chrome-only — verified at Phase 4.

This does not cover the **Live catalog**, which is member-visible on purpose: published
Knowledge apps are the thing being sold.

### 1.3 Coded, declarative, boundary

| Kind | Test | In the Factory |
|---|---|---|
| **Coded** | Needs an appendage the agent lacks — filesystem, network, external API | The board surface; the Knowledge apps; Staged artifact production |
| **Declarative** | Process flow an agent reasons about from stated conditions | Which artifacts an item needs; what a lane's work consists of |
| **Boundary** | What may happen without a human. Declared and enforced, never reasoned | The Live promotion (§8). Hold. Hotel and Tango on sales surfaces (§7.5) |

**The agent is a decision maker. Skills are its interface to systems.** A skill is
mechanism, never judgment. If a skill needs a decision to execute, that decision
belongs to the agent and does not get buried inside the skill.

**Boundaries do not soften as agents improve.**

---

## 2. The work item

2.1 **The first lane is a backlog, and everything in it is ready to advance.** It is
not a grooming pen.

> Coach: "It wouldn't be in the backlog if it wasn't ready for advancement."

**There is no lane before it.** Raw ideas live outside the Factory — in a note, a
chat, wherever they already live. Items enter the backlog two ways:

- a **create-backlog function** on the board
- an **API endpoint**, so a service or an agent can create a card directly

Originator (§4) is set naturally at that boundary: a card created by a research agent
carries that agent; a card Coach creates carries Coach.

2.2 **Fields.** Reduced until nothing further could come out.

| Field | Set by |
|---|---|
| Title | Author |
| Description | Author — the real body: what it is, why it matters, constraints, what the originator knew |
| Originator | Automatic at the create boundary. **Required** |
| Status | The lane it is in |
| Attachments | Author — links and uploads |
| Created date | Automatic |

**Cut, and why:** owner (always the admin — one value is not a field); complexity
(negligible throughput impact); size (same principle); category (advisor invention,
drove no decision); ready/groomed flag (single-valued given 2.1); **priority** (the
pull model removed the reason for it — nobody schedules into a queue, so a chip
saying "medium" ranks nothing); **notes** (description already carries free text).

**Level and use-mode are not fields.** Information, Knowledge, and Intelligence are
**entities**, not tags on a card. Intelligence ships under contract — that follows
from being Intelligence, not from a box someone ticks. Where the entity model lives
and how an item references what it produced is **deferred**; nothing in this pipeline
depends on it.

2.3 **Attachments are often the whole substance of the item** — a paper Gemba found,
a chain screenshot, a competitor's page. Keeping a summary and losing the artifact is
the thin-material failure.

Attachments are also where the wiki agent finds material it cannot get from the repo.

2.4 **The card is for scanning.** Title and originator. Everything else behind it. No
attachment count — an attachment may be a link or two hundred pages.

2.5 **Controls come off the card.** The board today renders Back / Advance / Hold /
Rework inline on every card. Opening an item shows a **side panel**, conforming to
Apple HIG. Controls live in the panel.

**Precedent, stated precisely.** The pattern to match is Trade Log's `TradeSheet.tsx`
and `ImportSheet.tsx` — not "Practice" generally. Those are the only side panels in the
repo, they are two hand-rolled copies rather than a shared component, and every other
Practice surface renders panel content inline instead.

**One deliberate divergence from that precedent.** Both existing sheets sit behind a
full-screen dimming scrim that blocks the background. The goal here is that **the lanes
stay live and readable** while the panel is open. That is a new interaction for this
codebase, named here so it is not discovered at build time.

---

## 3. Movement — pull, not push

3.1 **Nothing advances itself.** No conveyor, no precondition engine, no auto-move.
An item moves when someone takes it.

3.2 **Capacity is not a configured number.** It is whoever is willing to do the next
piece of work. No WIP limit to set.

3.3 **The pull table.** Where an agent pulls, that agent is **Gemba** — no other
bench seat substitutes.

| Transition | Who pulls | What they judge | Evidence attached |
|---|---|---|---|
| Backlog → Research | **Gemba or a human** | That it can take the work on | — |
| Research → Spec | An admin | That there is enough attached to develop from | Research |
| Spec → Build | The admin | That no blockers or issues remain | Spec(s) + build plan |
| Build → Staged | **Gemba** as build agent | Carries it to the finish line | Built artifact |
| **Staged → Live** | **Coach — §8** | **A boundary, not a pull** | — |

3.4 **Ready for Build = spec(s) and build plan attached, no blockers open.** One
puller, named evidence — without both, the board grows informal side channels.

3.5 What accumulates on the item is **evidence**. The item is its own record.

3.6 **Hold is sacred**, available at every lane.

3.7 **Divergence flagged:** `v0.1.5` seats Gemba against the conveyor. Here and in the
revised charter he is a puller and a worker — same seat, retrained.

---

## 4. Originator and provenance

4.1 Originator records true source: Coach, the system, a named agent, or an **outside
source**. **Required**, set at the create boundary.

4.2 **This is the legal record, not bookkeeping.** If an outside party later claims
trademark or IP, the item is the **contemporaneous record of origin and date**. It
clears the platform where the idea was internal, and **flags at intake** items needing
clearance before work starts. Far cheaper than after a Knowledge app is in the store.

4.3 Same discipline as the documented origin of the IKI hierarchy itself — the
mid-1990s work with Jerry Shanz.

4.4 **Ruled out:** demand signal (counting requests) is overbuilding. The *identity* of
an external originator matters; the *count* does not.

4.5 **The board captures no originator today.**

---

## 5. Earned weight

5.1 No originator is assigned standing — including Gemba's.

5.2 **Just track it.** Originator and outcome on the item; the pattern becomes visible
without a scoring model.

5.3 > "Earn the weight. That's a very important characteristic."

---

## 6. Research, Spec, Build

6.1 **Research.** Gemba or a human pulls the item, does the work, and **attaches the
research to the item.**

6.2 **Spec.** Admin and agents construct the spec or specs, then a build plan, and
carry it to the point where no blockers remain. The admin pulls into Build.

6.3 **Build.** Gemba as build agent takes it and carries it to the finish line.

6.4 **The board does not score the process** — no round counters, no cycle metrics.

6.5 **Revisions are normal.** A card can always be brought back.

---

## 7. Staged

7.1 **Staged is the busiest lane, not a waiting room.** Agent production and client
trial run in parallel. Everything produced sits dark.

7.2 **Client trial.** Existing clients get it first and use it in earnest.

- **No early-access label.** They are on the staging server; the venue is the label
- **Clients are not obligated.** "My clients are not my servants. If they don't
  evaluate it, that is their evaluation."
- **Non-engagement is a data point, not a verdict.** The item passed every pull to get
  here. **Staged gathers signal; clients approve nothing.**

7.3 **Agent production — all dark until the switch.** **Gemba**, equipped with skills,
creates **four artifacts**:

- the product
- the landing page draft
- the store placement
- **the help guide**

**The wiki page is not among them.** It is Oscar's, composed after publication from
the published help guide. See §7.8.

**The help guide and the help wiki page are two different artifacts**, and the spec
previously collapsed them:

| Artifact | Surface | Author |
|---|---|---|
| **Help guide** | served in-app by the Help bot | **Gemba** |
| **Help wiki page** | the corpus | **Oscar**, derived from the published help guide |

The Woo half cannot complete until that interface exists (§8.7) — a build-order
constraint, not a scope exclusion.

7.4 **Which artifacts an item needs is declarative** — the same venue inference the
wiki agent performs. **Producing them is coded.**

7.5 **Hotel and Tango gate by claim type, not by artifact.** *(Rewritten at Phase 4
per Hotel H-1 — the previous version gated by artifact and was wrong.)*

**Gated — wherever it appears:**

- Any **outcome claim**. Profit language, implied win rate, expected return. Invariant
  #8 has no exceptions
- Any **risk or mechanics claim**. Maximum loss, breakeven, margin behaviour,
  assignment risk, expiration behaviour, what the member is actually holding

**Ungated:**

- **Navigational and procedural content.** Where a control is, what a field does, how
  to open a builder, how to save

**Why the axis moved.** A help page is exactly where a member goes to understand what a
Knowledge app does *before* deploying capital against it. If it misstates a maximum loss,
"the document is cheap to fix" is true and irrelevant — the member who read the wrong
version has already made the capital decision. This is the same failure the OPF Truth
and Elegant Failure doctrine already treats as severity-high: a member acting on a false
claim about what they hold.

**The practical effect is narrow.** A help page that only states plumbing stays exempt
and stays fast. A help page that states a structure's risk or outcome profile gets the
same pass a landing page gets.

- Review happens **before or at Live**, never inside Gemba
- **The Live boundary remains Coach's** — they gate the strings, not the switch
- This changes what gets reviewed, not who writes it

7.6 **The help guide is part of the definition of a product.** Nothing goes Live
without one. Documentation debt cannot accrue if it is constitutive.

**A wiki page is NOT a Live precondition.** *(Changed by Coach ruling, 2026-08-25.
The previous rule made Live unreachable — it required an artifact the Factory does
not produce.)*

A product publishes on Coach's switch **whether or not a wiki page exists**. It then
becomes **visibly noisy** — flagged as missing its wiki page — and stays noisy until
one exists.

**OPEN — Coach:** what "noisy" looks like. On the card, on the product, or both.
This is the mechanism that makes the design work rather than leaving a missing page
nobody notices.

7.7 **The Help Package is superseded.** A single canonical interface produces help,
product, and app pages, with the agent determining from venue which are needed.

7.8 **The derivation rule — general, not Factory-specific.**

**Every publishable thing has a wiki page derived from it, and the wiki page is
always Oscar's.** The source system owns the artifact; Oscar owns the corpus entry.

| The thing | Its corpus entry |
|---|---|
| A course | the course wiki page |
| A help guide | the help wiki page |
| A product | its wiki page |

> "A course isn't the course wiki." — Coach

The two are never the same object. **The Factory needs no exception to this rule**,
and the earlier attempt to give it one — Gemba authoring the wiki page — was the
advisor building a special case where the general rule already applied.

On publication the product **notifies Oscar exactly as a course or a help guide
does.** Same signal, same path, no special case, no second write path, no envelope.

`FatTail-Labs-Options-Lab-Template-Help-Package-Spec-v0_1.md` is still on disk and was
edited after its supersession. **It needs a superseded banner** or it will be cited as
authority downstream.

---

## 8. Live — the switch

8.1 **Staged → Live is the one transition that is not a pull.** It is a **boundary**.

8.2 **Coach entering product type, tier, and free-versus-paid IS the human promotion
under invariant #7.** Not a form field — the gate itself.

8.3 **Coach's hands, not any administrator's.** Gemba prepares everything and stops.

8.4 **One act flips everything.**

8.5 **Order: the Live write first, then Woo.** State after the Live write is
`Published`.

8.6 **Paid does not invent a price.**

8.7 **The Woo step is a stub** — no WooCommerce API interface exists. The store as its
own native surface on `labs.fattail.ai` runs through Mike and Foxtrot as a separate
program. Woo is the cash register, not the storefront.

8.8 **Partial-failure disposition is narrowed, not closed.** With the Woo step stubbed
and the Live write first, a Woo failure leaves a `Published` item rather than an
undefined one. The real disposition belongs to the store program.

8.9 **MiniTwo deferred.** The build is finished before production deployment.

8.10 **RESOLVED — the wiki publish path no longer concerns this board.**

The Wiki Spec's §7 (board approval) and §11 ("no agent-direct publish," "no second
approval state") were in tension, and that tension blocked a Factory-authored wiki
page publishing off Coach's switch.

**Nothing publishes into the Wiki off the Factory's switch.** Oscar composes on his
own board, through his own single write path, on his own schedule. The Wiki program
still has its internal question to settle; **the Factory no longer depends on the
answer.**

---

## 9. Never done

9.1 **There is no totally-done state, and asking for one is the wrong question.** A
wiki page for a live surface always trails the surface. A Knowledge app in the store keeps
earning revisions.

9.2 **This is the operating condition, not a defect being tolerated.**

9.3 "Done" is not a lane state to be defended. Cards come back.

---

## 10. What the board does not do today

| Gap | § |
|---|---|
| No Staged lane — goes Build → Live | 7 |
| No originator captured anywhere | 4.5 |
| No description or attachments on the item | 2.2, 2.3 |
| Priority chip present but now cut | 2.2 |
| Four controls inline on every card; no side panel | 2.5 |
| Lane still named "Ideas" | 2.1 |
| No API endpoint for card creation | 2.1 |

**Board copy.** The subhead reads *"Deposit an idea; the factory picks it up. Research
winners are a human judgment — the belt will not choose them."* Both halves describe a
conveyor that no longer exists.

Tango's read on register (T-1): "deposit" addresses an anonymous depositor, which is the
wrong voice for an admin-only floor. Nobody here is submitting into a slot for
evaluation — it is Coach or Gemba taking the next piece of work. The subhead should
speak like a workbench, not an intake form; §2.1's "ready to advance" is the right
register to carry up.

**Replacement copy is Coach's to write.**

---

## 11. What remains open

| # | Item | Owner |
|---|---|---|
| 1 | **Three successive OKs** to retrain the shipped IF-1/IF-3/IF-4 conveyor to pull (DL-539). India's evidence: five functions in `server/iki_factory.py`, 28 passing tests | Coach |
| 2 | **The wiki publish path** — Wiki Spec §7 vs §11, and Source Contract v0.1.4 §6 | Wiki program |
| 3 | **Create-endpoint scope** (Mike M-2). `POST /api/admin/iki-factory/cards` today rejects agent principals. Reusing `factory:operate` bundles "deposit a card" with "operate the whole board" — there would be no way to hand a source system a deposit-only key. A separate scope costs nothing to add now | Coach |
| 4 | **Create-endpoint rate posture** (Mike M-2). No throttling primitive exists anywhere in the codebase today. Unbounded agent creation plus the still-live auto-pickup is a flooding path with no backstop. Needs a decision, not a default | Coach |
| 5 | Canonical filename and version | Coach, at Phase 5 |
| 6 | Where the IKI entity model lives, and how an item references what it produced | Deferred |
| 7 | Advisory (India IND-7): `gemba.md` has no Status/DL header, so a charter edit trips nothing checkable | Coach |
| 8 | Advisory (India): a read of what is in `v0.1.5` but not here — amend means those rules stay live | India |
| 9 | Advisory (Echo E-4): Echo needs a seat at the Staged build packet specifically, for the dual-track lane view | Bench |

**Closed at Phase 4:** admin-only enforcement verified server-side (Mike M-1). Card
attribution via originator at the create boundary confirmed correct as specified —
the one part of the new endpoint that needs no further design.
