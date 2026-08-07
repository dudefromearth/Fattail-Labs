# Seed C0-5 — Foxtrot workers / deploy

**Agent:** Foxtrot  
**Depends on:** C0-0 PASS · Spec v1.0.2 §6.6 · §8.5–8.6 · DL-238 · Mike C0-3  

## Task

Ops plan (no silent workers):

1. Discord Gateway bot process: host, launchd, restart policy (MiniTwo / staging).  
2. **Scheduled role reconcile** job interval + logging + fail-loud alert path.  
3. Message **backfill** job schedule + rate-limit respect.  
4. Config keys (guild id, bot token, webhook secrets) — fail loud if missing.  
5. Staging vs production guild/channel mapping strategy.  

## Output

`gate-reports/C0-5-foxtrot.md` — APPROVED / RETURNED + runbook outline for
`infra/deploy.md` or Architecture/06.
