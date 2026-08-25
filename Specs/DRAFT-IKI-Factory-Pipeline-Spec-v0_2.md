# IKI Factory — Pipeline Specification (DRAFT v0.2)

**Provisional filename and version. Coach names the real ones before this lands.**

| | |
|---|---|
| Status | DRAFT — advisor draft for bench review |
| Supersedes | DRAFT v0.1 (2026-08-24 19:34) |
| Source | Spoken outline + rulings, working sessions 2026-08-24 |
| Program | IKI Factory |
| Relationship to in-tree spec | Advisor does **not** hold `IKI Factory Spec v0.1.5`. This document is not a diff against it. Reconciliation is Coach's call. |

**Scope statement.** Active program: IKI Factory. Describes the board, its columns,
item attributes, and the deploy handoff. Touches outside program: **the Wiki**, at
§10 and §12 only. Flagged, not written past.

---

## 0. What changed from v0.1

| # | Change | Source |
|---|---|---|
| 1 | Woo is a **stub**; store is a separate later program | Coach ruling |
| 2 | Live write first, **then** Woo; state after Live write is Published and rides the conveyor | Coach ruling |
| 3 | Paid does **not** invent a price | Coach ruling |
| 4 | Admin entering type/tier/free-vs-paid **is** the human promotion under invariant #7 | Coach ruling |
| 5 | Sizing is small/medium/large by judgment, wall-clock anchored | Coach ruling |
| 6 | **Coded vs. declarative** line drawn through the whole document (§1.4) | Coach ruling |
| 7 | Help Package retired; single canonical wiki interface replaces it | Coach ruling |
| 8 | "Never done" is the operating condition, not a defect | Coach ruling |
| 9 | MiniTwo deferred — build finished before production deployment | Coach ruling |
| 10 | Store listing and Woo product **removed** from staging stubs (see #1) | Consequence of #1 |

---

## 1. Purpose and the shape of the thing

1.1 The Factory turns a raw idea into something that can be sold or handed to a
member. A production pipeline, not a place traders work.

1.2 The Kanban board is a **workspace**. The **admin is the ultimate operator** —
call a card back, edit it, hold it, decide when it goes live, at any stage.

1.3 **Hold is sacred.** That is what makes any automation safe to have at all.

### 1.4 Coded, declarative, and boundary — the governing distinction

Three kinds of thing live in this document and they are built differently.

| Kind | Test | In the Factory |
|---|---|---|
| **Coded** | Requires an appendage the agent does not possess — filesystem, network, external API, real computation | The board surface itself; the templates; staging assembly; the fetch half of link validation |
| **Declarative** | Process flow the agent can reason about from stated conditions | Card movement across the board; preconditions; sizing; categorization; the credibility half of link validation |
| **Boundary** | What may happen without a human. Not reasoned — declared and enforced | "The admin decides what goes live." Invariant #7. Hold. |

**The agent is a decision maker. Skills are its interface to systems.** A skill is
mechanism, never judgment — if a skill needs a decision to execute, that decision
belongs to the agent and does not get buried inside the skill.

**Boundaries do not soften as the agent gets better.** A more capable agent makes
them more necessary, not less. This is the "no autonomy theater" non-goal.

---

## 2. The backlog

2.1 The first column is **not "Ideas."** It is a **backlog** in the real scrum/Kanban
sense, carrying grooming work.

2.2 **Attributes on every item** — structured fields, not prose:

| Attribute | Kind | Notes |
|---|---|---|
| Size | Declarative | §3 |
| Complexity | Declarative | §3 |
| Category | Declarative | |
| Prioritization | Declarative | §5 |
| Originator | Declarative, **required** | §4 |
| Owner | — | Always the admin |

2.3 An unsized item is not groomed. **Whether that bars advancement is OPEN** —
see §3.4.

---

## 3. Sizing

3.1 **Small / medium / large**, anchored to wall clock:

| Size | Meaning |
|---|---|
| Small | Under 30 minutes |
| Medium | A few hours |
| Large | A few days |

3.2 **This is a judgment call, and that is correct.** Point analysis and consensus
story points existed to align a team on work measured in weeks. Neither the team
nor the weeks are there. Estimating a thirty-minute task in story points is
ceremony.

3.3 **The downside is bounded.** Coach: "the worst that happens is a product comes
in early or late by half a day." No precision is worth building to protect against
that.

3.4 **Consequence, flagged honestly.** At this granularity size does *not* do the
job v0.1 gave it. If most items are small or medium, size is not what separates
candidates — **prioritization is doing nearly all the work.** Size may be useful
metadata rather than a gate. **OPEN — Coach:** can an unsized item advance?

3.5 A skill may still *apply* the scale consistently across items and originators.
The scale itself is judgment, not computation.

---

## 4. Originator and provenance

4.1 **Ownership is always the admin.** Originator records true source: Coach, the
system, a named agent, or an **outside source**.

4.2 **This is the legal record, not bookkeeping.** If an outside party later claims
trademark or IP, the item is the **contemporaneous record of origin and date**. It
clears the platform where the idea was internal, and **flags at intake** items
needing clearance before work starts. Far cheaper than after a template is in the
store.

4.3 Same discipline as the documented origin of the IKI hierarchy itself — the
mid-1990s work with Jerry Shanz.

4.4 **Ruled out:** demand signal (counting requests) is overbuilding. The
*identity* of an external originator matters for 4.2; the *count* does not.

---

## 5. Prioritization

5.1 Goal: as many high-quality templates as possible. The real test is **templates
that sell.**

5.2 Knowledge templates are table stakes. **Intelligence templates and systems are
the differentiation** and carry more weight per unit of work.

5.3 Ranking is **partly earned**. Coach's judgment early; once things ship, sales
and usage feed back into the ranking.

5.4 **OPEN — Coach:** rank number or ordered list? Undirected.

---

## 6. Earned weight

6.1 No originator is assigned standing.

6.2 **Just track it.** Originator and outcome on the item; the pattern becomes
visible without a scoring model.

6.3 > "Earn the weight. That's a very important characteristic."

---

## 7. The gate out of the backlog

7.1 **Reserved for the admin.** A **boundary**, not process flow.

7.2 Upstream is grooming; downstream is committed work.

---

## 8. Development

8.1 The spec-first loop: tech spec, use case, first pass, iterate with the bench
until genuinely good — not merely finished.

8.2 Several rounds is **correct behavior, not a stall**.

8.3 **The board does not score the process** or show which round a card is on.
Noise.

8.4 Ships when the admin says ship — early or late. **Revisions are normal.**

---

## 9. Staging

9.1 **Not a technical rehearsal. A real audience.**

9.2 Existing clients get it first, use it in earnest, decide whether it belongs in
their toolkit.

9.3 **Clients are not obligated.**

> "My clients are not my servants. If they don't evaluate it, that is their
> evaluation."

9.4 **Non-engagement is a data point, not a verdict.** Clients may be wrong. The
item passed §7 and the whole §8 loop; silence does not undo that judgment.
**Staging gathers signal; it is not an approval gate.**

9.5 **OPEN — Coach:** finished product, or explicit early access?

---

## 10. What a product includes

10.1 **Help documentation and a wiki page are part of the definition of a product.**
Nothing ships without them. Documentation debt cannot accrue if it is constitutive.

10.2 **The Help Package is retired.** It has been replaced by a **single canonical
interface** that produces help, product, and app wiki pages — the wiki agent
determining from venue which pages are needed. See the Wiki Authoring Agent spec.

10.3 The Factory's only obligation to the Wiki is **exposing a publication signal at
Deploy.** No delivery hook. No envelope construction.

---

## 11. The staging assembly skill

11.1 A **coded** skill — it touches the filesystem and real surfaces. It scaffolds
structure and leaves specifics to Coach and the bench.

11.2 What it stubs, all **unpublished**:

- the landing page
- the sales page
- the wiki page
- the help documentation

11.3 **Removed from v0.1:** the WooCommerce product and the store listing. See
§12 — neither is buildable today.

11.4 The checklist lives in the skill, not in memory.

---

## 12. Commerce and the store — **narrowed**

12.1 **The Woo step is a stub.** No WooCommerce API interface exists.

12.2 **The store is its own native surface on `labs.fattail.ai` and is a separate,
later program** running through Mike and Foxtrot. Not Factory scope.

12.3 **Woo is the cash register, not the storefront.** Labs keeps presentation and
venue awareness.

12.4 **Paid does not invent a price.**

12.5 **The admin entering product type, tier, and free-versus-paid IS the human
promotion under invariant #7.** This is a **boundary**, not a form field.

12.6 New products surfacing as quick links on the store's wiki venue follows the
store program, not this one.

---

## 13. Going live

13.1 **Order is ruled: the Live write first, then Woo.**

13.2 **The state after the Live write is `Published`, and it rides the conveyor.**

13.3 **The partial-failure carry is narrowed, not closed.** v0.1 claimed dark
assembly dissolved it. That was wrong on two counts: the Woo step is a stub, so
there is little to fail yet; and the Live-first ordering means a Woo failure leaves
a Published item, not an undefined one. **What remains open is the disposition when
a real Woo integration exists** — which belongs to the store program.

13.4 **MiniTwo deferred.** The build is finished before production deployment.

---

## 14. Never done

14.1 **There is no totally-done state, and asking for one is the wrong question.**
A wiki page for a live surface always trails the surface. A template in the store
keeps earning revisions.

14.2 **This is the operating condition, not a defect being tolerated.** Nothing in
this document should read as if incompleteness is a problem awaiting a fix.

14.3 **Consequence for the board:** "done" is not a column state to be defended.
Cards come back. That is the system working.

---

## 15. Open items for Coach

| # | Item | § |
|---|---|---|
| 1 | Can an unsized item advance, or is size a gate? | 3.4 |
| 2 | Prioritization: rank number or ordered list | 5.4 |
| 3 | Staging cohort: finished product or explicit early access? | 9.5 |
| 4 | Does this supersede or amend `IKI Factory Spec v0.1.5`? | header |
| 5 | Column names beyond "backlog" | 2.1 |
