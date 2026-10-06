# FatTail Labs — Agent-Managed Lifecycle

**Spec v0.3 — DRAFT, awaiting Coach's rulings on §16**
Date: 2026-09-27
Author: Claude (drafted from walk-and-talk with Coach, 2026-09-26; revised against Grok adversarial reviews of v0.1 and v0.2)
Status: Not stamped. Bytes of this file are frozen at v0.3; changes go to v0.4.
**Supersedes:** `FatTail-Labs-Agent-Managed-Lifecycle-Spec-v0_2.md` (baseline; do not act on it). v0.1 is also on disk as a baseline.
Relationship: addendum to the Observer Lifecycle spec handed to Connor 2026-09-26 (version to be pinned — Q5). This document extends it; it does not reopen it.

### What changed since v0.2

Grok's second pass (`Agent-Managed-Lifecycle-Spec-v0_2-Adversarial-Review.md`) verified all twenty v0.1 findings landed and raised six new ones, all carried (Appendix B). None dropped. The changes:

- Untaken loop steps are reachable from the strip, not permanently listed on it (F2-1).
- Discovery cues fire only for a member Labs has seen present and producing nothing; an unknown ledger gets no discovery campaign (F2-2).
- Gesture triggers are a closed list — loop closed, cycle boundary, first discovery; a routine loop-state refresh is not a trigger (F2-3).
- The three loop steps are observed **work products**, not surface visits; this is now doctrine, with detectors left in §19 (F2-4).
- Gesture events and bubble-open rate are diagnostic only, never reward inputs (F2-5).
- §11 table column reworded from "talks to members" to view-presentable (F2-6).

Open for Coach: Q1, Q2, Q3, Q5, Q6 (§16). No further Grok findings are pending.

### What changed since v0.1 (carried forward from v0.2)

All twenty findings from `Agent-Managed-Lifecycle-Spec-v0_1-Adversarial-Review.md` are dispositioned in Appendix A. None were dropped. The material changes:

