# W0-4 — Foxtrot watchdog / launchd

**Project:** SSR Collector Hardening  
**Agent:** Foxtrot  
**Depends:** W0-1 spec  

## Do not
- Implement
- Unload or kickstart `ai.fattail.labs.ssr-live-capture` mid-gth
- Invent alert channel (OPEN)

## Do
Design-only: independent watchdog process + launchd, heartbeat file/path, 60s silence during live phase for any scheduled symbol. Separate from the tap. Cut over between phases. StudioOne only. Fail loud. Config for tolerances.

Write: `agents/p-ssr-collector-hardening/gate-reports/W0-4-foxtrot.md`  
Verdict: **APPROVED** or **RETURNED**, plus **GO / NO-GO**.
