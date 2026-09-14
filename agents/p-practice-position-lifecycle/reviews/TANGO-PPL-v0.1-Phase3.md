# TANGO — Phase 3 Experience Review

**Agent:** Tango  
**Date:** 2026-09-13  
**Subject:** `Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md` (**DRAFT**, Juliet Phase 1)  
**Workflow:** spec-create-review-workflow Phase 3 (Tango half). Verdict is **member psychology / capacity** only. Spec not edited. OD-21 not picked. OD-19 not decided.

**Persona:** a trader who is bleeding, short on trust, and needs honest process — not magic, not profit theater.

**Read (this pass):**

- Agent charter `agents/bench/tango.md` · doctrine §11 (Coach Content Law) · Tango invariants (capacity over dependency; no profit-claim; bleeding member; respect; §11)
- Draft spec v0.1 — full; walked §1 circumstances, §4.4 states, §5 close/delete, §6 import end-state, §8 member experience, §9 acceptance
- `docs/Practice-Position-Lifecycle-B0-Focused-Audit-v1_1.md` (analysis law) — C1-1…4, C2-1…4, §2.3 member sentence, fourth-state contract
- Trade Log v1.1 §16.4–§16.6, §16.9 (T-D5 process-first; delete order; four gates; no win-rate chrome)
- Human Interface Spec v1.0 §6.3 (AlertDialog / destructive pattern)
- Positions View v0.2 V8 / V15 (no valence; P&L present, not primary)
- India Phase 2 `reviews/INDIA-PPL-v0.1-Phase2.md` (read; not re-litigated as architecture)

---

## Up front

This pass **did not change or drop** anything Coach wrote. The spec file was not edited. Objections sit here, labeled Tango.

Juliet’s up-front Coach Content Law notes are accepted from the member seat: B0 v1.1 contract intact; both phrases **partial-residual** (C1) and **unfinished cycle** (C2) kept; ODs transcribed not answered; matcher rewrite PARKED; no third English word invented as law.

**Tango did not pick OD-21 vocabulary. Tango did not decide OD-19.**

India’s Phase 2 RETURN (B1–B3: write-path table, Privacy parent, exhaustive PPL-2 consumers) is architecture. Tango does not re-block those seams as psychology. One dignity opinion sits **beside** India’s B1 (truncated-history import must not feel like a failed close) — labeled, not promoted into a second system constraint.

---

## Bench delta

What the next Tango (or Echo chrome pass / Charlie packet) can do that this one could not:

1. **Override-as-habit is the capacity failure mode for the four gates.** Fail-loud is one named 422 when a close actually violates a gate, plus that one override. Four always-on “Allow …” boxes train the bleeding member to check them all so the save works. That is dependency on the bypass, not capacity. Spec law (API 422, overrides in the payload, never cookie) is right. Chrome is the hole.
2. **Remaining is the risk number; original stays on the fill.** After 1-of-5, Positions **4** is what can still bleed. The open fill is still **5**. Overwriting the fill with 4 rewrites history. Leaving **5** as the Positions number is today’s lie. Both numbers must be visible; the member must not have to subtract.
3. **409 English is the order rule, not an error code.** “Close first, then the open” is dignity. `close_id` in the API body is fail-loud for Alpha. If chrome shows “Conflict 409,” we trapped them.
4. **B0 sentence APPROVED:** *“opened before your imported history.”* Subject is the position, not the person. Do not “improve” it into *incomplete import*, *fix your file*, *missing open*, or *you imported wrong*. Hotel still owns the **state token** (OD-21). This sentence is the explained-boundary *explanation*, not the Autofilter word.
5. **Declarations that wear Complete are a soothing bot.** Spec already forbids manufacturing Complete and forbids fake fills. Next chrome pass: declaration actions name the **boundary** they teach. Not Done. Not Fixed. Not Resolve to Complete.
6. **Silent hold-boundary drop feels like the app ate the position.** PPL-7 “one answer” is the trust law. Tango does not pick the direction (India FI-PPL-1 / OD-23). Named is honest; silent unmount is “the app is broken.”

---

## Coach content intact?

**Yes.** Walked against B0 v1.1 and spec §1 / §4.4 / §6 / §8:

