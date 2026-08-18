# W0-2 — India spec / architecture review

**Project:** SSR Collector Hardening  
**Agent:** India  
**Depends:** W0-1 spec file exists  
**Spec:** `Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md`  
**Coach stamp:** `seeds/W0-0-coach-stamp.md`

## Do not
- Implement code
- Restart StudioOne tap or dash
- Remove or rewrite Coach text
- Invent an alert channel
- Change cadence

## Do
Review for: domain model, product boundary (this is StudioOne ops, not member Labs UI), invariants (archive is product; zero downtime; config over code), alignment with DL-428/431 and Arch 28 (tap does not call Massive; chain_feed is the writer).

Hole semantics must not invent instruments or silent false marks (adjacent to DL-309 spirit for the archive).

Session map is config. Polling interest on the bus: if tap stops touching interest for a symbol, chain_feed should idle that topic — confirm this is specified, not a silent Massive leak.

**§ Flagged ideas** required. Block only for invariant/law/system breakage.

Write: `agents/p-ssr-collector-hardening/gate-reports/W0-2-india.md`  
Verdict: **APPROVED** or **RETURNED** for build readiness, plus **GO / NO-GO**.
