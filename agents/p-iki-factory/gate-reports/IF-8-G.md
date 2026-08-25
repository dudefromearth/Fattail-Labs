# IF-8-G — Delta Gate Report

**Gate:** IF-8-G. **Spec:** `Specs/FatTail-Labs-IKI-Factory-Pipeline-Spec-v1_0.md` §7. **Baseline:** commit `87ed7de`. **Verdict: PASS**, with four judgment calls flagged explicitly below — none silently decided, each named as a disposition Coach may want to weigh in on.

---

## 1. Scope delivered

**New lane.** `LANES` tuple: `("backlog", "research", "spec", "build", "staged", "live")`. Additive — no data migration needed for the lane value itself (no existing row was ever in a lane between `build` and `live` that needed moving). New migration `145_iki_factory_if8_staged.sql` adds `staged_ready` (mirrors `built_ready`/`spec_ready`) and the `iki_factory_staged_artifacts` table.

**Build → Staged is Gemba's pull, not the admin's.** Quoted directly from the canonical v1.0 spec (§3.3, not the bench plan's paraphrase — I checked the spec file itself): *"Build → Staged | **Gemba** as build agent | Carries it to the finish line."* This is a real, enforced actor restriction — `validate_move` now rejects an admin attempting this specific transition (`GEMBA_BUILD_PULL` reason) and requires `actor.kind == "agent"`. This is asymmetric with every other transition built so far (Research→Spec and Spec→Build are admin-only; this one is agent-only) and is exactly what the spec's own pull table names, not an invention.

**Staged → Live remains a boundary, not a pull** (v1.0 §8.1) — `execute_deploy` now reads from `staged` (not `build`), gated on `staged_ready` + product-completeness, matching exactly what `build→live` required before this GO, just moved one lane down.

**Staged production (v1.0 §7.3).** Landing in Staged (`_mark_staged`) seeds five artifact rows: `product`, `landing_page`, `store_placement`, `help_page` start `pending`; `wiki_page` starts and stays `blocked`, permanently, with a reason citing §8.10 and the Wiki program. `produce_staged_artifact` lets an admin or an agent (Gemba) record content for the four in-scope kinds — no invention, the caller supplies the body, mirroring exactly how attachments work in IF-6. `wiki_page` is rejected unconditionally, by anyone, including Gemba himself — this is not a permission gap to be closed by trying with the right actor, it's a scope boundary.

**Carried from IF-7-G, item 1 — closed.** `test_gemba_pull_backlog_to_research` proves an agent principal can pull Backlog→Research, which no prior test in this program ever demonstrated despite the pull table naming "Gemba or a human" since IF-7.

## 2. Four judgment calls, named rather than decided silently

**(a) Staged→Live is NOT hard-gated on artifact completeness, including the permanently-missing wiki_page.** §7.6 is normative BUILD AUTHORITY text: *"Nothing goes Live without them [help documentation and a wiki page]."* Read literally, that would make Live **permanently unreachable** under this GO, since wiki_page can never be produced here. I did not implement that reading — it would regress already-shipped, tested Live-reachability (IF-4/IF-7's tests currently pass reaching Live). Instead, Staged→Live checks exactly what Build→Live checked before (staged_ready + product-completeness); artifact status is tracked and visible in the panel, not enforced as a switch condition. `test_staged_to_live_gated_on_staged_ready_and_product_not_artifacts` documents this choice explicitly in its own docstring, including the §7.6 tension, rather than asserting it as settled. **This is the single biggest disposition I'd want Coach's read on before IF-9 or a future Staged-hardening pass.**

**(b) Product-spec fields are now enterable while the card is in `staged`, not just `build`.** The panel's product-type/tier/free-vs-paid section now shows for `spec`, `build`, and `staged` lanes. This wasn't explicitly named in scope, but was necessary for the fields to be settable at the lane where Live is actually reachable from. No test asserts they *can't* still be set while in `build` (they can — I didn't remove that), only that they're also reachable in `staged`.

**(c) No client-trial UI was built.** The order was explicit — "no early-access label, the staging server is the label. Signal only; clients approve nothing" — and I read this as a deliberate ruling that client trial gets **no in-app feature at all**, not a feature I hadn't gotten to yet. Echo's named seat (E-4) was for "the dual-track lane view, agent production alongside client trial" — what I built is single-track (artifact production only), because the second track was explicitly ruled to not need one. Flagging the mismatch between the seat's framing and what actually got built, rather than quietly building only half and calling it dual-track.

**(d) `produce_staged_artifact` accepts either an admin or an agent**, not Gemba exclusively, mirroring IF-2's "no skill registered yet, admin stands in" posture rather than hard-requiring a production skill that doesn't exist. This matches the pattern already established for research (empty skill registry fails loud, doesn't block the admin from working around it), but it does mean an admin can produce all four in-scope artifacts unilaterally today, without Gemba touching them at all — worth naming since the spec's language ("Gemba, equipped with skills, creates...") reads as Gemba's job specifically.

## 3. `git diff --stat` against baseline `87ed7de`

```
 server/iki_factory.py                        | 166 +++++++++++++++++++++++++--
 server/routes/iki_factory_admin.py           |  26 +++++
 server/tests/test_iki_factory_if4.py         |  62 +++++++---
 server/tests/test_iki_factory_if5.py         |  75 ++++++++++--
 web/components/admin/IkiFactoryBoard.tsx     |   6 +-
 web/components/admin/IkiFactoryItemPanel.tsx | 134 ++++++++++++++++++++-
 6 files changed, 432 insertions(+), 37 deletions(-)
```
Plus two new files not in the diffstat (didn't exist at baseline): `migrations/145_iki_factory_if8_staged.sql`, `server/tests/test_iki_factory_if8.py` (10 tests).

**Confirmed zero diff, not touched:** `server/tests/test_iki_factory_if1.py`, `test_iki_factory_if2.py`, `test_iki_factory_if3.py`, `test_iki_factory_if6.py`, `server/routes/iki_factory_live.py`.

**IF-4 and IF-5 needed real changes this time**, unlike IF-7 where IF-2 needed none — because inserting a lane between `build` and `live` breaks every test that reached Live directly from Build (that hop is now a two-step skip, rejected by the existing `ONE_STEP` check). Both files' `_to_build`-adjacent helpers gained a `_to_staged` step; every test that called `_product`/`_deploy` directly needed that same one-line insertion. None of IF-4 or IF-5's actual assertions about *what happens* at Live changed — only *how you get there* did.

## 4. Full suite

```
62 passed in 4.08s
```
52 from before this GO (unchanged) + 10 new (`test_iki_factory_if8.py`). Production build: `✓ Compiled successfully`. `tsc --noEmit` clean on both touched components.

---

## What the acceptance tests did NOT measure

1. **No test proves an admin-produced artifact and a Gemba-produced artifact are indistinguishable to anything downstream** (e.g., to whatever eventually reviews these before Live) — both are accepted identically today, which is judgment call (d) above made concrete: nothing currently cares who actually did the work.
2. **No test exercises Hold blocking `produce_staged_artifact` itself.** Hold blocks *pulls* (movement); artifact production is a content-write action on a card already sitting in Staged, and I never checked whether Hold should also freeze artifact production. Right now it doesn't — a held card in Staged can still have artifacts recorded against it.
3. **No test proves what happens to in-progress artifact drafts if a card is reworked backward out of Staged.** `set_status` (rework) isn't restricted from moving a card out of `staged` to an earlier lane; the `iki_factory_staged_artifacts` rows aren't cleaned up, re-seeded, or marked stale when that happens — they'd just sit there, associated with a card that's no longer in Staged, until it's pulled back in (which would try to re-seed via `ON DUPLICATE KEY UPDATE kind = kind`, a no-op that leaves old content in place). Untested, and I'm not confident this is the right behavior versus resetting them.
4. **No test proves the reverse of judgment call (a)** — i.e., nothing asserts that Coach *could* choose to hard-gate Live on artifact completeness later without a structural rewrite. The current design would need a real code change (not a config flip) to add that gate if Coach decides §7.6 should bind after all.
5. **The panel's "Record" UI for producing artifacts has no test at all** — no Playwright walkthrough, no assertion that the textarea/button pair actually reaches the new endpoint from a real browser session. The API-level round trip is tested; the UI wiring to it is not.
6. **No test proves what a member (non-admin, non-agent session) sees or is blocked from regarding Staged artifacts** beyond the one 403 check (`test_produce_artifact_requires_factory_scope`) — reading is gated the same as everything else via `_factory_actor`, but there's no dedicated test proving a plain member GET is rejected for `/staged`.

---

**Signed:** Delta. Verdict **PASS**. Judgment call (a) — Live not gated on artifact/wiki completeness despite §7.6's literal text — is the one I'd most want Coach's disposition on before this lane is considered settled, not just built.