| Coach / B0 item | This review |
|-----------------|-------------|
| Circumstance 1 — partial close + delete-order | Kept. Walked as the 1-of-5 member. |
| Circumstance 2 — truncated-import orphan + no end state | Kept. Walked as the 60-day file / day −90 open. |
| Spine: read models consume `closes[]` / `slot_remaining`; coverage window; fourth state; gates to API; **do not touch the matcher** | Kept. Capacity-positive (teach what the book knows). |
| Both phrases: **partial-residual** (C1) and **unfinished cycle** (C2) | Kept. Tango does not collapse them and does not invent a third word. |
| B0 member sentence *“opened before your imported history.”* | **APPROVED** as explained-boundary copy (see walkthrough). Not replaced. |
| Four close gates + explicit overrides | Kept. Chrome recommendation labeled Tango, not a de-scope of the gates. |
| Delete-order: close first, then open; 409 | Kept. Dignity notes are chrome, not a different order. |
| Declarations = new object, never a fake fill | Kept. Capacity law. |
| OD-19, OD-21, OD-9, OD-22, OD-23, OD-24 | Untouched. Not answered. |
| PPL-12 no stored position / status | Kept. Hiding the book behind a stored “Complete” would have been the dependency move. Spec refuses it. |
| T-D5 process-first; no win-rate chrome; V8/V15 no valence | Kept in §8.1 / §9.4. |

Tango objections are in this file, not inlined as deletions.

---

## Blocks (capacity-over-dependency / profit-claim / dignity only)

**None.**

The draft’s member-experience law does not hook without teaching, does not claim profit, and does not humiliate.

| Check | Verdict | Why this is not a block |
|-------|---------|-------------------------|
| Capacity over dependency — coverage window + declarations | **Pass** | Window and declarations are **inputs to derivation**, not a second book and not a bot that mints fills or a soothing Complete (§4.1, §4.6, §8.4, PPL-12). They teach what the book knows. |
| No profit-claim / P&L theater on lifecycle chrome | **Pass** | §8.1 process-first (T-D5); P&L optional and neutral; no valence (V8/V15); §9.4 no win-rate chrome. Remaining qty is **risk honesty**, not a result. “Complete” here means the cycle was consumed — existing Trade Log process language, not a win. Tango does not relitigate that token. |
| Honest incomplete cycles vs “the app is broken” | **Pass** | Named, calm state; never blank; never lying Open-at-5; never lying Complete; never a raw “broken” that blames them for a truncated import (§8.1). Current as-built *is* the broken-app feeling. This Spec is the correction. |
| Four gates + overrides — fail-loud, not nag | **Pass (law)** | API 422, named gate, overrides opt-in per request, never cookie (§5.2, §7.1). That is fail-loud. Always-on four checkboxes are as-built chrome, not new law. Echo owns the ritual. Opinion T-O1, not a block of Coach’s four gates. |
| Partial-residual qty 4 after 1-of-5 | **Pass (law)** | Remaining **4** on blotter and Positions; not orphan; open not deletable (§8.3, §9.1, PPL-2). Original-vs-remaining *craft* is T-O2. |
| Truncated-import copy vs blaming the member | **Pass** | B0 sentence APPROVED. Orphan **inside** the window stays Orphan close — we do not soothe a real unmatched close by pretending the file was truncated (§4.4, §6.1). |
| Delete-order dignity, not trap | **Pass (law)** | Close first, then open; 409; kit AlertDialog; close ≠ delete (§5.3–§5.4, §8.2). 409-as-English is T-O3. Soft-trash / wizard **not decided** (OD-19). |

Doctrine §11.4: Tango does not promote “I worry Charlie might 422 the ToS file” into a hard constraint. That write-path is India’s B1. Member-facing stance is T-O4, labeled.

---

## Opinions / recommendations

Labeled **Tango**. Coach may discard. Echo owns HIG. Hotel owns OD-21. India owns write-path / OD-9 shape.

### Walkthrough A — Circumstance 1 (close 1 of 5)

Seat: I opened 5. I closed 1. I am already losing. I do not trust this screen.

**Today:** Orphan close + Open at **5**. Positions overstate what can still bleed. I think I broke the book. I delete the open to “fix” it and orphan the real close. The product taught me nothing and then punished me.

**This Spec:** partial-residual, Positions **4**, no orphan badge, open not deletable. That is the honest book. I can still bleed on 4. I am not crazy.

**T-O2 — remaining vs original (capacity, not OD-21):**

