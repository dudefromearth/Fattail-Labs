# Advisor Review — The Practice: Coach Design Architecture v0.2

**Date:** 2026-08-13  
**Input:** Advisor artifact *FatTail Labs — The Practice: Coach Design Architecture v0.2* (DRAFT — not build authority)  
**Reviewer:** Architecture / parent-spec check against as-built Journal, Journey, Retro, and doctrine  
**Status:** Review only. No spec fold. No implementation plan.  
**Audience:** Coach · India · Tango · Hotel · Echo · Victor · Mike · Lima

**Parents checked (as-built, not the advisor draft):**

| Doc | Used for |
|-----|----------|
| Journal Session Spec v0.6 | §8.2 witness posture · §9 guardrails (no field-fill, one question per turn) · §1.3 not Interviewer |
| Journey Experience Spec v1.0 | Pillar signals §4.1 · login `/home` §2.2 · idle timeout §2.3b · overall grade |
| Journal Retrospective Spec v0.7.1 | Ceremony frame · “not skippable” · “not a report card” |
| Journey Experience / DL-067 | Post-login landing |
| North Star Member Ethos v1.2 | Secular enlightenment · capacity over dependency |
| Member Campaign Structured Practice | As-built meaning of “campaign” |

---

## Verdict

This is a strong advisor frame and **not foldable yet**. The spine is right. The collisions with shipped law are real, and a few of them are bigger than the draft’s §17 currently admits.

**Hold** as the current thinking document. Do not fold into `Specs/` or start an implementation plan until **B-Agent**, **B-Personalize**, and the missing collisions below are ruled and decision-logged. The document is already honest about not being build authority. That posture is correct.

---

## What holds

The path diagram is the best product sentence in the suite: Campaign is direction, Playbook is the ideal, Journal is the walk, Retro is the look-back, Journey is whether the walk still points true north. Trade Log owns the objective stream; Journal owns the subjective stream; they stay distinct until the retro join. That split is load-bearing and should survive every later spec.

**You talk. The Coach presents and asks. You confirm.** is the right interaction law. It is the actual category difference from a form-shaped journal. Retro as pre-compiled presentation plus one-tap ratification is the only ceremony a bleeding trader will finish.

The rails-license-freedom bet in §3.2 is the correct AI architecture: context + guardrails are the product; the model is the expressor. Heat restraint in §6.2 is the one place the shipped doctrine was actually protecting someone (don’t put heavy reflection in front of open risk). Re-deriving that instead of deleting it is the right move.

B4 snapshot-at-load is settled correctly. Stars as their own object, not tags, is correct. Family B + export/purge on every new store is correct. B-Name being blocking is correct — do not let “Hey, it’s Coach” ship in UI copy by accident.

§16’s compliance map is the right kind of document. Most advisor drafts skip it.

---

## Blocking collisions with as-built law

These are not taste. They are Spec contradictions. The draft’s §17 does not yet carry all of them.

### 1. Journal v0.6 §9, not only §8.2

B-Agent names the witness-to-guide charter (member writes first; no unprompted questions). That is necessary and not sufficient.

Shipped Journal law also forbids:

- **filling empty fields**
- **more than one question per turn**
- the agent as **Interviewer** (v0.6 §1.3)

Draft §3.1 says the Coach files structured fields from conversation. That *is* filling fields. A versioned Journal amendment has to say: conversation is SoR; a **member-visible confirmation** of extracted fields is the write; silent back-end invent-and-store is still forbidden. Without that sentence, “the model files it” becomes the exact failure §9 exists to stop.

Add a ruling, or widen B-Agent: **B-Extract** — machine-side structured pass requires confirmation, never silent write.

### 2. “Does not touch Journey math” cannot coexist with “The Practice pumps the pillars”

Draft §18 says pillar math and EWMA stay as-built. Draft §10 says The Practice continuously feeds Daily routine, Process adherence, and Retrospective cadence with **new signals**.

As-built (`Journey Experience v1.0` §4.1):

