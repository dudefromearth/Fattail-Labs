# W0-G — Wiki Spec v1.2 (plan v1.1)

**Date:** 2026-08-22  
**Delta:** **PASS**  
**Program:** IKI Lab — Wiki · **DL-542** (W0 seated) · **DL-540** confirmed · **DL-539** freeze held

## Criteria

| Check | Result | Evidence |
|-------|--------|----------|
| `wiki_compile_candidates` exists | PASS | migration `132_wiki_compile_candidates.sql` applied |
| Watcher-state row has SHA | PASS | CLI `--sha 9b7a1ed15d28c1775c1ebd7cb2041e69cc3d076f` → `last_sha` recorded |
| Zero candidate rows | PASS | `COUNT(*) = 0`; `first_snapshot: true` |
| Administrator sees empty copy | PASS | Playwright admin: `wiki-compile-inbox` = 1, empty copy = 1 |
| Navigator has no node in DOM | PASS | Playwright practice/activator: inbox = 0 |
| Empty region does not navigate | PASS | inbox links/buttons/forms = 0; URL stayed `/app/wiki` |
| pytest wiki/watcher | PASS | `tests/test_wiki_compile_watcher.py` 11 passed; wiki_api + wiki_store green |
| `pytest tests -q` | PASS for W0 | 1089 passed, 4 skipped; **1 fail outside allowlist** (see below) |
| Diff inside W0 allowlist | PASS | no AppChrome, Options Lab, `web/lib/market/`, course-path, `web/app/app/iki/**` |
| Oscar v0.3 without clobber | PASS | `agents/bench/oscar.md` created; vault `~/.grok/agents/oscar.md` not touched |
| No course-path edits | PASS | |
| No `iki_public` | PASS | |
| No AppChrome / Options Lab | PASS | |
| Design chain | PASS | UX · Echo · Interaction · Tango each PASS (`W0-5-design-chain.md`) |

## CLI (AT-WK5)

```
.venv/bin/python -m wiki_compile_watcher --sha 9b7a1ed15d28c1775c1ebd7cb2041e69cc3d076f
{"last_sha": "9b7a1ed15d28c1775c1ebd7cb2041e69cc3d076f", "first_snapshot": true, "candidate_count": 0}
```

SHA input fail-loud: `--sha` / `LABS_WIKI_WATCHER_SHA` / test fixture. No silent default. No MiniTwo poll.

## Full pytest (SI #10)

`1 failed, 1089 passed, 4 skipped`. Failure is `tests/test_opf_session_envelope.py::test_cl21_ladder_http_carries_opf_session` (`opf_session.market` expected `extended`, got `open`). **Options Lab / OPF — frozen (DL-539).** W0 did not open that tree. Not a W0 defect.

## Design chain

UX PASS · Echo PASS · Interaction PASS · Tango PASS. No “Echo covers all three.” Hotel not on W0. Foxtrot not on W0.

## Oscar collision

In-repo `agents/bench/oscar.md` was absent. Coach GO: seat Labs curator there. Vault Oscar not clobbered.

## W1

Not this gate. Needs second stamp (OD-WK2, OD-WK9).
