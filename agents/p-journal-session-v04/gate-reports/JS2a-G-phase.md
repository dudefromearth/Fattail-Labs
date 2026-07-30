# JS2a-G — Agent contract

**Verdict:** **PASS**  
**Date:** 2026-07-30

## Evidence

- Mode enum `llm | local | off` (DL-157)
- Once-only absence keys via `absence_keys_raised_json`
- No depth budget refusals
- RTH: quiet if no member message; silent ack if member wrote
- Validator double-fail → plain-text degrade (session open)
- `local` does not invent free dialogue
- Tests green with `LABS_JOURNAL_AGENT_MODE=local`
