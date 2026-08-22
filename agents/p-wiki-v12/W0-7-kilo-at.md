# W0-7 — AT evidence (Kilo)

**Date:** 2026-08-22  
**Depends:** W0-5 (DOM placed) · W0-3 (watcher stub)

## AT-WK5 — PASS

First SHA → watcher-state has SHA, `COUNT(*)` on candidates = 0.

```
cd server && .venv/bin/python -m pytest tests/test_wiki_compile_watcher.py -q
11 passed
```

`test_at_wk5_first_sha_zero_candidates`: fixture SHA `aaaaaaaa…` recorded on `wiki_compile_watcher_state`; candidates 0.  
`test_first_sha_named_error_if_candidates_exist`: `WikiCompileWatcherError` / AT-WK5 snapshot text; SHA not recorded (txn rollback).

CLI:

```
.venv/bin/python -m wiki_compile_watcher --sha <hex>
# {"last_sha": "...", "first_snapshot": true|false, "candidate_count": 0}
```

Missing SHA fails loud (no silent default, no MiniTwo poll).

## AT-WA1 — PASS (server + live DOM)

- `/api/wiki/index` `admin: true` for `administrator`; `false` for `navigator` (`test_index_admin_flag`).
- Live Playwright (`localhost:3000`, 2026-08-22):
  - `/api/auth/dev-login` → `/app/wiki`: `wiki-compile-inbox` = 1, empty copy = 1, stayed on `/app/wiki`
  - `/api/auth/dev-login-practice` (activator): inbox = 0, empty = 0, stayed on `/app/wiki`

## AT-WA6 (W0 reading) — PASS

Empty region contains no `<a>`, `<button>`, or `<form>` (`linksInInbox` = 0). Compile/Dismiss buttons = 0. Does not navigate. Full stay-put-on-action is W1-G.

## AT-WA11 — see W0-G `git diff --stat`

Declared W0 allowlist includes `migrations/`, `server/`, `web/app/app/wiki/**`, Wiki Spec v1.2 r4 nits, Admin v0.1.2, `agents/bench/oscar.md`, `Architecture/00-decision-log.md`. SQL does not fail W0. No AppChrome, Options Lab, `web/lib/market/`, course-path.

## SI #10

`tests/test_wiki_compile_watcher.py` + wiki characterization: green.  
Full `pytest tests -q`: **1089 passed, 4 skipped, 1 failed** — `tests/test_opf_session_envelope.py::test_cl21_ladder_http_carries_opf_session` (`opf_session.market` expected `extended`, got `open`). **Frozen tree (DL-539).** W0 did not touch OPF / chain-ladder. Not a W0 defect; not fixed in this packet.