- **Gestures fire on state change only, never on the persistence of an open loop** (blocker, F2).
- **Grok Bot janitors are narrowed to unscoped, batch, and external work; member-scoped reconciliation is native** (blocker, F13).
- **The space is the object environment; the help bubble is a view over it.** Guide writes objects, not messages (blocker, F9 — a clarification of Coach's ruling, flagged for his veto; Grok confirms §11 as written clears the blocker if Coach confirms).
- The strip and the pre-filled retro render what was produced, never a scorecard of absences (F1, F3).
- Off-platform routine is unknown, not "open" (F6).
- Stale nudges atrophy; the bubble is not an inbox (F5).
- First contact is once per relationship (F18).
- Q4 answered (machinery); Q2 and Q3 corrected for self-voting.

---

## 0. How to read this document

This is a **doctrine-level** spec. It states what the system is for, what it must never do, and the shape of its parts. It deliberately does not specify wire formats, object schemas, claim semantics, TTLs, or UI pixel behavior — those belong in **instance contracts** written underneath it. A reviewer asking "but how exactly does X work" is usually pointing at an instance-contract item, and should say so rather than asking the doctrine to grow. Items already known to be instance-contract are collected in §19.

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

Email campaigns are a reminder at best. There is no basis for expecting members to open them and act on substance. Guidance therefore has to arrive **where their hands already are**: the work surfaces (Runner, Analyzer, the course player, live sessions, Community — any surface where a member spends time in a session).

The Practice suite already provides journaling and retrospective. Most members do not know it exists. The failure is discovery and distance, not capability. The system **pulls Practice to the member**; it does not send the member to Practice. This is the same ruling made for the radar map and it holds here.

**Invariant:** the member never has to navigate somewhere to satisfy the routine. If closing a loop step — daily reflection *or* the weekly retrospective — requires leaving the current surface, the design is wrong.

**Corollary for partial rollout:** until a surface carries the strip (§4), the system may not ask for a loop step from that surface that would require navigation. On a strip-less surface it may only accrue in the bubble (§6). The first slice instruments one surface (Q1); the invariant governs the rest.

---

## 4. The guide surface

The guide has two parts that must stay coordinated:

1. **A prescriptive path** — the routine as a fixed shape (daily loop, weekly cycle, six cycles for Observers).
2. **A position marker** — where this member actually stands against that path, derived from what Labs has observed (time in apps, courseware progress, journal entries, trades submitted, retrospectives completed). Position is **observed, never self-reported** — and observation is bounded (§8): what Labs did not see is unknown, not undone.

Concretely:

- A **persistent strip** on the work surfaces showing the path and the member's place in it. **The strip renders what the loop produced** — today's entry, today's analysis, today's trades. When Labs has seen the member present on its surfaces and producing nothing, the strip carries a **discovery cue** (the tool exists, here it is). Loop steps not yet taken are **reachable from the strip, not listed on it** — no standing three-item menu, no empty boxes, no count of skips. The prescriptive path is shown; the scorecard is not, and neither is the scorecard's silhouette.
- **Unknown is not thin.** A member whose ledger is unknown (§8) — working the routine off-platform — is not shown discovery cues and is not gestured at about discovery. Discovery is for a member Labs has *observed* present and idle, not for one Labs has not observed at all.
- **Reflection is one click from the strip.** A journal entry can be opened and written in place. This is the mechanism by which Practice comes to the member.
- **The weekly retrospective opens in place from the strip**, same ruling as daily reflection. It **arrives pre-filled with what exists** — the entries, the trades, the analyses of that week. Absences are not listed. The member's job in the retro is meaning, not recall, and meaning-making does not start from a row of zeros.

---

## 5. Tone doctrine

**The guide is never a nag.** A system that counts what the member skipped will be dialed to the floor in week two and ignored thereafter. This rules the strip (§4), the retro (§4), the gestures (§6), and the Learner (§10) alike.

The guide is **motivational by evidence**: it shows what the loop *produced* — a pattern surfaced in the journal, an analysis that called the regime, a retro that changed the next week's plan. Because week-one entries are thin and week-five entries are not, the compounding is visible, and cycle one can be shown next to cycle five. That contrast is the motivation; it is not borrowed from copy.

Early in the window, when there is little produced yet, the guide's job is **discovery** (the tools exist, here they are, here is what one entry looks like), not motivation.

---

## 6. Attention — the help bubble as the member's view

All agent-to-member contact **surfaces in the help bubble, lower right**. This is the one familiar place a voice already comes from. Nothing pops up elsewhere; nothing is modal; nothing hijacks the screen. The agent does not interrupt — objects in the member's scope **accrue**, and the member opens the bubble to see what is there.

The bubble has a **gesture vocabulary** to get attention: a subtle wiggle, a slow pulse, a larger swell. **A gesture fires on one of three state changes and nothing else:** a loop closed, a cycle boundary reached, or a first discovery (§4, for an observed-and-idle member only). **It never fires on the continued existence of an open loop**, and it never fires on a routine refresh of loop state — the Populator writing a member's session state at login is bookkeeping, not substance, and every login must not wiggle. An unclosed loop is not "something waiting"; it is the member's day in progress. Gesture intensity is proportional to the significance of the change, so the bubble never cries wolf. Adding a trigger to this list is a doctrine change, not an instance-contract one.

**Accrual has decay.** Objects in the bubble atrophy when they are no longer live — a nudge about yesterday's loop does not survive into today. The bubble is a view of what is current, not an inbox of leftover nudges. (Atrophy is what Spaces vitality already requires; the mechanism is instance-contract, §19.)

**Intensity is member-dialed against a tier floor.**

- Observers **cannot dismiss** the guide. They can turn intensity down to the Observer floor.
- Paid tiers have a **lower floor**. It is one system with different floors, not different systems per tier.
- The floor is never zero for any tier (§17). The member-facing wording of the two floors is open (Q2).

**The dial position is a signal, and a ceiling.** A member who drops the dial to the floor in week two is telling the system something, and the Learner (§10) treats it as such — but quiet is a **hard ceiling on intensity**, not a gap for learning to fill. Nothing the system learns may raise intensity above the member's current dial.

---

## 7. First contact

First contact happens **once per member relationship**, at the first login for which no relationship memory (§9) exists — the sooner the better, before the member learns to ignore the corner.

The agent introduces itself, says in one breath what it does, and **asks permission to address the member by name**. The answer is recorded in the relationship memory and is the system's **first engagement signal**. Everything that follows honors that answer.

A new device, a fresh session, or a cold cache is **not** a new relationship. If relationship memory cannot be loaded, that is a load failure to be handled, never a reason to reintroduce or re-ask. Where relationship memory lives so that this holds is instance-contract (§19).

---

## 8. What the agent knows — the user model

The agent must sound like it knows the member, not like a system message. Minimum knowledge:

- **Identity** — name, and whether the member consented to its use.
- **Tenure** — how long they have been in the process, expressed as loop/cycle position ("week three," "cycle two closed"), not as a date. Tenure changes the sentence entirely: "you're in week three" is a different message from "you haven't journaled."
- **The ledger** — what Labs has **observed** the member do, as **live loop state** (produced today / cycle position / time since last seen). The ledger states only what was observed in Labs. It must never imply that what was *not* observed did not happen: a member who journals in a notebook, works the routine in Discord, or does their analysis while watching the show is **unknown** to the ledger, not "open," and is never gestured at as if they had skipped.
- **Dial position and consent state.**

What exists today in Labs telemetry: identity, and app, journal, trade, courseware and retrospective events. What this system derives or introduces: live loop state, the dial, and consent. The work is shaping the former into the latter, not collecting more.

---

## 9. Memory — three layers

1. **User state** — the derived loop position above. Rebuilt from telemetry; not authoritative on its own.
2. **User relationship memory** — private, per member. What the agent said, how the member responded, what they agreed to, what they asked it to stop doing. This is what lets the agent pick up mid-thread instead of reintroducing itself every session. It never crosses users.
3. **Agent craft memory** — cross-user. The agent's record of its own attempts and outcomes as a coach: which framings at which loop states led to which results. This is the artifact that makes the agent better next month, and it is the thing nobody else can copy.

**The member has access to their memory.** Visibility over relationship memory, and the member's control over it, live as a **preference in the member's profile**, alongside the intensity dial. Everything the member controls about the agent relationship sits in one place. Memory the member can see is memory the member can trust; memory they cannot is a creepy surface. The *depth* of control — direct edit, or view plus request-to-forget — is open (Q3).

---

## 10. The learning layer

The agent learns in two directions:

- **Per member** — what actually moves this person.
- **As a coach** — its own competence, independent of any one member. The agent builds a *practice*, not just profiles.

Structurally this is **reinforcement learning**: state is loop position (and context from §8), actions are nudge **framings and timings**, reward is whether the loop closed.

**The action space excludes intensity.** Learning may change what is said and when; it may never change how loudly, and never above the member's dial (§6). Dial-down is evidence about framing, not an invitation to escalate.

**The reward function is pluggable, not baked in.** Coach wants to try different definitions and run variants side by side. The doctrine constraint on any reward: **reward loop or cycle completion, not clicks.** Rewarding attention produces a pest; rewarding closure produces a coach. **Closure means the loop's three steps were observed** (§18), not that the member was present on a surface.

The Learner observes the space (§11): what was offered, what closed, what was dialed down. It writes to craft memory. It does not talk to members.

---

## 11. Agent Spaces integration

This system is built on Agent Spaces (Agentic Spaces doctrine v0.5, and the Agent OS constitution) and is the second real application of it after the IKI Factory. It is deliberately a different shape: the Factory is a pipeline with an end state; this is a live environment that never finishes. Same dumb substrate, two shapes — that is the point.

**The space is the object environment. The help bubble is a view over it.** Coach's ruling that "the help system becomes the space" is carried as follows: the help system is rebuilt *on* the space — what the member sees in the bubble is the set of live objects in their scope — and the bubble does not become a write-target. Help content, loop observations, a wiki answer, an agent's question all become **objects**; the bubble is how a member sees them. No agent "writes a message into the help window." No feature needs new plumbing because every feature produces objects.

If today's help system dispatches intents (a concierge routing a question to a handler), that dispatcher is either retired or stays outside the space. It is not the space. Fan-in to the bubble is a property of the view, not a routing rule that agents obey.

**One space, user-scoped objects.** Scope is an **attribute on the object, not a partition**, so recognition patterns can match within one member or across all of them. This is what makes cross-user learning possible without a second system.

**Recognition, not routing.** Agents recognize objects and decide to act; nothing dispatches. The space knows nothing about agents. Agents have a constitution (Agent OS); the space does not. First contact (§7) is the Guide recognizing a first-login object with no relationship memory behind it — not a scripted chain from login.

Agent roles in the first application:

| Agent | Recognizes | Emits | Objects presentable in the member view |
|---|---|---|---|
| **Populator** | member session events | that member's live loop-state objects | no |
| **Guide (coach)** | loop-state objects, cycle boundaries, first-login objects, dial changes | nudge / observation / question objects in the member's scope; relationship memory | **yes — the only agent whose objects the view may present** |
| **Learner** | offered / closed / dialed-down objects | craft memory | no |
| **Janitors** (§12) | unscoped batch and external-data needs | deposits at the membrane | no |

Each row is an agent that recognizes and may emit; the table is not a pipeline. Populator → Guide is two recognitions of the same environment, not two stages.

**There is one pipeline, and it is named:** the **membrane** (§12), where external work enters as deposits. That is Factory-shaped by nature — ETL is ETL — and this spec does not pretend otherwise. It is confined to the edge and is not the shape of the Guide or the Learner.

**Instances scale horizontally.** Any agent type may run as many instances as load requires, each claiming objects. This surfaces the claim-liveness / attention question already open in the Spaces doctrine (§7.1 vs §8.1). That is an **instance-contract item and is not ruled here**; the only doctrine constraint is that two Guide instances must never both speak to the same member about the same thing.

**Skills, not tools.** The space never sees a tool. An agent has skills; tools are wrapped as skills and are private capability. A tool changing is invisible to everything else. The same agent shape can carry different skill loadouts for different deployments. Coach's expectation is that the only place this architecture will chafe is at the tool edge — never in the human-agent interaction, which must not ossify.

**Agent OS** supplies the agents' stance toward their own work (antifragility, sovereignty, the purpose↔mechanism completeness invariant). Improvements in the underlying models land in that slot without a rewrite. The doctrine here does not hardcode judgment; it leaves the slot.

---

## 12. Grok Bots — role and boundary

Coach intends to employ xAI Grok Bots in this system, for their interoperability with one another and their flexibility. Their role is ruled as follows:

**Grok Bots are janitors, not residents.** They sit *outside* the space and treat it as an **edge environment**: a bot does work in its own world and deposits results across the membrane as objects for native agents to recognize. They do not hold the coaching voice.

**Their coordination is machinery, not convention** (Q4, answered by Grok in review). Known: bots address each other by name in threads and hand off work; they share one cloud computer; xAI does not treat separate bots as separate security boundaries; there is no native object-space or recognition substrate. Inferred, not known: a single bot can run a batch job with no peer messaging. Not known: any official way to disable directed messaging.

Consequences:

- Cooperating janitors coordinate **outside the space** with their native messaging; only deposits cross the membrane. If two bots must cooperate, an adapter keeps their routing entirely outside the space (instance-contract, §19). A lone janitor needs no inter-bot coordination at all.
- **Janitor duties are unscoped, batch, or external only**: hauling external data in, sweeping unscoped or system-level objects, batch jobs that touch no member. **Member-scoped work — reconciling a member's loop state, sweeping a member's stale nudges — is native (Populator, Learner), never a Grok Bot job.** Loading member objects into a shared-computer context window is the blast radius §13 forbids.
- **The space is the membrane.** Member data never reaches the shared bot computer.

Explicit non-role: **any member-facing contact.** The Guide is FatTail's own agent.

---

## 13. Privacy and data boundaries

- Relationship memory is per member and never leaves that member's scope.
- Craft memory is derived and must not be reversible to an identifiable member.
- No member-scoped object is ever loaded onto any shared external agent computer (§12).
- The member can see their relationship memory from their profile, with control depth per Q3 (§9).

---

## 14. Signals the system produces (for measurement, not for the member)

- Consent answer at first contact, and time to first contact.
- Dial position over time; time-to-floor.
- Daily loop closures (three steps observed) and weekly cycle closures; time-to-first-journal-entry.
- Retro completion rate and whether the retro changed anything in the next cycle (as judged by the Learner).
- Discovery: first use of each Practice tool, by week.

These are the raw material of the reward function (§10) and of the archetype work in the Observer Lifecycle spec.

**Diagnostic only — never reward inputs:**

- Gesture events by trigger type, and bubble-open rate following each.

These tell the team whether the bubble is behaving; feeding them to the Learner would reward attention, which §10 forbids.

---

## 15. Non-goals

- Not a curriculum tracker. No gates, no "complete module four."
- Not a scorecard. No empty boxes, skip counts, or absence lists anywhere a member can see.
- Not a notification system. No toasts, banners, or modals anywhere but the help bubble — and the bubble is a view of what is live, not an inbox.
- Not two systems. One guide, tier floors.
- Not a Grok-fronted product. Member voice is FatTail's.
- Not an email feature. Email stays a reminder.

---

## 16. Open decisions — need Coach

**Q1 — First slice.** Which single work surface gets the strip first: Runner or Analyzer? Consequence: the first falsification test of "pulling Practice to the member" happens where Observers already spend the most time. If Runner, execution-heavy members are tested first; if Analyzer, analysis-heavy. All other surfaces run under the §3 corollary (accrue only) until instrumented.

**Q2 — Floor wording.** The floor is never zero (decided, §17). What is open is how the two floors are described to members — e.g., Observer: "always visible, can be quiet"; paid: "can be nearly silent, never gone." Consequence: the wording is a promise the product must keep.

**Q3 — Memory control depth.** Does the member get *direct edit* of relationship memory, or *view plus request-to-forget*? Consequence: direct edit is more honest and more work, and lets a member make the record inconsistent; request-to-forget is simpler and keeps the agent's record coherent.

**Q5 — Observer Lifecycle spec version.** Which version number does this addendum attach to? Needed for the Relationship line in v0.3.

**Q6 — Finding 9 veto.** §11 carries "the help system becomes the space" as "the help system is rebuilt on the space; the bubble is a view over it." Does that preserve the ruling, or did you mean something the reinterpretation loses? Consequence: if the bubble is a write-target, Spaces' recognition model is broken on the member side and Grok's blocker stands.

---

## 17. Decided with rationale (Coach may override)

- **Week one is orientation only, unmeasured.** Rationale: Coach's stated expectation; measuring it would nag.
- **Reflection and the retro both open in place from the strip.** Rationale: the §3 invariant applies to the whole loop, not half of it.
- **Retro arrives pre-filled with what exists; absences not listed.** Rationale: the data exists; a row of zeros is a nag.
- **Gestures fire on state change, never on an open loop's persistence.** Rationale: the alternative is a daily nag Observers cannot dismiss.
- **Learning cannot raise intensity above the dial.** Rationale: quiet is a ceiling; otherwise dial-down trains escalation.
- **The floor is never zero for any tier.** Rationale: a zero floor turns one system back into two.
- **First contact is once per relationship.** Rationale: re-asking on a new device is a nag; missing memory is a load failure.
- **Off-platform routine is unknown, not open.** Rationale: the ledger observes Labs; it does not judge what it cannot see.
- **Guide is the only member-facing agent.** Rationale: one voice; keeps Grok Bots and the Learner off the coaching path.
- **Scope is an attribute, not a partition.** Rationale: cross-user learning without a second space.
- **Grok Bot coordination is machinery (Q4 closed).** Rationale: Grok's own account in review; janitors coordinate outside the space.
- **Janitors are unscoped/batch/external only.** Rationale: §13 blast radius.
- **Claim liveness is an instance-contract item.** Rationale: Coach's standing rule that mechanical specificity lives under doctrine.
- **Gesture triggers are a closed list of three; adding one is a doctrine change.** Rationale: every open-ended trigger so far has turned into a nag on inspection.
- **Closure is three work products, never a visit.** Rationale: otherwise the falsification test in §18 is gamed by annotation.
- **Unknown ledgers get no discovery.** Rationale: discovery is for the observed-and-idle; treating the unseen as idle is the §8 failure by another door.

---

## 18. First falsification test

The Observer rollout is the test. The claim under test: *members who are shown their own loop, in place, by a guide that is never a nag, close more cycles than members who receive the same content by campaign.*

**Closure is defined as the inner loop's three work products observed:** an **analysis artifact**, a **trade** (live, simulated, or declared), and a **journal entry**. A surface visit is not a step. Opening Analyzer is not an analysis; being on Runner is not an execution; opening the journal is not a reflection. A trade that was already happening on Analyzer does not count as a closed loop because a strip was next to it. This is doctrine. What remains for the instance contract (§19) is the wire-level detector for each product — what exactly constitutes a saved analysis artifact, a declared trade, a written entry — not whether a visit can substitute for one. It cannot.

If Observers on the guided surface do not out-close campaign-only Observers over six cycles by that definition, the doctrine is wrong somewhere in §3–§6 and this spec reopens. If they do, the next slice is the second surface and the Learner.

---

## 19. Instance-contract register

Items this spec names but deliberately does not rule. Each becomes a line in an instance contract under this doctrine.

- Object atrophy: TTL and merge rules for nudge / observation objects (§6).
- Where relationship memory lives so that first contact is once per relationship across devices (§7).
- Claim liveness and attention for multiple Guide instances (§11; Spaces §7.1 vs §8.1).
- The membrane adapter that keeps cooperating Grok Bots' routing outside the space (§12).
- The wire-level detectors for each of the three work products — analysis artifact, trade, journal entry (§18). Whether a visit counts is not open: it does not.
- Gesture vocabulary mapping: which state changes map to which gesture at which significance (§6).
- The disposition of today's help dispatcher, if one exists (§11).

---

## Appendix A — Disposition of Grok review findings (v0.1 → v0.2)

Every finding from the written review, carried or dropped. None dropped.

| # | Section | Severity | Disposition |
|---|---|---|---|
| 1 | §4 vs §5 | should-fix | **Carried.** Strip renders what was produced plus discovery cues; open steps are available actions, never empty boxes or skip counts (§4, §15). |
| 2 | §6 | **blocker** | **Carried.** Gestures fire on state change only, never on persistence of an open loop (§6, §17). |
| 3 | §4/§5 | should-fix | **Carried.** Retro pre-fills only what exists; absences not listed (§4, §17). |
| 4 | §5/§10/§6 | should-fix | **Carried.** Learning action space excludes intensity; dial is a ceiling (§6, §10, §17). |
| 5 | §6/§15 | should-fix | **Carried.** Accrual has decay; bubble is a view of what is live, not an inbox. TTL/merge to §19. |
| 6 | §1/§3/§8 | should-fix | **Carried.** Ledger states only what Labs observed; off-platform work is unknown, not open (§4, §8, §17). |
| 7 | §3/§4/Q1 | should-fix | **Carried.** §3 corollary: strip-less surfaces may only accrue; no navigation-requiring asks. Q1 amended. |
| 8 | §3 | should-fix | **Carried.** Retro opens in place from the strip, same as daily reflection (§3, §4, §17). |
| 9 | §11 | **blocker** | **Carried, flagged for Coach (Q6).** Space is the object environment; bubble is a view; Guide emits objects, not messages (§6, §11). |
| 10 | §11 table | should-fix | **Carried.** Table reworded as recognitions, not stages; first contact is recognition of a first-login object (§7, §11). |
| 11 | §11 | should-fix | **Carried** with F9. Any existing help dispatcher is retired or stays outside the space; fan-in is a view property (§11, §19). |
| 12 | Q4 | should-fix | **Carried.** Q4 answered "machinery"; recorded in §12 and §17; adapter to §19. |
| 13 | §12 | **blocker** | **Carried.** Janitors narrowed to unscoped/batch/external; member-scoped reconciliation is native (§12, §13, §17). |
| 14 | §12/§11 | nit | **Carried.** The membrane is named as the one pipeline, confined to the edge (§11). |
| 15 | Q2 vs §6 | should-fix | **Carried.** Never-zero moved to §17; Q2 is floor wording only. |
| 16 | Q3 vs §9 | should-fix | **Carried.** "Correct" struck from §9; Q3 stays open on control depth. |
| 17 | Q4 vs §12 | nit | **Carried.** Q4 closed after F12. |
| 18 | §7/§9 | should-fix | **Carried.** First contact once per relationship; missing memory is a load failure (§7, §17, §19). |
| 19 | §8 | nit | **Carried.** Telemetry claim split into what exists and what this system derives (§8). |
| 20 | §18 vs §2 | should-fix | **Carried.** Closure defined as three observed steps; annotated activity does not count (§10, §18, §19). |

---

## Appendix B — Disposition of Grok second-pass findings (v0.2 → v0.3)

Grok verified all twenty Appendix A rows as landed, confirmed blockers F2 and F13 cleared, and confirmed §11 clears F9 if Coach answers Q6 in the affirmative. Six new findings, all carried, none dropped.

| # | Section | Severity | Disposition |
|---|---|---|---|
| 2-1 | §4 | should-fix | **Carried.** Untaken steps reachable from the strip, not listed on it; no standing menu (§4). |
| 2-2 | §4/§6/§8 | should-fix | **Carried.** Unknown ≠ thin; discovery cues and discovery gestures only for observed-and-idle members (§4, §6, §17). |
| 2-3 | §6 | should-fix | **Carried.** Trigger list closed at three; loop-state refresh is not a trigger; additions are doctrine changes (§6, §17). |
| 2-4 | §19/§18 | should-fix | **Carried.** Closure = three work products, as doctrine; only detectors remain in §19 (§18, §19, §17). |
| 2-5 | §14 | should-fix | **Carried.** Gesture events and bubble-open rate moved to a diagnostic-only list, excluded from reward (§14). |
| 2-6 | §11 | nit | **Carried.** Table column reworded to "objects presentable in the member view" (§11). |

---

*End of v0.3. This file is frozen. It is ready for Coach's rulings on Q1, Q2, Q3, Q5 and Q6; those rulings and any resulting edits go to v0.4, which is the stamp candidate.*
