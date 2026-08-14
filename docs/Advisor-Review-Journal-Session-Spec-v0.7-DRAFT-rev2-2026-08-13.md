# Advisor Review — Journal Session Spec v0.7 DRAFT rev 2

**Date:** 2026-08-13  
**Input:** [`Specs/FatTail-Labs-Journal-Session-Spec-v0_7-DRAFT_1.md`](../Specs/FatTail-Labs-Journal-Session-Spec-v0_7-DRAFT_1.md)  
*(Rev 1 remains at `…-DRAFT.md`. Rev 2 is the `_1` file.)*  
**Reviewed against:** v0.3 architecture · B-Agent override · prior review H1–H6 / S1–S5 · Trade Log v1.1 · as-built `journal_session_structured.py`  
**Reviewer:** Architecture / India-shaped check (Grok)

---

## Verdict

**PASS — ready for Coach GO** after three small polish items (none reopen the charter).

Rev 2 folded every must-fix and should-fix from the first review. Heat-gate clock, kind matrix, confirmation-event SoR, closed field *rule*, lawful empties, parents, J7 slices, reserved references table, effort-map keys, and dismiss ≠ presence withdrawal are all now law.

Do not walk any of that back.

---

## Disposition of rev-1 findings

| ID | Rev-2 result |
|----|----------------|
| **H1** heat-gate clock | **Addressed.** Request-time derived open book; date not an input; any active account; fail-closed; overnight suppresses `coach_day_open`; consumed, not deferred. |
| **H2** kind × heat matrix | **Addressed.** §4.3 table + focus no-op + overnight / late-dump rules. |
| **H3** confirmation event SoR | **Addressed.** `member_journal_confirmations`; no member message; same-txn write; interview path uses the same law. |
| **H4** closed field set | **Rule addressed; keys not listed.** See P1. |
| **H5** lawful empties | **Addressed.** §4.2a; no-campaign day-open; empty digest silent. |
| **H6** parents / portability | **Mostly addressed.** Own Spine + Campaign cited. Portability still says v1.3 “advisor copy” vs this repo’s **v1.4**. See P2. |
| **S1** build order | **Addressed.** J7-0…J7-7; charter GO = J7-0…J7-4. |
| **S2** star vs references | **Addressed.** Journal defines the mark; references reserved to Retro. |
| **S3** effort-map keys | **Addressed.** Closed set `{day_open, surface, extract, mechanical_turn}`; missing/unknown aborts boot. |
| **S4** dismiss vs presence | **Addressed.** |
| **S5** empty digest | **Addressed.** |

B-Name, B-Journey-Feed, B-Personalize, B-Campaign-bind remain correctly **open**.

---

## Remaining polish (fold before or in J7-0 — not a rewrite)

### P1 — Name the closed field keys (Hotel / Kilo)

§6 says “only keys already defined by the v0.6 structured interview schema.” **v0.6 never enumerates keys.** As-built SoR is `server/journal_session_structured.py` (v0.2 lineage):

`instrument` · `thesis_direction` · `trigger_level` · `size_risk` · `invalidation` · `watching` · `plan_diff` · `deviations` · `what_worked` · `open_thread` · `differed_from_plan` · `note`

**Add that list (or “union of as-built `TAG_FIELD_SPECS` keys”) as the closed set.** Unknown key stays a hard reject.

Also state: extract-and-confirm **does not restore v0.2 required-for-complete / seal gates.** v0.6 optional/absent law holds. Tags still do not drive interview scripts.

### P2 — Portability cite this repo

This repo’s authority is **Practice Portability v1.4** (BUILD AUTHORITY). Rev 2 should cite v1.4 and require a **v1.5** bump. Open decision #6 can close on that sentence.

### P3 — Heat-on *asked* analysis still rejects

§5.2 says “answers if asked” and “zero analysis.” Verification only fixtures **unprompted** turns.

**Add:** while the book has unmatched opens, a member question that would produce analysis is still a hard reject (or a named non-analytic refusal: wait / acknowledge). Fixture: heat on + “what do you think of this trade?” → no analytic render.

That is the doctrine: holding risk, not “unprompted only.”

---

## Nits (optional)

- Promote `…-DRAFT_1.md` to replace `…-DRAFT.md` so there is one current file. Keep rev-1 in git history.
- §3 can say playbook may be quoted as current RAM when no campaign is active; snapshot-at-load applies only with an active campaign. §4.2a already omits the loaded-rules *block*; this just prevents Alpha from treating “no campaign” as “no playbook.”
- `structured_provenance_json` is a projection of `member_journal_confirmations`, not a second SoR. One sentence prevents drift.
- Add Kilo fixture: overnight hold through RTH close → flatten after hours → `coach_day_close` fires once; no late `coach_day_open`.

---

## GO recommendation

**Coach may GO this spec** with P1–P3 as same-day editorial (or first lines of J7-0). The charter, rails, and inheritance map are stable enough to plan.

Charter GO scope remains **J7-0 … J7-4** (drafts, heat signal, guide + extract, notify/presence). Voice and star stay later slices on the same spec.

Next step (this reviewer, after Coach GO or after P1–P3 land): **implementation plan** from rev 2 + v0.3 + B-Agent DL draft.
