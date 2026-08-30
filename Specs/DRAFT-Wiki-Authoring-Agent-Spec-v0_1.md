# Wiki Authoring Agent — Specification (DRAFT)

**Provisional filename and version. Coach names the real ones before this lands.**

| | |
|---|---|
| Status | DRAFT — advisor draft for bench review |
| Source | Spoken outline, working session 2026-08-24 |
| Program | Wiki |
| Supersedes | Nothing. Extends the interface model in the unified Wiki Spec. |

**Scope statement.** Active program: Wiki. Files/trees this document describes:
the wiki authoring agent's knowledge, interface, and output obligations.
Touches outside program: **NONE** — the Factory relationship is described in the
Factory spec and referenced here only as an inbound expectation.

---

## 0. Why this document exists

The wiki agent as previously specified is a **submission slot**: the operator
collects their own thoughts, assembles material, and deposits it through the
message window. The agent then discharges a contract against what arrived.

That is not the interface Coach wants. The expectation is a **colleague** — an
agent that already knows the surface, already knows what has been written about
it, opens the conversation itself, and drafts on request. This document
specifies that agent.

---

## 1. Premise — who this agent is for

1.1 The authoring channel is **admin-only**. It has exactly two operators: Coach
and Connor. Both are trained.

1.2 The agent is therefore **not designed defensively**. Guard rails built for a
naive deliverer are misplaced on this channel. Coach's stated principle:

> "When I'm developing for other people, I develop based on the knowledge that
> they may not know what they're doing, and I make the interface fail-safe for
> them. When I'm developing for me, I develop based on the knowledge that I
> have, and I expect the interface to act the way I act."

1.3 **This does not relax the source contract.** Fail-loud validation continues
to govern automated sources polling in. Two doors, two postures: the machine
door is defended, the operator door is a conversation.

1.4 **OPEN — Coach:** "Admin-only" and "two named trained operators" are not the
same statement. If the administrator role ever widens beyond Coach and Connor,
does the posture in 1.2 revisit automatically, or does it hold until Coach
rules otherwise?

---

## 2. Standing knowledge

2.1 The agent holds **standing read access** — not envelope-delivered material —
to:

- the specs tree
- the plans
- the decision log
- the full existing wiki corpus

2.2 **Justification, and it is load-bearing.** FatTail Labs specs are as-built,
not aspirational. Documentation parity is doctrine: feature, spec, and decision
log land in the same body of work, never "later." Where development diverged
from the spec, the spec was updated. Coach's statement of the underlying
discipline:

> "I take great pride in making sure that everything I say becomes the truth.
> And if I cannot match it with my vision, then I will make it the truth."

2.3 Consequently **no citation-and-verify ceremony is required** of the agent
when writing from the spec tree. There is no gap between the document and the
system, so there is nothing for the operator to catch. An advisor proposal to
require source citation as a drift check was raised and **rejected** — the
premise it defended against (spec/system divergence) does not exist here.

2.4 Standing knowledge is what makes §4's coverage greeting and §5's plain-
language requests possible. Without it, the operator is back to assembling
envelopes. **The access ruling and the conversational interface are one ruling,
not two.**

---

## 3. Surface recognition

3.1 Invocation already carries **surface identity** — the agent knows which
surface it was called from. This is already accomplished.

3.2 That identity is the **lookup key**. From it the agent resolves:

- every document that brought the surface to life (specs, plans, decision-log
  entries)
- every wiki page that already covers the surface
- the help material that already exists for it

3.3 **OPEN — Coach:** how does surface identity map to its documents? Naming
convention, or an explicit per-surface registry? Both work; they fail
differently. No default is written here.

---

## 4. The opening move — coverage, not a blank prompt

4.1 The agent **speaks first**. On invocation it reports coverage for the
surface: what exists, what looks incomplete, what is absent entirely. Then it
proposes and waits.

Coach's illustration of the behavior:

> "I would want the wiki to come back and say, hey, I noticed you have a help,
> but it looks incomplete, and there is no user-facing or customer-facing set.
> What would you like me to do? I would say, finish the help and create the
> other two."

4.2 This makes **"what's missing" a byproduct of the greeting** rather than a
separate query. The operator never reconstructs what already exists.

