# StudioOne Data Plane & Remote UI — Full Agent Bench Plan v1.0

**Document type:** FatTail Labs Full Agent Bench Plan  
**Date:** 2026-09-19  
**Status:** **Review object — not a build GO.** Coach asked for the plan, architecture, and design for full bench review. **SODP0-W0** is intake only.  
**Author:** Juliet (orchestration) · Grok Build (documents)  
**Authority:** Coach (stamp / GO / AP-1)  
**Canonical land path:** `docs/StudioOne-Data-Plane-Full-Agent-Bench-Plan-v1.0.md`  
**Board:** [`agents/p-studioone-data-plane/`](../agents/p-studioone-data-plane/)  
**Token:** [`agents/go/SODP0-W0.md`](../agents/go/SODP0-W0.md)

**Spec (DRAFT):** [`Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md`](../Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md)  
**Architecture:** [`Architecture/36-studioone-data-plane.md`](../Architecture/36-studioone-data-plane.md)  
**Design:** [`Architecture/36-studioone-data-plane-design.md`](../Architecture/36-studioone-data-plane-design.md)

**Grok Build does not implement.** Juliet hands seeds. Auto-GO on clean gates. Stop + **GO / NO-GO** on a problem. No packet writes "done" before Coach AP-1.

---

## Standing law

### CP-1 — Chain primacy (verbatim · DL-707)

> **CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne (chain_feed and its supporting jobs) is never disrupted by Volume Profile Service work. If any test, install, invocation, backfill, or migration step could disrupt it — including indirectly via shared Massive account connection/rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is either redesigned to remove the risk or HELD until after the RTH close (16:00 ET). "Could disrupt" is judged pessimistically; when uncertain, hold. Every StudioOne packet must (a) carry CP-1 verbatim in its GO, (b) state its resource footprint (connections, disk, CPU) against chain_feed's needs, (c) capture chain_feed process status and last-snapshot freshness BEFORE and AFTER execution as evidence, and (d) include a rollback line: the single command or action that removes the change. A packet whose AFTER check shows chain_feed degraded is a FAIL regardless of its own success, and its rollback executes immediately.

### Other binds

| Law | Bind |
|-----|------|
| **TS-1** | doctrine §17. Fill design has two AP-1 strikes. Not repaired. Replacement on StudioOne. DL cites both strikes. |
| **RL-1** | REQ-001 · REQ-002 · REQ-003 OPEN in every report |
| **AP-1** | Coach browser. REQ-001 VP CONFIRMED only on his cross-check |
| **SODP-1…10** | spec §2 · **SODP-10** hardening after the move |
| **D6 / D7 / D8** | stay open |
| **VPS Q1** | ES/MES model ACTIVE blocked |
| **MiniTwo** | not this tree until SODP4 names it |

**Open REQs:** REQ-001 · REQ-002 · REQ-003.

---

## 0. Full bench sequence

```text
SODP0-G   Advisor + design + infra + auth review  (India → Echo+Tango → Foxtrot → Mike)
             │
             ▼
          Coach stamp  →  BUILD AUTHORITY  (spec v0.1.x) + SODP1-W0
             │
             ├─► SODP1-G  Inventory grep/lsof  (Kilo)           StudioTwo read-only
             ├─► SODP2-G  History provider on StudioOne (TS-1)  Alpha+Foxtrot+Kilo   CP-1
             ├─► SODP3-G  Labs hop OHLC/contracts/stream        Alpha+Charlie
             ├─► SODP4-G  MiniTwo hop                           Foxtrot+Mike         named
             ├─► SODP5-G  Retire StudioTwo data plane           Foxtrot
             └─► SODP6-G  MacBook UI host                       Foxtrot+Charlie      named
                    │
                    ▼
             SODP-AT     artifacts (June on ES+MES via hop; grep-proof; lsof)
                    │
                    ▼
             AP-1        Coach: pan June 2026 on ES AND MES, StudioTwo
                    │
                    ▼
             SODP-H-G    Hardening round (after the move, not during)
                         Kilo consolidated tests · Alpha/Charlie delete dangle
                         India MATCH · Echo re-gate · Delta grep-proof
```

SODP0 is sequential (workflow Phases 2–4). SODP1 may run during SODP0 if read-only. **No `server/` history rewrite until Coach stamps BUILD and SODP2-W0.**

---

## 1. Seats (the whole bench that touches this)