- **Remaining 4** is the number that may still hurt me. It is primary on Positions and on the derived status.
- **Original 5** stays on the **open fill**. Do not rewrite the fill to 4. That is a new lie (“I only ever had 4”).
- **Closed 1** stays on the close fill. I should not have to subtract.
- Do **not** print `slot_remaining` or `open_units` as member words. Remaining / original / closed are enough.
- Whether Autofilter’s **token** is its own word or shares Hotel’s fourth-state word is **OD-21**. Qty visibility is not vocabulary. W1 may ship qty **4** and “not orphan” with a machine key; copy waits.

**T-O1 — four gates, fail-loud not nag (capacity):**

A close that **passes** all four gates should show **no** override chrome. A 422 names **the one** failed gate and offers **that one** override. Trade Log §16.5 already has “Will pair with open #…” — keep that preview; it teaches pairing before save. Do not drop it when SoR moves to the API.

The four gates stay. Tango is not asking for fewer gates. Tango is asking that unused overrides not become a ritual the bleeding member clicks to make the pain stop.

**T-O3 — delete-order dignity (not OD-19):**

API 409 names the blocking close id (fail-loud for Alpha). Member chrome, from the seat:

- Delete on a blocked open is **unavailable with a reason**, not a confirm that then 409s (slap after they already agreed to destroy).
- Consequence sentence is the **order rule in English**: this open still has a close; delete the close first, then the open. Not “Conflict 409.”
- Deleting the **close** of 1: name the consequence — the open of 5 is unmatched again. That is teaching, not a scare.
- Kit `AlertDialog` / `useConfirm` as spec’d (HIS §6.3): item name, consequence, Cancel, destructive not default-focused. Bespoke in-drawer forever confirm is the current slap.

**Tango does not decide** close-vs-delete as one wizard with a hard fork, or two; **does not decide** soft-trash vs hard delete. Those are OD-19. Opinion only: two **named** transitions are more honest than a wizard that hides that close and delete are different acts. Discard freely.

Bulk “Select opens” excluding partial-residual (§5.1) is dignity. I should not be able to mass-trash remaining risk because the row still looks “open.”

### Walkthrough B — Circumstance 2 (import 60 days; open on day −90)

Seat: I did the honest thing. I uploaded the file I have. A close has no open. Today that looks like I broke the import, or the app is junk.

**This Spec:** coverage window → explained boundary, not a broken book. Acceptance: 60-day import, day −90 open, no broken book. Declarations if I need to teach the book further — never a fake open fill.

**T-O5 — B0 sentence (dignity). APPROVED:**

> opened before your imported history.

- Subject is the **position**, not me.
- “Your imported history” is the file boundary I own, not a scold.
- Do not swap in: *incomplete import*, *missing open*, *orphan because you truncated*, *fix your file*, *broken book*, *error*.
- Show this sentence **only** when the window actually supports the claim. India’s note (NULL window ≠ unbounded; `import_id IS NULL` stays Orphan close) is also a **Tango honesty** note: saying “opened before your imported history” when we do not know the window is a new lie. Tango does not shape OD-9 columns.

**T-O4 — truncated import is not a failed close (dignity, beside India B1):**

From this seat, uploading a 60-day ToS file must not come back as “orphan close not allowed.” That blames me for truncated history — the exact humiliation C2 exists to stop. Coverage window **explains**. 422 **refuses**. Those are different feelings.

Tango does **not** dispose how Alpha applies the four gates to import commit. India already required a write-path table + OPEN OD. Tango’s member-facing stance, for whoever writes that OD: truncated-history import is an explained boundary, never a member-error close. W2 must not ship a 422 wall on truncated orphans **before** W3 can name the window — that sequence would re-teach “the app is broken” in the release that was supposed to stop it.

Real unmatched closes **inside** the window stay Orphan close. We do not soothe those. Capacity is telling the two cases apart.

**T-O6 — declarations are a lesson, not a Complete button (capacity):**

§8.4 is the law. Chrome must not grow a “Mark complete” / “Resolve” / “Fix” that writes a declaration and makes the red go away. A declaration names a boundary (*this close’s open is outside the imported history*). It does not close the cycle. It does not invent a debit/credit. Hotel still owns the fourth-state **word**.

**T-O7 — hold boundary, named not vanished (trust; not OD-23):**

