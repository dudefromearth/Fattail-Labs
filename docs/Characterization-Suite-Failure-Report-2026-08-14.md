# Characterization suite failure report

**Date:** 2026-08-14  
**Checkout:** production `main` `9400c65c7c061cbf8a5ca7d3e684d5bb3859a278`  
**Same SHA as MiniTwo.** Not `pile-2026-08-14`. Not Conversation Lab. Not RB-01–08.

**Score:** 873 passed · **31 failed** · **10 errors** · 2 skipped · 916 collected  
**Command:** `cd server && .venv/bin/python -m pytest tests -q --tb=no`  
**Duration:** 264.16s

---

## Why this list was not given sooner

They were named once, thinly. Round 0 (14 Aug) recorded **33 failed / 10 error** on the later StudioTwo checkout and parked the problem as **RB-13** (“suite is not a green characterization gate”). That audit listed families (catalog, board, HARD, help, media, privacy, enroll, resources, retro, curate, trade-log, video, wiki, Bravo smoke) — not this project-by-project map.

After `main` was reset to production the suite was run again and only the **score** was reported when asked. The failure map was not walked until Coach asked *where*.

The bench also never made `pytest tests -q` a ship gate. Phase gates PASS on their own packets. A red full suite can sit for weeks without a Coach-facing alert. **RB-13** is that gap.

---

## They are not one recent project

They are **scattered across ~3 weeks of work (21 Jul – 13 Aug)** and **cluster into a few causes**, not 41 independent bugs.

| Cluster | Count | Cause | Last test-file touch | Recent project? |
|---------|------:|-------|----------------------|-----------------|
| **A. Missing catalog seed** `first-stop-the-bleeding` | **4 fail + 10 error + 1 video fail** = **15** | Tests hard-code that slug. This DB’s published set is `0-dte-foundations`, `campaigns`, `fattail-app`, `fattail-foundations`, `start-here`. Fixture `lesson_slugs` does `detail["modules"]` → **KeyError: 'modules'**. Same missing course breaks enroll, progress, Bunny video, most lesson gating. | Catalog 26 Jul · lessons 2 Aug · progress 4 Aug · video 23 Jul | **No single new project.** Live **dev DB drift** vs old seed names. |
| **B. Strategy Lab Curate** | **5 fail** | **One cause:** `ValueError: Phase 'curation' is full (max 100)`. Tests create bots into a **full** local Curate phase. | **6 Aug** `e5f9719` | **Yes — Curate board / perf guards.** One commit family. Failures are **DB occupancy**, not five separate logic bugs. |
| **C. Resources downloads** | **6 fail** | All hit `assert 404 == 200` (or 302 vs 403) on download paths. | 21 Jul / 27 Jul | **Old Resources suite.** Looks like **route or fixture 404**, not last week’s Options Lab. |
| **D. Auth status-code mismatch** | **3 fail** | Unauth admin paths return **401**, tests want **403** (catalog, media). Privacy wants the word `consent`, gets `Administrator role required`. | 26 Jul / 21 Jul / 25 Jul | **Old P1 auth/catalog/privacy.** One contract drift, several files. |
| **E. One-off product/test drift** | **see table below** | Each is its own file. | mixed | Mixed; **two are last 10 days.** |

**Not in this list:** Conversation Lab, Options Lab Analyzer/Heatmap, Market Bus, Journal v0.7, RB-* law tests. Those commits are **not on this SHA**.

---

## Cluster E — singles

| Test | Why it failed | When the test last moved | Project |
|------|----------------|--------------------------|---------|
| `test_live_bravo_research_pack_smoke` | `XAI_API_KEY is required` — key not in this pytest env | 23 Jul | P2 / Bravo live smoke |
| `test_board_snapshot_and_vision` | Board copy no longer contains exact `"Stop the bleeding"` / `"Content Vision"` | 23 Jul | Admin content board |
| `test_import_api_replace` | Quiz import **403** “Administrator role required” | **1 Aug** | Course quiz import |
| `test_process_meters_mt_empty_then_enrolled` | Formula id `…+mt` vs live `…+mt+active-span-v2` | 31 Jul | FatTail Hard / toughness |
| `test_missing_fields_rejected` | Empty help subject returns **200**, test wants **422** | **4 Aug** | Help desk (DL-211) |
| `test_export_native_thinkorswim_and_roundtrip` | Adapter **`fattail` vs `thinkorswim`** | **11 Aug** | **Trade Log import** (closest to “recent”) |
| `test_reindex_admin_only_and_counts` | Wiki reindex **403**, wants 200 | 29 Jul | Wiki |
| `test_local_analyze_and_validate_ok` | Empty analyze result `[]` | 30 Jul | Retrospective agent |
| `test_rt53_ui_agent_panel_source` | Grep for `"profit"` in retro workspace source failed | 30 Jul | Retrospective UI (this SHA is itself a 13 Aug retro commit) |
| `test_same_lesson_name_ok_in_different_modules` | **409**, wants 200 (create collision) | 2 Aug | Lessons |
| `test_upload_list_reference_guard_delete` | Media delete **200**, wants **409** | 21 Jul | Admin media |
| `test_draft_visible_via_admin_api` | **404** on admin draft course | 26 Jul | Catalog (also seed/admin) |
| `test_admin_catalog_includes_drafts` | Missing slug `tail-hedging-workshop` | 26 Jul | Catalog seed |

