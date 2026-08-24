# WU-R0-1 India — Wiki Spec v0.2.1 (unified)

**Agent:** India  
**Spec:** `Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md` (DRAFT)  
**Advisor draft:** `Specs/FatTail-Labs-Wiki-Spec-v0_2.md`  
**Plan:** `docs/Wiki-Spec-v0_2_1-Full-Agent-Bench-Plan-v1.0.md`  
**Landing diff:** `reviews/WU-R0-v0.2-to-v0.2.1-diff.md`  
**Date:** 2026-08-23  
**Spec not modified.**

## Verdict

| Question | Result |
|----------|--------|
| Architecture / boundary sound to stamp **if Coach accepts hunks 2–4 as the v0.2.1 bump** | **Yes** |
| Unification introduces a new store or product boundary | **No** |
| Citation map IV.3 vs as-built | **Sound** (advisory nits) |
| II.5 vs Agent spec v0.1.3 §7 carve | **Honored in substance**; wording compressed (ADVISORY) |
| I.1 vs DL-539 | **v0.2.1 hunk 2 aligns**; does not punch the freeze |
| Landing diff recon-only? | **No — FLAG.** Hunks 2, 3, 4 are beyond IV.6 / header. |
| **GO SPEC (this packet’s condition)** | **DO NOT GRANT.** Return to Coach. |
| **BLOCKING invariant / law / system** | **None.** |

Coach Content Law: Coach’s v0.2.1 sentences in hunks 2–4 are **not removed**.
They are labeled **BEYOND recon**, not rejected.

---

## Named charges (plan R0-1 table)

### Unification introduces no new store or boundary

**APPROVED.** I.2 restates WIK-D1: page bytes in git; derived index in MySQL;
ledger = state + **contract evidence**, never page bytes. II.5: no MySQL
content beyond contract evidence. III.2 is a **read path** over published git
pages, not a second corpus. III.3 launcher is chrome over the existing session
API (WA-4). Context-provider registry is config, fail-loud — derived context,
not a store of wiki prose.

**BLOCKING if implemented:** a `wiki_pages` authoring table, or session
transcript treated as published page bytes. Not in this spec.

### Citation map IV.3

**APPROVED as a map.** Old WA1–WA13 / W1–W11 / WI* land in I–III without
creating a parallel program. Gate reports citing SUPERSEDED files remain valid
(IV.4) — correct, do not rewrite history.

**ADVISORY:** IV.3 says Member Wiki D-7 “agent seated” as dissolved; D-1 name
is carried in I.5. Matches DL-551 dissolving D-3 only. Do not banner-edit D-1
as dissolved.

### II.5 vs v0.1.3 §7 (IV.6.a)

In-tree Agent spec v0.1.3 §7 (DL-553):

> Not a second store: no wiki **page bytes** in MySQL. `source_change` and
> `registration` contracts carry pointers and source-authored summaries, never
> copies. **`kind=session` carve (India R0-1 · DL-553):** the live then sealed
> transcript is **contract evidence** on the ledger row, not a wiki page and
> not a fork of `lab-wiki`.

v0.2.1 II.5 restates no-invention with a parenthetical that the invariant
governs **published content**; sealed transcript is ledger evidence; plus
“No content in MySQL beyond contract evidence.”

**ADVISORY (wording, not a block):** II.5 is looser than v0.1.3’s named
`kind=session` carve. On a future nits pass after Coach confirms GO SPEC,
prefer the v0.1.3 sentence beside II.5 rather than compressing it. India
does **not** require that before architecture is stampable. IV.6 said
“correct any divergence to the in-tree text” — this is that nit, **not** a
landing-diff silent edit (II.5 is identical in v0.2 and v0.2.1).

### I.1 does not punch DL-539

**APPROVED in v0.2.1.** Hunk 2 is the sentence that makes this true. Advisor
v0.2 (“absence is a defect, not a default”) could be read as licensing
AppChrome. v0.2.1 closes that. Plan B2 / discovery report match.

### IV.6 (b) Member Wiki edit

Not in the v0.2→v0.2.1 diff. Plan already dispositioned: access hunk absorbed
by I.3; IKI door-rename flagged unrelated. India agrees. On unification,
banner-only SUPERSEDE — do not keep editing Member Wiki v0.1 body.

---

## Isolation

**BLOCKING if WU-1 mounts via AppChrome or `web/app/layout.tsx` without
DL-539 three-OK.** Spec + plan already stop. Chrome ruling is blank this
packet — WU-1 must not start. Not a spec defect.

Factory emit (hunk 3) is **IKI tree**. Wiki packet may **receive** or
GET-poll. **BLOCKING if a wiki seed edits Factory Deploy.** Not this spec’s
wiki-side text.

---

## Bench delta

Landing diff classifier (RECON vs BEYOND) is now an artifact. Next GO SPEC
needs Coach to accept hunks 2–4 as the v0.2.1 bump, or revert them to v0.2
and rename.
