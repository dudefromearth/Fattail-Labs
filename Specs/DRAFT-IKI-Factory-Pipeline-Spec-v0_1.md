# IKI Factory — Pipeline Specification (DRAFT)

**Provisional filename and version. Coach names the real ones before this lands.**

| | |
|---|---|
| Status | DRAFT — advisor draft for bench review |
| Source | Spoken outline, working session 2026-08-24 |
| Program | IKI Factory |
| Relationship to prior spec | The existing Factory spec was, in Coach's words, "the first pass, off the top of my head." This document materially revises the pipeline. Supersession is Coach's call, not the advisor's. |

**Scope statement.** Active program: IKI Factory. Files/trees this document
describes: the Factory board, its columns, item attributes, and the deploy
handoff. Touches outside program: **the Wiki**, at one seam only — §10 and §12,
where a product's help page and wiki page are declared part of the product and
the curator picks them up on publication. Coach directed both programs this
session; flagging the seam rather than writing past it.

---

## 1. Purpose

1.1 The Factory turns a raw idea into something that can be sold or handed to a
member. It is a **production pipeline**, not a place traders work.

1.2 The Kanban board is a **workspace**. It is automated as far as it safely can
be, but the **admin is the ultimate operator**. If the belt can finish a card
itself, it will; the admin retains the right at any stage to call a card back,
edit it, hold it, and decide when it actually goes to live production.

1.3 **Hold is sacred.** That is precisely what makes the automation safe to have
at all. Automation here is a convenience, never an authority.

---

## 2. The backlog

2.1 The first column is **not "Ideas."** That name undersells it. It is a
**backlog** in the real scrum/Kanban sense, and it carries actual grooming work
— sizing, complexity rating, categorization, and a sense of how the item would
be brought into being.

2.2 Grooming exists so that the decision in §6 is made between **shaped items**
rather than a pile of one-liners.

2.3 **Attributes on every backlog item** — structured fields, not prose in a
description, so items can be sorted, filtered, and compared:

| Attribute | Notes |
|---|---|
| Size | Set by skill — §3 |
| Complexity | Set by skill — §3 |
| Category | |
| Prioritization | §5 |
| Originator | §4 — required |
| Owner | Always the admin |

2.4 An item that has not been sized is not groomed, and is therefore not a
candidate to move forward. The conveyor can check this.

---

## 3. The sizing skill

3.1 Size and complexity are determined by a **skill**, not per-item judgment.

3.2 Rationale: consistency. The same skill sizing every item makes the numbers
**comparable across items and across originators** — which is exactly what
sizing usually lacks.

3.3 Consequence: an agent that finds twenty candidate topics during research can
size them all on the way in, so they **arrive groomed rather than raw**.

---

## 4. Originator and provenance

4.1 **Ownership is always the admin.** Originator is a separate field recording
where the item actually came from:

- Coach
- The system
- A specific named agent (e.g. one doing research)
- An **outside source**

4.2 **This is not bookkeeping. It is the legal record.** If an outside party
later claims trademark or intellectual property in the idea, the backlog item is
the **contemporaneous record of origin and date**. It cuts both ways:

- it clears the platform where the idea was Coach's or an agent's
- it **flags at intake** the items that need a license or clearance *before*
  anything is built

Catching that in the backlog is far cheaper than after a template is in the
store.

4.3 This is the same discipline that governs the documented origin of the IKI
hierarchy itself — the mid-1990s work with Jerry Shanz. Know where the idea came
from, and be able to prove it. The backlog applies that discipline down to the
smallest template.

4.4 **Ruled out this session:** demand signal on the item (e.g. counting how
many members requested the same thing) is **overbuilding** and is not a field.
Recorded here so the decision is visible, not silently dropped. Note the
distinction: the *identity* of an external originator matters for §4.2; the
*count* does not.

---

## 5. Prioritization

5.1 The main goal is **as many high-quality templates as possible**. The primary
goal is **good templates, and templates that actually sell.**

5.2 **Tiering.** Knowledge templates are table stakes. **Intelligence templates
and systems are where the real differentiation is**, and carry more weight per
unit of work.

5.3 **The ranking is partly earned, not declared.** Early on, prioritization is
Coach's judgment. Once templates are shipping, the sales and usage feedback loop
begins doing the ranking — what sells informs what gets built next.

5.4 **OPEN — Coach:** prioritization as a rank number, or a straight ordered
list dragged into shape? Undirected; no default written here.

---

## 6. Earned weight

6.1 **No originator is assigned standing.** No agent gets weighted because of
what it is.

