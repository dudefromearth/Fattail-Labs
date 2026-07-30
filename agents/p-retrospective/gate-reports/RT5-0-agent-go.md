# RT5-0 — Coach agent path decision

**Project:** p-retrospective  
**Primary:** Coach  
**Date:** 2026-07-29  
**Prerequisite:** RT4-G PASS  

---

## Decision: **GO**

Ship agent analyze (RT5-1…RT5-G).

| Item | Lock |
|------|------|
| Path | **GO** — implement `POST …/analyze` |
| Trial agent | **Off by default** (Observer trial cannot run analyze unless config opens it) |
| Missing config | **Fail loud** on analyze (no silent empty analysis) |
| Stub/local | Allowed: deterministic local analyzer from staged report when `LABS_RETRO_AGENT_MODE=local` |
| HTTP provider | Optional later; HTTP-only to MSC if used; no MSC code import |

## Feeds

→ **RT5-1** Alpha · Mike  
