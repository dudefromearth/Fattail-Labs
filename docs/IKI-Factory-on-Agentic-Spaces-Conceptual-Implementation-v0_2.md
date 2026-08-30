# IKI Factory on Agentic Spaces — Conceptual Implementation v0.2

**Date:** 2026-08-27
**Type:** Conceptual implementation. Not a framework, not a store, not an API. This describes what the Factory *is* when it is expressed in Spaces — what a card is, what the spaces are, and what happens when Gemba looks.
**Parent doctrine:** `FatTail-Labs-Agentic-Spaces-Spec-v0_5.md`
**Status:** Draft for Coach. Not stamped.
**Changes in v0.2:** two corrections from review, both agreed by Coach. **Starvation no longer prescribes its own remedy** — an unclaimed card exposes a question with several possible answers, and only the bench can say which (§5). **"Reads the whole space" is named as first-slice behaviour, not law** — at scale, attention itself must become intelligent, and where an entity looks is its judgment too (§2.4a). One addition: the boundary test the review named is worth keeping (§3).

## Scope statement

**Active program:** Agentic Spaces — IKI Factory first instance.
**Files/trees this document touches:** none. Conceptual only.
**Touches outside program:** NONE.

---

## 1. What dies

The Factory has lanes: Backlog, Research, Development, Build, Staging, Live. A card sits in one and moves to the next.

**The lanes die.** Not renamed, not reimplemented as spaces — gone. A lane is an addressed place, and an addressed place is the thing Spaces removes.

What replaces them is not six spaces. It is **one space with no stages in it at all**, and a second for staging (§3). What a card's *stage* was is now something an entity **reads off the card and its history**, not a place the card is sitting.

The board you look at is a **rendering**, not a location. Someone draws it by grouping cards according to what they see — and two people could group them differently and both be right, because grouping is judgment and judgment belongs to entities.

**This is the hard version and it is the one that tests the idea.** Six spaces named after the six lanes would pass every mechanical test and prove nothing.

---

## 2. The Work space

**One space. Everything the pipeline touches lives in it.** A raw idea, a research finding, a spec, a built artifact — all cards, all in the same place, distinguished by nothing the substrate knows about.

### 2.1 What a card is

The v1 handle from doctrine §6.1, and nothing more:

| Field | In the Factory |
|---|---|
| **id** | The card's identity. What a claim tags and a note references. |
| **written_at** | When it entered. |
| **origin** | Who wrote it — you, Gemba, an agent. **Provenance, never an address.** |
| **body** | The card, in language a human reads. Intent, findings, a spec draft, a note about what was tried. |
| **hints** | Optional. "Probably research." Advisory, ignorable, and never a routing rule. |

**No `stage`. No `lane`. No `assignee`. No `to`.** If any of those appear, the experiment failed and it failed on day one (§7).

A card's body is written to be understood, not parsed. "We need a template for the 0DTE wing-selection walkthrough, and I don't know yet whether it's a course or a help package" is a card. It carries its own state in what it says.

### 2.2 How a card's stage is known

By reading it. The body says where it is, or the history does.

A card whose body is an intent and which carries no notes is at the beginning. A card carrying a research note from Gemba has been researched. A card carrying a spec in its body, or a note pointing at a spec, is past that.

**Nothing enforces order.** A card could acquire a spec before anyone researched it, if that is what happened. The Factory's sequence was a convention that worked; under Spaces it is a convention entities generally follow, and departures are visible rather than impossible.

### 2.3 Attendants

**Coach** — writes cards, claims, disposes, tends the space, holds authority.

**Gemba** — attends continuously. His charter says what he recognizes: work that wants research, and work that is ready to become a spec. He reads bodies and judges.

Nobody else in the first slice. A third attendant is where genuine contention appears, and contention is a second slice.

### 2.4 What happens when Gemba looks

He reads the space. Not a queue, not his lane — in the first slice, the whole space, every card he can see.

For each one he asks a single question: **is this mine?** Not *is it in my column*, not *was it addressed to me* — does this fall under my charter.

When the answer is yes, he **claims** it. The claim is a tag on the card; the card stays exactly where it was and everyone can see he holds it. When he finishes, he writes his finding into the space — as a note on that card, or as a new card — and releases.

When the answer is no, he moves on and the card stays. That is not an error. It is a card he does not recognize, and if nobody recognizes it, that is information (§5).

**Gemba is never handed anything.** Nothing arrives at him. He goes and looks, and looking is his behaviour, not the substrate's.

### 2.4a Exhaustive reading is a first-slice convenience, not law

