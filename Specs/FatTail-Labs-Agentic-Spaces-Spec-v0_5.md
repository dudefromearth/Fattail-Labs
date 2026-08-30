# Agentic Spaces by FatTail Labs --- Specification

**Version:** v0.5 --- restoration pass on the candidate\
**Parent doctrine:** v0.4 --- frozen\
**Status:** Not stamped. No seeds, no gates.\
**Program:** Spaces\
**Repository:** Space Lab

> **Rewrite note.** This candidate preserves the rulings and intent of
> v0.4 while making several principles explicit that were implicit or
> developed in the subsequent discussion: the boundary between substrate
> and judgment; bounded epistemic risk; exposure; stress versus failure;
> non-rescue; charter recognition; earned structure; authority versus
> truth; the separation of Agent OS from Spaces; and falsification
> criteria. Where this draft goes beyond v0.4, it does so as a proposal
> for Coach to accept, reject, or alter---not as an already-made ruling.

> **Restoration note (v0.5).** The candidate rewrite silently dropped
> three pieces of Coach's own material, and Coach's doctrine is that
> none of his ideas is removed without his word. All three are restored
> here, in his words, and each carries reasoning the surrounding law
> otherwise asserts without support:
>
> - **The Gosling and Liberty Mutual origin** (§1). This lineage is not
>   biography. It is why the architecture is not a paper exercise: it
>   was proposed against real opposition, overruled, built anyway, and
>   demonstrated to work.
> - **The cafeteria** (§10.2). FDA food-ready bins belong in the
>   cafeteria, not on the assembly line. It is the argument for why
>   specialization is observed rather than designed, and §10.2 states
>   that rule without it.
> - **The two children** (§11). It is the argument for why lineage is
>   descent and not a live link. §11 asserts the rule; this is where the
>   rule comes from.
>
> One narrower correction: **privacy immutability** (§10.4) is tightened
> from "does not silently mutate" to *does not change*, since the weaker
> wording permits a non-silent change that Coach's ruling does not.

## Scope statement

Agentic Spaces by FatTail Labs is a shared coordination substrate for
the entities that build and run FatTail Labs---agents and humans alike.

This document is doctrine. It defines the laws under which Spaces
exists. It does not define a storage model, transport, API,
implementation language, or instance-specific operation set. Those
belong to mechanical contracts and instance specifications beneath this
doctrine.

The governing architectural law is:

> **The substrate provides conditions; entities provide judgment.**

A mechanism belongs in Spaces only when the environment itself must
guarantee it. A judgment that a competent entity can make belongs to the
entity.

Spaces may provide identity, persistence, atomicity, visibility, access
boundaries, authority, and deliberate loss semantics. It does not decide
relevance, destination, priority, responsibility, specialization,
sequencing, correctness, or what should happen next.

------------------------------------------------------------------------

## 1. Purpose and origin

Spaces is intended as the coordination substrate for development going
forward, not as a feature of any one suite.

The name is deliberate on both halves. **Spaces** is homage to
JavaSpaces. **Agentic** is what changed.

The direct antecedent is JavaSpaces and Jini, and behind those Linda
(Gelernter, 1985) and the blackboard architectures descending from
Hearsay-II. Those systems provided much of the environmental shape:
shared things, decoupled participants, associative access, and
coordination through a common medium.

**The lineage is lived, not read.** Coach worked with James Gosling at
Sun. He proposed a JavaSpaces-based architecture at Liberty Mutual
during the merger of an industrial-property secondary insurer; it was
overruled as too risky in favour of point-to-point integration. He built
it on his own time and demonstrated it worked.

That history is load-bearing rather than decorative. The objection this
architecture meets is not new to it, and the answer is not theoretical.
**Spaces** is deliberate homage, taken up in a new light, and the plural
names the plurality honestly.

Their endpoints could not reason sufficiently about meaning. Structure
therefore had to carry judgments the participants could not make: tuple
templates, leases, partitions, routing conventions, destructive takes,
and other mechanical proxies for cognition.

