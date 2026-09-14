# HOTEL — Phase 4 Domain Review

**Agent:** Hotel (Trading-Domain Guardian)  
**Date:** 2026-09-14  
**Subject:** `Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md` (**DRAFT**, Juliet Phase 1)  
**Workflow:** spec-create-review-workflow Phase 4. Domain accuracy only. Spec not edited. Parents not edited. No board, no seeds, no curriculum invented.

**Read (this pass):**

- Charter `agents/bench/hotel.md` · doctrine (esp. §11 Coach Content Law, process-outcomes lock)
- Draft spec v0.1 (full) — especially §4.4, §5, §6, §8, §12
- `docs/Practice-Position-Lifecycle-B0-Focused-Audit-v1_1.md` (C1-1, C2-1, OD-21/23/24)
- `docs/Practice-Position-Lifecycle-Source-Audit-2026-09-13.md` (matcher quantity-aware; late close orphans; ToS expire is a real close fill)
- India Phase 2 `agents/p-practice-position-lifecycle/reviews/INDIA-PPL-v0.1-Phase2.md` (O4 two predicates; FI-PPL-1/2) — cited, not re-run
- Trade Log v1.1 §8 partials, §16.6, §16.9 item 8 (no win-rate chrome)
- Positions View v0.2 §5.1 remaining open qty · V8 no valence
- `server/trade_log_domain/matching.py` module docstring + `MAX_STRUCTURE_HOLD_DAYS` comment
- `test_match_refuses_year_long_hold` docstring (“Spreadsheet year typo…”)
- `docs/Trade-Log-Pairing-Orphan-Closes.md` (current member teaching of “orphan” and 30-day)

---

## Up front

This pass **did not change or drop** anything Coach wrote. The spec file was not edited. Objections and OD answers sit here, labeled Hotel.

Juliet kept both Coach phrases (**partial-residual** C1 and **unfinished cycle** C2), transcribed B0’s “absorbing” sentence, and left OD-21 OPEN. Hotel does **not** collapse those phrases in the spec. Hotel **rejects** implementing the absorbing sentence as one member-facing word. That is a labeled recommendation, not a deletion of Coach text.

India’s Phase 2 **RETURNED** (write-path SoR, Privacy parent, exhaustive PPL-2 consumers) is architecture packetability. It is **not** a Hotel domain block and is not re-litigated here.

---

## Bench delta

What the next invocation can do that this one could not:

1. **OD-21 is answered (Hotel → Coach).** Reject “unfinished cycle” as the *absorbing* fourth-state word. Accept it as the **C2** token only. Keep **partial-residual** as the **C1** token. Two predicates, two member words. No third English word as law.
2. **OD-23 is answered (Hotel → Coach).** `30` is a **technical cap against year-typo pairing**, not a curriculum-owned hold duration. Do not change the number in this Spec. Do not teach “close by day 30.”
3. **OD-24 is answered (Hotel → Coach).** FIFO lot *selection* stays engine-owned (PPL-1 freeze). The member **should see which open was consumed** on a partial (pairing provenance). No lot-method picker (no LIFO / specific-id curriculum).
4. Remaining units as displayed open qty is confirmed **trading-honest**. Qty 5 after a 1-of-5 close is a **false book**. Spec PPL-2 already requires 4.
5. Truncated-import orphan must be taught as **opened before the file**, never as “you never opened.” Spec §6.1 already has the member sentence.
6. Synthetic expire-worthless and imported EXPIRED-as-`TO_CLOSE` are **different events**. Spec §4.7 / §9.2 item 8 already requires distinguishability. Assignment / exercise must not inherit the word “expired.”

---

## Coach content intact?

**Yes.** Spec not edited. Both phrases remain in §4.4 / §6.2 / §12. B0 absorbing sentence remains transcribed. ODs 19, 21, 9, 22, 23, 24 remain the B0 set. Matcher rewrite stays PARKED. Hotel recommendations sit **beside** that text.

Nothing of Coach / Claude’s B0 v1.1 contract was dropped by this review.

---

## Blocks (false/reckless trading claim or false book only)

**None.**

The draft does not teach a false book. It **names** the as-built lies (open-at-5, orphan badge on a real partial, truncated-import as broken book, synthetic conflated with broker expire) and requires the honest remainder, the explained boundary, and provenance. Process-only chrome is already law (§8.1, §9.4). Declarations are forbidden from minting fills (PPL-9) — inventing a `TO_OPEN` to soothe a truncated file would have been a block; the spec refuses it.

Hotel would **block** a later packet that:

