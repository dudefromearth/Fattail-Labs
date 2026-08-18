# W0-5 — Kilo characterization list

**Project:** SSR Collector Hardening  
**Agent:** Kilo  
**Depends:** W0-1 spec  

## Do not implement. List tests.

Coach-required:
1. Symbol with no session in GTH is not polled and not counted as a hole.
2. Heartbeat silence triggers alert.
3. Audit correctly flags a synthetic 30s gap.

Add edges: phase transition single log line; flag-off default (current poll-all unchanged); cutover does not rewrite Friday 2026-08-14.

Write: `agents/p-ssr-collector-hardening/characterization-list.md`  
and `agents/p-ssr-collector-hardening/gate-reports/W0-5-kilo.md`  
Verdict: **GO / NO-GO** (list complete enough to implement against).
