# Seed P1a-1 — Foxtrot plane bring-up (infra only)

**Project:** OPF Generation Plane  
**Agent:** Foxtrot  
**Depends:** P0-G · OD-GP3 ticked on `GP-W0.md`  
**Law:** GP23 · GP24 · GXA0 Q5 · plan P1a  
**Files:** `infra/deploy.md` · launchd from `infra/launchd/ai.fattail.labs.chain-feed.plist.example` on the **named host**  
**Out:** MiniTwo if OD-GP3 is StudioTwo · secrets in the gate report · `--workers` > 1 · **any product Python** (`plane_interest.py` is P1b) · claiming AT-GP23 · **loading `ai.fattail.labs.ssr-live-capture.plist`**

## Ask

On the host Coach named. **StudioTwo probe 2026-09-01 14:34 EDT:** Redis already up; `mb:*` empty; no chain_feed; uvicorn missing bus env. **P1a = env + one plist.**

1. Redis: already `PONG` on StudioTwo. Do not reinstall.
2. **One env change, then restart uvicorn:** `LABS_MARKET_BUS=1`, `REDIS_URL=redis://127.0.0.1:6379/0`, **`LABS_OPF_STORE_MAX_STALE_MS=20000`** (OD-GP2 — no code default; hydrator will not start at P2 without it). Today `get_store()` is `None` and `pricing.py:238` swallows the touch.
3. **One plist:** `chain_feed` from `infra/launchd/ai.fattail.labs.chain-feed.plist.example`. Load **that** plist only.
4. Uvicorn still `--workers` omitted or 1.
5. Evidence: `redis-cli ping`, SCAN `mb:ladder:*` **under a documented one-shot manual touch**, launchd state for **chain-feed only**.
6. A key produced only by a manual touch is the **expected P1a state**, not AT-GP23.
7. **Do not load `ai.fattail.labs.ssr-live-capture.plist`.** It is on disk, not loaded. If it runs, AT-GP23 would pass on SSR's interest, not the plane's. GP21 exists to expose that.

## Done when

Command + output in `gate-reports/` evidence. India P1a-2. Delta P1a-G.
