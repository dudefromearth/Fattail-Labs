# IKI Factory — Pipeline Specification (DRAFT v0.4)

**Provisional filename and version. Coach names the real ones before this lands.**

| | |
|---|---|
| Status | DRAFT — advisor draft. **Not build-ready.** See §0.2 |
| Supersedes | DRAFT v0.3, v0.2, v0.1 (all 2026-08-24) |
| Source | Working session 2026-08-24 walked against the live board; Grok review folded |
| Program | IKI Factory |
| In-tree relationship | Advisor does **not** hold `IKI Factory Spec v0.1.5`. This is not a diff against it. Reconciliation is Coach's call. |

**Scope statement.** Active program: IKI Factory — the board, the work item, the
lanes, and the transitions between them. Touches outside program: **the Wiki**, at
§8 only. Flagged, not written past.

---

## 0. Status of this draft

### 0.1 What changed from v0.3

| # | Change | Source |
|---|---|---|
| 1 | **Spec → Build tightened** — one puller, evidence named | Grok 3, accepted |
| 2 | **Hotel and Tango seated on member-facing strings** produced in Staged | Grok 6, accepted |
| 3 | **Help Package wording corrected** — obligation kept, successor named TBD | Grok 7, accepted |
| 4 | **Board subhead rewritten** to pull language | Grok 9, accepted |
| 5 | **Gemba charter contradiction raised** — advisor finding, not Grok's | §0.3 |
| 6 | Level / use-mode carried as OPEN, **not written in** | Grok 5, unverifiable |
| 7 | Priority signal left as Coach's words, **not reinterpreted** | Grok 4, objected |

v0.3 killed the conveyor. That correction stands and is not revisited here.

### 0.2 Why this is not build-ready

**Eight open items**, three of which change structure rather than detail: where raw
ideas are worked up (§2.1), the Gemba charter contradiction (§0.3), and whether
this document closes the Factory's job description (§12, item 7).

A build plan written now would answer them by implication. Grok's review reached
the same conclusion independently.

### 0.3 BLOCKING — the Gemba charter contradiction

**Neither the advisor nor Grok caught this in the v0.3 pass.**

v0.3 removed the conveyor model. But OD-F9 and the auto-advance rulings are
downstream in the Factory bench plan v1.1 and — more seriously — in
`agents/bench/gemba.md`, which **Coach rewrote personally** and which is protected
law on the allowlist's never row, program-wide.

If Gemba's charter encodes auto-advance and this spec says nothing advances itself,
an agent would be operated outside its own founding document. Coach's standing rule
is that a charter contradiction **returns to Coach** rather than triggering a
rewrite packet.

**This lands on Coach before any build plan exists.** The advisor does not touch
the charter and proposes no rewrite.

---

## 1. Purpose and the governing distinction

1.1 The Factory turns a raw idea into something that can be sold or handed to a
member. A production pipeline, not a place traders work.

1.2 The board is **admin floor only**.

**OPEN — Coach (recognition):** the parent spec left open whether the Factory is
member-facing. Admin-only is what this document states. If that is right, the suite
pill is operator chrome rather than a member workshop — which changes the nav
promise. Confirm or correct; the advisor has not decided it.

### 1.3 Coded, declarative, boundary

| Kind | Test | In the Factory |
|---|---|---|
| **Coded** | Needs an appendage the agent lacks — filesystem, network, external API | The board surface; the templates; Staged artifact production |
| **Declarative** | Process flow an agent reasons about from stated conditions | Which artifacts an item needs; what a lane's work consists of |
| **Boundary** | What may happen without a human. Declared and enforced, never reasoned | The Live promotion (§9). Hold. Hotel and Tango on member-facing strings (§8.5) |

**The agent is a decision maker. Skills are its interface to systems.** A skill is
mechanism, never judgment. If a skill needs a decision to execute, that decision
belongs to the agent and does not get buried inside the skill.

**Boundaries do not soften as agents improve.** A more capable agent makes them
more necessary, not less.

---

## 2. The work item

2.1 The first lane is a **backlog**, not "Ideas." **Everything in it is already
ready to advance.** A holding area for understood items, not a pen where raw ideas
get worked into shape.