- displays open qty as original `unit_qty` after a real partial close, or
- badges a 1-of-5 remainder as Orphan close, or
- teaches a coverage-window orphan as “you never opened,” or
- labels synthetic expire-worthless as a broker expire (or an imported assignment as “expired”), or
- ships win-rate / expectancy chrome on this surface, or
- inserts a fake fill to manufacture Complete.

None of those are law in this DRAFT.

---

## Opinions / recommendations (include OD-21 / 23 / 24)

Coach may discard any of these. They are not blocks. They are not silent spec edits.

### OD-21 — fourth-state vocabulary (**Hotel recommendation**)

**Question as posed:** Does Hotel accept **“unfinished cycle”** as the fourth-state vocabulary?

**Answer:**

| Phrase | Hotel |
|--------|--------|
| **partial-residual** (C1) | **Keep** as the member-facing word for remaining units after a *real* partial close. |
| **unfinished cycle** (C2) | **Accept** as the member-facing word for truncated-import / incomplete book. |
| **“unfinished cycle” as the absorbing fourth-state word** (B0 §2.3) | **Reject.** Do not implement one Autofilter token that absorbs both predicates. |

**Why reject the absorbing word (trading honesty, not taste):**

A 1-of-5 close is **two finished facts**: 1 unit is closed; 4 units remain open. That is remaining inventory — capital still on. It is not missing history. Calling it “unfinished” teaches the member that leftover size is a defect they must “finish,” which is process-pressure dressed as status, and it conflates **residual risk** with **unknown book**.

A truncated-import orphan is the opposite job: the close is real; the open likely predates the file. The cycle cannot be told. **Unfinished cycle** is the honest word *there*. Teaching that close as “you never opened” or as the same token as a 4-lot remainder would make a bleeding trader filter one bucket and get two different jobs.

India O4 is correct that these are **two predicates**. Hotel disagrees that they should share a **member-facing** token. Machine keys may be distinct (`partial_residual` vs `unfinished_cycle`). Echo owns chrome. W1 may emit a machine key for the C1 remainder without locking Autofilter copy (already Juliet / India). C1 acceptance stays **partial-residual** until Coach disposes this OD.

**Do not invent a third English word as law** (no dangling, pending, incomplete, leftover). Hotel uses only Coach’s two phrases.

B0’s absorbing sentence stays in the spec as transcribed Coach/Claude. Hotel is not deleting it. Coach disposes: implement two tokens, or overrule Hotel and share one.

**Labeled Hotel recommendation for Coach Phase 5:** dispose OD-21 as **two member-facing tokens, Coach’s two phrases, no absorbing collapse, no third word.**

---

### OD-23 — is 30 curriculum-owned or a technical cap? (**Hotel recommendation**)

**Answer: technical cap against year-typo pairing. Not curriculum-owned. Do not change the number in this Spec.**

Evidence (not inference):

- `matching.py` module docstring: refuse pair when the hold is absurdly long, *“e.g. spreadsheet year typo 2026-05-12 open → 2027-05-12 close.”*
- Comment on the constant: *“Legitimate multi-day holds in the 0DTE book are ~1 week; a year-long pair is always bad data.”*
- `test_match_refuses_year_long_hold`: *“Spreadsheet year typo must not pair open→close a year later.”*

Thirty calendar days is a **safety bound** so a year-shifted spreadsheet does not keep a structure in open interest for twelve months. It is **not** a lesson that members must flatten by day 30. FatTail process does not own “30-day max hold” as curriculum. Defined-risk weeklies and monthlies honestly live past 30 days; pairing-refusal at day 31 is the cap firing, not a method.

**Do not silently change 30.** Agreement at the **current** 30-day boundary (PPL-7) stays in-scope. Who owns a future number is Coach.

**Do not teach 30 as a holding-period rule** in blotter copy, Autofilter, or the pairing explainer. A late close that fails the cap is not “you held too long” and not “you never opened.” It is a **pairing-window** miss (India **FI-PPL-1** is the direction of agreement — both still Open named / both drop-or-explain / named state — distinct from this OD). Hotel on that flag: whatever direction Coach picks, the member sentence must not moralize the hold.

If Practice later needs a **curriculum** hold window (style × horizon), that is a different named number owned in a curriculum spec — not this matcher constant wearing a lesson.

Existing member doc `docs/Trade-Log-Pairing-Orphan-Closes.md` currently lists “Within **30 days**” as a pairing rule and tells members to fix `exec_at` so they pair. That can teach **backdating to satisfy the cap**. When parents are amended, that sentence should name the cap as typo-guard, not as a lever. Not this pass.