One space and one attendant makes reading everything cheap, so the first slice does it. **That must not become doctrine.**

At scale an entity should not exhaustively scan every thing in every space it can reach. It will have to judge **where to look, how deeply, when to return, what looks interesting, and what changed conditions deserve renewed attention.** Deciding where to spend attention is judgment, and judgment belongs to the entity (doctrine §3) — a rule that made attendance exhaustive would be the substrate deciding it.

So there are **two levels of recognition, and both are the entity's**:

> **Recognition of spaces worth attending → recognition of things worth claiming.**

The parent doctrine already gestures at the first: persistent unhinted attendance — an entity repeatedly attending a space nobody suggested — is the signal that a boundary is real (§5.2).

Which opens something the first slice is too small to show. **Attention patterns are themselves organizational behaviour.** Agents may hang around spaces nobody assigned them. They may stop attending spaces their archetype was traditionally associated with. Several may congregate around a new kind of material. One may find a useful relationship between two spaces nobody designed.

That is not merely emergent work allocation. It is **emergent organizational topology**, and it is only observable once there is more than one space and more than one attendant to watch.

### 2.5 What Coach does that Gemba cannot

Writes the card that starts a thing. Judges which cards warrant a spec — the Development judgment, which was never mechanical and is not now. Stamps. Disposes.

Under doctrine §10.5 he holds authority and may delegate named powers. Disposal is delegable only if named, and in the first slice it is not delegated at all.

---

## 3. The Staging space

**Coach: "the pipeline and staging are like two separate things."** That is a real boundary and not a lane in disguise, so it earns a second space.

The pipeline makes **one thing**. Staging assembles a **constellation** around it — the product, the landing page, the help guide, the wiki entry, the campaign — in parallel, plus an advisory review bench and trusted clients. Different material, different attendants, different judgment.

Doctrine §10.2 is the test and it passes: *a space's properties follow the material it holds.* FDA food-ready bins belong in the cafeteria, not on the assembly line.

**The distinction is worth keeping as a test in its own right**, since it is the question every future space will face:

> **A different place in a process is probably not a space. A different kind of material or ecology may be.**

Backlog against Research is a difference in *stage* — same material, further along. Work against Staging is a difference in *kind* — one makes a thing, the other assembles what surrounds it. Only the second earns a boundary.

**Two spaces, not six.** The boundary is between *making a thing* and *assembling what surrounds it*, which is a difference in kind. Backlog versus Research is a difference in stage, which is not.

### 3.1 How something reaches Staging

**Nothing is moved and nothing is sent.** A staging card is **written** into the Staging space by whoever judges the thing ready to be surrounded — pointing at what the pipeline produced.

Whether that is one card the subassembly attendants each claim, or a card per subassembly, is a real design question and I am not deciding it. It comes down to whether the constellation is one thing with parts or five parallel things, and that is Coach's to say (§8).

### 3.2 Live

Live is not a space. **Live is Coach's single stamp** releasing the constellation, and the doctrine already covers what happens next: the state after a Live write is Published and is never pulled back.

A stage that is a decision by one person, made once, is not a place work sits.

---

## 4. Claims, atrophy, and the board

**A claim tags, it does not remove.** Gemba claiming a card does not vacuum it out of the space — it shows, on the card, that he holds it. The board always shows who holds what. Nothing vanishes.

**A claim lives on attention.** If Gemba goes quiet — stops attending that card — the claim atrophies and the card is available again. Nobody has to detect that he stalled, and nobody set a deadline in advance.

**Attention is per card, not per space** (doctrine §8). The Factory can be busy while one card sits unattended, and that card decays regardless of the traffic around it. Which is the point: a neglected card in a busy space says plenty of parties were present and none of them recognized it.

The four observable acts: claiming it, releasing it, explicitly attending it, or writing a note that references its id. **Not** opening the board that lists it, and **not** a notification firing about it.

**An atrophied card stays visible.** Atrophy is a state, not a deletion. Disposal is separate, deliberate, and Coach's.

---

## 5. What the Factory learns that it could not before

This is why the Factory was chosen over the Wiki, and it is worth stating as capability rather than mechanism.

**A card nobody claims exposes a question to the bench.** Under lanes, a card sat in a column and looked fine. Under Spaces, a card everyone could see and nobody claimed is a fact that demands an answer — but **the substrate does not know which answer**, and neither does this document.

It may reveal a charter boundary. It may reveal missing competence. It may be **malformed** — unintelligible, or written so nobody could tell what it wanted. It may be **premature**, waiting on something that has not happened. It may be **garbage**, and correctly ignored. It may be something nobody *should* claim.

