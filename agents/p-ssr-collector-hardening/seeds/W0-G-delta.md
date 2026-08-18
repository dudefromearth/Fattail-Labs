# W0-G — Delta spec-lock gate

**Project:** SSR Collector Hardening  
**Agent:** Delta  
**Depends:** W0-1 spec · W0-2 India · W0-3 Echo · W0-4 Foxtrot · W0-5 Kilo · W0-6 Lima cadence report

## Criteria (all must have evidence)

1. Spec exists at `Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md` and contains Coach's full Phase 0 packet verbatim.
2. India filed APPROVED or RETURNED with GO/NO-GO. RETURNED on invariant break = this gate **FAIL**.
3. Echo, Foxtrot, Kilo each filed GO/NO-GO. Opinions labeled. No invented alert channel.
4. Lima cadence report exists; **cadence env was not changed**.
5. Running collector still up: `curl -sS -m 4 http://studioone.local:5055/api/status` returns a phase. No mid-gth restart required by this gate.
6. Friday `2026-08-14` archive not rewritten (spot-check file mtimes or count).

Delta does not modify work. Verdict **PASS / FAIL / BLOCKED** and **GO / NO-GO**.

Write: `agents/p-ssr-collector-hardening/gate-reports/W0-G.md`
