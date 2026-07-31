# FatTail Labs — Help System Architecture v0.1

**Status:** DRAFT — architecture and design. Content design follows separately.
**Scope:** Member-facing help across Journey, Practice apps, Courses, and Live.
**Not in scope:** `docs/ADMIN-GUIDE.md` (operator procedures) and the Specs corpus.

---

## 1. What help is

> **Answering a question at the moment and place it arises, without leaving the task.**

That sentence is the whole boundary. Help is contextual and interruption-shaped. Anything scheduled,
browsable, or conceptual belongs somewhere that already exists.

| Surface | Job | Shape |
|---|---|---|
| **Courses** | Teach the practice — why and when | Scheduled, sequenced, paced |
| **Tool reference** | Explain an app end to end | Per-app, evergreen, read deliberately |
| **Wiki** *(coming)* | The compiled map of everything taught | Browsable, cross-linked, searchable |
| **Help** | Unblock the member **right now** | Contextual, short, in place |
| **Guide** *(exists in nav)* | **Unknown to this document** — §8 item 1 |

**The dividing line: help answers "how", courses teach "why and when."** An article explaining *why*
you should never backfill adherence tags is a course lesson filed in the wrong place. Help says
adherence is set when you log the trade, and links to the lesson.

If two surfaces would both answer a question, help links rather than repeats. **One explanation, one
home.** The alternative is six copies drifting apart, which is the documentation-parity failure the
repo already fights.

---

## 2. What help is not

**Not a place to paper over a confusing interface.** If an article exists because a screen is
unclear, the screen is the defect and the article is a workaround.

> **Read counts are a UI backlog, not a success metric.** The most-read help article names the worst
> screen in the product. Review the top ten quarterly as defects.

**Not a second source of truth.** Help describes behavior; it never defines it. When help and the
product disagree, help is the bug.

**Not advice.** "How do I improve my win rate?" is a real question members will ask, and the answer
is not in a help article. Help explains what the product does and routes to the course. The
prohibitions in the agent guardrails apply to help copy in full: no advice, no diagnosis, no
evaluation, no profit claims.

**Not a support inbox.** Escalation to a human is a route out of help, not a layer of it.

---

## 3. Placement — inline, with the feature

**Help attaches to application features. There is no help centre and no help destination.**

Same principle as a calendar cell being its own control: the answer lives where the question arises,
not somewhere the member has to go and then come back from.

| Destination | Holds |
|---|---|
| **Courses tab** | All learning — the practice curriculum and tool reference |
| **Inline, on the feature** | Help |
| **Wiki** *(coming)* | The browsable, cross-linked map |
| **Guide** *(exists)* | Undecided — §8 item 1 |

### 3.1 Inline UI copy — owned by the surface

Empty states, placeholders, labels, error messages. Governed by the surface specs, not by this
system. Listed only to say help does not own them and must not substitute for them. **A good empty
state removes an article.**

### 3.2 Feature help — an on-demand overlay

**Help is a layer over the application, activated on demand.** Off by default, costing nothing. On,
it highlights every region that has help; the member hovers, tabs, or taps to a region and opens its
answer in place.

This beats a permanent affordance on every feature: scattered help icons add visual weight
everywhere to pay for something used occasionally, and the Journal surface spec already fights to
keep chrome off the screen.

It also solves discovery (§3.4). A member who does not know which feature owns their question turns
the layer on and **sees what is documented**.

#### Regions

Regions map to `surface.state` keys — the layer renders the existing registry (§5) rather than
introducing a second structure.

- **A region with states shows the article for the state you are in.** A closed journal date and an
  open one are different questions on the same region.
- **Undocumented regions render as known-but-unwritten**, not as nothing. A dark region is
  indistinguishable from "no feature here," and the difference is the authoring backlog.
- With the layer on, coverage is visible. That is the content checklist, for free.

#### Three input paths, one region set

| Path | Behavior |
|---|---|
| **Hover** | Region highlights; click opens the article |
| **Tab** | Regions take focus in sequence; Enter or Space opens; arrows move between regions |
| **Tap** | Tap highlights and opens |

**Tab order is a guided tour, so order regions by how the feature is used** — not DOM order. On the
Journal day: date → tags → composer → thread → interview → trades. A member who tabs that sequence
has been taught the screen without knowing what to point at, which is a better answer to discovery
than search.

#### Entering and leaving

- Entering disturbs nothing underneath: no scroll jump, no lost draft, no focus change.
- The layer **traps focus** while active, so tabbing does not wander into the app beneath it.
- **Escape exits and returns focus exactly where it was.** Plus a visible way out — a layer with no
  obvious exit is a trap.
