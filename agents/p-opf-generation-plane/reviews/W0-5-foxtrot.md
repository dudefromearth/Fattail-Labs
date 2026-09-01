# W0-5 — Foxtrot P1a runbook (StudioTwo)

**Agent:** Foxtrot  
**HEAD:** `374ed86`  
**Date:** 2026-09-01  
**OD-GP3:** StudioTwo (Coach W0-0)  
**Evidence parent:** `agents/p-opf-generation-plane/evidence/studio-two-2026-09-01-od-gp3.md`  
**Out honored:** no product Python · no MiniTwo · no secrets in this review · SSR capture **not loaded**

**Verdict:** **APPROVED.** P1a on StudioTwo is **env + one plist + uvicorn restart**. Redis is already up. Bus is absent.

**This GO does not run P1a.** Runbook only.

---

## As-built (re-probed 2026-09-01 14:45 EDT, this host)

| Fact | Evidence |
|------|----------|
| Redis | `PONG`. Probe: v8.2.3, `127.0.0.1:6379`, bind `127.0.0.1 ::1`, homebrew `/opt/homebrew/etc/redis.conf`. **Nothing to install.** |
| `mb:*` | SCAN count **0**. Never served the bus. |
| `chain_feed` | **No process. No chain-feed plist loaded.** |
| uvicorn | pid **79091**, `main:app --port 4001 --host 127.0.0.1`, **no `--workers`**. |
| API env | Probe: none of `LABS_MARKET_BUS`, `REDIS_URL`, `LABS_MB_*`, `LABS_OPF_*`. `get_store()` → `None`; `pricing.py:238` swallows. |
| SSR trap | `~/Library/LaunchAgents/ai.fattail.labs.ssr-live-capture.plist` **on disk** (1519 B, 2026-08-14). `launchctl print gui/$(id -u)/ai.fattail.labs.ssr-live-capture` → **not loaded**. **Must stay unloaded.** |

MiniTwo stays `bus: "not_configured"` until a later Foxtrot packet. Wings-compute capability is **not** claimable on the member host until then.

---

## P1a runbook (when a later GO authorizes P1a)

1. **Do not install Redis.**
2. **One env change** on the API process (launchd plist or `.env` + restart), then **restart uvicorn**:
   - `LABS_MARKET_BUS=1`
   - `REDIS_URL=redis://127.0.0.1:6379/0`
   - **`LABS_OPF_STORE_MAX_STALE_MS=20000`** (OD-GP2; no code default; hydrator will not start at P2 without it)
3. **One plist:** copy `infra/launchd/ai.fattail.labs.chain-feed.plist.example` → `~/Library/LaunchAgents/ai.fattail.labs.chain-feed.plist`, `launchctl load`. That example already sets `LABS_MARKET_BUS=1` and `REDIS_URL` for the **feed** process.
4. Keep uvicorn **without** `--workers`.
5. Evidence: `redis-cli ping`; `launchctl print …/ai.fattail.labs.chain-feed`; SCAN `mb:ladder:*` only after a **documented one-shot manual touch** — that is **not** AT-GP23.
6. **Do not load `ai.fattail.labs.ssr-live-capture.plist`.** If SSR holds interest, AT-GP23 passes on someone else's keys — GP21's failure mode.
7. **Ships no Python.** `plane_interest.py` is P1b (Alpha), after P1a-G, and is wings-only.

P1a-G (later): Redis reachable · chain_feed running · `LABS_MARKET_BUS` set · `LABS_OPF_STORE_MAX_STALE_MS` set · SSR unloaded.