Today day-book drops me at 30d and the blotter still says Open. I do not know which surface to believe. PPL-7 (one answer) is the right law. Tango does **not** pick “both still Open (named)” vs “both drop / explain” vs fourth-state (India FI-PPL-1). Tango’s only experience constraint: **do not implement agreement as a silent unmount.** Silent drop is “the app ate my position.” Named is “the book has a hold rule.” Ownership of the number 30 remains OD-23 / Hotel.

**T-O8 — expire provenance (capacity, not new plumbing):**

I need to tell *the broker closed this* from *the lab inferred expire-worthless* from *I closed this*. Spec already requires distinguishability (PPL-10). No P&L color. No “you expired for a win.” Chips, not a lecture. Hotel/Echo. Tango does not invent `close_kind`.

**T-O9 — Autofilter (capacity):**

§8.5: do not ship a state the filter cannot name. If I cannot list remaining-risk rows, I cannot review the book. Fourth **token** waits on OD-21; C1 remaining must still be findable (machine key is fine in W1). Tango does not name the token.

---

## Flagged ideas

Never discarded. Coach disposes. Tango does not erase the need.

| ID | Idea | Why flagged | Discuss with |
|----|------|-------------|--------------|
| **FI-TANGO-1** | Close-gate chrome: one named 422 + one override; no four-checkbox pre-flight on a passing close. Keep “Will pair with open #…” | Capacity: override-as-habit. Does not remove Coach’s four gates. | Echo · Charlie · Coach |
| **FI-TANGO-2** | Remaining vs original both visible (Positions **4** primary; open fill stays **5**; close fill **1**). Never member-facing `slot_remaining`. | Capacity: bleeding member will not subtract. Not OD-21. | Echo · Hotel (token only) · Coach |
| **FI-TANGO-3** | 409 member sentence = order rule in English; blocked open is not a confirm-then-fail. | Dignity, not OD-19. | Echo · Coach |
| **FI-TANGO-4** | Hold-boundary agreement must be **named**, not a silent drop — direction still OPEN (India FI-PPL-1). | Trust / “app ate my position.” Not OD-23. | Coach · Hotel · Echo |
| **FI-TANGO-5** | Declaration chrome verbs that cannot be read as Complete / Fix / Resolve-to-done. | Capacity: declarations teach; they are not a soothing bot. | Echo · Hotel (OD-21) · Coach |
| **FI-TANGO-6** | Member-facing stance on India’s import-commit OD: truncated file is explained, not 422-blamed. Sequencing: do not 422 truncated orphans in W2 before the window can speak in W3. | Dignity of C2. Does not answer the OD. | India · Juliet · Coach |

Juliet’s §11 inventory (OD-19/21/9/22/23/24, `as_of` TZ, non-integer qty, PATCH, import-commit, IB, S-3, matcher rewrite PARKED) is **not** discarded. Tango adds the six flags above; does not remove any of Juliet’s.

---

## Build disposition

**APPROVED**

Member psychology / capacity / dignity / profit-claim: the draft’s **law** is the bleeding member’s correction. Coverage window and declarations teach the book; they do not hide it. Incomplete cycles are named, not blamed. Remaining **4** is the risk number. Delete-order is close-first, not a trap, if chrome speaks English. Process-first; no P&L theater on lifecycle chrome.

Tango is **not** BUILD AUTHORITY. India Phase 2 is still **RETURNED** on system seams (B1–B3). Echo still owns HIG / AlertDialog / named-state chrome. Hotel still owns **OD-21** and sits on OD-23 / OD-24. Phase 5 remains Coach.

**Pass (no Tango block):**

- Capacity: window + declarations are inputs; no fake fills; no manufactured Complete (§8.4, PPL-9, PPL-12)
- No profit-claim / no valence / no win-rate on lifecycle chrome (§8.1, §9.4, V8/V15)
- Honest incomplete cycle vs broken-app (§8.1, §6.1, §9.2)
- B0 sentence *“opened before your imported history.”* APPROVED as explanation copy
- Remaining qty **4** after 1-of-5 is law (§8.3, §9.1, §9.5)
- Delete-order close-first + kit confirm + close ≠ delete (§5.3–§5.4, §8.2)
- Four gates remain fail-loud at the API; Tango did not collapse them
- OD-21 not picked; OD-19 not decided
- Coach content intact; both phrases kept

*Tango · Phase 3 · 2026-09-13 · spec not edited · parents not edited · OD-21 not picked · OD-19 not decided*