| Pillar | As-built signal | This doc’s feed |
|--------|-----------------|-----------------|
| Daily routine | Day has Trade Log **or** Journal | Hypothesis · execution · reflection loop, scored daily |
| Process adherence | % of tagged trades `followed`/`partial` | Per **loaded playbook entry** |
| Retro cadence | Days since last **completed** retro vs horizon | “Regularity of the sitting,” scored |

Those are different instruments. If math is frozen, the Coach cannot calibrate fade against “loop completeness” or “edict-by-edict adherence” — those numbers do not exist. If the new feeds are real, Journey v1.0 is **amended**, and “no second store” only holds if the new signals **replace** the old ones, not sit beside them.

Also as-built: there **is** a blended score (`process.overall_raw_percent` + tenure-adjusted grade Poor→Excellent). Draft §10.2’s “no blended score to chase” is a **new** product law, not a description of today’s Journey. The Tight / Medium / Loose half-life knob is also new; as-built EWMA is **live presence only**, half-life 4 weeks, not a member control on true-north.

**Rule this as B-Journey-Feed.** Three options, pick one:

1. Freeze Journey math; Coach fade reads **new internal Practice signals** that are not pillar scores.
2. Amend Journey v1.0 so the three Practice pumps **become** those meters.
3. Dual-write during a named migration, then cut over.

(1) is the only option that honors draft §18 as written. (2) is the only option that honors draft §10.5 as written. They cannot both be true.

### 3. Retro v0.7.1 already forbids two things this doc reopens

v0.7.1 §2: the retro is **not skippable** (“cadence adherence is itself a process signal”) and **not a report card**.

Draft §8.5 names a “report-card window.” B3 says force the report, never the ceremony.

Those are reconcilable if you drop the words “report card” and name standing output **unratified compilation** — visible, not sealed, not scored as a person. They are not reconcilable if skipped ceremonies still “don’t lose work” **and** regularity is scored **and** the ceremony is optional. Pick the v0.7.1 line or amend it in the open. Don’t quietly overwrite “not a report card” with “report-card window.”

### 4. Heat restraint cannot be left to the model

Draft §3.2 says no decision trees for when the Coach speaks. Draft §6.2 **is** a decision tree, and it must stay **code**.

“While a trade is live” needs a SoR: open Trade Log position for that identity/date, not a model vibe. If the book is empty, the restraint is off. If a position is open, unprompted analysis is a hard reject — same class as today’s render-time guardrails, not a prompt hope.

Add to the thin-spec list: **live-position signal for §6.2**. Do not let “the model knows when to lay back” eat this.

### 5. Login and timeout facts are wrong

As-built (Journey v1.0 §2.2–2.3b, DL-067):

- Login lands on **`/home`**, not “current course materials.” `/home` already has continue-learning in the main column and **ProcessMeter** on the rail.
- Idle timeout default is **30 minutes**, member-adjustable **15–60**, not “~1 hour.”

Draft §11’s idea (small Journey always in peripheral view; drafts must survive idle logout) is right. The destination and the timeout number need to be corrected or explicitly amended. Draft persistence is correctly non-optional once idle logout exists.

---

## Rulings — keep, sharpen, add

| ID | Disposition |
|----|-------------|
| **B-Agent** | **Adopt**, with extract/confirm and live-position constraints above. This is the program. Without it the rest is furniture. |
| **B-Personalize** | **Adopt as a thin, hostile spec**, not as “the Coach learns you.” See schema below. |
| **B3** | Advisor position (force report, never ceremony) is the Tango-respecting one. Then strike “report card” and reconcile with v0.7.1’s “not skippable.” Suggested law: ceremony is invited; **unratified standing compilation** still exists; cadence meter still decays (as-built §4.1a already does this without forcing a sitting). |
| **B4** | Leave settled. Daily-load snapshot can wait. |
| **B-Name** | Block any UI string until ruled. Internal callsign stays Coach. Member-facing name is not a copy detail. |
| **B-Journey-Feed** | **Add.** Freeze math vs amend meters (see collision 2). |
| **B-Extract** | **Add.** Machine-side structured pass requires confirmation, never silent write. |
| **B-Campaign-overload** | **Add.** As-built “campaign” is Member Campaign / Structured Practice (charter, bounds, instances). This doc’s Campaign is “the season you committed to walk.” Same word, two objects. Either bind this Campaign to the shipped campaign model or rename the path piece (Season / Program / Commitment). India will block a third campaign table. |

