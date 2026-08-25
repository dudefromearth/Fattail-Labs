# IF-7-G — Delta Gate Report

**Gate:** IF-7-G. **GO:** `agents/go/IKI-FACTORY-IF7.md`, three OKs recorded, verified before the first edit. **Baseline:** commit `6b79e38`. **Verdict: PASS**, with full disclosure of scope growth beyond the five named functions and four named tests — every expansion is named, reasoned, and shown before/after below.

---

## 1. Scope delivered — the five named functions

| Function | What changed |
|---|---|
| `create_idea` | Priority param removed. The unconditional Ideas→Research jump (second `UPDATE` + `_log` + `attempt_research` + skill-run block) deleted entirely. Card now lands in `backlog` and returns immediately. |
| `run_conveyor_spec_to_build` | **Deleted.** Zero callers remained once `patch_card`'s and `move_card`'s auto-invocations were removed. |
| `run_conveyor_build_to_live` | **Deleted.** Same reason. |
| `execute_deploy` | `auto` parameter removed. Hold check now unconditional (`if card.get("hold")`, not `if auto and card.get("hold")`). Still the only path that writes Live — now reached exclusively via an explicit `move_card(to_lane="live")` pull. |
| `patch_card` tail | The `if lane=="spec" and spec_ready: return run_conveyor_spec_to_build(...)` / `if lane=="build" and built_ready: return run_conveyor_build_to_live(...)` branches deleted. A patch now only ever patches. |

**One thing India's scope list didn't name, found while removing the tail:** `move_card` itself had its *own* onward-chaining calls to both retired functions (after landing in `spec`, and after landing in `build`) — a second, independent auto-fire path beyond `patch_card`'s. Both removed; `move_card` now returns immediately after any pull instead of chain-checking whether the next lane is also ready.

## 2. Deferred-from-IF-6 items