Cluster A already counted the other catalog / progress / gating / video rows.

---

## Full fail / error list (from the 9400c65 run)

**FAILED (31)**

- `tests/test_agent_tasks.py::test_live_bravo_research_pack_smoke`
- `tests/test_catalog.py::test_catalog_lists_published_only`
- `tests/test_catalog.py::test_draft_visible_via_admin_api`
- `tests/test_catalog.py::test_admin_catalog_includes_drafts`
- `tests/test_catalog.py::test_admin_course_requires_admin`
- `tests/test_content_board.py::test_board_snapshot_and_vision`
- `tests/test_course_quiz_import.py::test_import_api_replace`
- `tests/test_hard.py::test_process_meters_mt_empty_then_enrolled`
- `tests/test_help.py::test_missing_fields_rejected`
- `tests/test_lesson_gating.py::test_same_lesson_name_ok_in_different_modules`
- `tests/test_media.py::test_upload_list_reference_guard_delete`
- `tests/test_media.py::test_media_endpoints_are_admin_only`
- `tests/test_member_privacy.py::test_admin_read_denied_without_consent_and_allowed_with_grant`
- `tests/test_member_progress.py::test_enroll_round_trip`
- `tests/test_member_progress.py::test_journey_reuses_enrollments_no_second_store`
- `tests/test_resources.py::test_free_resource_downloads_for_any_session`
- `tests/test_resources.py::test_members_resource_blocks_observer_allows_alumni`
- `tests/test_resources.py::test_download_requires_session`
- `tests/test_resources.py::test_description_emoji_round_trip`
- `tests/test_resources.py::test_emoji_length_capped`
- `tests/test_resources_api.py::test_members_only_download_403`
- `tests/test_retrospective_agent.py::test_local_analyze_and_validate_ok`
- `tests/test_retrospective_agent.py::test_rt53_ui_agent_panel_source`
- `tests/test_strategy_lab_curate_perf_guards.py::test_comparison_never_calls_live_correlation`
- `tests/test_strategy_lab_curate_perf_guards.py::test_comparison_sql_execute_budget_not_3n`
- `tests/test_strategy_lab_curate_perf_guards.py::test_comparison_payload_lean_no_dual_full_arrays`
- `tests/test_strategy_lab_curate_perf_guards.py::test_comparison_http_endpoint_perf_guards`
- `tests/test_strategy_lab_curate_perf_guards.py::test_comparison_scales_sql_sublinear_when_n_grows`
- `tests/test_trade_log_import.py::test_export_native_thinkorswim_and_roundtrip`
- `tests/test_video_signed.py::test_admin_put_video_provider_bunny`
- `tests/test_wiki_api.py::test_reindex_admin_only_and_counts`

**ERROR (10)** — all `KeyError: 'modules'` at fixture setup

- `tests/test_lesson_gating.py::test_anonymous_gets_401_even_for_free`
- `tests/test_lesson_gating.py::test_observer_gets_free_but_not_gated`
- `tests/test_lesson_gating.py::test_observer_trial_membership_gets_gated`
- `tests/test_lesson_gating.py::test_alumni_and_above_get_gated`
- `tests/test_lesson_gating.py::test_lesson_payload_has_video_config`
- `tests/test_lesson_gating.py::test_public_landing_payload`
- `tests/test_member_progress.py::test_progress_delta_clamped_to_60`
- `tests/test_member_progress.py::test_watching_90_percent_auto_completes`
- `tests/test_member_progress.py::test_progress_requires_session`
- `tests/test_member_progress.py::test_mark_complete_toggle_on_and_off`

---

## Scattered commits or one blast?

**Scattered.** Last touches on the failing *test files* span **21 Jul → 11 Aug**. No one commit on `9400c65` explains the whole red suite.

What *is* concentrated:

1. **One missing course slug** (`first-stop-the-bleeding`) takes down **~15** nodes (catalog + gating setup + progress + Bunny).
2. **One full Curate phase** takes down **all 5** perf-guard tests (**6 Aug** project).
3. **Resources** is **6 tests, one 404**.
4. **Trade Log import (11 Aug)** is the newest *product* fail — **one test**, adapter name.

`9400c65` itself is **13 Aug** `feat(retrospective): recommend start at 7 days or 5 trades`. That can explain the retro UI grep. It does **not** explain Curate-full, missing course slug, or Resources 404s.

---

## Bottom line

This is a **characterization suite vs a live StudioTwo `labs` DB + env**, not a report that last week’s Options Lab / Conversation Lab broke CI. Those programs are **not on this tree**.

The honest status has been “suite not green” since at least Round 0. The **count** was reported and **RB-13** was filed. This file is the project-by-project map.