- Articles open **in place**, beside the region. Never a navigation.

#### Constraints

- **Short.** A long answer is a lesson misfiled; link to it (§3.2a).
- Region overlays are invisible to crawlers and, unless authored properly, to screen readers. If help
  ever goes public (§8 item 3b), the same content needs a second reachable form.

#### Two verbs, one layer

Help and bug reporting are **the same posture with different verbs**. Both are: point at a region,
say something about it. One is "what is this?", the other is "this is wrong."

| Mode | Opens | Produces |
|---|---|---|
| **Explain** | The region's article | Nothing — a read |
| **Report** | A short capture form | A defect, pre-tagged with region context |

Same regions, same highlight, same tab order. A mode toggle on the layer, not a second overlay.

**Reports arrive structured.** The form carries `surface_key`, `state_key`, route, and app version
automatically, so a defect reads `journal.closed — the message doesn't say which retrospective closed
it` rather than "the journal is broken." That is the difference between a defect queue that can be
triaged and one that has to be interviewed.

**No member content leaves with a report.** The same rule as help queries (§5): no journal text, no
trade detail, no tag names captured automatically. If a member types them into the description that
is their choice; the system attaches none. *Mike.*

**Both verbs feed one map.** Article reads per region are a UI backlog (§2); defect reports per
region land on the same registry. A region that is heavily read *and* heavily reported is the worst
screen in the product, named twice.

*Prior art: MarketSwarm's overlay pattern, and the plane concept from the FOTW Application Layer —
help as an interaction posture rather than a feature. Concepts are fair to reuse; MSC code is not,
and Labs has no Path Core or CRCE to host plane machinery. Invariant 1.*

### 3.2z Feature help — content rules

A help affordance on each feature that opens what is relevant to **this feature, in this state**.

- Opens **beside** the task. Never navigates away, never loses a draft.
- Scoped by feature and, where it matters, by state — a closed date and an open one raise different
  questions.
- **Short.** A long answer is a course lesson misfiled; link to it instead.
- Every answer can link out to a specific lesson or the tool reference in the Courses tab (§3.2a).

### 3.2a Linking into courses

**This link is what makes the whole division work.** Help stays short only because depth has
somewhere to live. Without the link, "one explanation, one home" is a slogan and every article grows
until it is a lesson.

Rules that keep it useful:

- **Link to a lesson, never a course.** "See 0-DTE Foundations" is not an answer. "Module 4, Lesson 2
  — making a commitment checkable" is. Course-level links are how members get sent to a table of
  contents and give up.
- **Reference lessons by stable id, not position.** A link to "Module 4, Lesson 2" breaks the first
  time the curriculum is resequenced, and help rot is invisible — nothing fails, the link just goes
  somewhere wrong. Same rule as tag ids surviving rename.
- **Handle the gate.** A member may not be enrolled in the course holding the lesson. Help either
  links to a free-preview lesson, or states the answer briefly and names where it is taught without
  a dead link. It must never produce a paywall from inside a help panel — that turns help into a
  sales surface, and members will stop opening it.
- **Leaving is now safe, but say so.** The Journal session stays open and nothing is lost, so
  clicking through to a lesson costs nothing. Where that is not true of a surface, the lesson opens
  without discarding work.

**The loop runs both ways.** Help points into lessons; lessons end in the product (Curriculum §5,
rule 4). A member can enter at either end — stuck mid-task and taught, or taught and sent to
practice — and arrive at the same place.

### 3.3 Where removed explanation goes

The Journal surface spec forbids copy explaining how surfaces relate — "structured fields stay
available at the same time," "nothing locks you out of either." That rule stands, and the content
was not worthless; it was **rendered by default when it should have been available on demand**.

> **Inline help is the home for every explanation removed from a surface.** Cutting the paragraph and
> filing it here is the complete move. Cutting it and losing it is not.

This is also the honest test of whether a surface needed the paragraph: if the help article for a
screen has to explain the layout rather than the feature, the layout is the defect (§2).

### 3.4 Discovery — the one cost

Largely answered by the overlay (§3.2): turning the layer on reveals what is documented, and tabbing
the region order walks the surface. What remains is the member who does not know **which screen** to
be on at all. Two ways to cover that, and it needs a decision (§8 item 3):

- Global search returns help content and opens it **in place on the owning feature**, preserving the
  inline model.
- Or the Wiki carries browsing and help stays strictly contextual.

Accepting the cost is also legitimate — most questions arise *while looking at the thing*.

### 3.5 Conversational help

