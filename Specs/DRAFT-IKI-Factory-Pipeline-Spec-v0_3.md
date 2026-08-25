# IKI Factory — Pipeline Specification (DRAFT v0.3)

**Provisional filename and version. Coach names the real ones before this lands.**

| | |
|---|---|
| Status | DRAFT — advisor draft |
| Supersedes | DRAFT v0.2, DRAFT v0.1 (both 2026-08-24) |
| Source | Working session 2026-08-24, walked against the live board |
| Program | IKI Factory |
| In-tree relationship | Advisor does **not** hold `IKI Factory Spec v0.1.5`. This is not a diff against it. Reconciliation is Coach's call. |

**Scope statement.** Active program: IKI Factory — the board, the work item, the
lanes, and the transitions between them. Touches outside program: **the Wiki**, at
§8 only, where Staged produces wiki and help pages. Flagged, not written past.

---

## 0. What changed from v0.2 — read this first

v0.2 was **wrong at the model level**, not in detail. It described a conveyor: the
belt evaluates preconditions and advances cards on its own, with the admin
retaining a veto. **There is no belt.** Nothing moves itself.

| # | Change | Consequence |
|---|---|---|
| 1 | **Conveyor model removed entirely** | §3 rewritten. No auto-advance, no precondition evaluation, no belt-stop |
| 2 | **Pull replaces push** | An item moves when someone takes it. §3.2 |
| 3 | **Backlog holds ready items only** | Grooming is not the lane's job. §2.1 |
| 4 | **Size and complexity cut** | Both fields removed. Sizing skill removed |
| 5 | **Owner and category cut** | Single-valued and undirected respectively |
| 6 | **Ready/groomed status cut** | Would be single-valued given #3 |
| 7 | **Staged lane added** | Board is missing it today. §8 |
| 8 | **Product and store placement restored to Staged** | v0.2 removed them; that was a build-order fact misread as scope. §8.3 |
| 9 | **Attachments added to the work item** | §2.3 |
| 10 | **Admin-only backlog gate removed** | An agent may take an item to Research without asking. §3.3 |

Coach reversed size mid-session (ruled small/medium/large, then cut it twenty
minutes later). Recorded so the reversal is visible. **If size should return as a
plain optional label, say so — it is out as written.**

---

## 1. Purpose and the governing distinction

1.1 The Factory turns a raw idea into something that can be sold or handed to a
member. A production pipeline, not a place traders work.

1.2 The board is **admin floor only**.

### 1.3 Coded, declarative, boundary

| Kind | Test | In the Factory |
|---|---|---|
| **Coded** | Needs an appendage the agent lacks — filesystem, network, external API | The board surface; the templates; the Staged artifact production |
| **Declarative** | Process flow an agent reasons about from stated conditions | Which artifacts an item needs; what a lane's work consists of |
| **Boundary** | What may happen without a human. Declared and enforced, never reasoned | The Live promotion (§9). Hold. |

**The agent is a decision maker. Skills are its interface to systems.** A skill is
mechanism, never judgment. If a skill needs a decision to execute, that decision
belongs to the agent and does not get buried inside the skill.

**Boundaries do not soften as agents improve.** A more capable agent makes them
more necessary, not less.

---

## 2. The work item

2.1 The first lane is a **backlog**, not "Ideas." **Everything in it is already
ready to advance.** It is a holding area for understood items, not a pen where raw
ideas get worked into shape.

> Coach: "It wouldn't be in the backlog if it wasn't ready for advancement. The
> only thing holding it back is need and priority."

**OPEN — Coach:** where does a raw idea get worked up, if not here?

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
size and complexity (§0); category (advisor invention, drove no decision);
ready/groomed flag (single-valued given 2.1).

2.3 **Attachments.** Often the whole substance of the item — a paper an agent
found, a chain screenshot, a competitor's page. Keeping a summary and losing the
artifact is the thin-material failure. Links and uploads both.

Attachments are also where the wiki agent finds material it cannot get from the
repo, when it comes back to Coach asking for content.

2.4 **The card is for scanning.** Title, priority, originator. Everything else
behind it. No attachment count — an attachment may be a link or two hundred pages,
so the number means nothing.

2.5 **Controls come off the card.** The board today renders Back / Advance / Hold
/ Rework inline on every card. At real volume that is most of the visual weight,
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

3.3 **The judgment at each pull, and who makes it:**