| Seat | Job on this program |
|------|---------------------|
| **Coach** | Stamp, AP-1, SODP-LABS yes/no, MiniTwo/MacBook named packets |
| **Juliet** | This plan, seeds, board. Does not implement. |
| **India** | SODP0-G: spec/arch vs CP-1, Arch 28, TS-1, SODP-4 vs Coach “all API,” product boundary |
| **Echo** | Design doc: banner, three UI hosts, no vendor ticker in chrome |
| **Tango** | Honesty of SHORT HISTORY; no silent wall; capacity |
| **Hotel** | Price series is the contract they picked — no mixed-print lie |
| **Mike** | Hop: member cookie never forwarded; computing-class; SSO per UI host |
| **Foxtrot** | StudioOne launchd, pins, Tailscale, retire StudioTwo leftovers, CP-1 install |
| **Alpha** | History provider, hop wiring, delete fill, cache |
| **Charlie** | Chart consumes `short_history`; no short localStorage win; MacBook site URL |
| **Kilo** | Inventory, live contract tests, grep-proof, headed June artifact, **consolidated StudioOne data-service suite (SODP-H)** |
| **Delta** | Every gate PASS/FAIL/BLOCKED with evidence. Never waived. |
| **Lima** | DL same day; Arch 36 honesty; spec status |
| **Sierra** | Not this tree (no catalog) unless a public route appears |
| **Victor / Whiskey / Yankee** | Not central unless a packet claims a lineage frame |

Content-studio seats (Bravo, November, Romeo, Papa, Gemba, Golf) are **not seated** on SODP0.

---

## 2. Packets

### SODP0 — Review (this intake)

**Machine:** StudioTwo, read-only.  
**Seeds:** `seeds/SODP0-india.md` · `SODP0-echo-tango.md` · `SODP0-foxtrot.md` · `SODP0-mike.md`  
**Gate SODP0-G:** all four APPROVED or RETURNED with flagged ideas. Coach then stamps or sends back.

India must **flag** (not erase) the tension: Coach said “api run from StudioOne”; SODP-4 keeps product Labs on MiniTwo until a named cut. That is a Coach box, not India’s kill.

### SODP1 — Inventory (Kilo)

Read-only. Grep Massive / `ohlc_for_source` / `_aggs_price_fill` / launchd on StudioTwo vs StudioOne. Artifact: `gate-reports/SODP1-inventory.md`.

### SODP2 — History on StudioOne (Alpha + Foxtrot + Kilo)

**CP-1 FULL DRESS.** TS-1 replacement lives here. Massive-first, vendor ticker translation, disk cache, payload banner flag. Delete `_aggs_price_fill`. Overlay/rsync; **no git-pull** of the stale StudioOne Labs tree.

Footprint (draft, Foxtrot confirms): +1 Python HTTP or new route on `:4010`; Massive GETs historical; disk under on-box store; no chain-feed plist edit.

Rollback: bootout the history agent **or** revert the vp-api overlay; Labs hop off.

### SODP3 — Hop (Alpha + Charlie)

Labs `/ohlc` `/contracts` `/stream` hop like structure. Client banner from payload. Bust short OHLC cache.

### SODP4 — MiniTwo (Foxtrot + Mike)

Only when Coach names production. Tailscale pin. Product Labs stays.

### SODP5 — Retire StudioTwo leftovers (Foxtrot)

bootout local vp-api, chain-feed, vp-engine on StudioTwo after SODP3 holds. `lsof :4010` empty.

### SODP6 — MacBook (Foxtrot + Charlie)

Named site URL + SSO callback. Same hop.

### AP-1

Coach: tile → chart, pan to June 2026, ES **and** MES. REQ-001 range then VP cross-check. REQ-003/002 unchanged unless he marks them.

### SODP-H — Hardening round (full bench, after the move)

**Depends:** SODP5 + AP-1. **Forbidden during SODP2–6** (doctrine §13).  
**Law:** spec SODP-10 · Audit & Hardening Round Spec v1.1 Simplify.  
**Coach:** refactoring and hardening audit; bulletproof; consolidated unit tests; no dangling code; purpose-built; Data Services and APIs on StudioOne; remotes consume APIs.

| Seat | Packet |
|------|--------|
| Kilo | One test suite for StudioOne data services. UI tests consume hops only. 0 warnings. |
| Alpha + Charlie | Delete dangling (fill remnants, unused print-first OHLC, second Massive, dead launchd). Not disable. |
| India | Architecture MATCH after deletes. |
| Echo | Re-gate touched surfaces. |
| Foxtrot | StudioTwo `lsof :4010` empty; StudioOne process set = spec §4 only. |
| Delta | FAIL if dangle remains, tests assumed, or AP-1 interface moved. |

**Seed:** `agents/p-studioone-data-plane/seeds/SODP-H.md` (HOLD until AP-1).

---

## 3. Isolation FAIL

A seed that: repairs `_aggs_price_fill`; calls Massive from Next; forwards member cookies to StudioOne; git-pulls StudioOne Labs; answers D6/D7/D8; grants model ACTIVE; deploys MiniTwo without a named GO; stops StudioTwo `:3000`/`:4000` as a “fix”; **streamlines SODP2–6 mid-build** (hardening is SODP-H only); leaves dangling data-plane code on a UI host.

---

## 4. Why the full bench (not a sidecar ticket)

This is a **topology change of the whole market system**, not an OHLC patch. It binds capture, Massive, VP, symbology, three UI hosts, auth hop, and TS-1. Skipping India/Echo/Mike/Foxtrot is how StudioTwo kept a second data plane after VP “moved.”
