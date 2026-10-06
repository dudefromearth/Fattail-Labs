# FatTail Labs — Agent-Managed Lifecycle

**Spec v0.1 — DRAFT for adversarial review**
Date: 2026-09-26
Author: Claude (drafted from walk-and-talk with Coach, 2026-09-26)
Status: Not stamped. Open for Grok review. Bytes of this file are frozen at v0.1; changes go to v0.2.
Supersedes: none.
Relationship: addendum to the Observer Lifecycle spec handed to Connor 2026-09-26 (Coach to pin that spec's version number in v0.2). This document extends it; it does not reopen it.

---

## 0. How to read this document

This is a **doctrine-level** spec. It states what the system is for, what it must never do, and the shape of its parts. It deliberately does not specify wire formats, object schemas, claim semantics, or UI pixel behavior — those belong in **instance contracts** written underneath it. A reviewer asking "but how exactly does X work" is usually pointing at an instance-contract item, and should say so rather than asking the doctrine to grow.

Section 16 lists the decisions that genuinely need Coach. Section 17 lists what has been decided with a rationale he can override.

---

## 1. Thesis

**The routine is the product.** Courses, tools, shows and the wiki are how a member learns the routine and what the routine consumes; they are not the thing being sold. A member who has internalized the routine succeeds; one who has consumed every course and has no routine does not.

The routine is a **loop within a loop**:

- **Daily (inner) loop** — analysis → execution → reflection. Execution includes simulated or declared trades, not only live ones. Reflection is journaling.
- **Weekly (outer) cycle** — a retrospective across that week's daily loops. Each cycle closes and seeds the next; cycles compound.

The system described here exists to get members into that loop and keep them in it, using agents rather than email, on the surfaces where members already work.

---

## 2. Scope

**General to every user of FatTail Labs.** Observers are the **first rollout**, not the definition. Observers are first because their six-week window gives exactly six cycles and a natural on-ramp, and because they are the population where the routine is most absent and the cost of losing them is highest.

Week one of the Observer window is **orientation only**: the member is made aware that a routine is coming and what its shape is. No loop is expected, and nothing is measured against the loop in week one.

There are **no hard gates**. A member may run ahead, skip, or do anything they like. The system guides; it does not restrict.

Out of scope for this spec: the campaign/email layer (covered in the Observer Lifecycle spec), courseware content, and the Practice suite's internal features. This spec uses those; it does not define them.

---

## 3. Reach — go where they are

Email campaigns are a reminder at best. There is no basis for expecting members to open them and act on substance. Guidance therefore has to arrive **where their hands already are**: the work surfaces (Runner, Analyzer, and any surface where a member spends time in a session).

The Practice suite already provides journaling and retrospective. Most members do not know it exists. The failure is discovery and distance, not capability. The system **pulls Practice to the member**; it does not send the member to Practice. This is the same ruling made for the radar map and it holds here.

**Invariant:** the member never has to navigate somewhere to satisfy the routine. If closing a loop step requires leaving the current surface, the design is wrong.

---

## 4. The guide surface

The guide has two parts that must stay coordinated:

1. **A prescriptive path** — the routine as a fixed shape (daily loop, weekly cycle, six cycles for Observers).
2. **A position marker** — where this member actually stands against that path, derived from captured signals (time in apps, courseware progress, journal entries, trades submitted, retrospectives completed). Position is **known, never self-reported**.

Concretely:

- A **persistent strip** on the work surfaces showing today's loop (analysis / execution / reflection) with state, and the current week's cycle position.
- **Reflection is one click from the strip.** A journal entry can be opened and written in place. This is the mechanism by which Practice comes to the member.
- The **weekly retrospective arrives pre-filled** with the facts the system already has (did they journal, did they submit trades, did they analyze, did they engage courseware). The member's job in the retro is meaning, not recall.

---

## 5. Tone doctrine

**The guide is never a nag.** A system that counts what the member skipped will be dialed to the floor in week two and ignored thereafter.

The guide is **motivational by evidence**: it shows what the loop *produced* — a pattern surfaced in the journal, an analysis that called the regime, a retro that changed the next week's plan. Because week-one entries are thin and week-five entries are not, the compounding is visible, and cycle one can be shown next to cycle five. That contrast is the motivation; it is not borrowed from copy.

Early in the window, when there is little produced yet, the guide's job is **discovery** (the tools exist, here they are, here is what one entry looks like), not motivation.

---

## 6. Attention — the help system as the channel

All agent-to-member contact **emanates from the help bubble, lower right**. This is the one familiar place a voice already comes from. Nothing pops up elsewhere; nothing is modal; nothing hijacks the screen. The agent does not interrupt — it **accrues**, and the member opens the bubble to see what is waiting.

The bubble has a **gesture vocabulary** to get attention: a subtle wiggle for "something is here," a slow pulse for "there is an open loop today," a larger swell for the weekly cycle close. **Gesture intensity is proportional to what is actually waiting**, so the bubble never cries wolf.

**Intensity is member-dialed against a tier floor.**

- Observers **cannot dismiss** the guide. They can turn intensity down to the Observer floor.
- Paid tiers have a **lower floor**. It is one system with different floors, not different systems per tier.
- The floor is never zero for any tier (see §16, Q2).

**The dial position is itself a signal.** A member who drops the dial to the floor in week two is telling the system something, and the learning layer (§10) treats it as such.

---

## 7. First contact

First contact happens **on first login** — the sooner the better, before the member learns to ignore the corner.

The agent introduces itself, says in one breath what it does, and **asks permission to address the member by name**. The answer is recorded in the relationship memory (§9) and is the system's **first engagement signal**. Everything that follows honors that answer.

---

## 8. What the agent knows — the user model

The agent must sound like it knows the member, not like a system message. Minimum knowledge:

- **Identity** — name, and whether the member consented to its use.
- **Tenure** — how long they have been in the process, expressed as loop/cycle position ("week three," "cycle two closed"), not as a date. Tenure changes the sentence entirely: "you're in week three" is a different message from "you haven't journaled."
- **The ledger** — what they have done and not done, as **live loop state** (done today / open today / cycle position / time since last seen), not as a report to be re-derived.
- **Dial position and consent state.**

All of this already exists in Labs telemetry. The work is shaping it into live state, not collecting it.

---

## 9. Memory — three layers

1. **User state** — the derived loop position above. Rebuilt from telemetry; not authoritative on its own.
2. **User relationship memory** — private, per member. What the agent said, how the member responded, what they agreed to, what they asked it to stop doing. This is what lets the agent pick up mid-thread instead of reintroducing itself every session. It never crosses users.
3. **Agent craft memory** — cross-user. The agent's record of its own attempts and outcomes as a coach: which framings at which loop states led to which results. This is the artifact that makes the agent better next month, and it is the thing nobody else can copy.

**The member has access to their memory.** Visibility and control over relationship memory (view, correct, ask to forget) live as a **preference in the member's profile**, alongside the intensity dial. Everything the member controls about the agent relationship sits in one place. Memory the member can see is memory the member can trust; memory they cannot is a creepy surface.

---

## 10. The learning layer

The agent learns in two directions:

- **Per member** — what actually moves this person.
- **As a coach** — its own competence, independent of any one member. The agent builds a *practice*, not just profiles.

Structurally this is **reinforcement learning**: state is loop position (and context from §8), actions are nudge framings and timings, reward is whether the loop closed.

**The reward function is pluggable, not baked in.** Coach wants to try different definitions and run variants side by side. The doctrine constraint on any reward: **reward loop or cycle completion, not clicks.** Rewarding attention produces a pest; rewarding closure produces a coach.

The learning agent observes the space (§11): what was offered, what closed, what was dialed down. It writes to craft memory. It does not talk to members.

---

## 11. Agent Spaces integration

This system is built on Agent Spaces (Agentic Spaces doctrine v0.5, and the Agent OS constitution) and is the second real application of it after the IKI Factory. It is deliberately a different shape: the Factory is a pipeline with an end state; this is a live environment that never finishes. Same dumb substrate, two shapes — that is the point.

**The help system becomes the Space.** The help bubble is the member's window into the space. Help content, loop nudges, wiki answers, agent observations all arrive through the same window. No new plumbing per feature.

**One space, user-scoped objects.** Scope is an **attribute on the object, not a partition**, so recognition patterns can match within one member or across all of them. This is what makes cross-user learning possible without a second system.

**Recognition, not routing.** Agents recognize objects and decide to act; nothing dispatches. The space knows nothing about agents. Agents have a constitution (Agent OS); the space does not.

Agent roles in the first application:

| Agent | Recognizes | Writes | Talks to members |
|---|---|---|---|
| **Populator** | member login / session events | that member's live loop state as objects | no |
| **Guide (coach)** | loop state, cycle boundaries, first login, dial changes | messages into the help window; relationship memory | **yes — the only one** |
| **Learner** | offered / closed / dialed-down objects | craft memory | no |
| **Janitors** (see §12) | stale objects, drift, external data needs | cleaned / reconciled / imported objects | no |

**Instances scale horizontally.** Any agent type may run as many instances as load requires, each claiming objects. This surfaces the claim-liveness / attention question already open in the Spaces doctrine (§7.1 vs §8.1). That is an **instance-contract item and is not ruled here**; the only doctrine constraint is that two Guide instances must never both speak to the same member about the same thing.

**Skills, not tools.** The space never sees a tool. An agent has skills; tools are wrapped as skills and are private capability. A tool changing is invisible to everything else. The same agent shape can carry different skill loadouts for different deployments (a Factory agent and a Guide agent share a shape and carry different skills). Coach's expectation is that the only place this architecture will chafe is at the tool edge — never in the human-agent interaction, which must not ossify.

**Agent OS** supplies the agents' stance toward their own work (antifragility, sovereignty, the purpose↔mechanism completeness invariant). Improvements in the underlying models land in that slot without a rewrite. The doctrine here does not hardcode judgment; it leaves the slot.

---

## 12. Grok Bots — role and boundary

Coach intends to employ xAI Grok Bots in this system, for their interoperability with one another and their flexibility. Their role is ruled as follows:

**Grok Bots are janitors, not residents.** They sit *outside* the space and treat it as an **edge environment**: a bot does work in its own world and deposits results into the space as objects for native agents to recognize. They do not hold the coaching voice.

Rationale:

- What is known of Grok Bot (beta from 2026-08-11): named persistent agents sharing **one cloud computer** (browser, files, terminal); bots message each other directly and hand off in threads; each keeps its own role and memory. xAI states explicitly that separate bots are **not separate security boundaries** and describes the shared computer as a real blast radius.
- Their native coordination is **point-to-point messaging and handoff** — a different model from recognition-from-a-space. If they were residents, their coordination would be a routing layer underneath a system whose whole point is not having one.
- Member data must therefore never reach the shared bot computer directly. **The space is the membrane.** Janitors read and write scoped objects through it and nothing else.

Candidate janitor duties (not exhaustive): sweeping stale objects, reconciling drift between telemetry and loop state, hauling external data into the space, batch jobs that do not need a member's attention.

Explicit non-role: **any member-facing contact.** The Guide is FatTail's own agent.

**Open for Grok's review (§16, Q4):** whether Grok Bot's coordination is convention (drops in cleanly at the edge) or machinery (assumes its own routing). This is cheap to verify now and expensive to discover in month three.

---

## 13. Privacy and data boundaries

- Relationship memory is per member and never leaves that member's scope.
- Craft memory is derived and must not be reversible to an identifiable member.
- No member data is placed on any shared external agent computer (§12).
- The member can see, correct, and request deletion of their relationship memory from their profile (§9).

---

## 14. Signals the system produces (for measurement, not for the member)

- Consent answer at first contact, and time to first contact.
- Dial position over time; time-to-floor.
- Daily loop closures; weekly cycle closures; time-to-first-journal-entry.
- Retro completion rate and whether the retro changed anything in the next cycle (as judged by the Learner).
- Discovery: first use of each Practice tool, by week.

These are the raw material of the reward function (§10) and of the archetype work in the Observer Lifecycle spec.

---

## 15. Non-goals

- Not a curriculum tracker. No gates, no "complete module four."
- Not a notification system. No toasts, banners, or modals anywhere but the help bubble.
- Not two systems. One guide, tier floors.
- Not a Grok-fronted product. Member voice is FatTail's.
- Not an email feature. Email stays a reminder.

---

## 16. Open decisions — need Coach

**Q1 — First slice.** Which single work surface gets the strip first: Runner or Analyzer? Consequence: the first falsification test of "pulling Practice to the member" happens where Observers already spend the most time. If it is Runner, execution-heavy members are tested first; if Analyzer, analysis-heavy.

**Q2 — Floors.** Confirm the floor is never zero for any tier, and state the two floor values in member-facing terms (e.g., Observer: "always visible, can be quiet"; paid: "can be nearly silent, never gone"). Consequence: a zero floor for paid tiers turns "one system" back into two.

**Q3 — Memory control depth.** Does the member get *edit* of relationship memory, or *view plus request-to-forget*? Consequence: direct edit is more honest and more work; request-to-forget is simpler and keeps the agent's record coherent.

**Q4 — Grok Bot coordination model.** Is Grok Bot's inter-bot coordination convention or machinery? (For Grok to answer in review.) Consequence: if machinery, janitors need an adapter that keeps their routing entirely outside the space; if convention, they drop in at the edge as written.

**Q5 — Observer Lifecycle spec version.** Which version number does this addendum attach to? Needed for the Supersedes/Relationship line in v0.2.

---

## 17. Decided with rationale (Coach may override)

- **Week one is orientation only, unmeasured.** Rationale: Coach's stated expectation; measuring it would nag.
- **Reflection opens in place from the strip.** Rationale: the §3 invariant.
- **Retro arrives pre-filled.** Rationale: recall is a waste of the member's reflection; the data exists.
- **Guide is the only member-facing agent.** Rationale: one voice; keeps Grok Bots and the Learner off the coaching path.
- **Scope is an attribute, not a partition.** Rationale: cross-user learning without a second space.
- **Claim liveness is an instance-contract item.** Rationale: Coach's standing rule that mechanical specificity lives under doctrine.

---

## 18. First falsification test

The Observer rollout is the test. The claim under test: *members who are shown their own loop, in place, by a guide that is never a nag, close more cycles than members who receive the same content by campaign.* If Observers on the guided surface do not out-close campaign-only Observers over six cycles, the doctrine is wrong somewhere in §3–§6 and this spec reopens. If they do, the next slice is the second surface and the Learner.

---

*End of v0.1. This file is frozen. Findings from review go into a written list and are dispositioned into v0.2 one by one (carried with fix, or dropped with reason).*