4.3 This is also the structural inversion of the submission slot. The
conversation opens with the agent's assessment, not with an empty box.

4.4 **OPEN — Coach:** "looks incomplete" is a **quality judgment**, not a
presence check. What standard does the agent apply? Presence-or-absence is not
sufficient to produce the sentence in 4.1.

---

## 5. The registers

5.1 Three named output shapes. Each has a different voice, a different assumed
reader knowledge, and different constraints:

| Register | Reader | Notes |
|---|---|---|
| Help documentation | Operator/member needing procedure | Carries no market or outcome claims |
| Member-facing | Member of the service | Assumes membership context |
| Public-facing | Anyone | **Carries the no-profit-claims invariant hardest** |

5.2 These live as **skills**, in the existing shape: inputs, steps, invariants,
verification. Encode the judgment once; do not re-derive it per page.

5.3 Invocation is **by name** — the operator names the register, or says
**"complete set"** to get all three from the same source material.

5.4 **Never automatic across all three.** Producing every register for every
surface unrequested is wasteful and wrong. Coach's ruling: "That would be
dumb."

5.5 The default opener is §4's coverage report, which is what makes 5.3
practical — the operator answers a specific proposal rather than issuing a cold
instruction.

---

## 6. The working loop

6.1 The operator points at a source or names a request. The agent drafts. The
operator reviews and okays it.

6.2 **The operator does not assemble an envelope.** This is the read-only-poll
principle already ruled for automated sources, extended to the operator as a
deliverer. Coach's framing:

> "I don't see any reason why I should have to deposit a transcript myself when
> it's all there and accessible."

6.3 Precedent: the existing Grok workflow — point at a path, get a draft, review,
approve. Nothing about the wiki agent makes that shape impossible.

6.4 The contract still governs what lands. What changes is who builds the
envelope.

---

## 7. Link integrity

7.1 **The creator owns linkage.** A page that lands correctly but sits orphaned
— nothing pointing in, nothing pointing out — is not finished. The agent that
wrote the page knows what it relates to, so weaving it in is part of finishing
the job, not later cleanup.

7.2 Obligation is **"do it or facilitate it."** Where the agent cannot complete
a link itself, it **names the links it could not make** rather than leaving them
silently missing. In existing language, that is a `failed-partial` — a correct
outcome, honestly reported.

7.3 The curator's periodic sweep is a **safety net, not the primary mechanism**.
See the Curator spec.

---

## 8. Thesis check

The agent is a working instance of the IKI hierarchy, not a metaphor for it:

| Tier | In this agent |
|---|---|
| **Information** | The specs, plans, decision log, existing corpus |
| **Knowledge** | The coverage judgment and the register-shaped page |
| **Intelligence** | Noticing the gap and proposing the work |

If the wiki agent does not work this way, the platform contradicts its own
thesis.

---

## 9. Reader-facing behaviors raised this session — **placement OPEN**

These came up in review and are Coach's, preserved verbatim in substance. They
may belong in this spec, in the unified Wiki Spec, or in a third document.
**Coach places them; the advisor has not assigned them.**

9.1 **Venue awareness.** The wiki knows where it is appearing — client space,
sales space, or public-facing space — and adjusts its quick links to those
respective spaces. The same corpus presents different entry points depending on
where the reader is standing.

9.2 **Intent reasoning and reframing.** For a question the corpus does not
directly answer, the agent understands the nature of the question, reasons about
whether the material sought is tangentially related to ours, and then **reguides
and reframes** so the person understands exactly what the wiki does contain.
Not a dead end, not a bluff — teaching the shape of the corpus. This is
capacity-over-dependency in practice.

9.3 **Advisor note (ADVISORY, discardable):** queries that come up empty are the
only signal of what the corpus lacks that the systems of record do not contain.
Worth logging as signal, not as failure. Coach has not ruled on this.

---

## 10. Open items, consolidated for Coach

| # | Item | §|
|---|---|---|
| 1 | Does the non-defensive posture hold if the admin role widens past two trained operators? | 1.4 |
| 2 | Surface→document mapping: naming convention or explicit registry? | 3.3 |
| 3 | What standard defines "looks incomplete"? | 4.4 |
| 4 | Placement of venue awareness and intent reframing | 9 |
| 5 | Whether empty-handed queries are logged as corpus signal | 9.3 |