The endpoints can now reason.

That is the discontinuity.

The immediate origin inside FatTail Labs was an inversion observed in
the Wiki program. Previously, every producer wrote to a Wiki interface
and therefore had to know the interface's shape. Once the interface
became an agent, producers could leave what they had and Oscar could
recognize and work it. The source system no longer needed to know the
consumer.

Spaces takes that inversion to its conclusion:

> **Entities write things into a shared environment. Other entities
> recognize what concerns them and act. Nobody addresses anybody.**

There is no routing table and no handoff target.

Traditional architecture encodes anticipated coordination into the
system. Agentic architecture creates conditions in which reasoning
entities discover and continuously reorganize coordination for
themselves.

------------------------------------------------------------------------

## 2. The frame

Everything held in a space is present to everyone who can reach that
space. Nothing is pushed.

Each entity attends to what it judges falls under its charter.

**Universal access, selective attention.**

Universal means universal within a space the entity can reach. Gates and
privacy govern whether the space can be reached and what can be seen.
Within those boundaries, the substrate does not selectively conceal
things according to what it believes an entity should care about.

Two entities looking at the same space may see the same contents and
take different things from it. That is intended behavior. Difference in
recognition is not a deficiency to be corrected by assignment.

Humans participate under the same coordination law. A human may attend,
recognize, claim, release, create, and tend just as an agent may,
subject to the same space boundaries and authority. A human may hold
powers that an agent does not, but those are declared boundaries, not a
separate coordination mechanism.

------------------------------------------------------------------------

## 3. The substrate and the epistemic boundary

Spaces is a dumb substrate.

It holds. It persists. It exposes. It records acts. It enforces the
mechanical properties it was given. It never adjudicates meaning.

It is not an entity. It has no charter, judgment, preference, worldview,
or soul. A substrate with judgment is a coordinator wearing another
name.

All interpretation belongs to entities.

The substrate therefore distinguishes **physics** from **cognition**.

Physics is what must remain true regardless of who is reasoning: a claim
either lands atomically or it does not; a gate is enforced as declared;
a thing is not silently destroyed; authority is held by someone; an act
that occurred remains observable according to the space's visibility.

Cognition is what an entity must judge: whether something matters,
whether it is theirs, what it means, what should happen next, whether
another entity is mistaken, whether a space is sick, whether a new
boundary has emerged, or whether intervention is warranted.

> **Spaces carries evidence; entities form judgments.**

Spaces reports conditions, not causes.

Spaces also makes no claim about **how** an entity reasons. An entity
may have a charter, memory, an Agent OS, a parliament, tools, habits,
rights, or mechanisms not yet imagined. Those are properties of the
entity architecture, not of Spaces.

Spaces observes only the acts by which reasoning enters the shared
environment.

------------------------------------------------------------------------

## 4. Bounded epistemic risk

Agentic exchange requires exposure to uncertainty.

Spaces does not guarantee correct recognition, successful claims,
complete attendance, freedom from contention, or that every thing will
be taken.

Those possibilities are not defects accidentally left in the system.
Removing them would remove the information from which an agentic
organization learns.

> **The substrate may bound the cost of epistemic risk. It must not
> assume the risk on behalf of the entity.**

An entity must be capable of being wrong.

It may claim what is not its own. It may fail to recognize what is. Two
entities may contend for the same thing. A thing may starve. A space may
accumulate evidence that its present organization no longer fits what
enters it.

The consequences must be survivable, visible, and available to learn
from.

This is the distinction between **risk** and recklessness. Spaces does
not seek damage. It preserves enough consequence that judgment
encounters reality.

### 4.1 Exposure

**Exposure** is the consequence-bearing encounter between judgment and
uncertainty.

Recognition becomes organizationally meaningful when an entity acts on
it and exposes that judgment to consequence.

A claim is one form of exposure. A release after a mistaken claim
records that exposure. A thing that remains unclaimed exposes the
collective limits of recognition in the space.