> Coach: "It wouldn't be in the backlog if it wasn't ready for advancement. The
> only thing holding it back is need and priority."

**OPEN — Coach:** where does a raw idea get worked up, if not here? **Deliberately
unfilled.** Inventing a grooming lane would be filling a step Coach has not laid,
and the board's deposit form currently accepts raw ideas straight into this lane.

2.2 **Fields.** Defined, then reduced to only what is necessary — per Coach's
general rule.

| Field | Why it survives |
|---|---|
| Title | Card identity |
| Description | The real body — enough to understand the item weeks later: what it is, why it matters, constraints, what the originator knew |
| Originator | Required. The legal record — §5 |
| Priority | The only thing separating candidates now that size is gone |
| Status | Which lane the item is in |
| Notes | Links, constraints |
| Attachments | §2.3 |
| Created date | Provenance, paired with originator. Not a field anyone fills |

**Cut and why:** owner (always the admin — a field with one value is not a field);
size and complexity; category (advisor invention, drove no decision); ready/groomed
flag (single-valued given 2.1).

**Coach reversed size mid-session** — ruled small/medium/large, cut it twenty
minutes later, then referred to it again in passing. It is **out** as written. If it
should return as a plain optional label, that is a one-line change.

**Not added — see §12 item 5:** Grok proposes a `level` (Knowledge vs Intelligence)
and `use-mode` (`knowledge_license | contract`) field, required before Staged for
Intelligence-class items, citing seated law that an Intelligence product is not
shippable with use-mode unset. **The advisor does not hold that document and will
not write a field in on a secondhand citation.** If the law is as cited, this is a
real gap and the fields belong here.

2.3 **Attachments.** Often the whole substance of the item — a paper an agent
found, a chain screenshot, a competitor's page. Keeping a summary and losing the
artifact is the thin-material failure. Links and uploads both.

Attachments are also where the wiki agent finds material it cannot get from the
repo, when it comes back to Coach asking for content.

2.4 **The card is for scanning.** Title, priority, originator. Everything else
behind it. No attachment count — an attachment may be a link or two hundred pages,
so the number means nothing.

2.5 **Controls come off the card.** The board today renders Back / Advance / Hold /
Rework inline on every card. At real volume that is most of the visual weight,
repeated down a lane being scanned past. Controls belong with the opened item.

**OPEN — Coach:** does opening an item mean a panel beside the board, or leaving
the board?

---

## 3. Movement — pull, not push

3.1 **Nothing advances itself.** There is no conveyor, no precondition engine, no
auto-move. An item moves when someone takes it.

3.2 **Capacity is not a configured number.** It is whoever is willing to do the
next piece of work. There is no WIP limit to set and no weighted-versus-count
question to answer.

3.3 **The pull table.**

| Transition | Who pulls | What they judge | Evidence attached |
|---|---|---|---|
| Backlog → Research | An agent or human willing to do the research | That it can take the work on | — |
| Research → Spec | An admin | That there is enough attached to develop from | Research |
| **Spec → Build** | **The admin** | **That no blockers or issues remain** | **Spec(s) + build plan** |
| Build → Staged | The build agent | Carries it to the finish line | Built artifact |
| **Staged → Live** | **Coach only** | **A boundary, not a pull — §9** | — |

3.4 **Spec → Build has one puller and named evidence** (folded from Grok 3). v0.3
read "admin + agents construct spec(s) and a build plan," which named the work but
not the owner. Spec work sprawls across multiple agent drafts and rework; without a
single puller and a stated meaning for "ready for Build," the board grows informal
side channels. **Ready for Build = spec(s) and build plan attached, no blockers
open.** Same grammar as Research → Spec.

3.5 What accumulates on the item as it moves is **evidence**. The item is its own
record.

3.6 **The backlog transition is not admin-gated.** An agent may take an item to
Research without asking — research is cheap and reversible.

3.7 **Hold is sacred**, and remains available at any lane.

---

## 4. Priority

4.1 Goal: as many high-quality templates as possible. The real test is **templates
that sell.**

