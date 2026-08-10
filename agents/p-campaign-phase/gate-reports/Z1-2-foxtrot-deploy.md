# Z1-2 — Foxtrot deploy checklist

**Status:** PASS (checklist written)  
**Date:** 2026-08-09  

## Checklist

1. `cd server && .venv/bin/python migrate.py` — apply 116 (if pending) + **117**
2. Restart FastAPI (launchd / uvicorn per env)
3. `cd web && npm run build && npm start` (production-only)
4. Smoke: create campaign with Big Three → activate → phase report strip visible
5. Smoke: complete without end date → 422; with end → terminal
6. Smoke: undirected trade create still works
7. Staging: labs-stage · Prod: MiniTwo per `infra/deploy.md`

## Not done this session

Live MiniTwo deploy (operator action).
