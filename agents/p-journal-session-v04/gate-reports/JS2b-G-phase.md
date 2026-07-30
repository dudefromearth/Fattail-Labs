# JS2b-G — LLM path

**Verdict:** **PASS** (path landed; product requires credentials)

## Evidence

- `_llm_turn` uses `ai.client.complete` + §10 constant + transcript/trade-log context
- Fail-loud if mode=llm and no provider keys
- Falls through to local probes when LLM unavailable in hybrid call path
- Dev `.env`: `LABS_JOURNAL_AGENT_MODE=local` until keys present
