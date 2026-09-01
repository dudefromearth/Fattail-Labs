# P1a-G — Delta

**Agent:** Delta  
**Date:** 2026-09-01  
**HEAD at start:** `e96be54`  
**Law:** spec v0.2.2 + plan as folded at `374ed86` · GP23 · GP24 · OD-GP3 = StudioTwo · OD-GP2  
**Authorized:** P1a infra only  
**Evidence:** `agents/p-opf-generation-plane/evidence/p1a-studio-two-bring-up-2026-09-01.md`  
**India:** `reviews/P1a-2-india.md` APPROVED

**Verdict:** **PASS**

---

## Check

| Requirement | Result |
|-------------|--------|
| Named host = OD-GP3 StudioTwo | **Yes.** |
| Redis reachable | **Yes.** `redis-cli ping` → `PONG`. Nothing installed. |
| `LABS_MARKET_BUS` set on API process | **Yes.** NAME present on pid 90357. |
| `LABS_OPF_STORE_MAX_STALE_MS` set | **Yes.** NAME present on pid 90357. Value in `.env` is `20000` (OD-GP2). |
| `REDIS_URL` set | **Yes.** NAME present. |
| `chain_feed` running | **Yes.** launchd `ai.fattail.labs.chain-feed` loaded, pid 90821, never exited. |
| `mb:ladder:*` under documented one-shot | **Yes.** `mb:ladder:p1a-c-touch:1970-01-01:w1:dual`. **Not AT-GP23.** |
| uvicorn `--workers` omitted or 1 | **Yes.** Omitted. |
| SSR live-capture unloaded | **Yes.** `Could not find service` before and after. |
| Infra only — no product Python | **Yes.** |
| Five frozen §8 modules untouched | **Yes.** |
| MiniTwo untouched | **Yes.** `bus: "not_configured"` stands. Wings-compute not claimed on the member host. |
| Secrets in artifacts | **None.** |
| `/api/health` after restart | **HTTP 200**, `env=dev`, `git_sha=e96be54802802c336c7db8049a342a6ece78c209`. |
| P1a-0 does not gate process work | **Recorded.** Unattended reboot: Coach gets back in (FileVault off; Tailscale Network Extension at boot; sshd listening). |

## Correct outcomes, not defects

- `chain_feed` runs. It is not idle because a member Options Lab tab holds `mb:ladder:I:SPX:2026-09-01:w25:dual`. Plane interest is P1b. That member key is **not** AT-GP23.
- Feed ticks skip that topic: `Missing required environment variable: LABS_ENV`. The example plist only sets `LABS_MARKET_BUS` and `REDIS_URL`. P1a loaded that plist only.
- SCAN `mb:*` was 0 before the API restart. Keys after restart came from the member WS reconnect plus the documented one-shot.

## Carries (surface; do not act)

1. **P1b vs `main.py`.** P1b-1 declares `server/main.py` for the lifespan start. `main.py` has no lifespan today and is on the frozen §8 allowlist. **P1b needs DL-539 OK 2** (and OK 3 before any allowlist edit). `plane_interest.py` cannot start in-process without touching `main.py` as the file stands.
2. **Daemon vs `.env`.** A′ showed the owner of uvicorn does not source `.env` by itself. Durable fix (teach the daemon, or stand up `ai.fattail.labs.api.plist` per `deploy.md`) is an **open Coach decision**. Not built in P1a.

## What this PASS unblocks / does not

P1a-G PASS unblocks **P1b in the DAG only**. It does **not** start P1b (separate GO). **P2-0 stays blocked:** DL-539 is **1/3**. No product code in P1a. MiniTwo is not the plane host.

**One line:** StudioTwo API has the three names, chain-feed is loaded, SSR is not, Redis answers, a one-shot `mb:ladder:*` key exists, and that is not AT-GP23.
