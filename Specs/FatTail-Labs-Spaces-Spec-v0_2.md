# FatTail Labs — Spaces Specification

**Version:** v0.2 (filename and version still Coach's to name — see §16.1)
**Status:** Draft for Coach. Not stamped. No seeds, no gates.
**Changes in v0.2:** the two contradictions and the ambiguities raised on v0.1 are closed in the body rather than left as opens — claim liveness, notification payload, gate-before-universal-access, and a **minimum recognizability floor** written as *implementation*, not as constitution. §18 is new: it names the seven rulings Coach must make for a mechanical contract to be built, with a written position on each. **Nothing here is an API, an op set, or a store.**
**Author:** External advisor draft, from Coach's rulings in the walk-and-talk session of 2026-08-26.

---

## Scope statement

**Active program:** Spaces (new program).
**Files/trees touched by this document:** none. This is a specification document only. No code, no repo trees, no migrations, no configuration.
**Touches outside program:** NONE.

This document records decisions Coach made verbally. Where a dimension was not directed, it appears in §16 as an open question rather than as a written position. Nothing in this document is a default standing in for a ruling.

---

## 1. Purpose and origin

Spaces is a shared coordination substrate for the entities that build and run FatTail Labs — agents and humans alike. It is intended as the glue for development going forward, not as a feature of any one suite.

The origin is an inversion Coach observed in the Wiki program. Previously every producer wrote to a Wiki interface and had to know that interface's shape. Now the interface is an agent: producers drop what they have into a queue, and Oscar picks it up and works it. Nothing is required of the source system. This is the same shape as the polling-watermark decision, and Coach has ruled it the model for all new development.

Spaces takes that inversion further. Rather than pipelines with handoffs built into each agent, entities write things out and other entities recognize and take them in. Nobody addresses anybody. There is no routing table and no handoff target.

**Lineage.** The direct antecedent is JavaSpaces and Jini, and behind those, Linda (Gelernter, 1985) and the blackboard architectures descending from Hearsay-II. Coach worked with James Gosling at Sun and proposed a JavaSpaces-based architecture at Liberty Mutual during the merger of an industrial-property secondary insurer; it was overruled as too risky in favour of point-to-point integration. He built it on his own time and demonstrated it worked. The name **Spaces** is deliberate homage, taken up in a new light, and it names the plurality honestly.

The advance over the antecedents is stated in §4: the endpoints can now reason.

---

## 2. The frame

Everything held in Spaces is present to everyone who can reach it. Nothing is pushed. Each entity attends to what it judges falls under its charter.

**Universal access, selective attention.** An entity's interests are what make it useful. Two entities looking at the same space see the same contents and take different things from it, and that is the intended behaviour, not a deficiency to be corrected by assignment.

**Universal means universal inside a space you can reach.** A gate (§9) decides reach. This is not an exception bolted onto the frame — it is what the frame has always meant, and it is stated here so the gate is not read later as a contradiction of it. Within a space you can reach, nothing is hidden and nothing is withheld; whether you can reach a space at all is the creator's declaration at emergence.

---

## 3. What the substrate is, and what it is not

Spaces is a dumb substrate. It holds, it matches, it carries what it was given. **It never adjudicates.**

It is not an entity. It has no judgment, no preferences, and no soul. A substrate with judgment would be a coordinator wearing a mystical name. All intelligence lives in the entities attending it. This is precisely what makes it trustworthy: it cannot play favourites.

The substrate makes exactly one hard mechanical promise — atomicity of a transaction (§6). Everything else in the model is decay and judgment.

**Pull is not a property of Spaces.** Taking is entity behaviour. The substrate does not push, deliver, assign, or dispatch. When an entity pulls, that is the entity's choice, expressed through the substrate rather than performed by it.

---

## 4. Recognition replaces routing

Nothing in Spaces is addressed to anyone.

An entity reads a thing and reasons about whether it is theirs. **This is recognition in the true sense of the word** — a reasoned look at a thing, concluding "that's part of my charter." It is not structural matching, not formal-to-actual template matching, not a schema check.

This is the substantive advance over JavaSpaces. Rigid tuple shapes existed because the endpoints could not reason and needed a mechanical basis for matching. The endpoints can now reason. Therefore **contents need no schema.**

**Hints, not routing rules.** An entity may be told "probably this space or that one; you might want to monitor them." Hints are advisory. If the thing is elsewhere, the entity goes looking and nothing breaks. Persistent unhinted monitoring — an entity repeatedly attending a space nobody suggested to it — is the signal that a boundary is real.

---

## 5. Things

A thing held in a space may be anything: a thought, a physical thing, a document, a mechanism, a tool, a philosophy.

**One obligation: it must be recognizable to those who care.** It need not be recognizable by everybody. Something unrecognizable to you is evidence it isn't yours.

Within that obligation, a thing must be engageable in a language a human can engage in. Machine-only serialized payloads that no human could read are excluded — but the audience for legibility is those who care, not the world.

There is no schema, no mandated field set, and no registration of types.

**A minimum handle, written as implementation and not as constitution.** Something must identify a thing well enough to claim it, refer to it, or notice it has gone unattended — zero fields cannot be built. So v1 carries an **id**, a **written_at**, an **origin**, a **body**, and optional **hints**.

That set is **v1's answer to the obligation, not a replacement for it.** The law is and remains: *recognizable to those who care, engageable in a language a human can engage in.* If the handle proves too thin or too fat, it changes; the obligation does not. Nothing measures a thing against the field set — it is measured against the obligation.

**One field needs watching. `origin` is provenance, never an address.** A thing that records who wrote it is a short step from a thing directed at someone, and that is precisely the property Spaces exists to remove. It may be read to understand where something came from. It may not be used to route, to filter by sender as a substitute for recognition, or to imply an intended recipient. If `origin` ever starts deciding who acts, the coordinator has returned.

---

## 6. Claims and transactions

**A claim tags a thing; it does not remove it.** The thing stays in the space, now showing who holds it. Nothing vanishes, so the space is auditable by inspection: it always shows who holds what.

**A claim carries its own liveness, and that liveness is attention — not a lease.** If the holder stops attending, the claim atrophies exactly as anything else does, and the work becomes available again. Nobody has to detect the failure, and nobody sets a deadline in advance.

*(v0.1 described this liveness as a lease in one place and replaced leases with atrophy in the next section. The two cannot both hold: a lease is a duration someone guessed, and it expires whether or not the work is alive. **Atrophy is the answer and no lease survives in v1.** The contradiction is closed here rather than carried as an open.)*

**Transactions.** An entity may claim a set of things as one act. Either all the tags land or none do. This is a substrate responsibility, not an entity responsibility: atomicity is mechanical and requires no judgment, so it does not compromise the dumb substrate.

Placing it in the substrate removes two problems. There is no window in which a partial claim is visible and could be misread as work in progress, and no entity has to reimplement rollback.

This is the only hard mechanical guarantee Spaces makes.

---

## 7. Vitality: atrophy and disposal

**Unattended things atrophy.** This is decay, not a timer someone set. No garbage-collection policy is required, because relevance is self-evidencing.

Atrophy is a difference in kind from a lease. A lease is a deadline set by someone in advance, and it expires whether or not the work is alive. Atrophy tracks actual attention: work being actively attended does not decay.

**Atrophy is a state, not a deletion.** Atrophied things remain visible.

**Disposal is a separate, deliberate act** by someone who judges that a space has become unmanageable and chooses to tend it. Nothing self-destructs. No scheduler sweeps.

---

## 8. Notification and attention

Notification is retained from JavaSpaces. Without it, attending means polling.

It does not compromise the dumb substrate, because of what it says: the space says *something is here*. The entity decides *whether it's mine*.

**What a notification may carry is therefore bounded: existence, and where.** It must not carry a classification — not a type, not a category, not a suggested recipient. A notify that says *a Spec arrived* has recognized on the entity's behalf, and routing has come back through the side door wearing a smaller name. The entity is told that the space changed; it goes and looks.

**Registrations of interest atrophy the same way things do.** Attention must be renewed to stay real. Nothing persists by default.

---

## 9. Spaces themselves

A space has identity and properties. It lives somewhere. Its contents are recognizable. It has attendants who watch and act.

**Emergence.** Spaces may emerge on demand rather than being pre-declared. Create generic spaces and let them evolve. Specialization is not prescribed up front — rigid architecture was compensation for brainless components. A space's properties follow the material it holds: FDA food-ready bins belong in the cafeteria, not on the assembly line, and you learn that from the material, not from a diagram drawn in advance.

**Gates.** Whoever creates a space may intentionally gate it, for any reason they judge necessary. The gate is part of the space's identity, declared at emergence. The space merely enforces what it was given; there is no runtime interpretation of a gate.

**Portals.** A space must have visible, accessible portals through which participants see and act. A space may be built to ensure that certain participants have visibility. **Portals may be added to a living space by whoever holds authority over it** — consistent with authority acting on live spaces while the substrate merely carries out what it was given.

---

## 10. Lineage

Spaces have genealogy. A new space inherits its parent's properties, gate included, unless overridden. Specialized bins are therefore never designed from scratch, and **the diff is the specification.**

**Inheritance happens at birth only.** Lineage is a record of descent, not a live link. A space's life cycle is independent of its birth. A change to a parent does not propagate to a living child, so there is no in-flight disruption to reason about.

A space may have more than one parent, resolved at the moment of creation.

Two good parents can produce two children, one of them a fine reflection of the parents and one of them not. Both are still individuals. Descent explains where a space came from; it does not govern what it becomes.

---

## 11. Conflict

Where inherited or declared properties conflict, **the mechanism does not resolve it.** The conflict sits there, legible, until whoever holds authority over that space rules.

Conflict is an escalation, not a precedence rule. The substrate never adjudicates.

---

## 12. Privacy and data

There is no internal privacy model, because Coach sees no reason an internal agent would need to keep things private from other internal agents.

Member data is governed by the existing platform rule and is not relitigated here: **Grok and other agents work only on synthetic data, never live data.**

---

## 13. Antifragility

Two properties of this model look like weaknesses. Coach's position is that they are the only path to antifragility, and this specification adopts that position.

**Recognition is fallible.** An entity reasoning about whether something falls under its charter can be wrong in both directions — missing work that is its own, or claiming work that is not. Deterministic matching either fires or does not, and fails the same way forever. Recognition that can be wrong can also learn. A claim taken in error is information about a charter boundary.

**Starvation is possible.** Nothing in the model guarantees a thing is attended to at all. If no entity recognizes it, it atrophies. That is honest signalling: a thing nobody recognizes is telling you the bench has a hole. Guaranteed delivery would hide the hole by forcing something to take it.

Both stressors must be visible and survivable. Three commitments make that binding:

1. **Stressors are named as signals, not errors.** An atrophied thing is a coverage report on the bench. A misclaim is a report on a charter boundary. Neither is logged as a failure.
2. **Disposal is the only lossy act, and it must be deliberate** (§7). As long as nothing is swept automatically, every stressor remains available to be learned from.
3. **A misclaim carries a return path.** An entity that takes a thing and then recognizes it is not theirs releases it *with what it learned* — this isn't mine, and here is why. Recognition error then does not merely fail visibly; it improves the next recognition.

The first two are framing of decisions already made. The third is a real mechanism, and it is small.

---

## 14. Method: re-expressing the old primitives

The working method for the remainder of this specification is to take each rigid structure from the antecedent model, state what it solved, and name what an entity decides instead. In every case something the substrate enforced becomes something an entity judges.

Settled so far:

| Old primitive | What it solved | What replaces it |
|---|---|---|
| Template shape | Matching without reasoning | Charter recognition (§4) |
| Lease timeout | Detecting abandoned work | Atrophy; an agent noticing a stalled claim (§6, §7) |
| Space partitioning | Deciding where a thing belongs | Hints, and emergent specialization (§4, §9) |
| Notify | Avoiding polling | Notification retained; attention is the entity's (§8) |
| Take (destructive read) | Preventing double work | Claim as a tag, not a removal (§6) |
| Transaction | Atomic multi-item claim | Retained in the substrate, unchanged in kind (§6) |

JavaSpaces is scaffolding for the shape, not a thing to inherit. Once the shape holds, the scaffold is discarded. The remaining primitives are walked one by one (Open Question 5).

---

## 15. Adoption

Spaces eventually replaces the existing coordination mechanisms rather than sitting underneath them permanently. Coach has not fixed the order; the two candidates carry different value.

**The Wiki** is a single producer and a single consumer with one signal. It is a clean first proof that the substrate works, and the risk if it does not is contained. The Wiki proves whether Spaces is *right*.

**The IKI Factory** is the larger test. Note the correction recorded in §3: the Factory's pull model is already entity behaviour and is not a mechanism to be replaced. What Spaces would replace is the lanes — the addressed places where work sits — with spaces that entities recognize things in. The conversion is therefore smaller than it first appears. The Factory proves whether Spaces *scales*.

No order is stamped in this document.

---

## 16. Open questions for Coach

1. **File name and version.** Still Coach's to name.
2. **CLOSED in v0.2.** Claim liveness is attention; no lease survives. §6.
3. **Transaction scope.** Does an atomic claim span multiple spaces, or only things within one space? *Position: one space in v1 — see §18.3.*
4. **A thing's own lineage.** Spaces have genealogy. Does a thing held in a space have descent in the same way? Raised in the session, not answered.
5. **Remaining primitives.** Which antecedent primitives are still to be walked under §14, and in what order.
6. **What counts as attention** for the purposes of atrophy (§7). Undirected. The answer determines whether atrophy is a real signal or a proxy for elapsed time.
7. **Authority over a space.** The creator sets the gate (§9) and an authority-holder may add portals. Whether authority is fixed to the creator, transferable, or plural, is undirected.
8. **Adoption order** (§15).

---

## 18. The seven rulings a mechanical contract needs

A contract that can be built requires these, and none of them is the advisor's to make. Each carries a written position so nothing is a blank.

1. **Claim liveness.** *Position, and closed in the body: atrophy. No lease in v1.* A lease is the primitive this doctrine retired; reintroducing it for claims alone would make the exception the engine.

2. **What counts as attention.** Without an answer, atrophy is a timer with a better name — which is the failure this whole model exists to avoid. *Position: an **observable act on the thing** — a claim, a release, an explicit attend, or a write that references its id.* Not opening a page, not a notification firing. Both of those are things happening *near* a thing rather than *to* it, and counting them would let attention accrue without anyone attending.

3. **Transaction scope.** *Position: one space in v1.* Cross-space atomicity is a distributed transaction, which is a different engineering problem and a later extension. One-space atomicity is a local guarantee and it is the only honest promise a v1 substrate can make.

4. **The minimum handle.** *Position: id, written_at, origin, body, hints optional — as v1 implementation, per §5.* No type, no assignee, no recipient. The obligation in §5 remains the law and the handle is measured against it, never the reverse.

5. **Adoption order.** *Position: Wiki first.* One producer, one consumer, one signal — it proves whether Spaces is **right**, with contained risk if it is not. The Factory proves whether it **scales**, and it is the larger surface. One first instance, not both.

6. **Authority over a space.** Who may dispose and who may add portals. Disposal is the only lossy act in the model, so this is the one place authority has teeth. *Position: the creator, transferable by an explicit act, not plural in v1.* Plural authority over a lossy act needs a conflict rule, and §11 deliberately has none.

7. **How the pair is law.** Whether this doctrine and a mechanical contract are two documents or one, and which version string an implementation cites. *Position: two files, doctrine as parent — if they ever conflict, doctrine wins until Coach amends it.*

**Two of these are more genuinely Coach's than the rest.** The **handle** (4), because it turns an obligation into fields and that is where an advisor most easily writes a decision that was never made. And whether **attend is its own operation** or a claim is the only attention that counts — which changes the op set, and follows directly from how (2) is answered.

The remaining five are mechanical consequences of doctrine already ruled, and a position on each is written above.

---

## 17. What this document does not contain

- No implementation design, storage model, transport, or API surface. None was directed. **The store is a later packet and must not jump the queue** — the contract is what gets built first, and India names a store against it afterward.
- No op set. §18 names what a contract needs ruled; it does not write one.
- No agent assignments and no seeds.
- The ancillary doctrine note on the queue-and-agent inversion remains a separate pending artifact; §1 records the inversion as the origin of Spaces but does not stand in for that note.
- Nothing of Coach's from the session has been removed, de-scoped, or parked. The one place where an earlier statement and a later one do not sit flush is raised as Open Question 2 rather than resolved here.