4.2 Knowledge templates are table stakes. **Intelligence templates and systems are
the differentiation** and carry more weight per unit of work.

4.3 Priority is **partly earned**. Coach's judgment early; once things ship, sales
and usage feed back into the ranking.

4.4 **Priority must be a maintained ordering across the lane, not a value set once
at deposit and forgotten.** The board today asks for it on the intake form, in
isolation — but ranking is comparative by definition. You cannot rank an item
against a backlog you have not looked at.

4.5 **OPEN — Coach:** rank number, or an ordered list dragged into shape?

4.6 **OPEN — Coach (raised by Grok, advisor declined to fold).** Grok proposes
redefining the feedback signal as *usage + declared intent + paid where priced*
rather than "sell," on the grounds that store revenue alone fights the license
model — Knowledge behind email and terms, Intelligence per-product license or
contract. **The reasoning is sound and the advisor is not disputing it.** But
"templates that actually sell" is Coach's phrase, verbatim, and reinterpreting it
is not the advisor's call or Grok's. **Coach rules; the phrase stands until then.**

---

## 5. Originator and provenance

5.1 Originator records true source: Coach, the system, a named agent, or an
**outside source**. **Required.**

5.2 **This is the legal record, not bookkeeping.** If an outside party later claims
trademark or IP, the item is the **contemporaneous record of origin and date**. It
clears the platform where the idea was internal, and **flags at intake** items
needing clearance before work starts. Far cheaper than after a template is in the
store.

5.3 Same discipline as the documented origin of the IKI hierarchy itself — the
mid-1990s work with Jerry Shanz.

5.4 **Ruled out:** demand signal (counting requests) is overbuilding. The *identity*
of an external originator matters; the *count* does not.

5.5 **The board captures no originator today.** Everything deposited so far has no
provenance.

---

## 6. Earned weight

6.1 No originator is assigned standing.

6.2 **Just track it.** Originator and outcome on the item; the pattern becomes
visible without a scoring model.

6.3 > "Earn the weight. That's a very important characteristic."

---

## 7. Research, Spec, Build

7.1 **Research.** Whoever pulled the item does the work and **attaches the research
to the item.**

7.2 **Spec.** Admin and agents construct the spec or specs, then a build plan, and
carry it to the point where no blockers or issues remain. The admin pulls into
Build (§3.4).

7.3 **Build.** The build agent takes it and carries it to the finish line.

7.4 **The board does not score the process** — no round counters, no cycle metrics.
Noise.

7.5 **Revisions are normal.** A card can always be brought back.

---

## 8. Staged

8.1 **Staged is the busiest lane, not a waiting room.** Two things happen in
parallel: agent production, and client trial. Everything produced sits dark.

8.2 **Client trial.** Existing clients get it first and use it in earnest.

- **Clients are not obligated.** "My clients are not my servants. If they don't
  evaluate it, that is their evaluation."
- **Non-engagement is a data point, not a verdict.** Clients may be wrong. The item
  passed every pull to get here. **Staged gathers signal; clients approve nothing.**
- **OPEN — Coach:** finished product, or explicit early access?

8.3 **Agent production — all on hold until the switch.** An agent equipped with
skills creates:

- the product
- the landing page draft
- the help documentation
- the wiki page
- the store placement

The Woo half cannot complete until that interface exists (§9.6). That is a
build-order constraint, not a scope exclusion — Staged owns producing them.

8.4 **Which artifacts a given item needs is declarative** — the same venue inference
the wiki agent performs. **Producing them is coded** — it touches the filesystem and
real surfaces.

8.5 **Hotel and Tango gate member-facing strings** (folded from Grok 6). The landing
page, help documentation, and wiki page all carry invariant #8 — no profit claims,
ever — and process-not-P&L framing. v0.3 named no reviewer, which left compliance
buried inside the build agent.

- Review happens **before or at Live**, never inside the build agent
- **The Live boundary remains Coach's** — Hotel and Tango do not gate the switch,
  they gate the strings
- Wiki pages additionally follow the Wiki Spec's own review path; this does not
  replace it

8.6 **Help documentation and a wiki page are part of the definition of a product.**
Nothing goes Live without them. Documentation debt cannot accrue if it is
constitutive.