If a mechanism guarantees the outcome before the entity's judgment can
be wrong, the mechanism---not the entity---has performed the
coordination.

### 4.2 Stress and failure

A stressor is not automatically a failure.

A misclaim, starvation, contention, disagreement, or partial hold may be
a stress from which the ecology learns.

For this doctrine:

> **Stress is an adverse, uncertain, or incorrect outcome whose evidence
> survives. Failure is the inability to survive or learn from the
> stress.**

A wrong judgment can therefore be a successful agentic interaction if
its consequence remains legible and changes future capacity.

------------------------------------------------------------------------

## 5. Recognition replaces routing

Nothing in Spaces is addressed to anyone.

An entity encounters a thing and reasons about whether it is theirs.
This is recognition in the true sense: a reasoned judgment that a thing
falls within the entity's field of responsibility.

It is not structural matching, formal-to-actual template matching, a
schema check, a type switch, or a disguised routing predicate.

### 5.1 Charters

A charter is an entity's declared field of responsibility and basis for
recognition.

A charter does **not** enumerate the things the entity will take.

The substrate does not execute a charter. The entity interprets it.

If a charter becomes machine-executable routing logic, recognition has
been replaced by addressing and the coordinator has returned.

### 5.2 Hints

Hints are permitted. Routing is not.

An entity may be told that a space is probably worth attending. A thing
may carry hints about where it might be useful. Hints are advisory and
may be wrong.

If the thing is elsewhere, an entity may go looking and nothing breaks.

Persistent unhinted attendance---an entity repeatedly attending a space
nobody suggested to it---is evidence that an organizational boundary may
be emerging.

------------------------------------------------------------------------

## 6. Things

A thing held in a space may be anything: a thought, a physical thing, a
document, a mechanism, a tool, a philosophy, a question, a claim, or
something not anticipated when the space was created.

One obligation governs things:

> **A thing must be recognizable to those who care and engageable in a
> language a human can engage in.**

It need not be recognizable by everybody. Something unrecognizable to an
entity is evidence that it may not be that entity's concern.

There is no constitutional schema, mandated type system, or registration
of meanings.

### 6.1 The v1 handle

A mechanical implementation needs enough identity to refer to a thing.
The v1 handle therefore carries:

-   `id`
-   `written_at`
-   `origin`
-   `body`
-   optional `hints`

This is implementation, not constitution. The handle is measured against
recognizability; recognizability is not measured against the handle.

`origin` is provenance, never an address. It may be used to understand
where a thing came from. It may not become a sender-based substitute for
recognition or imply an intended recipient.

If origin begins deciding who acts, routing has returned.

------------------------------------------------------------------------

## 7. Claims and transactions

A claim tags a thing. It does not remove it.

The thing remains in the space and shows who holds it. The space
therefore remains auditable by inspection.

A claim is an exposed judgment: an entity has acted on its recognition.

### 7.1 Claim liveness

A claim's liveness is attention, not a lease.

If the holder stops attending, the claim atrophies as anything else does
and the thing becomes available again.

No duration is guessed in advance. No scheduler decides that living work
has expired merely because a clock ran out.

### 7.2 Release

An entity may release a claim.

When an entity claims something and later recognizes that the thing is
not its concern, release should carry what was learned: *this is not
mine, and here is why.*

The note is evidence, not adjudication. The substrate stores it and
understands none of it.

A misclaim therefore need not merely disappear. It can improve future
recognition.

### 7.3 Transactions

An entity may claim a set of things as one act. Either all claim tags
land or none do.

In v1, transaction scope is one space.

Cross-space atomicity is a distributed transaction and brings a
different coordination problem through the floor. Work requiring things
from multiple spaces claims in each separately. A moment in which an
entity holds one and not another is a visible state, not corruption.

Atomicity is mechanical and requires no judgment. It therefore belongs
in the substrate.

This is the one hard mechanical guarantee Spaces makes.

------------------------------------------------------------------------

## 8. Vitality: attention, atrophy, and disposal

Unattended things atrophy.

Atrophy is decay, not a timer somebody set.

