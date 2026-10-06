# C-4 — What Lives in the Space

**Instance contract v0.3 — DRAFT**
Under: `FatTail-Labs-Agent-Managed-Lifecycle-Spec-v0_8.md` (stamped). §19 line C-4.
Date: 2026-09-27
Author: Claude, at Coach's direction.
Status: Not stamped. Bytes frozen at v0.3; changes go to v0.4.
**Supersedes:** C-4 v0.2 (Claude) and `Specs/…-C4-Object-Shapes-v0_1.md` (Connor). Both defined per-type schemas, field lists and emission-rights tables. Coach's ruling: that was a traditional system forced onto Agent Spaces. Neither is carried; this replaces them whole.

---

## 1. The space is dumb

The space holds things. It does not know what they mean, who should act on them, or what fields they ought to have. An agent reads the space, recognizes something it can work on, and takes it. That is the entire protocol.

Every thing in the space has three properties and nothing else is required:

- **scope** — the member it is about, or none. An attribute, not a partition. Agents match on it or ignore it.
- **kind** — a plain word for what it is: `loop-state`, `note-to-member`, `question-to-member`, `session`, `deposit`. An agent that meets an unfamiliar kind ignores it.
- **content** — whatever the emitting agent judged worth writing, in plain language or plain data. The reading agent is intelligent; it is trusted to read.

Nothing here constrains content. The constraints on what agents *say* and *do* — never count skips, never show absences, gesture only on a loop closing, a cycle boundary, or a first discovery, never point a member at another member — are Agent OS constraints on the agents, enforced there. The space cannot enforce them and does not try.

## 2. The two agents in the first slice

**Populator.** Can see Labs — the journal table, the trade log, sessions, and (once built) the analysis save. Each time a member is present it writes one `loop-state` thing for that member for today: what they produced, where they are in the week, when last seen. In its own words. It replaces yesterday's; it does not accumulate.

**Guide.** Reads `loop-state` and `session` things for a member and decides whether anything is worth saying. If so it writes a `note-to-member` or `question-to-member`. If not, it writes nothing. The help bubble is a view that shows a member the Guide's things in their scope and nothing else.

Neither agent needs a schema to understand the other. The Populator writes what it saw; the Guide reads what was written.

## 3. What never enters the space

- Consent, dial position, relationship memory — private stores, outside.
- Any member's data on any shared external agent computer (Lifecycle §12, §13).
- A second member's identity inside a scoped thing.

## 4. Stopgaps until their own contracts exist

- Things about a member expire at the end of the member's Labs day. (Atrophy contract will refine.)
- One Populator and one Guide run per environment. (Claim contract will refine.)
- Membership tier is stubbed to `observer` and week to unknown until C-6.

## 5. Open — needs Coach

**Q1 — Labs calendar day.** Server time or the member's timezone? Consequence: whether a late-evening West Coast entry counts today. Default if unruled: server time.

---

*End of C-4 v0.3. Frozen.*