8.7 **The Help Package name is superseded; the obligation is not** (corrected per
Grok 7). v0.3 read as though the obligation had been retired, which would leave a
hole. Precisely:

- The **obligation** in 8.6 stands, unchanged
- The **name** "Help Package" is superseded by a single canonical artifact
  interface producing help, product, and app wiki pages, with the wiki agent
  determining from venue which are needed
- **That interface is TBD and not yet named.** Until it is, the obligation is met by
  whatever path currently produces help and wiki pages
- `FatTail-Labs-Options-Lab-Template-Help-Package-Spec-v0_1.md` is still on disk and
  was edited after its supersession. **It needs a superseded banner** or it will be
  cited as authority downstream

---

## 9. Live — the switch

9.1 **Staged → Live is the one transition that is not a pull.** It is Coach's, and
it is a **boundary**.

9.2 **The admin entering product type, tier, and free-versus-paid IS the human
promotion under invariant #7.** Not a form field — the gate itself.

9.3 **One act flips everything.** That is what makes it a real boundary rather than
five separate decisions.

9.4 **Order: the Live write first, then Woo.** The state after the Live write is
`Published`.

9.5 **Paid does not invent a price.**

9.6 **The Woo step is a stub** — no WooCommerce API interface exists. The store as
its own native surface on `labs.fattail.ai` runs through Mike and Foxtrot as a
separate program. Woo is the cash register, not the storefront.

9.7 **Partial-failure disposition is narrowed, not closed.** With the Woo step
stubbed and the Live write first, a Woo failure leaves a `Published` item rather
than an undefined one. The real disposition belongs to the store program.

9.8 **MiniTwo deferred.** The build is finished before production deployment.

9.9 The Factory's only obligation to the Wiki is **exposing a publication signal at
Live.** No delivery hook, no envelope construction, **and no second compile path
from the Factory into the wiki outside the Wiki Spec.**

---

## 10. Never done

10.1 **There is no totally-done state, and asking for one is the wrong question.** A
wiki page for a live surface always trails the surface. A template in the store
keeps earning revisions.

10.2 **This is the operating condition, not a defect being tolerated.** Nothing here
should read as if incompleteness awaits a fix.

10.3 "Done" is not a lane state to be defended. Cards come back. That is the system
working.

---

## 11. What the board does not do today

Observed against the live surface.

| Gap | § |
|---|---|
| No Staged lane — goes Build → Live | 8 |
| No originator captured anywhere | 5.5 |
| No description, notes body, or attachments on the item | 2.2, 2.3 |
| Priority set at intake in isolation, not maintained as an ordering | 4.4 |
| Four controls inline on every card | 2.5 |
| Lane still named "Ideas" | 2.1 |

**Board copy.** The subhead reads *"Deposit an idea; the factory picks it up.
Research winners are a human judgment — the belt will not choose them."* Both
halves describe a conveyor that no longer exists, and "deposit" is submission-slot
voice. **It must die with the model.** Replacement copy is Coach's to write, not the
advisor's — the shape is: ready items, taken by whoever does the next piece of work,
in priority order.

---

## 12. Open items for Coach

| # | Item | § | Weight |
|---|---|---|---|
| 1 | **Gemba charter contradiction** — conveyor removal vs. protected charter | 0.3 | **Blocking** |
| 2 | Where a raw idea gets worked up, if the backlog holds only ready items | 2.1 | Structural |
| 3 | Does this document close the Factory's job description, or amend `v0.1.5`? | header | Structural |
| 4 | Admin-only floor — confirm, and what it means for the suite pill | 1.2 | Recognition |
| 5 | Level / use-mode fields — confirm the cited law and they go in | 2.2 | Needs Coach |
| 6 | Priority signal — "sell," or usage + intent + paid where priced | 4.6 | Needs Coach |
| 7 | Priority as rank number or ordered list | 4.5 | Detail |
| 8 | Opening an item — panel beside the board, or leave the board | 2.5 | Detail |
| 9 | Staged cohort — finished product or explicit early access | 8.2 | Detail |
| 10 | Should size return as a plain optional label | 2.2 | Detail |