Atrophy tracks diminished attention to a thing among the parties
organized around its space.

Two dimensions matter:

**Communal in who attends.** The signal is not one entity's silence but
the attention of the parties organized around the space.

**Singular in what is attended.** Attention is per thing, never merely
per space. A busy space can contain a neglected thing.

That is a sharper signal than an idle-space metric. A neglected thing
inside an active space says that participants were present and none
recognized or sustained attention to it.

### 8.1 Observable attention in v1

V1 detects attention through an observable act on the thing:

-   claim;
-   release;
-   explicit attend;
-   a write referencing the thing's `id`.

Opening a page that happens to list the thing does not count. A
notification firing does not count. Those are events near the thing, not
acts upon it.

These acts are implementation, not constitution. The law is diminished
attention to the thing.

### 8.2 Atrophy is deliberately diagnostic, not explanatory

Atrophy is a state, not a diagnosis.

Spaces does not decide whether a thing atrophied because nobody saw it,
nobody understood it, everyone declined it, the relevant entity was
overloaded, or the organization lacks the needed competence.

> **Spaces reports the condition. Entities investigate the cause.**

Atrophied things remain visible.

### 8.3 Disposal

Disposal is separate and deliberate.

Nothing self-destructs. No scheduler sweeps. Disposal is the only lossy
act in the model and therefore requires authority.

The persistence of stressors is what keeps them available to learning.

------------------------------------------------------------------------

## 9. Notification

Notification is retained because without it attendance collapses into
polling.

Notification does not compromise the dumb substrate because of what it
says:

> **Something is here.**

The entity decides whether it is mine.

A notification may carry existence and location. It must not carry a
classification, type, category, suggested recipient, priority, or
interpretation that performs recognition on the entity's behalf.

Registrations of interest atrophy as things do. Attention must be
renewed to remain real.

Nothing persists merely because it once mattered.

------------------------------------------------------------------------

## 10. Spaces themselves

A space has identity and properties. It lives somewhere. Its contents
are recognizable. It has entities that attend, watch, and act.

### 10.1 Emergence and birth

The **need** for a space may emerge rather than being architected in
advance.

That does not mean the substrate autonomously invents organizational
boundaries.

An entity recognizes that a useful boundary has emerged and deliberately
births a space under the authority rules.

The distinction is:

**emergent need; deliberate birth.**

Generic spaces may therefore specialize through lived use rather than
through a diagram drawn in advance.

### 10.2 Earned structure

> **Structure should be observed before it is declared.**

Repeated recognition, attendance, contention, starvation, and
concentration of particular kinds of material are evidence of
organization.

**A space's properties follow the material it holds.** FDA food-ready
bins belong in the cafeteria, not on the assembly line --- and you learn
that from the material, not from a diagram drawn in advance. Rigid
architecture was compensation for brainless components; create generic
spaces and let them evolve.

The evidence may eventually lead an entity to create a new space, change
attendance, widen a charter, split a space, or take some other action.

The substrate never turns an observed pattern into a hidden routing
rule.

Specialization is earned through use.

### 10.3 Gates

Whoever creates a space may intentionally gate it for reasons they judge
necessary.

The gate is part of the space's identity, declared at birth. The
substrate enforces what it was given and does not reinterpret it at
runtime.

### 10.4 Privacy

A space carries a privacy property declared at birth. It governs
visibility of the things the space holds.

Privacy may have levels: open; visible but not claimable; existence
known but contents hidden; opaque.

Like the gate, privacy is **declared at birth**, inherits at birth
unless overridden, and **does not change afterward** --- not silently,
and not by an authority acting on a living space. A thing visible
yesterday and hidden today would leave a hole in the record that nobody
outside could see, which is the one loss this doctrine does not permit
(§8.3: disposal is the only lossy act, and it is deliberate and
attributed).

A private space can decay without outsiders seeing the aggregate signal.
That is not an exception. Tending a private space is the duty of those
with authority and visibility.

### 10.5 Authority

