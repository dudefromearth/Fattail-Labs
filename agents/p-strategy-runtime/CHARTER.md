# p-strategy-runtime — Charter

**Program:** Strategy Lab Process Runtime (M0–M2 first; M3 optional)  
**Spec:** `Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md`  
**Scope:** `docs/Strategy-Lab-Process-Runtime-Implementation-Scope-v1.0.md`  
**Bench plan:** `docs/Strategy-Lab-Process-Runtime-Full-Agent-Bench-Plan-v1.0.md`  
**Board:** this folder  

## Mission

Ship a **process space** for versioned strategy **deployment instances**: envelope, scan/manage runners, decision log, dry→paper→live ladder, Tradier paper path with order dedupe and broker-held exits, arming ceremony, and Deployment Pack export — with **user + broker** as primary runners, not Labs multi-tenant bot farm.

## Goals

1. **M0** — Plan, arm, export, dry-run without Labs tick loop.  
2. **M1** — Tradier paper multi-leg + broker-held exits; live only after LEGAL-LIVE.  
3. **M2** — User-local worker consuming Deployment Pack.  
4. **Safety** — O-1…O-5 order dedupe; structure-agnostic ExitPolicy; pause ≠ flat banners; G-2 live gate.  
5. **Honesty** — Process metrics; Family B isolation; no profit theater; no Labs uptime promises.  

## Non-goals

- Legal counsel / ToS drafting (external GO/NOGO only)  
- M3 as brand default  
- Indicator marketplace  
- MSC shared code  

## Success

Vertical slice DoD in Scope §3.1 and Spec §13 met with Delta evidence. LIVE production path only if Coach **LEGAL-LIVE = GO**.
