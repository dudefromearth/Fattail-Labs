# SC-1-1 — Envelope + watermark (Alpha)

**Plan:** GO SC-1 · Source Contract v0.1.4

## In scope

- `migrations/139_wiki_source_watermarks.sql` — `(source_kind, source_id) → content_hash, seen_at, contract_id`. No body.
- `wiki_agent_schema.parse_source_envelope` — required set, closed `source_kind` / `acquired_by`.
- Same portal `POST /api/wiki-agent/contracts`. `source_kind` present ⇒ Source Contract.
- Disposition `accepted` | `failed-partial` | `rejected` + reason if not accepted.
- Ledger kind `source_contract`. No git write. No compose.

## Out of scope

Poll adapters, Factory, UI, OD-6 unpublish action, skill wiring, AppChrome.