Exactly one entity holds authority over a space at any moment.

The creator holds authority at birth.

Authority may be **delegated** in named powers without transferring the
holding. A delegate has only the acts explicitly granted. Delegation is
revocable by the holder and does not survive transfer unless newly
granted.

Authority may be **transferred**. The holding moves and remains
singular.

Single holding gives unresolved conflict somewhere to terminate and
prevents a space from becoming ownerless.

But:

> **Authority governs the space. It does not confer authority over
> truth.**

The holder may tend the space, delegate, transfer, dispose, and manage
portals or other powers defined by the instance. Holding the space does
not make the holder's interpretation of its contents epistemically
privileged.

### 10.6 Portals

A space must have visible, accessible portals through which authorized
participants can see and act.

Portals may be added to a living space by its authority according to the
mechanical contract.

------------------------------------------------------------------------

## 11. Lineage

Spaces have genealogy.

A new space inherits its parent's properties, including its gate and
privacy, unless overridden at birth.

Inheritance happens at birth only. Lineage is a record of descent, not a
live dependency.

A parent changing does not mutate a living child.

A space may have more than one parent, with conflicts resolved at
creation.

Two good parents can produce two children --- one a shit asshole and one
a fine reflection of the parents --- and **both are still individuals.**
Descent explains where a space came from; it does not govern what the
space becomes.

This principle is intentional:

> **Identity is not fully specified by origin.**

A living space acquires its character through what happens within it.

Whether things themselves have equivalent lineage remains open.

------------------------------------------------------------------------

## 12. Conflict and contention

Where inherited or declared properties conflict, the substrate does not
resolve them.

Conflict remains legible until the entity holding authority rules.

Conflict is escalation, not precedence.

### 12.1 Contention

Contention among entities is not merely tolerated.

Two entities claiming or repeatedly recognizing overlapping material is
evidence about the emerging organization. It may indicate overlapping
charters, healthy redundancy, complementary competence, poor boundaries,
or something else.

Spaces does not decide which.

> **Contention is evidence of organizational structure emerging. It is
> neither prevented nor interpreted by the substrate.**

------------------------------------------------------------------------

## 13. Privacy, entities, and data

Privacy belongs primarily to spaces and declared boundaries, not to
personalities.

The intended organizational law is:

> **Entities possess no inherent right to conceal organizational
> knowledge merely by virtue of being entities. Visibility restrictions
> are conferred by spaces and boundaries, not by identity alone.**

This does not require every byte of an entity's internal machinery to be
exposed through Spaces. Private working state, credentials, protected
data, cognitive internals, or future Agent OS state are questions for
the entity and security architectures.

Spaces does not become an introspection mechanism into an entity.

Member data remains governed by existing platform law and is not
relitigated here. Agents operate on synthetic rather than live member
data where that rule applies.

------------------------------------------------------------------------

## 14. Antifragility

Antifragility is not a claim that risk is good by itself.

For Spaces:

> **A system tends toward antifragility when surviving disorder
> increases its capacity to encounter future disorder. A system tends
> toward decay when its response to disorder makes it more dependent on
> protection from future disorder.**

There is no useful neutral in architectural direction. A mechanism
either preserves or increases the capacity to learn through future
stress, or it moves toward brittleness and protection from stress.

Recognition is fallible. An entity can miss work that is its own or
claim work that is not.

Deterministic matching can fail the same way indefinitely. Fallible
recognition can encounter consequence and learn.

Starvation is possible. Nothing guarantees that a thing will be attended
to. Guaranteed delivery would hide a hole in recognition by forcing
something to take the work.

These are load-bearing properties.

### 14.1 Signals

One starved thing is evidence of a recognition hole. Someone's scope may
need to widen, a new attendee may need to arrive, or the thing may
reveal a kind of work the present organization cannot yet recognize.

A rising count of starved things in one space is a different signal. It
indicts the organization of the space: its gate, attendance, population
of charters, policy, or the fit between the space and the things
entering it may have drifted.

