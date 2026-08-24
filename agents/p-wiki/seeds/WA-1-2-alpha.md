# WA-1-2 — Portal + ledger + fixture git (Alpha)

**Plan:** GO WA-1 · **DL-548**

## In scope

`migrations/134_wiki_contracts.sql` (`wiki_contracts` + `wiki_agent_sources` + `sealed_at`).  
`server/wiki_agent_*.py`, `server/routes/wiki_agent.py`.  
`POST/GET /api/wiki-agent/contracts`. Schema fail-loud. Fixture draft commit helper (no model).  
Mount router (`server/main.py` one include — seam required for the portal).

## Out of scope

Pollers, pointer registry, member wiki UI, compile-inbox, accretion API, MiniTwo.

## Completion

Invalid schema → 4xx + ledger `rejected`. Valid registered agent → `contract_id` + `validated`. Session open without sealed transcript. Fixture git commit message contains `contract_id`. No page markdown column on the ledger.
