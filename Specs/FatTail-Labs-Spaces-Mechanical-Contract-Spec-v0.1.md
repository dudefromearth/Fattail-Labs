# FatTail Labs — Spaces Mechanical Contract Specification

**Version:** v0.1 (provisional — Coach names file and version; see Open Question 1)  
**Status:** Draft for Coach. Not stamped. No seeds, no gates. **Not BUILD AUTHORITY.**  
**Type:** Companion to [`FatTail-Labs-Spaces-Spec-v0.1.md`](./FatTail-Labs-Spaces-Spec-v0.1.md). Doctrine stays in that file. This file states the **v1 mechanical contract** future Labs applications design against.  
**Author:** Advisor draft, 2026-08-27. Carries Coach's Spaces rulings; does not invent positions he has not directed.  
**Parents:** FatTail Labs Spaces Spec v0.1 · Wiki inversion (Oscar / queue) · IKI Factory pull model · DL-539 · sacred invariants 2 and 8.

---

## Scope statement

**Active program:** Spaces (companion document).  
**Files/trees touched by this document:** none. Specification only. No code, no repo trees, no migrations, no configuration, no store choice.  
**Touches outside program:** NONE.

This document does not replace Spaces Spec v0.1. It does not remove, reorder, or reword that file's §0-equivalent doctrine. Where v0.1 left a dimension open, this file either **repeats the open** or states a **candidate** marked as such. Nothing here is a default standing in for a Coach ruling.

---

## How to read the pair

| Document | Job |
|---|---|
| **Spaces Spec v0.1** | What Spaces is. Dumb substrate. Recognition. Atrophy. Antifragility. Lineage. Adoption candidates. |
| **This file** | What a future Labs app may assume: operations, a minimum thing handle, claim/visibility rules, and what the app must never ask Spaces to do. |

If the two conflict, **v0.1 doctrine wins** until Coach stamps both.

---

## 1. Purpose

Labs applications will be designed as **writers of things** and **entities that recognize**, not as pipelines with addressed handoffs.

This contract exists so that:

- A new app can be specified without inventing a router.  
- An entity charter can be written without a routing table.  
- A first implementation (when Coach stamps BUILD) has a surface small enough to test without becoming a coordinator.

The substrate remains dumb. Intelligence stays in the entities.

---

## 2. Relationship to the inversion

The Wiki inversion (producers drop work; Oscar recognizes) and the Factory pull model (Gemba takes; nothing advances itself) are **entity behaviour**. This contract does not replace them.

What this contract replaces, when adopted: **addressed places** — `to: Oscar`, lane names as destinations, handoff targets baked into producers.

| App act | Against Spaces |
|---|---|
| Produce a document, card, packet, finding | **Write** a thing into a space |
| Attend one's charter | **Read** and **recognize** |
| Hold work | **Claim** (tag; thing stays) |
| Discover it was not yours | **Release** with a return note |
| Know something appeared | **Notify** = presence, not class |
| Tend a crowded space | **Dispose** (authority only) |

---

## 3. What this contract does not give an application

Spaces will not:

- Assign work  
- Route, dispatch, or push to a named agent  
- Adjudicate charter disputes  
- Guarantee that something is attended  
- Interpret a gate's purpose at runtime  
- Enforce a type registry or priority  
- Live-link a child space to a parent after birth  
- Store member identity or live member data for agent use  

If an app needs any of those, it is not using Spaces. It is asking for a coordinator.

---

## 4. Operations (v1)

The substrate exposes exactly these acts. Names are contract names, not an API surface and not a store mapping.

| Op | Promise | Not |
|---|---|---|
| **Write** | A thing appears in **one** named space. Visible to every entity that passes that space's gate. | Address, assign, classify for a consumer |
| **Read** | An observer sees things and their claim tags without taking. | Exclusive lock; destructive consume |
| **Claim** | Tags the thing “held by *X*.” The thing **remains**. Atomic across a **set of things in one space** (all tags land or none). | Cross-space transaction in v1 — **Open Question 3 in v0.1**, candidate below |
| **Release** | The tag drops. Optional **return note**: this is not mine, and why. | Silent drop with no learning path |
| **Attend** | An explicit observable act that the thing is being watched (feeds atrophy). | Page-open; notify-fire; implied interest |
| **Notify-register** | The space will say *something changed here*. Registration **atrophies** unless renewed. | Typed dispatch (“this is a Spec”) |
| **Dispose** | Authority-only. Deliberate. The **only** lossy act. | Scheduler sweep; TTL deletion of atrophied things |

**Atomicity of Claim on a set in one space** remains the only hard mechanical guarantee (Spaces Spec v0.1 §6).

**Candidate (not a ruling) — transaction scope:** v1 atomicity is **one space**. Multi-space atomic claim stays out until Coach answers v0.1 Open Question 3.

---

## 5. Minimum recognizability

Spaces Spec v0.1 §4–5: no schema, no type registry, contents need no template match.

v1 still requires enough that a human who cares, and an entity who cares, can **point at the same object**. That is recognizability, not a JavaSpaces template.

| Handle | Why it exists | What it is not |
|---|---|---|
| **id** | Stable pointer | A type |
| **written_at** | Audit; input to atrophy | A deadline the writer set |
| **origin** | Which internal entity or human wrote it | Member PII; a routing address |
| **body** | Human-engageable text, or a handle a human in that space can open | Machine-only opaque bytes |
| **hints** | Optional words an entity *may* use | Routing rules; ignored by the substrate |