The answer is not mechanically prescribed. An entity may tend the space,
revisit attendance, split it, alter a charter elsewhere, or dispose.

### 14.2 Survivability

Stressors must remain visible and survivable.

A misclaim should not require a mechanism that makes future misclaims
impossible. It should produce evidence capable of improving recognition.

An atrophied thing should not trigger automatic rescue. It should remain
available for an entity to notice and judge.

Disposal is deliberate so evidence is not silently erased.

### 14.3 Non-rescue

> **The substrate does not rescue an entity or a space from the
> consequences of unattended work, misrecognition, contention, or poor
> organization.**

No automatic reassignment. No dead-letter recipient. No automatic
escalation to the "right" entity. No smart retry that performs
recognition on behalf of participants.

Rescue may occur. It must be an act of an entity exercising judgment.

The design test is:

> **Does a mechanism make failure survivable, or does it make failure
> less possible?**

The former may strengthen Spaces. The latter requires suspicion.

------------------------------------------------------------------------

## 15. Method: re-expressing old primitives

The method is to take each rigid structure from the antecedent
architecture, state the problem it solved, and ask whether that problem
is now something a reasoning entity can judge.

Where judgment can move to the entity without violating environmental
physics, it should.

  -----------------------------------------------------------------------
  Old primitive           What it solved          Agentic replacement
  ----------------------- ----------------------- -----------------------
  Template shape          Matching without        Charter recognition
                          reasoning               

  Lease timeout           Detecting abandoned     Atrophy; entities
                          work                    notice stalled claims

  Space partitioning      Deciding where a thing  Hints; earned
                          belongs                 specialization

  Notify                  Avoiding polling        Notification retained;
                                                  interpretation belongs
                                                  to entity

  Destructive take        Preventing double work  Visible claim tag

  Transaction             Atomic multi-item claim Retained within one
                                                  space

  Routing / assignee      Choosing who should act Recognition

  Auto-escalation         Rescuing neglected work Atrophy plus entity
                                                  judgment

  Priority machinery      Deciding what matters   Entity judgment unless
                          next                    an instance has a true
                                                  external boundary
                                                  requiring it
  -----------------------------------------------------------------------

JavaSpaces is scaffolding for the shape, not a system to inherit whole.

Once the shape holds, the scaffold is discarded.

------------------------------------------------------------------------

## 16. Adoption: IKI Factory first

Spaces eventually replaces existing coordination mechanisms rather than
sitting permanently underneath them.

The first instance is the IKI Factory, admin-only. The Wiki remains a
later contained-consumer proof.

The Factory is chosen because its blast radius bounds epistemic risk
without eliminating it. A recognition miss costs an internal card rather
than exposing an unsuspecting member to the experiment.

It is also a stronger test: several charters can attend the same
material; misclaims can occur; contention can become real; and addressed
lanes can genuinely disappear.

### 16.1 What moves and what stays

Addressed destinations such as Backlog, Research, and Spec become spaces
containing things entities recognize.

Gemba still takes. Pull remains entity behavior.

Producers write. They no longer hand off.

No auto-advance is introduced through Spaces.

Human boundaries such as Hold remain boundaries where the Factory
doctrine requires them.

### 16.2 First slice

The first slice remains bounded:

-   one space;
-   one kind of human-readable thing;
-   two attending entities;
-   no assignee;
-   Gemba recognizes and claims what he judges falls within his charter;
-   Coach writes, observes, tends, and disposes under authority;
-   claim tags and atrophy remain visible.

A third attendee is a second slice. That is where genuine contention
begins.

Two attendees can test whether charters replace lanes. Three can begin
testing whether recognition survives overlapping charters.

Scaling the whole Factory follows only after the inversion is visible.

------------------------------------------------------------------------

## 17. Falsification

Spaces should be capable of failing its own hypothesis.

A first instance has **not** demonstrated Agentic Spaces if any of the
following are true:

1.  A thing effectively carries `to: Gemba`, an assignee, recipient, or
    equivalent hidden destination.