6.2 **Just track it.** Originator on the item, outcome on the item. After enough
throughput the pattern is simply visible — which sources' items reached Deploy
and sold, and which died in Research. **No scoring model needs to be designed.**

6.3 Coach's principle, which generalizes past this column:

> "Earn the weight. That's a very important characteristic."

An agent that becomes a crackerjack at producing backlog items that turn into
successful products becomes the go-to. By evidence, not by rule.

---

## 7. The gate out of the backlog

7.1 This transition is **reserved for the admin**.

7.2 Rationale: everything upstream is grooming; everything downstream is
**committed work**. Sizing and prioritization exist to make this one decision
well-informed — **not to make it automatic**.

---

## 8. Development

8.1 This column is the **spec-first loop Coach already runs**: tech spec, use
case, first pass, then iterate with the bench until it is genuinely a quality
product — not merely finished.

8.2 A card sitting here through several rounds is **correct behavior, not a
stall**. This column is where work actually happens; it is not a handoff.

8.3 **The board does not score the process** or display which round a card is
on. That is noise.

8.4 It ships when the admin says ship it — **early or late, it does not matter**.
**Revisions are normal**, not a failure; a card can always be brought back.

---

## 9. Staging

9.1 Staging is **not a technical rehearsal. It is a real audience.**

9.2 **Client trial.** Existing clients of the service get it first, try it in
earnest, and decide whether they want it as part of their primary tool set.
Their feedback is gathered before the store.

9.3 **Clients are not obligated.** Coach's ruling, verbatim in substance:

> "My clients are not my servants. They're not obligated to make any attempt on
> any product to evaluate it. If they don't evaluate it, that is their
> evaluation."

9.4 **But non-engagement is a data point, not a verdict.** Clients may be
entirely wrong. An item reached this column by passing the §7 gate and the whole
§8 loop, which means Coach already believed in it — client silence does not undo
that judgment. **Staging is a signal-gathering step, not an approval gate.**

9.5 **Dark commercial assembly.** In parallel with the trial, the commercial
packaging is built and left unpublished. See §11.

9.6 **OPEN — Coach:** does the client cohort see the item as a finished product,
or is it explicitly labeled early access? Undirected.

---

## 10. What a product includes

10.1 **Help documentation and a wiki page are not optional deliverables. They
are part of the definition of a product.** Nothing ships without them.

10.2 This is what prevents documentation debt from ever accruing — it cannot be
deferred if it is constitutive.

---

## 11. The staging assembly skill

11.1 A **skill** scaffolds every artifact structurally, leaving the details to
Coach and the bench. The mechanical part is encoded once; the judgment stays
human.

11.2 What it stubs, all **unpublished**:

- the WooCommerce product
- the landing page
- the sales page
- the store listing
- the wiki page
- the help documentation

11.3 **The checklist lives in the skill, not in someone's memory.** Nothing is
forgotten at launch because nothing is assembled at launch.

---

## 12. The store

12.1 The store is a **browsing catalog** — where the whole range is visible,
rather than arriving at a single product by link.

12.2 It is **its own native surface on `labs.fattail.ai`**. Not a Woo storefront.

12.3 **Woo is the cash register, not the storefront.** Labs keeps presentation
and venue awareness; Woo handles the transaction underneath.

12.4 **New products surface as quick links on the store's wiki venue** — the
venue-aware behavior described in the Wiki Authoring Agent spec §9.1. Someone
standing in the store gets store-appropriate entry points, and a fresh product
appears there.

---

## 13. Going live, and the handoff

13.1 Because staging already built everything, **deploy is a single switch**
rather than a scramble. Everything being flipped already exists.

13.2 **This largely dissolves the deploy partial-failure problem** carried as an
open advisor item — the failure mode assumed artifacts were *created* at the
moment of launch. Under dark assembly they are not. Coach should confirm whether
the carry is closed or narrowed.

13.3 **The chain closes across both programs:**

> The Factory ships it → the curator polls products and templates and catches it
> → the wiki page and help file are already in place → the store surfaces it.

The two programs meet here rather than merely coexisting.

---

## 14. Open items, consolidated for Coach

| # | Item | § |
|---|---|---|
| 1 | Prioritization form: rank number or ordered list | 5.4 |
| 2 | Is the staging cohort shown a finished product or explicit early access? | 9.6 |
| 3 | Does dark assembly close the deploy partial-failure carry, or only narrow it? | 13.2 |
| 4 | Does this document supersede the existing Factory spec, or amend it? | header |
| 5 | Column naming — "backlog" replaces "Ideas"; do the remaining column names stand? | 2.1 |
