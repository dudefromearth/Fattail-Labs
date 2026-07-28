# Seed WK6 — Kilo: Characterization tests

**Project:** p-wiki · **Agent:** Kilo · **Prerequisite:** WK2 + WK4

## Files in scope

- `server/tests/test_wiki_store.py`, `server/tests/test_wiki_api.py` (extend)
- Test fixtures (mini-vault)

## Work

Map §8.1 runbook rows to repeatable tests (Test Suite Spec conventions):

| Test | Covers |
|---|---|
| Draft page → member 404, admin 200 | WI10 / WIK-D2 |
| Published page payload: backlinks, sources, provenance fields | WI3/WI4 |
| Search ranking: title hit above body hit; snippet ~30 words | §4 |
| Graph payload excludes drafts; edges only resolved links | WI7 |
| Reindex idempotency: run twice → same counts, no dupes | WIK-D7 |
| Unresolved wikilink renders (API returns it flagged, no 500) | WIK-D6 |
| Missing LABS_WIKI_ROOT → boot abort | WIK-D4 |
| Anonymous → 401 on all member routes | Mike |

## Completion

- [ ] Full suite green vs dev DB (`pytest tests -q` output pasted)
- [ ] Suite runs in CI-able form (no dependence on Coach's personal vault content —
      fixtures only, real-vault check stays in the runbook)
