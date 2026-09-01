# Seed P1-1 — Foxtrot plane bring-up

**Project:** OPF Generation Plane  
**Agent:** Foxtrot  
**Depends:** P0-G · OD-GP3 ticked on `GP-W0.md`  
**Law:** GP21 · GP23 · GP24 · GXA0 Q5  
**Files:** `infra/deploy.md` · launchd plist from `infra/launchd/ai.fattail.labs.chain-feed.plist.example` on the **named host**  
**Out:** MiniTwo if OD-GP3 is StudioTwo · secrets in the gate report · `--workers` > 1 · editing `chain_feed.py` unless required (interest is plane-owned; feed should just see keys)

## Ask

On the host Coach named:

1. Redis up, bind localhost, `redis-cli ping` → PONG.
2. API env: `LABS_MARKET_BUS=1`, `REDIS_URL`.
3. `python -m market_data.chain_feed --interval 2` under launchd.
4. Plane interest heartbeat (if P2 not landed yet: a **temporary** documented touch of enumerated topics is allowed **only** to prove AT-GP23 substrate — prefer waiting for `plane_interest.py` from P2 if Coach sequences P1 after a stub heartbeat; **Juliet: P1 may land `plane_interest.py` heartbeat-only** so the feed has keys with no member. If so, declare that file here and keep it heartbeat-only.)
5. Evidence: SCAN `mb:ladder:*` nonempty **and** a captured `mb:pub` message, **no member watching**.
6. Uvicorn still `--workers` omitted or 1.

## Done when

Command + output in `gate-reports/` evidence. India P1-2. Delta P1-G.
