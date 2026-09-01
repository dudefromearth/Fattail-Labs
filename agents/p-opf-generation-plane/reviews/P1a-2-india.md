# P1a-2 — India

**Agent:** India  
**Date:** 2026-09-01  
**Depends:** P1a-1  
**Law:** OD-GP3 · `bus: not_configured` for MiniTwo-without-Redis · spec v0.2.2 + plan as folded at `374ed86`  
**Evidence:** `agents/p-opf-generation-plane/evidence/p1a-studio-two-bring-up-2026-09-01.md`

**Verdict:** **APPROVED** for P1a-G.

---

| Check | Result |
|-------|--------|
| Named host matches OD-GP3 | **Yes.** StudioTwo. MiniTwo not claimed. `bus: "not_configured"` on the member host stands. |
| Env present | **Yes.** New uvicorn pid 90357 has NAMES `LABS_MARKET_BUS`, `REDIS_URL`, `LABS_OPF_STORE_MAX_STALE_MS`. Repo `.env` holds the same three (values not in this review). |
| Feed process alive | **Yes.** `gui/501/ai.fattail.labs.chain-feed` loaded, `state=running`, pid 90821, never exited. |
| No product Python | **Yes.** `plane_interest.py` not landed. Five frozen modules not edited. |
| SSR unloaded | **Yes.** `launchctl print …/ssr-live-capture` → Could not find service, before and after. |
| `--workers` | **Yes.** Omitted on 4001. |
| MiniTwo | **Untouched.** |
| AT-GP23 | **Not claimed.** Documented one-shot `mb:ladder:p1a-c-touch:1970-01-01:w1:dual` is P1a state. Member `I:SPX` w25 is the Options Lab tab, not plane interest. |

## Carries (do not act)

1. P1b-1 wants `server/main.py` lifespan. `main.py` is frozen §8. **P1b needs DL-539 OK 2** (OK 3 before the edit).
2. StudioTwo API daemon does not source `.env` itself. Durable fix is Coach's: teach the daemon, or `ai.fattail.labs.api.plist`.