### B-Personalize — allowed vs forbidden

Allowed store: vocabulary the member used, questions they answered vs skipped, pace (turn length), ratified causes they named, playbook entries they keep breaking (by **their** marks).

Forbidden store: inferred emotion, personality, diagnosis, “what they need psychologically.”

Every row cites a member utterance or conduct event. Purge with Family B. If a learned item cannot be shown to the member as “I remember you said X on DATE,” it does not belong.

“Recurring obstacles” is one paraphrase away from a psychological profile. Make the schema the rail, or this ruling will fail Hotel and Tango on first contact.

---

## Gaps the fold will hit

Parents table is missing **Trade Log Spec**, **Journey math as-built (not only the umbrella)**, **Member Campaign Structured Practice**, **Agent Identity**, **North Star Ethos v1.2**, and **Process Integrity Scoring**. The objective stream is owned by a spec that isn’t listed.

v0.1 is cited as the memory-architecture SoR and **is not in the repo**. A reviewer cannot validate chunks / digest / stars from this file alone. Before fold, either inline the v0.1 memory section or land v0.1 next to v0.2.

Mermaid `CAMP → PB` overstates causality. Playbook exists without a campaign; campaign **snapshots** playbook. Draw “load/snapshot,” not production.

Draft §10.4’s “the diagnosis and the drill-down are the same gesture” should lose the word **diagnosis**. The rest of the doc spends capital forbidding that word.

§8.3 cause hypotheses: ratification does not wash a diagnostic sentence. Require the hypothesis to be a **conduct sentence with quotes/dates** (“adherence marks on the size edict went to 0 the week journal turns thinned”) and reject any sentence that names a state. Hotel gates the schema, not the prose.

Courseware routing needs entitlement and pathway: Observer vs Navigator, current-work resume, no generic “go study.” Thin spec, not a vibe.

Voice: transcription is Family B media; fail loud if STT is down; **no tone**. Already said. Keep it in Mike’s list.

---

## Lineage and copy

Draft §1’s Four Noble Truths mapping is Coach’s. Keep it in the architecture. **Do not** put Buddhist technical language in member UI unless Coach rules that. North Star is secular enlightenment; Victor gates any Taleb/via negativa **and** any Noble-Truth sentence that leaves this file.

“The measurement layer is done and world-class” is an internal positioning bet. Fine here. Never member-facing. The measurement suite is strong; it is not finished, and saying so outside this room is a trust problem.

Capacity-over-dependency as a fading glide path is the best rendering of that doctrine in this repo. The failure mode is fade-too-soon because Journey “routine” lights up from a single journal scribble. That is another reason B-Journey-Feed cannot stay implied.

---

## Suggested next move (Coach only)

Rule in this order, same day if possible:

1. **B-Agent** — guide + proactive-primary + heat restraint as **code** + extract-and-confirm
2. **B-Name**
3. **B-Journey-Feed** — freeze math vs amend meters
4. **B-Personalize** — allowed/forbidden schema, not a slogan
5. **B3** + drop “report card”
6. **B-Campaign-overload**

Then Lima logs those six. Then Juliet may write a **thin fold spec** (Journal v0.7 / Retro conversation frame / Coach charter) — not a bench plan. Implementation planning before those DLs is a doctrine miss.

Adopt the document as the current frame after those rulings. Do not treat §3.2’s “don’t build decision trees” as license to skip the live-trade gate or the confirmation gate. Those two trees are the rails that make the rest of the freedom safe.
