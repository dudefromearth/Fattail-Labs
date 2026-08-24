# WA-4-2 — Alpha session lifecycle + queue drain

**Plan:** Wiki Agent v0.1.3 · **GO WA-4** · Riders 1–2  
**Isolation:** wiki tree. No AppChrome. No public read.

## In scope

Open (already WA-1) → first agent turn cites `{surface, route, entity}` →
accrete while `sealed_at` IS NULL → seal immutable → follow-on new contract
referencing sealed id. Session draft: git `status: draft` + board
`awaiting_approval` (WA-2 path). Frontmatter: `session_contract_id` + calling
context; body/linkages seeded from entity.

Queue drain: `LABS_WIKI_LINKAGE_DRAIN_N` fail-loud; admin POST pulls next N
queued reverse-pass rows into board cards; status `drained`; nothing
auto-publishes.

## Out of scope

WA-5 registration. WA-6 public read. MiniTwo. Git credentials to
`ai.complete()`.

## Completion

Kilo WA-4-G rows including riders.