---

### OD-24 — FIFO lot selection visible on partials? (**Hotel recommendation**)

**Answer: visible as pairing provenance. Not a member lot-picker.**

When two (or more) opens share a structure key, FIFO consumes the oldest slot first. A close of 1 against two 5-unit opens leaves **open A at 4** and **open B at 5**. If the member cannot see which open took the slice, the **aggregate** remainder can be honest while the **lot** book is a lie: they will manage the wrong remaining structure.

Positions View v0.2 §5.1 already names “lot detail tap-deep.” That is the parent this Spec should not contradict.

**Hotel recommendation:**

- **Yes — show which open id (and open day) the partial consumed.** The matcher already records the slice on that slot (`closes[]`). This is display of FIFO, not a new engine.
- **No — do not let the member pick LIFO / specific-id / “close this lot.”** That would invent tax-lot curriculum the Practice blotter does not teach. PPL-1 freeze stays. Override remains the existing four gates (orphan / account / partial units / drift), not a lot method.
- Sheet copy already has “Will pair with open #…” (Trade Log §16.5). Partial should keep that grain: pair with **open #N, 1 of 5**, remainder **4** on that open — not a silent oldest-slot.

Not in-scope until Coach disposes (already §11). W1 remainder qty does **not** require lot chrome; W1 still must put the remainder on the **consumed** open, not smear it across the structure key.

---

### Remaining units as displayed open qty (C1-1 positions overstatement)

**Confirmed trading-honest.** Spec PPL-2 / §4.3 / §9.1 / §9.5 is the correct book.

Worked example: open 5, close 1 → remaining **4**. Positions and capital report **4**. Reporting **5** is a **false book** — capital overstatement, not cosmetic chrome. Source audit and B0 v1.1 already elevated this. Hotel would have blocked the spec if it had left qty at original `unit_qty`.

Matcher grain stays: `open_units == 5`, `closed_units == 1`, `slot_remaining == 4`, `m.close is None`. Read models consume `slot_remaining`. Do not rewrite the matcher to split lots (would break `test_partial_close_leaves_remaining_units_open`).

**Avg cost (labeled, not a block):** “scale to the remainder” must not be misread as re-averaging the remaining lot with the close proceeds. Per-unit avg of the remainder is the **open’s** avg; cost basis = avg × remaining units; the closed 1 realizes separately. Same formula as today, with qty = remaining. Do not invent a second cost model (already Juliet). India: qty SoR is the **match slot**, not `open_qty_and_avg_cost(trade)` — Hotel agrees; a fill helper that cannot see `slot_remaining` will keep overstating residual capital.

---

### Truncated-import orphan is not “you never opened” (C2-1)

**Confirmed.** An unpaired `TO_CLOSE` whose open would fall **before** the coverage window is an explained boundary, not a broken book and not a confession that the member failed to open.

Spec §4.5 / §6.1 member sentence (*“opened before your imported history.”*) is the honest teaching. Keep it. Echo/Tango may calm the prose; they may not replace it with “orphan,” “missing open,” or “you never opened.”

Today’s pairing explainer teaches orphan as structure/clock mismatch. That is true **inside** the window. **Before** the window it is a different claim. Parent amend when this ships.

Declarations that explain “open is outside imported history” are inputs to derivation, **never** a minted `TO_OPEN`. A fake open to manufacture Complete would be a false cycle — already forbidden (PPL-9 / PPL-12). Hotel lock.

---

### Synthetic expire-worthless ≠ imported EXPIRED as `TO_CLOSE` (C2-4)

**Confirmed; distinguishability is required, not optional chrome.**

These are different events:

| Event | What it is | What it is not |
|-------|------------|----------------|
| **Imported EXPIRED / ASSIGN / EXERCISE** | Broker (ToS) reported a terminal as a **real `TO_CLOSE` fill** at 0. Locked by `test_parse_tos_expired_pos_effect_is_to_close`. | Not the app inventing a close. |
| **Synthetic expire-worthless** | Derived, `id = -open.id`, never persisted. The **lab** claims leftover units expired at 0 because expiry ≤ `as_of` and no close fill exists. | Not a broker print. Not “we closed it at the venue.” |
| **Member close** | Stored `TO_CLOSE`, `entry_source=manual` (or `automated`). | Not expire. |

Teaching synthetic as “the broker expired this,” or teaching imported expire as “the app filled in a close,” is a false market event. Spec §4.7 / §6.4 / §9.2 item 8 already requires the triad. India O5: triad is distinguishable without a `close_kind` column. Hotel accepts that for the triad.