**The bench judges which.** Widening a charter is one possible answer, not the answer.

*(v0.1 said the answer is a charter — someone's scope widens or an attendant arrives. That was too deterministic for the doctrine it implements, and it has a failure mode worth naming: if starvation is read as a standing instruction to expand coverage, charters grow until every possible thing has an owner. That is comprehensive routing rebuilt from the inside, arriving through the one door the architecture left open.)*

**A rising count of neglected cards is the space failing** (doctrine §14.1). Different signal, different answer. The gate may be wrong, the attendants may have drifted from what is being written, or the space may want splitting. The answer is tending, not a charter.

**A misclaim is a charter boundary discovered** — and unlike starvation, this one names its own answer, because the entity that misclaimed is the one who learned. Gemba claims a card, reads it properly, recognizes it is not his, and releases it **with what he learned** — this isn't mine, and here is why. The next recognition is better. Under lanes this was a card in the wrong column, which taught nobody anything.

None of these needs new mechanism. Claims are tags, atrophied things stay visible, releases carry notes. The information is already sitting there to be read.

---

## 6. What does not change

**Pull stays Gemba's.** Spaces does not pull for him and never will. Doctrine §3: the substrate provides conditions, entities provide judgment.

**No auto-advance.** Nothing moves a card because a condition was met.

**Hold stays sacred.** A claim is not a promise to finish, and nothing takes work back on a schedule.

**Admin-only, synthetic data.** No member surface in this slice.

**The Development judgment stays Coach's.** Deciding what warrants a spec was never mechanical.

---

## 7. The two ways this lies to you

Check these first. Either one means the concept was never exercised.

**A card that carries `to: Gemba`** — or an assignee, or a recipient, or anything that names who should act. Then nothing was recognized; it was delivered, and addressing survived under a new word.

**A stage or lane enum the substrate enforces.** Then the lanes did not die, they moved into the floor, and the substrate stopped being dumb.

Doctrine §17 adds nine more. Two that will bite here specifically:

**Specialization configured before it emerges.** If the second space exists because a diagram said so rather than because the material asked for it, §10.2 was violated in the act of implementing it. Staging earns its space on Coach's judgment that the material differs — that is a ruling, not a diagram, and it is the last one that gets made in advance.

**Nothing surprising can happen.** If the first weeks produce exactly the board you would have drawn under lanes, the substrate is not doing anything and the honest read is that it failed.

---

## 8. What Coach still decides

1. **The Staging card shape** — one card the subassembly attendants claim in parallel, or a card per subassembly. Whether the constellation is one thing with parts or five parallel things.
2. **Whether Staging is in the first slice at all.** The bounded slice was one space, cards, Coach and Gemba. Adding Staging adds attendants and material, which is the widening the doctrine warns against. It may be right to prove the Work space first and let Staging follow.
3. **Gemba's charter, in his words.** His charter file is Coach-authored and protected. What he recognizes under Spaces is a change to it, and that is Coach's hand only.
4. **Where the store wraps.** India names it against the contract — likely wrapping the existing Factory table so it *looks* like one space, rather than a new store. Not decided here, and it should not jump the queue.
5. **The mechanical contract itself.** This document describes the Factory in Spaces terms; it does not name operations. Write, read, claim, release-with-note, attend, notify-presence is the expected set, and it belongs in a contract beneath the doctrine.

---

## 9. What this document does not contain

- No store, transport, API, or schema.
- No operation definitions — that is the mechanical contract.
- No seeds, no gates, no bench plan.
- No member surface.
- No Wiki. It remains the later contained-consumer proof.
- No change to Gemba's charter, which is Coach's hand only.

## 10. What reality has to tell us

Both corrections in v0.2 point the same way: this has reached the limit of what can be derived on paper.

Whether starvation means a hole or a malformed card, whether Gemba's attention finds a rhythm or thrashes, whether the Work space's inferred state is legible or contested, whether anything surprising happens at all — none of that is answerable by more doctrine. The remaining questions are empirical.

Build the slice. Let it tell you things neither the doctrine nor this document could work out in advance.

---

**One-line law:**
**The lanes die; one space holds the work and a second holds the constellation; a card carries its own state in language a human reads rather than in a field the substrate enforces; Gemba goes and looks — and where he looks is his judgment too — recognizes what is his, and tags it without taking it; and a card nobody claims is not a card sitting peacefully in the correct column, it is an open question put to the bench about its own ability to understand what it is being given.**