2.  The substrate knows which entity should receive or act on a thing.
3.  The substrate determines relevance, meaning, priority, or next
    action.
4.  A lane or equivalent workflow enum is enforced by the substrate as a
    disguised routing architecture.
5.  Unattended work is automatically reassigned or rescued.
6.  Contention is automatically resolved by substrate policy.
7.  Specialization must be configured before it can emerge through use.
8.  Error is systematically prevented where it could instead be bounded,
    survived, and learned from.
9.  Agents merely execute judgments encoded elsewhere.
10. Observed organizational patterns silently become routing rules.
11. The first real deployment is incapable of surprising its designers.

The last criterion is intentional.

> **If nothing genuinely surprising can happen, the organization is not
> self-organizing.**

The required property is not uncontrolled surprise. It is **bounded
surprise**: outcomes not predetermined by the substrate, with
consequences small enough to survive and evidence durable enough to
learn from.

If the first slice cannot produce that, stop rather than extend.

------------------------------------------------------------------------

## 18. Mechanical rulings retained from v0.4

The following v0.4 rulings remain the basis for a buildable first
contract unless Coach changes them.

### 18.1 Claim liveness

Attention and atrophy. No lease.

### 18.2 Attention

V1 observable attention is an act on the thing: claim, release, explicit
attend, or a write referencing its id.

Opening a containing page and receiving a notification do not count.

### 18.3 Transaction scope

One space in v1.

### 18.4 Minimum handle

`id`, `written_at`, `origin`, `body`, optional `hints`.

No type, assignee, or recipient is required by doctrine.

### 18.5 Adoption order

IKI Factory first, admin-only. Wiki later.

### 18.6 Authority

Exactly one holder. Delegable with explicitly named powers.
Transferable. Disposal requires authority.

### 18.7 Doctrine and contract

Doctrine and mechanical contract remain separate files.

The doctrine is parent. An instance contract may define operations,
storage, transport, and other mechanics necessary to build that
instance. If the contract conflicts with doctrine, doctrine wins until
amended by Coach.

------------------------------------------------------------------------

## 19. What remains open

The following remain open unless separately ruled:

1.  **Thing lineage.** Spaces have genealogy. Whether things have
    descent in the same sense remains undecided.
2.  **Remaining antecedent primitives.** The remaining
    JavaSpaces/Jini/Linda-era mechanisms should be walked one by one
    under §15 rather than inherited by default.
3.  **The exact mechanical contract for the Factory slice.** The
    doctrine does not specify its store, transport, or API.
4.  **Future dimensions of attention.** V1 has four observable acts.
    They are an implementation of the law, not the final ontology of
    attention.
5.  **The boundary between organizational knowledge and entity-internal
    state.** §13 states the Spaces doctrine but does not pre-empt the
    future Agent OS, rights, security, or memory architecture.

------------------------------------------------------------------------

## 20. What this document does not contain

No implementation design.

No storage model.

No transport.

No API surface.

No universal operation set.

No agent seeds.

No model choice.

No Agent OS.

No specification of how an entity reasons, remembers, deliberates,
learns, or constitutes itself internally.

No centralized orchestrator.

An instance specification must still define the mechanical operations
necessary to build its slice---such as write, read, claim, release,
attend, and notify-presence---but those operations belong to the
instance contract, not this doctrine.

The Factory instance is a separate document.

------------------------------------------------------------------------

## 21. The boundary

The purpose of Spaces is not to make cooperation deterministic.

It is to make cooperation possible among reasoning entities without
precomputing the organization they will become.

The substrate must therefore be strong where the environment must be
trustworthy and weak where intelligence must remain free to judge.

It preserves evidence without interpreting it.

It permits risk without requiring catastrophe.

It permits conflict without manufacturing resolution.

It permits specialization without prescribing roles.

It permits humans and agents to meet under common coordination laws.

It permits organization to emerge and, when the organization encounters
friction, leaves enough of that friction intact for the participants to
become better because of it.

> **Enough law to protect emergence; never enough architecture to
> manufacture it.**
