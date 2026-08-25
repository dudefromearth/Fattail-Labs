# GO token — IKI Factory IF-7

**ID:** `IKI-FACTORY-IF7`  
**Board:** `agents/p-iki-factory/`  
**Spec:** `Specs/FatTail-Labs-IKI-Factory-Pipeline-Spec-v1_0.md` **BUILD AUTHORITY** (**DL-582**), §3 and §7  
**Charter:** `agents/bench/gemba.md`, invariant 4 — pull, never push (landed, **DL-582**)  
**Plan:** `docs/IKI-Factory-Pipeline-Spec-v0.6-Full-Agent-Bench-Plan-v1.1.md`, IF-7  
**Baseline:** commit `6b79e38` — every edit under this GO has a diff against a real prior state

## DL-539 — three successive OKs (Coach stamps each; not filled by this token's creation)

- [x] **OK 1** — authorizes editing the five functions in `server/iki_factory.py`: `create_idea`'s unconditional Ideas→Research jump; `run_conveyor_spec_to_build`; `run_conveyor_build_to_live`; `execute_deploy` (auto-fire removed — Live stays Coach's); `patch_card`'s spec-ready/plan-attached tail (fires today after *any* successful patch). Plus the two items deferred from IF-6: the lane key rename (`ideas` → the backlog key, across the `LANES` tuple, the migration, and the display-label deferred-note comments) and the priority cut (§2.2 — field, chip, and intake form).  
  **Coach:** Coach  **Date:** 2026-08-25

- [x] **OK 2** — acknowledges this is a rewrite of code that shipped and passed a Delta gate under the opposite rule — conveyor, not pull — not additive work. `test_create_idea_pickup_stub`, `test_plan_attach_conveyors_to_build`, `test_hold_blocks_conveyor_clear_resumes`, and `test_product_spec_writes_published_then_stub` currently assert auto-advance; they become tests asserting it does *not* happen. India's Phase 2 read found no external dependency on the auto-pickup — that is evidence, not a guarantee.  
  **Coach:** Coach  **Date:** 2026-08-25

- [x] **OK 3** — final. Nothing advances itself; every move records an actor and a reason. Delta's silent-conveyor-on-patch finding (IF-6-G, "what the acceptance tests did not measure," item 4) closes here. The board stops moving things on its own.  
  **Coach:** Coach  **Date:** 2026-08-25

**One OK is not three. A break resets the count (doctrine §15 / DL-539).** Recorded here, on this token, in three separate turns — not inferred from a single instruction.

## Isolation

Factory domain only: `server/iki_factory.py`, `server/routes/iki_factory_admin.py`, `server/routes/iki_factory_live.py`, `server/tests/test_iki_factory_if*.py`, a new `migrations/NNN_*.sql` for the lane-key/priority schema change.  
**Never (this GO does not authorize):** rewriting `agents/bench/gemba.md` — the charter is landed (DL-582); this GO implements it, it does not reopen it. Also never: the Staged lane (IF-8) · the wiki publish path (Wiki program's) · `web/lib/runner/**` · Options Lab · Market Bus · Trade Log · `AppChrome`.

## Gate

**IF-7-G** — Delta. Full IF-1…IF-7 suite green. `git diff --stat` against the allowlist above, line by line, against baseline `6b79e38` (a real baseline exists now — produce it, don't approximate it). Re-authored tests, never deleted, each with an inline comment stating what it used to assert and why it changed. Names what the acceptance tests did not measure.

---

**Signed:** Coach  
**Status:** **Granted.** Three of three OKs recorded, 2026-08-25.
