# LIM2-1 — Trail fixtures (out)

**Agent:** Kilo  
**Depends:** LIM2-0  
**Date:** 2026-09-02

## Command

```
cd web && npx --yes tsx lib/options-lab/templates/limTrail.test.ts
limTrail.test.ts ok

cd web && npx --yes tsx lib/options-lab/templates/lim.test.ts
lim.test.ts ok
```

Injected clock only. No wall-time 45-minute run.

| Id | Result |
|----|--------|
| AT-LIM13 | PASS — ghosts record `xUnclamped = 300` |
| AT-LIM14 | PASS — held still, consecutive spacing **0** |
| AT-LIM15 | PASS — moved 20 units / interval, spacing **20** |
| AT-LIM25 expiration | PASS — first frame `[]`, own case |
| AT-LIM25 symbol | PASS — first frame `[]`, own case |
| AT-LIM25 session (asOf date) | PASS — first frame `[]`, own case; same-day asOf does not reset |