- **Lane key rename:** `LANES` tuple `"ideas"` → `"backlog"`. New migration `144_iki_factory_if7_backlog_lane.sql` moves existing rows (`iki_factory_cards.lane`, both sides of `iki_factory_transitions`). Verified against the real, non-test card (id 31, "Ways to use GEX with 0DTE") — it migrated to `backlog`, not orphaned. Zero rows left at `lane='ideas'` after migration.
- **Priority cut:** removed from `create_idea` (silently ignored if sent — matches create's existing lenient-body convention), removed from `patch_card`'s allowed set (now fails loud, 422 "unknown field: priority" — patch has always been strict), removed from `_row()`'s response shape, removed the now-dead `PRIORITIES` constant. The database column itself is left in place, unused, at rest — dropping it would be a destructive schema change this GO's scope didn't ask for.

## 3. Every move now records an actor and a reason

Structural, not incidental: `validate_move` and `move_card` no longer accept an `auto` parameter at all — there is no code path left that can set `auto_move=True` on a transition. `_log` still writes the column (schema untouched), but every call site now passes `auto=False` explicitly. Confirmed by `test_lineage_idea_to_published`'s rewrite: `assert not any(t["auto_move"] for t in trans)` across the entire idea→published lineage, and `assert all((t.get("reason") or "").strip() for t in trans)` — reason is universal now, not just present on the auto-moves that no longer exist.

**Hold's semantics changed structurally, not just incidentally:** removing `auto` collapsed `if auto and hold` to `if hold` — Hold now blocks every pull, for every actor, at every lane, not just what used to be auto-fired. I checked this doesn't contradict any existing test's premise (none tested "admin overrides Hold via manual move") before making it unconditional.

## 4. `git diff --stat` against baseline `6b79e38`

```
 server/iki_factory.py                        | 256 +++++++++------------------
 server/routes/iki_factory_admin.py           |  10 +-
 server/tests/test_iki_factory_if1.py         |  73 ++++++--
 server/tests/test_iki_factory_if3.py         |  70 +++++++-
 server/tests/test_iki_factory_if4.py         | 100 +++++++++--
 server/tests/test_iki_factory_if5.py         | 103 +++++++++--
 server/tests/test_iki_factory_if6.py         |  30 +++-
 web/components/admin/IkiFactoryBoard.tsx     |   8 +-
 web/components/admin/IkiFactoryItemPanel.tsx |   6 +-
 9 files changed, 416 insertions(+), 240 deletions(-)
```
Plus one new file: `migrations/144_iki_factory_if7_backlog_lane.sql` (not in the diffstat — didn't exist at baseline, nothing to diff against).

**`server/tests/test_iki_factory_if2.py` — zero lines changed**, confirmed by `git diff --stat` returning nothing for it. This is the one piece of evidence I'd point to first: the shared-helper strategy (below) meant IF-2's four tests needed no edits at all despite the entire mechanism they depend on being retrained underneath them.

**Confirmed zero diff, not touched:** `server/routes/iki_factory_live.py`, `server/iki_factory_media.py`, `server/iki_factory_research.py`, `server/iki_factory_woo.py`, `web/components/iki/IkiFactoryLiveCatalog.tsx`, `web/app/admin/iki-factory/page.tsx`, `web/e2e/iki-factory-if1.spec.ts`.

## 5. Test re-authoring — the four named, and what I found had to join them

**Named, full before/after in each test's own docstring now** (not repeating the diffs here — they're in the files with explicit "BEFORE (shipped, IF-N-G PASS) / AFTER" sections):
- `test_create_idea_pickup_stub` (IF-1)
- `test_plan_attach_conveyors_to_build` (IF-3)
- `test_hold_blocks_conveyor_clear_resumes` (IF-3)
- `test_product_spec_writes_published_then_stub` (IF-4)

**Not named, but directly invalidated by the same retrain — re-authored with the same discipline, flagged here explicitly rather than folded in silently:**
- `test_hold_blocks_deploy_clear_resumes` (IF-4) — identical mechanism to the named IF-3 Hold test, one lane further down.
- `test_hold_skips_spec_and_live` (IF-5) — same mechanism, exercised across both gates in one lineage.
- `test_lineage_idea_to_published` (IF-5) — asserted `auto_move=True` and the old `"ideas"` lane key across the full pipeline; both were directly falsified.
- `test_priority_unchanged_and_still_required_on_create` (IF-6) → replaced by `test_priority_cut`, since this GO's own named scope (the priority cut) directly contradicts what that test's own docstring said was out of scope for IF-6.

**Shared test infrastructure retrained (not "tests" themselves, but load-bearing for the whole suite):** `_create`/`_deposit`/`_pull_to_research` (IF-1), `_to_build` (IF-4 and IF-5 — two separate copies), `_publish` (IF-5), plus a new `_deploy` helper (IF-4) for the five tests that called `_product` directly expecting immediate auto-deploy (`test_woo_absence_leaves_published_not_build`, `test_paid_not_obtainable_free_is`, `test_catalog_visibility_by_id`, `test_gemba_cannot_rework_published` — one line added to each, no assertion logic changed). `_to_spec` (IF-3) needed **zero** changes — it was already calling the explicit `/move` endpoint.

## 6. Full suite

```
52 passed in 1.79s
```
Same total as before this GO (52) — no test added or removed, only retrained. Full production build (`npm run build`) — `✓ Compiled successfully`. `tsc --noEmit` clean on both touched components.

---

## What the acceptance tests did NOT measure

1. **No test exercises Gemba (an agent principal) actually pulling Backlog→Research.** The pull table names "Gemba or a human" for this transition; every test that reaches this path uses the admin cookie. `validate_move` places no restriction here, so it should work — but nothing proves it.
2. **No test proves Hold does *not* block rework** (`set_status`). I left that function untouched deliberately (not named in scope), but "Hold is sacred, available at every lane" (v1.0 §3.6) could be read to include rework, and nothing here confirms which reading is correct or that the current behavior is intentional rather than an oversight.
3. **No concurrency test.** Two actors pulling the same card at the same moment relies on the existing `db.transaction()` row-locking to serialize correctly; that guarantee is structural, not demonstrated by a test.
4. **The generic fallback reason (`f"Pulled by {actor.label}."`) is untested for non-admin actors.** Every rewritten test that checks reason text does so against admin-initiated pulls; an agent's `actor.label` value flowing into that same string was never observed.
5. **No test asserts a card can sit in `backlog` indefinitely without anything happening to it.** "Nothing advances itself" is proven by absence (no test shows it moving) rather than by a positive assertion that time or unrelated activity doesn't eventually move it.
6. **The retained-but-unused `priority` column's harmlessness is inferred, not demonstrated** — no test writes a row with a stray priority value and confirms nothing downstream trips on it.

---

**Signed:** Delta. Verdict **PASS**. GO token `IKI-FACTORY-IF7` fully discharged for its named scope; the six items above are named gaps for whoever picks up IF-8, not blockers to this gate.