Deferred pending §4. A static contextual layer that works beats a conversational one that leaks.

## 4. The agent boundary (architectural)

**The journal agent must never answer help questions.**

Two reasons, and the second is the hard one:

1. It is constrained against advice and its purpose is interviewing about trading. Product support is
   outside its job.
2. **Its transcript is Family B and append-only.** "How do I add a tag?" landing in a journal record
   permanently mixes product support into the trader's practice record — and that record feeds the
   retrospective, expected-vs-actual, and export. It cannot be cleaned up afterward, because the
   transcript is append-only by design.

So:

| | Journal agent | Help |
|---|---|---|
| Subject | The member's trading | The product |
| Record | Family B transcript, permanent | Not part of the journal. Ever |
| Guardrails | §9 agent prohibitions | Same prohibitions, plus no product claims beyond behavior |

**If a member asks the journal agent a product question**, the correct behavior is a brief redirect
that does not become part of the record's substance — and this needs a defined rule, because right
now the agent has no instruction covering it and will improvise. *§8 item 2.*

When a conversational help agent ships, it is a **separate surface with a separate transcript**, and
that transcript is support data, not practice data.

---

## 5. Content model

```
help_articles
  id, slug, title, body_md,
  surface_key,            -- which app/screen this attaches to
  state_key NULL,         -- optional: state within that surface
  status (draft|published),
  updated_at
```

- **`surface_key` is the join.** Contextual help resolves by surface, not by manual curation of link
  lists that will rot.
- Articles are **platform content, never member data.** No article is personalized, and no member
  data appears in one.
- **A contextual help request must not carry member content.** No journal text, no trade detail, no
  tag names in a help query, a URL, or an analytics event. Family B does not leave with a help
  request. *Mike.*

---

## 6. Governance

| Content about | Reviewer |
|---|---|
| Trading concepts, market mechanics | **Hotel** |
| Every member-facing string | **Tango** |
| What a meter or grade means | **Tango + Hotel** — this is the product's reading of the member |
| Family B, privacy, data questions | **Mike** |
| Anything reachable publicly | **Sierra** |

**Help copy carries the same prohibitions as the product.** No profit claims. No advice. No
characterizing the member. An article explaining the integrity grade is describing a judgment the
system makes about someone's conduct — it is one of the most sensitive strings in the platform, not a
routine FAQ.

**Parity rule:** an article describing a behavior that changes must land in the same body of work as
the change. Help drifts faster than any other surface because nothing breaks when it goes stale.

---

## 7. Build order

| Phase | Deliverable |
|---|---|
| **H0** | Boundary decisions (§8), inventory of what the Guide currently holds |
| **H1** | Content model, `surface_key` registry, authoring in admin |
| **H2** | Feature help on Practice apps and Journey |
| **H3** | Discovery decision (§3.4): global search in place, or Wiki-only browsing |
| **H4** | Report verb on the layer; read-count and report-count instrumentation feeding one UI defect review |
| **H5** | Conversational help — separate surface, separate transcript |

Content design follows H0 and H1. Writing articles before the boundary is settled produces material
that later has to move.

---

## 8. Open decisions

| # | Decision | Owner |
|---|---|---|
| 1 | **What is the existing Guide?** It is in the nav today. Help either extends it, replaces it, or duplicates it — and duplication is the default outcome if nobody decides | Coach + Sierra |
| 2 | Journal agent's response when asked a product question (§4) — needs a defined redirect, or it improvises | Tango + Hotel |
| 3 | Discovery (§3.4) — global search opening help in place, Wiki-only browsing, or accept the cost | Coach + Sierra |
| 3b | Whether help is member-only or partially public. Public help is indexable SEO surface and a support asset; it also exposes product behavior to non-members | Sierra + Coach |
| 4 | Escalation path — is there a human support route, and where does it live | Coach |
| 5 | Tool reference lives in the **Courses tab** — confirm it is a course, not a third format | Coach + Sierra |
| 7 | Whether lessons referenced from help must be free-preview by default, so help never dead-ends behind enrollment (§3.2a) | Coach + Sierra |
| 6 | Does help ship before, with, or after the Wiki — search scope depends on it | Coach |
| 8 | Whether the Report verb replaces the existing bug-reporting path or runs beside it | Coach + Foxtrot |

---

## 9. The test

A member mid-conversation in the Journal, unsure whether tagging changes what the agent does, gets an
answer **in place, in one sentence, without losing their draft** — and never sees that exchange again
in their own record.

If the architecture delivers that, it is right. If it delivers somewhere they have to navigate to, it
is a website — and they will not use it while mid-task, which is the only moment it was for.
