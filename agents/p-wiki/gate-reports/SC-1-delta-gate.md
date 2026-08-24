# SC-1-G Delta Gate — Source Contract envelope + watermark (2026-08-24)

**Gate:** plan v1.0 SC-1-G  
**Spec:** Source Contract v0.1.4 · **GO SC-1** · **DL-568**  
**Verdict: PASS**

Delta did not modify the work under review.

No compose. No poll adapters. No Factory emit. No UI. No AppChrome.
No `web/lib/runner/**`. Remaining ODs 4, 6, 7, 8, 9, 10, 12, 13, 14 stay holds.

## Seam (India SC-1-0)

One portal `POST /api/wiki-agent/contracts`. `source_kind` present → Source
Contract schema. `kind=session` without `source_kind` unchanged. Ledger kind
`source_contract`. No second portal.

## Allowlist

| Path | Role |
|------|------|
| `migrations/139_wiki_source_watermarks.sql` | watermark table (no body) |
| `server/wiki_agent_schema.py` | `parse_source_envelope` |
| `server/wiki_agent_store.py` | `accepted` / `failed-partial`; watermark upsert |
| `server/routes/wiki_agent.py` | portal seam + disposition |
| `server/tests/test_wiki_source_contract.py` | Kilo |
| `agents/p-wiki/seeds/SC-1-*.md` | seeds |
| `Architecture/00-decision-log.md` | **DL-568** |
| `Architecture/11-wiki-design.md` | SC-1 as-built |

## Evidence

### Migration / columns

```
watermarks ['source_kind', 'source_id', 'content_hash', 'seen_at', 'contract_id']
contracts body_md ()
```

No `body` / `body_md` on `wiki_source_watermarks`. `wiki_contracts.body_md` absent.

### Characterization (`tests/test_wiki_source_contract.py`)

```
........                                                                 [100%]
8 passed in 0.19s
```

| Test | Result |
|------|--------|
| Unknown `source_kind` → 400 + ledger `rejected` + `unknown_source_kind`; no watermark | PASS |
| Incomplete required set → `failed-partial` + reason; no invented title/body; no watermark | PASS |
| Valid envelope → `accepted` + `contract_id` + watermark round-trip; GET queryable | PASS |
| `acquired_by=skill` accepted; unknown `acquired_by` rejected | PASS |
| Agent `contracts:deliver` + `allowed_kind=source_contract` | PASS |
| Observer cannot post | PASS |
| Watermark table has no body column | PASS |
| Session without `source_kind` still `validated` | PASS |

Wiki agent + public-read characterization: `tests/test_wiki*.py` **89 passed**.

### House box (full `pytest tests -q`)

`7 failed, 1164 passed, 4 skipped` — all 7 in `tests/test_strategy_lab_curate.py`
(tolerated Curate house box). No new wiki failures. SSR not in this fail list.

## Residual

- **GO SC-2** not granted — no push UI, no compose/L12 page path.
- Skill wiring later. Poll adapters SC-3.
