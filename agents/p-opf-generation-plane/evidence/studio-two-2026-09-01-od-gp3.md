# StudioTwo probed 2026-09-01 14:34 EDT — OD-GP3 evidence for P1a

**Status:** evidence. Folded onto `GP-W0.md`, `W0-5-foxtrot.md`, `P1a-1-foxtrot-bus.md`.  
**Host SHA:** `9cbac89`, `main` synced with origin.

Redis is up and healthy: **v8.2.3, `127.0.0.1:6379`, bind `127.0.0.1 ::1`**, homebrew, config `/opt/homebrew/etc/redis.conf`. Nothing to install.

**All `mb:*` keys are zero** — interest, ladder, sym, session. This Redis has never served the bus.

**No `chain_feed` process and no `chain-feed` plist.** The bus isn't idling, it's absent.

The uvicorn there (`pid 79091`, `main:app --port 4001 --host 127.0.0.1`, no `--workers`) has **none** of `LABS_MARKET_BUS`, `REDIS_URL`, `LABS_MB_*`, `LABS_OPF_*` in its environment. So `get_store()` returns `None` and `pricing_interest`'s Redis touch is currently swallowed by the `except Exception: pass` at `pricing.py:238`.

**P1a on StudioTwo is therefore env + one plist.** Smaller than scoped.

**One trap — flag it on the W0-5 Foxtrot seed.** `ai.fattail.labs.ssr-live-capture.plist` is **on disk but not loaded**. Do not load it to get keys moving. SSR is a different program; if it runs, interest is held by **SSR, not the plane**, and **AT-GP23 would pass on someone else's interest** — the precise failure GP21 exists to expose. Plane interest must be the only interest P1a/P1b rely on.

**Fold into the same env change:** `LABS_OPF_STORE_MAX_STALE_MS` has **no code default** (OD-GP2, recommended `20000`). The hydrator refuses to start without it at P2, so setting it during P1a avoids a second visit. Every other `LABS_OPF_*` on that host is at its `_env` default today.
