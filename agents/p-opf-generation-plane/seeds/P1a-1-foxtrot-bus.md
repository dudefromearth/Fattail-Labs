# Seed P1a-1 — Foxtrot plane bring-up (infra only)

**Project:** OPF Generation Plane  
**Agent:** Foxtrot  
**Depends:** P0-G · OD-GP3 ticked on `GP-W0.md`  
**Law:** GP23 · GP24 · GXA0 Q5 · plan P1a  
**Files:** `infra/deploy.md` · launchd from `infra/launchd/ai.fattail.labs.chain-feed.plist.example` on the **named host**  
**Out:** MiniTwo if OD-GP3 is StudioTwo · secrets in the gate report · `--workers` > 1 · **any product Python** (`plane_interest.py` is P1b) · claiming AT-GP23

## Ask

On the host Coach named:

1. Redis up, bind localhost, `redis-cli ping` → PONG. (StudioTwo already does.)
2. API env: `LABS_MARKET_BUS=1`, `REDIS_URL`.
3. `python -m market_data.chain_feed --interval 2` under launchd.
4. Uvicorn still `--workers` omitted or 1.
5. Evidence: `redis-cli ping`, SCAN `mb:ladder:*` **under a manual `touch_interest`**, launchd state.
6. A key produced only by a manual touch is the **expected P1a state**, not AT-GP23.

## Done when

Command + output in `gate-reports/` evidence. India P1a-2. Delta P1a-G.
