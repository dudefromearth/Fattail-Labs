# P2 Foundation — The Agentic Operating Layer

**Status:** DRAFT — awaiting founder ratification
**Supersedes nothing.** P1 (the platform foundation) is closed and load-bearing —
see peer charter [`agents/p1-foundation/CHARTER.md`](../p1-foundation/CHARTER.md).
P2 builds the layer above it.

**Capabilities P2 provides to P1:** [`docs/P2-Capabilities-for-P1.md`](../../docs/P2-Capabilities-for-P1.md)

---

## Purpose

> **FatTail Labs is designed to be operated by agentic systems — agents,
> skills, and workflows — with humans providing oversight, validation, and the
> seeding of intent into a backlog.**
>
> The course platform is the visible product. The actual system under
> construction is a **content business that runs on agent capacity**, where
> human judgment is concentrated at the two points where it is irreplaceable:
> deciding what should exist, and validating what was made.

P1 built a platform a human administrator can drive entirely from the
production UI. P2's claim is stronger: **everything an administrator can do,
an agent must be able to do** — author courses, write lesson notes, produce
and place media, schedule and describe live content, curate resources, tune
category and hub copy, maintain the SEO surface — through the same governed
interfaces, leaving the same audit trail, subject to the same gates.

## The inversion

P1's mental model: *a human operates the platform; the API serves the UI.*

P2's mental model: *the API is the operating surface; the UI is one client of
it — the one humans happen to use.* Agents are first-class operators, not
automations bolted to the side. Nothing an agent does is a special case;
nothing a human does is unreachable by an agent.

This was seeded deliberately in P1: the live-session **category** is an
audience contract, not role plumbing, precisely so an agent can say *what a
piece of content is for* without knowing auth internals. P2 extends that
principle to every surface: **agent-facing contracts speak the domain
(courses, audiences, schedules, intents) — never the implementation.**

## The four roles

| Role | What it is | What it does |
|---|---|---|
| **Human** | Sovereign | Seeds intent into the backlog; validates and approves work products; owns publish authority; sets doctrine |
| **Agent** | Operator | Claims backlog items, produces work products (drafts, media, schedules, copy) through governed APIs |
| **Skill** | Procedure | A documented, executable unit of operating knowledge — "publish a course," "schedule a series," "write landing notes." The Admin Guide's sections are proto-skills |
| **Workflow** | Orchestration | Composes skills and agents into multi-step production with defined gates — "transcript → course draft → review → publish" |

## The backlog is the interface

Human intent enters the system as **seeded work products** in a backlog:
"build a course from this webinar transcript," "produce notes for every free
preview," "schedule next month's specials," "refresh the butterflies hub
copy." Agents claim items, produce, and return work for validation.

The backlog is therefore the boundary object between human judgment and agent
capacity. It must carry: intent (what and why), inputs (sources, transcripts,
media), acceptance criteria, state (seeded → claimed → in-progress → produced
→ validated → published | rejected), attribution (which agent, which human
gate), and evidence (what was verified).

## The gate principle

**Agent work lands as proposals; publishing is a human gate.** P1's
draft-first lifecycle is the enforcement mechanism that already exists:
courses are born drafts, invisible publicly until promoted. P2 generalizes it
— every surface an agent touches must have a draft/proposal state and a human
validation step. Gates may be *relaxed per-surface by explicit doctrine*
(e.g., schedule maintenance may earn auto-publish after a trust period), but
relaxation is a recorded decision, never a default.

## What P1 already provides

P2 is not a rebuild. The foundation was built agent-ready, mostly on purpose:

1. **A complete admin API** — every operator capability exists as a governed
   endpoint (the in-place UI proves the API is sufficient).
2. **Draft → publish lifecycle** — the natural proposal/validation gate.
3. **Domain-speaking contracts** — audience categories, intents, allowlists.
4. **Fail-loud validation** — malformed agent output dies at the boundary
   with a reason, which is exactly what an agent loop needs to self-correct.
5. **The characterization suite** — 47 tests defining "the system still
   works"; the validation harness agents run against.
6. **Spec + decision-log culture** — the governance corpus agents read to
   learn doctrine; documentation parity is what makes agents governable.
7. **Media pipeline, revalidation pipeline, audit-shaped logs.**

## What P2 must add (the pillars)

0. **Agentic video & content studio** — multi-format production: educational
   courses (lesson plans + resources + video), YouTube long-form, coaching
   shorts, thematic short-form. Research and script writing are first-class
   stages; courses follow educational guidelines and practices. **Cast:** named
   HeyGen avatars are the actors; `heygen-video` produces scenes and, where
   quality allows, finished lesson masters (`docs/P2-Cast-and-HeyGen-Production.md`,
   registry `docs/studio/cast/`).
1. **Agent identity & authorization** — agents authenticate as themselves
   (scoped credentials, not admin cookies); every mutation attributable.
   Today's admin-session-only surface is the gap named in Live Sessions v1.3.
2. **The backlog** — the work-product model above: seeding, claiming, state,
   acceptance criteria, evidence. Human UI for seeding and validating;
   API for claiming and delivering.
3. **Skills** — the operating procedures, written as executable/checkable
   documents with inputs, steps, invariants, and verification. Derived from
   the Admin Guide, governed like specs.
4. **Workflows** — orchestration with explicit gates; long-running,
   resumable, observable.
5. **The audit & observability spine** — what happened, by whom, gated by
   whom, verified how. The decision-log culture, mechanized.

## Content studio bench (archetypes)

Seated for P2 production work (charters in `agents/bench/`):

| Callsign | Role | Stage |
|---|---|---|
| **Bravo** | Content Research Specialist | Research packs, claims, misconceptions |
| **November** | Instructional Designer | Outcomes, lesson plans, educational guidelines, resources |
| **Romeo** | Script & Short-Form Writer | Course VO, coaching shorts, thematic shorts, YT scripts |
| **Papa** | Video Producer | Render, package, Labs + YouTube placement proposals |
| **Hotel** | Trading-Domain Guardian | Accuracy gate on trading education |
| **Victor** | Taleb Doctrine Channel | Antifragility, skin in the game, via negativa |
| **Whiskey** | Spitznagel Strategy Channel | Preservation-as-strategy, tail hedges, safe havens |
| **Yankee** | Mandelbrot Lineage Channel | Fat tails, wild randomness, discontinuity |

Pipeline default for courses: **Bravo → Hotel → (Victor/Whiskey/Yankee as frame requires) → November → Romeo → Hotel/Tango/lineage → Papa → human gate**.
Shorts may skip November when no course bundle is in scope; they still require Bravo
research (or an approved moment list) and doctrine gates. Lineage channels review when
the piece invokes their frame — not every short needs all three.

## Non-goals

- **No autonomy theater.** An agent that cannot be audited, gated, and
  attributed does not operate this system.
- **No parallel agent API.** Agents use the same governed surface as the UI;
  divergence is the seed of every integration rot.
- **No dependency inversion of the human.** The doctrine's prime rule —
  capacity, not dependency — applies to the operator too: the system makes
  Ernie's judgment go further; it never routes around it.

## Success criterion

**A full operating week where humans only seed and validate.** Content
produced, schedules maintained, copy refreshed, media placed — by agents,
through gates, with a complete evidentiary trail — while the humans touched
nothing but the backlog and the approve button.

---

*Ratification pending. On approval this charter governs P2 the way the Gate 1
foundation docs governed P1; pillar specs follow individually.*
