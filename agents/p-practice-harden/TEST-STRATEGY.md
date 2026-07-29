# p-practice-harden — intelligent test strategy

**Doctrine:** characterization over coverage theater. A test earns its place only if it
locks a **regression that would hurt members, isolation, correctness, or scale**.

Aligned with `Specs/FatTail-Labs-Test-Suite-Spec-v1.0.md` and Kilo’s seat on this board.

---

## What we keep / write

| Kind | When | Example |
|------|------|---------|
| **Security / isolation** | Any identity, session, or cross-member path changes | id=0 cannot resolve another book outside `dev` |
| **Scale invariant** | Query patterns that break at book size | list trades legs **not** N+1 (assert batch path / query bound) |
| **Domain truth** | Single-source formulas (H1) | golden open-on-day + equity series fixture |
| **Contract stability** | API shape used by Reports/Journal | multi-leg list returns all legs for every trade |
| **Import/export honesty** | I/O that can corrupt books | already covered; extend only on behavior change |

## What we refuse

- Tests that only prove “happy path still 200” with no unique invariant  
- Duplicating isolation already covered by `test_trade_log_legacy_prose_and_isolation`  
- Pure private-helper unit tests that mirror implementation line-by-line  
- Frontend unit farms for structure-only splits (PH2) — smoke / build + selective parity  
- “Dev id=0 still works” as a permanent product invariant (dev convenience, not member risk)

## H0 test map (useful only)

| Invariant | Owner | Status |
|-----------|-------|--------|
| id=0 storage fallback blocked outside `dev` | PH0-1 | **Keep** `test_identity_zero_fallback_blocked_outside_dev` |
| Gate does not break real sessions when env is production-like | PH0-1 | **Keep** `test_real_identity_trade_log_works_when_env_not_dev` |
| Dev id=0 convenience | — | **Drop** (not a product invariant) |
| A cannot list B’s trades | pre-existing | **Do not re-add** in PH0-3 |
| List returns full legs for multi-leg trades (N trades) | PH0-2 | **Done** `test_list_trades_batch_loads_multi_leg_legs` |
| List path does not call per-trade `_load_legs` | PH0-2 | **Done** (same test monkeypatch) |
| PH0-3 | Kilo audit | **Done** — no gaps; no new tests (`gate-reports/PH0-3-review.md`) |

## H1+ (preview)

| Phase | Intelligent tests |
|-------|-------------------|
| H1 domain | Pure golden fixtures (no HTTP) for structure key, open-on-day, realized series — **one** source of truth |
| H1 API | Thin HTTP: isolation + payload fields Journal/Reports need; not re-testing pure domain |
| H2 structure | Existing suite green + optional smoke; no new tests for file moves alone |
| H4 pagination | Correctness under partial load + deep-link still resolves (only if H4 GO) |

## Bar for adding a test (Kilo checklist)

1. What regression does this catch that nothing else catches?  
2. Would a future agent delete this and ship a silent member-facing bug?  
3. Is the assertion stable under legitimate refactors (behavior, not private names—unless the private name *is* the scale seam, e.g. forbidding `_load_legs` on list)?  

If any answer is weak → **do not add**.

## Evidence culture

- Prefer `pytest` command + summary in gate reports.  
- Query-count / path assertions beat “it felt faster.”  
- Never waive Delta for missing evidence on isolation or scale invariants.  
