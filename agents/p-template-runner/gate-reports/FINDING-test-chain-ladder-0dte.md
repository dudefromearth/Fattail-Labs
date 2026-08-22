# Separate finding — not TR-P1

**Owner:** Options Lab chain ladder / Massive live AT (not Template Runner).  
**Do not mix into TR-P1-G defects.** TR-P1 did not touch `server/`.

## Test

`server/tests/test_chain_ladder.py::test_live_zero_dte_fits_one_page_monthly_friday_does_not`

Hardcoded fixture dates in the test:

```python
zero = "2026-08-20"
friday = "2026-08-21"
if date.fromisoformat(friday) < et:
    pytest.skip("fixture expirations have settled")
```

Skip is strict `<`, so on **2026-08-21** the Friday fixture is not skipped. `zero` (2026-08-20) has settled.

> Root cause: hardcoded fixture dates `2026-08-20` / `2026-08-21` with strict `<` skip. Remedy candidates: compute the 0DTE fixture from the session calendar, or skip with `<=`. Hardcoded dates violate SI #2.

## Failure (this working tree, TR-P1 uncommitted)

```
tests/test_chain_ladder.py:542: in test_live_zero_dte_fits_one_page_monthly_friday_does_not
    assert len(z) == 200
E   assert 0 == 200
E    +  where 0 = len([])
FAILED tests/test_chain_ladder.py::test_live_zero_dte_fits_one_page_monthly_friday_does_not
1 failed in 0.21s
```

`git diff HEAD -- server/tests/test_chain_ladder.py` is **empty**. File last committed on `14b622d`.

## Fails on clean main with TR-P1 absent?

**Yes.** `origin/main` == `14b622d`. Worktree `/tmp/ftl-trp1-main` (detached `14b622d`, no runner files):

```
tests/test_chain_ladder.py:542: in test_live_zero_dte_fits_one_page_monthly_friday_does_not
    assert len(z) == 200
E   assert 0 == 200
E    +  where 0 = len([])
FAILED tests/test_chain_ladder.py::test_live_zero_dte_fits_one_page_monthly_friday_does_not
1 failed in 0.23s
```

Main is red on this live calendar fixture independent of TR-P1.
