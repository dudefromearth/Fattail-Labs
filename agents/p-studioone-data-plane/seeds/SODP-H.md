# SODP-H — Hardening round (HOLD until AP-1)

**Depends:** SODP5-G PASS · Coach AP-1 on June ES+MES.  
**Forbidden:** during SODP2–6 (doctrine §13).  
**Agents:** Kilo · Alpha · Charlie · India · Echo · Foxtrot · Delta  
**Machines:** StudioOne (CP-1 on any process touch) · StudioTwo (UI consume tests)

## Coach (verbatim)

> After we make this move to StudioOne, we are going to do a refactoring and hardening audit and figure out how we can make sure this architecture is sound and bullet proof. I want consolidated unit tests. I do not want any dangling code, I want everything clean and purpose built. Data Services and APIs on StudioOne, and remote services consuming the APIs.

## Do

1. **Kilo** — one suite for StudioOne data services (history, VP, symbology, ESZ2026→ESZ6 translation). UI tests consume hops only. `pytest tests -q` green, 0 warnings. No Massive in `web/`.
2. **Alpha + Charlie** — delete dangling: `_aggs_price_fill` remnants, print-first OHLC as BASE, second Massive on Labs, dead StudioTwo launchd. Not disable, not flag. Grep-proof.
3. **India** — MATCH SODP-1…10 after deletes.
4. **Echo** — re-gate touched surfaces vs references. Interface Coach accepted at AP-1 still passes.
5. **Foxtrot** — StudioTwo `lsof :4010` empty; StudioOne process set = spec §4 only. CP-1 BEFORE/AFTER.
6. **Delta** — FAIL if dangle, assumed tests, or AP-1 interface moved.

## Out

Mid-build streamline. Repair #3 of the fill. SODP-LABS. D6/D7/D8. Model ACTIVE.

## Gate SODP-H-G

Grep-proof clean. Consolidated suite green. Architecture MATCH. AP-1 interface intact. chain_feed undegraded.