**Stricter copy (recommendation, not block):** assignment is not expiration; exercise is not expire-worthless. Member-facing chips must not collapse ASSIGN / EXERCISE into the word **“expired.”** India’s **FI-PPL-2** (persist broker Pos Effect on the existing fill) is the honest way to say “Expired (imported)” vs “Assigned (imported)” vs “Closed (imported).” Until Coach wants that chip, the minimum is: synthetic labeled synthetic; imported terminal labeled imported; member close labeled member. Never one word for all three.

An imported expire **with** its open in the book is a real close → Complete of that pair is honest. An imported expire **without** its open is C2-1 / unfinished cycle, **not** Complete. Do not teach unpaired imported expire as a finished cycle.

---

### Process outcomes only

Spec §8.1 (P&L optional and neutral, never the headline, no profit-claim marketing, no valence on G/L) and §9.4 (Trade Log §16.9 item 8 — **no win-rate chrome**) stand. Hotel third-lock: **no win-rate, no expectancy, no ranked P&L queues** on blotter, Positions, or this program’s named states. Incomplete-cycle chrome is a **named book state**, not a performance score.

---

### Other domain notes (not ODs, not blocks)

- **Close ≠ delete (PPL-5).** Closing writes a fill; deleting destroys a row. Collapsing them would teach destruction as a close. Already law. OD-19 (wizard vs two / soft-trash) is Echo · Mike → Coach; Hotel does not dispose it. Soft-trash vs hard is not a trading-claim.
- **Full-structure close remains the UI default; partial is explicit.** Honest. Domain already consumes partials; the gate is honesty, not engine capability.
- **Hold-boundary direction (India FI-PPL-1)** is not OD-23. Hotel: do not pick. Do not moralize. One answer on blotter and day-book.
- **Import-commit vs orphan-gate 422** (India B1 / Juliet flag): 422-ing truncated files would refuse the common honest import. Hotel domain view agrees with India’s labeled split (honesty gates on member writes; explanation on imported history) — Coach disposes the new OD. Not answered here.

---

## Flagged ideas

Juliet §11 inventory is **not** discarded. Hotel adds / joins:

| ID | Idea | Why flagged | Discuss with |
|----|------|-------------|--------------|
| **OD-21** | Two member tokens (partial-residual · unfinished cycle), no absorbing collapse | Hotel recommendation above. Coach disposes. | Coach |
| **OD-23** | 30 = typo-guard, not curriculum max-hold; number unchanged | Hotel recommendation above. | Coach |
| **OD-24** | FIFO provenance visible; no lot-method picker | Hotel recommendation above. | Coach · India |
| **FI-PPL-1** (India) | Hold-boundary **agreement direction**, distinct from OD-23 | Hotel joins: no moralizing “held too long.” | Coach · India |
| **FI-PPL-2** (India) | Persist broker Pos Effect so ASSIGN / EXERCISE / EXPIRED are not the word “expired” | Hotel joins: those are different market events. Not required to ship the C2-4 triad. | Coach |
| **FI-PPL-H1** | Parent pairing explainer currently teaches 30-day as a member pairing lever (`exec_at` edit) | Can teach backdating to beat a typo-guard. Amend when parents version. Not this pass. | Lima · Echo · Coach |
| **FI-PPL-H2** | Remaining-lot avg cost = open avg; cost basis = avg × remainder; do not mix close proceeds into remaining avg | Prevent a second false book on avg cost. Juliet already “same formula.” | India · Alpha |

---

## Build disposition

**APPROVED**

Domain: the DRAFT does not teach a false book or a reckless claim. It requires remaining units, forbids fake fills, names truncated import as an explained boundary, requires expire provenance, and keeps process-only chrome. Both Coach phrases are intact; OD-21/23/24 were correctly left OPEN for this seat.

**Hotel OD answers for Coach Phase 5 (recommendations, not silent law):**

1. **OD-21 — reject absorbing; keep both phrases as two member-facing tokens.** Accept **unfinished cycle** for C2 only. Keep **partial-residual** for C1. No third word.
2. **OD-23 — technical cap, not curriculum. Leave 30.**
3. **OD-24 — show which open FIFO consumed; do not add a lot picker.**

India’s **RETURNED** (B1–B3) still sits on packetability. Echo + Tango still own chrome and incomplete-cycle pressure. Hotel does not block this file on those seats.

---

*Hotel · Phase 4 · 2026-09-14 · spec not edited · parents not edited · no curriculum invented*
