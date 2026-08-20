# Seed M-G — Delta Manager gate

**Project:** p-alerts  
**Agent:** Delta  
**Phase:** M  
**Depends:** M3 + M4 + M5  
**Gate it feeds:** Packet S · Coach ship (not MiniTwo unless asked)

## Evidence

AT-ALM-1…**13** from M4 with command output. Echo M3 HIG section ticks **H8** (cite it). Kilo lint PASS. Missing Echo H8 or lint → **FAIL**. No `HostPnLChart` in the M diff. Stream ≠ market socket.

Ternary **PASS / FAIL / BLOCKED**. Never waive.

## Deliverable

`gate-reports/M-G.md`