No mandated `type`, `assignee`, `priority`, or `to`.

If a producer cannot write a body someone who cares could engage, it is not a thing (v0.1 §5).

---

## 6. Claims and vitality (contract layer)

Doctrine: claim tags; does not remove. Atrophy is a state, not a deletion. Disposal is separate.

**Open in v0.1 (§16.2, §16.6):** whether claim liveness is atrophy or a surviving lease; what counts as attention.

**Candidates (not rulings):**

1. **Claim liveness is atrophy.** No lease primitive in v1.  
2. **Attention (v1)** is only an observable act on the thing: Claim, Release, Attend, or a Write that references the id. Notify-fire and “had the portal open” do not count.  
3. Atrophy **threshold** is configuration, fail-loud if missing (invariant 2). Configuration is not a lease the holder chose.  
4. When a claim atrophies, the tag lapses; the thing stays; it is visible as atrophied-unclaimed.  
5. Release with a return note is the misclaim path (v0.1 §13.3).

Until Coach stamps 1–2, no packet may implement a lease **or** pretend atrophy is “elapsed time since write.”

---

## 7. Visibility and gates

**Universal access is inside a space the entity can reach.**  
A gate is part of the space's identity at emergence (v0.1 §9). The substrate **enforces** the given gate. It does not interpret why the gate exists.

v1 application rule: do not invent a second access system beside the space gate. Instant Replay / host-surface inheritance is a different program; Spaces does not absorb it.

Member-facing spaces are not in this contract. Agents continue to work only on **synthetic data**, never live member data (v0.1 §12).

---

## 8. Notification

Notify says: **something is here** (or something changed).

It does not say what kind of thing it is, whom it is for, or what to do.

An entity that treats a notify payload as an assignment has left the model.

Registrations of interest atrophy like things (v0.1 §8).

---

## 9. What a future Labs application must specify

When a new Labs app is designed against Spaces, its spec names:

1. **Which space(s)** it writes to and which it attends (hints, not routes).  
2. **What a thing looks like in language** — the body a human in that space can engage — not a private binary protocol.  
3. **Charters** of attending entities: what they will recognize as theirs.  
4. **Portal:** how humans see contents, claim tags, and atrophied things.  
5. **What it will never put on a thing:** `to:`, assignee, a type enum Spaces is asked to enforce.

The app spec does **not** name a handoff target.

---

## 10. First instances (design against, not stamped order)

Carried from v0.1 §15. Order remains **Open Question 8**.

**Wiki (proof that Spaces is right).**  
One producer-shape, one consumer-shape, one signal. Producers write things. Oscar recognizes compilation candidates. Claim tag shows who holds the work. Misclaim returns with reason. Contained failure.

**IKI Factory (proof that Spaces scales).**  
Pull remains entity behaviour (Gemba takes). What would move into Spaces is the **addressed lanes** — places work sits so that entities recognize rather than being told the next lane. Smaller conversion than it first appears.

No other app is a first instance in this document.

---

## 11. Antifragility, as contract

Applications must treat:

| Event | As |
|---|---|
| Atrophied unclaimed thing | Coverage report on the bench — not a delivery failure |
| Misclaim + return note | Charter-boundary report — not an exception to swallow |
| Empty notify that nobody claims | Possible hole — not a prompt to add a router |

Guaranteed delivery is out of contract.

---

## 12. Adoption constraint

Spaces eventually replaces existing coordination mechanisms rather than sitting under them forever (v0.1 §15).

This file adds one constraint for when implementation begins: **do not run Wiki-on-Spaces and Factory-on-Spaces as one first packet.** The proofs answer different questions. Order is Coach's.

---

## 13. Open questions for Coach

Repeats v0.1 where still open. Adds only questions this contract created.

1. **File name and version** for this companion, and whether it stays a sibling or is folded into Spaces Spec as a numbered part.  
2. **Claim liveness vs atrophy** (v0.1 §16.2). Candidate in this file §6.  
3. **Transaction scope** (v0.1 §16.3). Candidate: one space in v1.  
4. **What counts as attention** (v0.1 §16.6). Candidate in this file §6.  
5. **Adoption order** (v0.1 §16.8).  
6. **Minimum handle** — are `id`, `written_at`, `origin`, `body`, optional `hints` acceptable as recognizability, or is even that too much schema?  
7. **Attend as its own op**, or is Claim the only attention that counts?  
8. **Authority over a space** (v0.1 §16.7) — still required before Dispose and portals can be implemented.  
9. **Thing lineage** (v0.1 §16.4) — out of this contract until answered.  
10. **Remaining JavaSpaces primitives to walk** (v0.1 §16.5) — out of this contract until named.

Everything in Spaces Spec v0.1 that Coach already ruled remains law.

---

## 14. What this document does not contain

- No storage model, Redis, Linda API, or HTTP surface.  
- No agent assignments, seeds, or benches.  
- No default for cache location, Time Machine, or any other program.  
- No type system.  
- No paper. Related work stays out; the doctrine file already states lineage.  
- Nothing from Spaces Spec v0.1 has been removed.

---

## 15. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-08-27 | Companion mechanical contract. Operations, minimum handle, claim/atrophy candidates, app design rules. Doctrine remains Spaces Spec v0.1. Not BUILD. |

**One-line law:**  
**Applications write things and recognize; Spaces holds, tags, notifies presence, and is atomic on a claim-set in one space; it never routes, never assigns, and never deletes except by a deliberate Dispose.**