| Transition | Who pulls | What they are judging |
|---|---|---|
| Backlog → Research | An agent or human willing to do the research | That it can take the work on |
| Research → Spec | An admin | That there is enough attached to develop from |
| Spec → Build | Admin + agents (Claude, Grok) construct spec(s) and a build plan | That no blockers or issues remain |
| Build → Staged | The build agent | Carries it to the finish line |
| **Staged → Live** | **Coach only** | **A boundary, not a pull — §9** |

3.4 What accumulates on the item as it moves is **evidence**: research attached,
then the spec, then the build plan. The item is its own record.

3.5 **The backlog transition is not admin-gated.** v0.2 reserved it for the admin.
An agent may take an item to Research without asking — research is cheap and
reversible.

3.6 **Hold is sacred**, and remains available at any lane.

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

5.4 **Ruled out:** demand signal (counting requests) is overbuilding. The
*identity* of an external originator matters; the *count* does not.

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
carry it to the point where no blockers or issues remain.

7.3 **Build.** The build agent takes it and carries it to the finish line.

7.4 **The board does not score the process** — no round counters, no cycle
metrics. Noise.

7.5 **Revisions are normal.** A card can always be brought back.

---

## 8. Staged

8.1 **Staged is the busiest lane, not a waiting room.** Two things happen in
parallel: agent production, and client trial. Everything produced sits dark.

8.2 **Client trial.** Existing clients get it first and use it in earnest.

- **Clients are not obligated.** "My clients are not my servants. If they don't
  evaluate it, that is their evaluation."
- **Non-engagement is a data point, not a verdict.** Clients may be wrong. The
  item passed every pull to get here. **Staged gathers signal; clients approve
  nothing.**
- **OPEN — Coach:** finished product, or explicit early access?

8.3 **Agent production — all on hold until the switch.** An agent equipped with
skills creates:

- the product
- the landing page draft
- the help documentation
- the wiki page
- the store placement

**Restored from v0.2**, which removed the product and store placement on the
grounds that Woo is a stub and the store is a later program. That was a
**build-order fact misread as scope.** Staged owns producing them; the Woo half
cannot complete until that interface exists.

8.4 **Which artifacts a given item needs is declarative** — the same venue
inference the wiki agent performs. **Producing them is coded** — it touches the
filesystem and real surfaces.

8.5 **Help documentation and a wiki page are part of the definition of a product.**
Nothing goes Live without them. Documentation debt cannot accrue if it is
constitutive.

8.6 **The Help Package is retired**, superseded by a single canonical interface
producing help, product, and app wiki pages, with the wiki agent determining from
venue which are needed.

---

## 9. Live — the switch

9.1 **Staged → Live is the one transition that is not a pull.** It is Coach's, and
it is a **boundary**.

9.2 **The admin entering product type, tier, and free-versus-paid IS the human
promotion under invariant #7.** Not a form field — the gate itself.

9.3 **One act flips everything.** That is what makes it a real boundary rather
than five separate decisions.

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
Live.** No delivery hook, no envelope construction.

---

## 10. Never done

10.1 **There is no totally-done state, and asking for one is the wrong question.**
A wiki page for a live surface always trails the surface. A template in the store
keeps earning revisions.

10.2 **This is the operating condition, not a defect being tolerated.** Nothing
here should read as if incompleteness awaits a fix.

10.3 "Done" is not a lane state to be defended. Cards come back. That is the
system working.

---

## 11. What the board does not do today

Observed against the live surface, for the build plan's benefit.

| Gap | § |
|---|---|
| No Staged lane — goes Build → Live | 8 |
| No originator captured anywhere | 5.5 |
| No description, notes body, or attachments on the item | 2.2, 2.3 |
| Priority set at intake in isolation, not maintained as an ordering | 4.4 |
| Four controls inline on every card | 2.5 |
| Subhead reads "Deposit an idea; the factory picks it up" — submission-slot voice, and "the factory picks it up" describes a conveyor that does not exist | 3.1 |
| Lane still named "Ideas" | 2.1 |

---

## 12. Open items for Coach

| # | Item | § |
|---|---|---|
| 1 | Where does a raw idea get worked up, if the backlog holds only ready items? | 2.1 |
| 2 | Opening an item — panel beside the board, or leave the board? | 2.5 |
| 3 | Priority as rank number or ordered list | 4.5 |
| 4 | Staged cohort — finished product or explicit early access? | 8.2 |
| 5 | Should size return as a plain optional label? | 0 |
| 6 | Does this supersede or amend `IKI Factory Spec v0.1.5`? | header |
